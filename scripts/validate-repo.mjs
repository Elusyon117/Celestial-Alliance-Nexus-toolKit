#!/usr/bin/env node
/** Repository-level validation for Celestial Nexus Toolkit v2.x.
 * Derives the toolkit version from index.html instead of hard-coding a release number.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [], warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

if (!exists('index.html')) fail('index.html is missing.');
const html = exists('index.html') ? read('index.html') : '';
const metaVersion = /<meta\s+content=["']([^"']+)["']\s+name=["']nexus-version["']/i.exec(html)?.[1]
  || /<meta\s+name=["']nexus-version["']\s+content=["']([^"']+)["']/i.exec(html)?.[1]
  || /data-nexus-version=["']([^"']+)["']/i.exec(html)?.[1]
  || '';
if (!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(metaVersion)) fail(`Could not derive a semantic toolkit version from index.html (found ${metaVersion || 'nothing'}).`);
for (const needle of [`data-nexus-version="${metaVersion}"`, `content="${metaVersion}" name="nexus-version"`]) {
  if (metaVersion && !html.includes(needle)) warn(`Version marker not found in expected form: ${needle}`);
}

let scriptCount = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = match[1] || '';
  if (/\bsrc\s*=/.test(attrs)) continue;
  const type = (/\btype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] || '').toLowerCase();
  if (type && !/(?:javascript|ecmascript|module)/.test(type)) continue;
  scriptCount += 1;
  try { new vm.Script(match[2], { filename: `index-inline-${scriptCount}.js` }); }
  catch (error) { fail(`Inline script ${scriptCount} syntax error: ${error.message}`); }
}
if (!scriptCount) fail('No inline scripts were found.');

const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
const ids = new Map();
for (const match of markup.matchAll(/\bid\s*=\s*(["'])([^"']+)\1/gi)) ids.set(match[2], (ids.get(match[2]) || 0) + 1);
const duplicateIds = [...ids.entries()].filter(([, count]) => count > 1);
if (duplicateIds.length) fail(`Duplicate DOM IDs: ${duplicateIds.slice(0, 30).map(([id,count]) => `${id}×${count}`).join(', ')}`);

// Inline event attributes must reference functions that exist somewhere in the HTML JavaScript.
const handlerNames = new Set();
for (const match of markup.matchAll(/\bon(?:click|change|input|submit|keydown|keyup|load|error)\s*=\s*(["'])([\s\S]*?)\1/gi)) {
  for (const call of match[2].matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = call[1];
    if (!['if','for','while','switch','catch','function','alert','confirm','prompt','setTimeout','clearTimeout'].includes(name)) handlerNames.add(name);
  }
}
for (const name of handlerNames) {
  const escaped = name.replace(/[$]/g, '\\$&');
  const definition = new RegExp(`(?:function\\s+${escaped}\\s*\\(|(?:const|let|var)\\s+${escaped}\\s*=|(?:window\\.)?${escaped}\\s*=)`);
  if (!definition.test(html)) fail(`Inline UI handler ${name}() has no definition.`);
}

for (const relative of ['scripts/sync-scmdb-missions.mjs','scripts/validate-toolkit.mjs','scripts/test-data-resilience.mjs','scripts/audit-patch-data.mjs','.github/workflows/sync-game-data.yml','.github/workflows/validate-toolkit.yml','sw.js']) {
  if (!exists(relative)) fail(`${relative} is required by the v2.0.4 update but is missing.`);
}

if (/check\(['"]version-meta['"],\s*version\s*===\s*['"]1\.8\.0['"]/.test(exists('scripts/validate-repo.mjs') ? read('scripts/validate-repo.mjs') : '')) {
  fail('validate-repo.mjs still hard-codes toolkit version 1.8.0.');
}

// Workflows should only invoke scripts present in the repository.
for (const workflow of ['.github/workflows/sync-game-data.yml','.github/workflows/validate-toolkit.yml']) {
  if (!exists(workflow)) continue;
  const text = read(workflow);
  for (const call of text.matchAll(/node\s+([\w./-]+\.mjs)/g)) if (!exists(call[1])) fail(`${workflow} invokes missing ${call[1]}.`);
}

console.log(`Repository validation: version ${metaVersion || 'unknown'}; ${scriptCount} inline scripts; ${ids.size} DOM IDs; ${handlerNames.size} inline handler functions.`);
warnings.forEach(message => console.warn(`WARN: ${message}`));
if (errors.length) { errors.forEach(message => console.error(`ERROR: ${message}`)); process.exit(1); }
console.log('PASS: repository structure and version-derived validation checks.');
