#!/usr/bin/env node
/** Non-destructive patch audit. Writes telemetry; it never rewrites curated module data. */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const statusPath = path.join(root, 'data', 'game-data-status.json');
const outPath = path.join(root, 'data', 'patch-audit.json');
const html = await fs.readFile(indexPath, 'utf8');
let status = {};
try { status = JSON.parse(await fs.readFile(statusPath, 'utf8')); } catch {}
const currentPatch = String(status?.modules?.contractFinder?.patch || /data-nexus-live-patch=["']([^"']+)/i.exec(html)?.[1] || '');
const currentMajorMinor = /^\d+\.\d+/.exec(currentPatch)?.[0] || '';
const matches = [...html.matchAll(/\b(4\.\d+(?:\.\d+)?)(?:-(?:LIVE|PTU|EPTU)(?:\.\d+)?)?\b/gi)].map(match => match[1]);
const counts = new Map();
for (const patch of matches) counts.set(patch, (counts.get(patch) || 0) + 1);
const stale = [...counts.entries()].filter(([patch]) => currentMajorMinor && !patch.startsWith(currentMajorMinor)).sort((a,b) => b[1]-a[1]);
const report = {
  schema: 'celestial-nexus.patch-audit.v2', generatedAt: new Date().toISOString(), currentPatch: currentPatch || null,
  currentMajorMinor: currentMajorMinor || null, staleReferenceCount: stale.reduce((sum,[,count]) => sum + count, 0),
  modules: { toolkit: { count: stale.reduce((sum,[,count]) => sum + count, 0), patches: stale.map(([patch]) => patch) } },
  observedPatchReferences: Object.fromEntries([...counts.entries()].sort((a,b) => a[0].localeCompare(b[0]))),
  note: 'Informational audit only. Historical references may be intentional; this script never auto-rewrites curated data.'
};
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Patch audit complete: ${report.staleReferenceCount} historical patch references flagged for review.`);
