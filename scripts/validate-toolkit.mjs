#!/usr/bin/env node
/** Lightweight CI integrity checks for the single-file Celestial Nexus toolkit. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootArg = process.argv.find(arg => arg.startsWith('--root='));
const root = rootArg ? path.resolve(rootArg.slice(7)) : path.resolve(scriptDir, '..');
const preSync = process.argv.includes('--pre-sync');
const indexPath = path.join(root, 'index.html');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function exists(relative) { return fs.existsSync(path.join(root, relative)); }

if (!fs.existsSync(indexPath)) {
  console.error(`index.html not found at ${indexPath}`);
  process.exit(1);
}
const html = fs.readFileSync(indexPath, 'utf8');

// Compile every inline JavaScript block without executing browser code.
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match, inlineCount = 0;
while ((match = scriptRe.exec(html))) {
  const attrs = match[1] || '';
  if (/\bsrc\s*=/.test(attrs)) continue;
  const type = (/\btype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] || '').toLowerCase();
  if (type && !/(?:javascript|ecmascript|module)/.test(type)) continue;
  inlineCount += 1;
  try { new vm.Script(match[2], { filename: `index-inline-${inlineCount}.js` }); }
  catch (error) { fail(`Inline script ${inlineCount} has a syntax error: ${error.message}`); }
}
if (!inlineCount) fail('No inline JavaScript blocks were found.');

// Basic HTML ID uniqueness, excluding script/style/template contents where literal strings can look like markup.
const markupOnly = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<!--([\s\S]*?)-->/g, '');
const ids = new Map();
for (const idMatch of markupOnly.matchAll(/\bid\s*=\s*(["'])([^"']+)\1/gi)) {
  const id = idMatch[2];
  ids.set(id, (ids.get(id) || 0) + 1);
}
const duplicates = [...ids.entries()].filter(([, count]) => count > 1);
if (duplicates.length) fail(`Duplicate DOM IDs: ${duplicates.slice(0, 20).map(([id, count]) => `${id}×${count}`).join(', ')}`);

// Required resilience and data-loader invariants.
for (const [needle, label] of [
  ['id="nexus-data-resilience-patch-v1"', 'data-resilience browser patch'],
  ['./data/scmdb-missions-live.js', 'bundled SCMDB snapshot loader'],
  ['Star Citizen Wiki', 'Star Citizen Wiki fallback support'],
  ['nexusMissionFaction', 'Contract Finder faction formatter'],
  ['nexusWikeloSyncMissionData', 'Wikelo synchronization'],
]) {
  if (!html.includes(needle)) fail(`Missing ${label}.`);
}
const destructive = html.indexOf("trade.materials=[];trade.rewards=[];trade.__liveVerified=false");
const resilience = html.indexOf('id="nexus-data-resilience-patch-v1"');
if (destructive >= 0 && resilience <= destructive) fail('The Wikelo resilience patch must execute after the legacy destructive standardizer.');
if (!html.includes('missing live recipe fields do not erase the catalog')) fail('Wikelo non-destructive fallback invariant is missing.');
if (!html.includes("return 'Unspecified faction'")) fail('Opaque faction identifiers are not guarded by the readable-name resolver.');

// Local src/href references should exist in the actual repository checkout.
if (!preSync) {
  const refs = new Set();
  for (const refMatch of markupOnly.matchAll(/\b(?:src|href)\s*=\s*(["'])(\.\/[^"'#?]+)\1/gi)) refs.add(refMatch[2]);
  for (const ref of refs) {
    const relative = ref.replace(/^\.\//, '');
    if (!exists(relative)) warn(`Referenced local asset is missing from this checkout: ${relative}`);
  }

  const snapshotPath = path.join(root, 'data', 'scmdb-missions-live.json');
  if (fs.existsSync(snapshotPath)) {
    try {
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      const rows = Array.isArray(snapshot.missions) ? snapshot.missions : [];
      const active = Math.max(Number(snapshot.activeMissionCount || 0), rows.length);
      if (active < 100) fail(`Contract Finder snapshot is not usable (${active} missions; expected at least 100 after sync).`);
      const rawFactionIds = rows.filter(row => {
        const faction = row?.faction;
        const name = typeof faction === 'object' ? (faction.name || faction.displayName || faction.display_name) : (row?.factionName || faction);
        return row?.factionGuid && (!name || /^(?:[0-9a-f]{8}-){1,4}[0-9a-f-]+$/i.test(String(name)));
      }).length;
      if (rawFactionIds > Math.max(10, rows.length * 0.15)) warn(`${rawFactionIds} mission rows still lack an enriched faction name; browser-side resolver will hide GUIDs.`);
    } catch (error) {
      fail(`Could not parse data/scmdb-missions-live.json: ${error.message}`);
    }
  } else {
    fail('data/scmdb-missions-live.json is missing after synchronization.');
  }
}

// Service worker should exist and use a new cache namespace so deployed clients do not remain on old index.html.
const swPath = path.join(root, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  if (!/data-resilience-v1-20260906/.test(sw)) warn('sw.js does not contain the v2.0.2 data-resilience cache revision; old clients may retain stale assets longer.');
} else {
  warn('sw.js not present in this overlay checkout; verify it exists in the target repository.');
}

console.log(`Toolkit validation: ${inlineCount} inline scripts compiled; ${ids.size} DOM IDs inspected.`);
warnings.forEach(message => console.warn(`WARN: ${message}`));
if (errors.length) {
  errors.forEach(message => console.error(`ERROR: ${message}`));
  process.exit(1);
}
console.log(`PASS: ${preSync ? 'pre-sync' : 'post-sync'} toolkit integrity checks.`);
