#!/usr/bin/env node
/** Celestial Nexus v1.9.1-r4 repository and workflow integrity validator. */
import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = path.join(ROOT, 'docs/validation-report.json');
const resolve = rel => path.join(ROOT, rel);
const exists = async rel => access(resolve(rel)).then(() => true).catch(() => false);
const readText = rel => readFile(resolve(rel), 'utf8');
const readJson = async rel => JSON.parse(await readText(rel));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const checks = [];
const check = (name, ok, detail = '', severity = 'error') => checks.push({
  name,
  ok: Boolean(ok),
  severity,
  detail: String(detail || '')
});

await mkdir(path.dirname(REPORT_PATH), { recursive: true });

let index = '';
let release = {};
let manifest = {};
let serviceWorker = '';
let versionText = '';
try {
  [index, release, manifest, serviceWorker, versionText] = await Promise.all([
    readText('index.html'),
    readJson('release.json'),
    readJson('manifest.webmanifest'),
    readText('sw.js'),
    readText('VERSION.txt')
  ]);
  check('core-files-readable', true, 'index, release, manifest, service worker, and version read successfully');
} catch (error) {
  check('core-files-readable', false, error.message);
}

const appVersion = String(release?.appVersion || '').trim();
const cacheRevision = String(release?.cacheRevision || '').trim();
const declaredVersion = String(versionText || '').trim();
const metaVersion = (index.match(/<meta[^>]+name=["']nexus-version["'][^>]+content=["']([^"']+)/i)
  || index.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']nexus-version/i)
  || [])[1] || '';
const htmlVersion = (index.match(/<html[^>]+data-nexus-version=["']([^"']+)/i) || [])[1] || '';
const swVersion = (serviceWorker.match(/\bconst\s+VERSION\s*=\s*["']([^"']+)/) || [])[1] || '';
const registrationRevision = (index.match(/serviceWorker\.register\(["']\.\/sw\.js\?v=([^"']+)/) || [])[1] || '';

check('release-config', /^\d+\.\d+\.\d+$/.test(appVersion) && /^\d+\.\d+\.\d+-r\d+$/.test(cacheRevision), `app=${appVersion || 'missing'}; cache=${cacheRevision || 'missing'}`);
check('version-file', declaredVersion === appVersion, `VERSION.txt=${declaredVersion || 'missing'}; release=${appVersion || 'missing'}`);
check('version-meta', metaVersion === appVersion, `expected=${appVersion}; actual=${metaVersion || 'missing'}`);
check('version-html-attribute', htmlVersion === appVersion, `expected=${appVersion}; actual=${htmlVersion || 'missing'}`);
check('service-worker-version', swVersion === cacheRevision, `expected=${cacheRevision}; actual=${swVersion || 'missing'}`);
check('service-worker-registration', registrationRevision === cacheRevision, `expected=${cacheRevision}; actual=${registrationRevision || 'missing'}`);
check('html-doctype', /^\s*<!doctype html>/i.test(index), 'HTML begins with a doctype');
check('index-size', Buffer.byteLength(index) >= 1_000_000 && Buffer.byteLength(index) <= 12_000_000, `${Buffer.byteLength(index)} bytes`);

const manifestIcons = Array.isArray(manifest?.icons) ? manifest.icons.map(icon => icon?.src).filter(Boolean) : [];
check('manifest-stable-id', Boolean(manifest?.id) && !String(manifest.id).includes('?v='), String(manifest?.id || 'missing'));
check('manifest-icon-version', manifestIcons.length >= 2 && manifestIcons.every(value => String(value).includes(`v=${appVersion}`)), manifestIcons.join(', ') || 'missing icon references');

// Only IDs present in the static document tree count. Script and style source text is removed first.
const staticMarkup = index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => match.replace(/>[\s\S]*<\/script>/i, '></script>'))
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, match => match.replace(/>[\s\S]*<\/style>/i, '></style>'));
const ids = [...staticMarkup.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, indexOfId) => ids.indexOf(id) !== indexOfId))];
check('unique-static-dom-ids', duplicateIds.length === 0, duplicateIds.join(', ') || `${ids.length} unique IDs`);

// Parse every inline JavaScript block without executing it.
const scriptTags = [...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const syntaxErrors = [];
let checkedClassic = 0;
let checkedModules = 0;
for (let indexOfScript = 0; indexOfScript < scriptTags.length; indexOfScript += 1) {
  const attrs = scriptTags[indexOfScript][1] || '';
  const code = scriptTags[indexOfScript][2] || '';
  if (/\bsrc\s*=/.test(attrs)) continue;
  const type = ((attrs.match(/\btype\s*=\s*["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
  if (type && !['text/javascript', 'application/javascript', 'module'].includes(type)) continue;
  try {
    if (type === 'module') {
      const temp = path.join(os.tmpdir(), `nexus-inline-${process.pid}-${indexOfScript + 1}.mjs`);
      await writeFile(temp, code);
      const result = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
      await unlink(temp).catch(() => {});
      if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'module syntax check failed').trim());
      checkedModules += 1;
    } else {
      new vm.Script(code, { filename: `index-inline-${indexOfScript + 1}.js` });
      checkedClassic += 1;
    }
  } catch (error) {
    syntaxErrors.push(`${indexOfScript + 1}: ${error.message}`);
  }
}
check('inline-script-syntax', syntaxErrors.length === 0, syntaxErrors.join('\n') || `${checkedClassic} classic and ${checkedModules} module scripts parsed`);

const featureMarkers = [
  ['wikelo-item-tag', '[Wikelo Item]'],
  ['wikelo-reward-tag', '[Wikelo Reward]'],
  ['wikelo-text-export', 'Export all trades (.txt)'],
  ['tundra-kopion-key', 'items_commodities_kopionhorn_tundra'],
  ['apex-valakkar-key', 'items_commodities_valakkarfang_irradiated_desc'],
  ['sadaryx-key', 'items_commodities_sadaryx_desc'],
  ['killshot-key', 'item_Descnone_rifle_multi_01_collector01'],
  ['fps-relative-performance-chart', 'Relative performance profile'],
  ['fps-spread-chart', 'Hip-fire and ADS spread'],
  ['fps-recoil-chart', 'Recoil pattern']
];
for (const [name, marker] of featureMarkers) check(`feature:${name}`, index.includes(marker), marker);

const requiredFiles = [
  'index.html', 'release.json', 'manifest.webmanifest', 'VERSION.txt', 'sw.js', 'SHA256SUMS.txt',
  'icon-192.png', 'icon-512.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'data/scmdb-missions-live.json', 'data/scmdb-missions-live.js', 'data/game-data-status.json',
  'data/patch-audit.json', 'data/roster.json', 'data/mrkraken-global.ini', 'data/mrkraken-release.json',
  'scripts/sync-scmdb-missions.mjs', 'scripts/audit-patch-data.mjs',
  'scripts/recover-scmdb-from-history.mjs', 'scripts/validate-repo.mjs',
  '.github/workflows/validate-toolkit.yml', '.github/workflows/sync-game-data.yml',
  '.github/workflows/sync-mrkraken-language-pack.yml', '.github/workflows/sync-scmdb-4.9-once.yml'
];
const missingRequired = [];
for (const rel of requiredFiles) if (!(await exists(rel))) missingRequired.push(rel);
check('required-files', missingRequired.length === 0, missingRequired.join(', ') || `${requiredFiles.length} required files found`);

for (const rel of [
  'release.json', 'manifest.webmanifest', 'data/scmdb-missions-live.json',
  'data/game-data-status.json', 'data/patch-audit.json', 'data/roster.json', 'data/mrkraken-release.json'
]) {
  try {
    JSON.parse(await readText(rel));
    check(`json:${rel}`, true, 'valid JSON');
  } catch (error) {
    check(`json:${rel}`, false, error.message);
  }
}

try {
  const payload = await readJson('data/scmdb-missions-live.json');
  const status = await readJson('data/game-data-status.json');
  const missions = Array.isArray(payload?.missions) ? payload.missions : [];
  const module = status?.modules?.contractFinder || {};
  check('scmdb-schema', payload?.schema === 'celestial-nexus.scmdb-missions.v2', payload?.schema || 'missing');
  check('scmdb-patch-verified', payload?.patchVerified === true, `patchVerified=${payload?.patchVerified}`);
  check('scmdb-mission-count', missions.length >= 100 && Number(payload?.missionCount) === missions.length, `declared=${payload?.missionCount}; actual=${missions.length}`);
  check('scmdb-status-count', Number(module?.totalCount) === missions.length, `status=${module?.totalCount}; actual=${missions.length}`);
  check('scmdb-status', ['current', 'stale-upstream-unavailable'].includes(module?.status), module?.status || 'missing');
} catch (error) {
  check('scmdb-integrity', false, error.message);
}

try {
  const meta = await readJson('data/mrkraken-release.json');
  const ini = await readText('data/mrkraken-global.ini');
  const bytes = Buffer.byteLength(ini);
  const entries = ini.split(/\r?\n/).reduce((count, line) => count + (line.includes('=') ? 1 : 0), 0);
  check('mrkraken-entry-count', entries >= 10_000 && Number(meta?.entry_count) === entries, `metadata=${meta?.entry_count}; actual=${entries}`);
  check('mrkraken-byte-count', bytes >= 1_000_000 && Number(meta?.byte_count) === bytes, `metadata=${meta?.byte_count}; actual=${bytes}`);
} catch (error) {
  check('mrkraken-integrity', false, error.message);
}

// Resolve static local HTML references. Query strings and fragments are ignored.
const localMarkupRefs = [...index.matchAll(/(?:src|href)\s*=\s*["'](\.\/[^"'#?]+)[^"']*["']/gi)]
  .map(match => match[1].replace(/^\.\//, ''));
const missingMarkupRefs = [];
for (const rel of [...new Set(localMarkupRefs)]) if (!(await exists(rel))) missingMarkupRefs.push(rel);
check('local-markup-references', missingMarkupRefs.length === 0, missingMarkupRefs.join(', ') || `${new Set(localMarkupRefs).size} local references resolved`);

// Resolve every local file listed in the service-worker shell.
const shellMatch = serviceWorker.match(/const\s+SHELL\s*=\s*\[([\s\S]*?)\];/);
const shellRefs = shellMatch ? [...shellMatch[1].matchAll(/["'](\.\/[^"']+)["']/g)].map(match => match[1]) : [];
const missingShellRefs = [];
for (const raw of shellRefs) {
  if (raw === './') continue;
  const rel = raw.replace(/^\.\//, '').split(/[?#]/)[0];
  if (!(await exists(rel))) missingShellRefs.push(rel);
}
check('service-worker-shell-files', shellRefs.length > 0 && missingShellRefs.length === 0, missingShellRefs.join(', ') || `${shellRefs.length} shell entries resolved`);

// Workflow checks deliberately use no third-party YAML package. GitHub parses workflow YAML itself;
// these checks verify repository-specific structure, action versions, permissions, and file references.
try {
  const workflowDir = resolve('.github/workflows');
  const workflowNames = (await readdir(workflowDir)).filter(name => /\.ya?ml$/i.test(name)).sort();
  check('workflow-count', workflowNames.length === 4, workflowNames.join(', '));
  const referencedScripts = new Set();
  for (const name of workflowNames) {
    const rel = `.github/workflows/${name}`;
    const text = await readText(rel);
    check(`workflow:${name}:name`, /^name:\s*\S/m.test(text), 'name key');
    check(`workflow:${name}:trigger`, /^on:\s*(?:$|\S)/m.test(text), 'on key');
    check(`workflow:${name}:jobs`, /^jobs:\s*$/m.test(text), 'jobs key');
    check(`workflow:${name}:timeout`, /timeout-minutes:\s*\d+/m.test(text), 'timeout configured');
    check(`workflow:${name}:concurrency`, /^concurrency:\s*$/m.test(text), 'concurrency configured');
    check(`workflow:${name}:no-pyyaml`, !/\bimport\s+yaml\b|pip\s+install\s+pyyaml/i.test(text), 'no undeclared PyYAML dependency');
    const isValidation = name === 'validate-toolkit.yml';
    check(`workflow:${name}:permissions`, isValidation ? /contents:\s*read/m.test(text) : /contents:\s*write/m.test(text), isValidation ? 'contents: read' : 'contents: write');
    check(`workflow:${name}:checkout`, /actions\/checkout@v7\b/.test(text), 'actions/checkout@v7');
    if (/setup-node/.test(text)) check(`workflow:${name}:setup-node`, /actions\/setup-node@v7\b/.test(text), 'actions/setup-node@v7');
    if (/upload-artifact/.test(text)) check(`workflow:${name}:upload-artifact`, /actions\/upload-artifact@v7\b/.test(text), 'actions/upload-artifact@v7');
    for (const match of text.matchAll(/\b(scripts\/[A-Za-z0-9._/-]+\.(?:mjs|js))\b/g)) referencedScripts.add(match[1]);
  }
  const missingScripts = [];
  for (const rel of referencedScripts) if (!(await exists(rel))) missingScripts.push(rel);
  check('workflow-script-references', missingScripts.length === 0, missingScripts.join(', ') || `${referencedScripts.size} referenced scripts exist`);
} catch (error) {
  check('workflow-integrity', false, error.message);
}

try {
  const sumsText = await readText('SHA256SUMS.txt');
  const invalid = [];
  let count = 0;
  for (const line of sumsText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/i);
    if (!match) {
      invalid.push(`malformed: ${line}`);
      continue;
    }
    count += 1;
    const [, expected, rel] = match;
    try {
      const content = await readFile(resolve(rel));
      const actual = sha256(content);
      if (actual !== expected.toLowerCase()) invalid.push(`${rel}: expected ${expected}, actual ${actual}`);
    } catch (error) {
      invalid.push(`${rel}: ${error.message}`);
    }
  }
  check('sha256-manifest', count >= 8 && invalid.length === 0, invalid.join('\n') || `${count} checksums verified`);
} catch (error) {
  check('sha256-manifest', false, error.message);
}

const errors = checks.filter(item => !item.ok && item.severity === 'error');
const warnings = checks.filter(item => !item.ok && item.severity === 'warning');
const report = {
  schema: 'celestial-nexus.validation.v2',
  generatedAt: new Date().toISOString(),
  status: errors.length ? 'failed' : warnings.length ? 'passed-with-warnings' : 'passed',
  errors: errors.length,
  warnings: warnings.length,
  release: { appVersion, cacheRevision },
  metrics: {
    bytes: Buffer.byteLength(index),
    lines: index.split(/\r?\n/).length,
    staticIds: ids.length,
    scriptTags: scriptTags.length,
    checkedClassicScripts: checkedClassic,
    checkedModuleScripts: checkedModules
  },
  checks
};
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    '## Toolkit validation',
    '',
    `- Result: **${report.status}**`,
    `- Errors: **${errors.length}**`,
    `- Warnings: **${warnings.length}**`,
    `- HTML: **${report.metrics.bytes.toLocaleString()} bytes**, **${report.metrics.lines.toLocaleString()} lines**`,
    `- Inline scripts parsed: **${checkedClassic + checkedModules}**`,
    ''
  ];
  if (errors.length) summary.push('### Errors', '', ...errors.map(item => `- **${item.name}:** ${item.detail}`), '');
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary.join('\n')}\n`, { flag: 'a' });
}

if (errors.length) process.exitCode = 1;
