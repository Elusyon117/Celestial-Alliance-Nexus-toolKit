#!/usr/bin/env node
/** Report patch-specific values that still need a module adapter or manual review. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const statusPath = path.join(root, 'data', 'game-data-status.json');
const outPath = path.join(root, 'data', 'patch-audit.json');

const status = JSON.parse(await fs.readFile(statusPath, 'utf8'));
const currentPatch = String(status.detectedPatch || status.modules?.contractFinder?.patch || '');
const source = await fs.readFile(indexPath, 'utf8');
const lines = source.split(/\r?\n/);
const refs = [];
const versionPattern = /(?<!\d)(4\.\d+(?:\.\d+)?)(?!\d)/g;

function patchParts(value) {
  return String(value || '').split('.').map(Number).concat([0, 0, 0]).slice(0, 3);
}
function comparePatch(a, b) {
  const aa = patchParts(a), bb = patchParts(b);
  for (let i = 0; i < 3; i += 1) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return 0;
}
function moduleHint(before) {
  const ids = [...before.matchAll(/id=["']([^"']+-view)["']/g)];
  return ids.at(-1)?.[1] || 'global-or-embedded-data';
}

let offset = 0;
for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
  const line = lines[lineIndex];
  for (const match of line.matchAll(versionPattern)) {
    const patch = match[1];
    const start = Math.max(0, match.index - 100);
    const end = Math.min(line.length, match.index + patch.length + 100);
    const context = line.slice(start, end);
    const patchContext = /patch|version|live|ptu|eptu|gameVersion|targetPatch|"patch"|alpha/i.test(context);
    if (!patchContext || !currentPatch || comparePatch(patch, currentPatch) >= 0) continue;
    const absolute = offset + match.index;
    refs.push({
      patch,
      line: lineIndex + 1,
      module: moduleHint(source.slice(Math.max(0, absolute - 12000), absolute)),
      context: context.replace(/\s+/g, ' ').trim(),
    });
  }
  offset += line.length + 1;
}

const grouped = {};
for (const ref of refs) {
  grouped[ref.module] ||= { count: 0, patches: new Set(), examples: [] };
  grouped[ref.module].count += 1;
  grouped[ref.module].patches.add(ref.patch);
  if (grouped[ref.module].examples.length < 6) grouped[ref.module].examples.push(ref);
}
const modules = Object.fromEntries(
  Object.entries(grouped).map(([key, value]) => [key, {
    count: value.count,
    patches: [...value.patches].sort(),
    examples: value.examples,
  }]),
);
const report = {
  schema: 'celestial-nexus.patch-audit.v1',
  generatedAt: new Date().toISOString(),
  currentPatch,
  staleReferenceCount: refs.length,
  affectedModuleCount: Object.keys(modules).length,
  modules,
  references: refs.slice(0, 250),
  note:
    'This report flags patch-specific embedded values. Only modules with a trusted machine-readable upstream should be auto-rewritten; other modules require a reviewed adapter.',
};
await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Patch audit: ${refs.length} older patch references across ${report.affectedModuleCount} modules.`);
