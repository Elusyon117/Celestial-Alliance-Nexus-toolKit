#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'pyro-hangar-sync.json');
const SOURCE_URL = process.env.PYRO_HANGAR_SOURCE_URL || 'https://exectimer.com/en';
const CYCLE_MINUTES = 185;
const CYCLE_MS = CYCLE_MINUTES * 60 * 1000;
const ANCHOR_CHANGE_THRESHOLD_MS = 5000;

function findBrowser() {
  if (process.env.PYRO_HANGAR_BROWSER) return process.env.PYRO_HANGAR_BROWSER;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const check = spawnSync('bash', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
    const bin = String(check.stdout || '').trim();
    if (check.status === 0 && bin) return bin;
  }
  throw new Error('No Chrome/Chromium browser binary found on the runner.');
}

function visibleText(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/section>|<\/article>|<\/h\d>|<\/button>|<\/span>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseDurationMs(value) {
  const text = String(value || '').trim();
  const h = Number((text.match(/(\d+)h/i) || [])[1] || 0);
  const m = Number((text.match(/(\d+)m/i) || [])[1] || 0);
  const s = Number((text.match(/(\d+)s/i) || [])[1] || 0);
  return ((h * 60 + m) * 60 + s) * 1000;
}

function extractState(text) {
  const cycleMatch = text.match(/Total Cycle\s+((?:\d{1,2}h\s+)?\d{1,3}m\s+\d{1,2}s)\b/i);
  if (!cycleMatch) throw new Error('ExecTimer rendered page did not expose a live Total Cycle countdown.');
  const remainingMs = parseDurationMs(cycleMatch[1]);
  if (!(remainingMs > 0 && remainingMs <= CYCLE_MS)) throw new Error(`Unexpected cycle remaining value: ${cycleMatch[1]}`);

  const lastSync = (text.match(/Last Sync:\s*([^\n]+)/i) || [])[1]?.trim() || '';
  const version = (text.match(/\bv\d+\.\d+\.\d+\b/i) || [])[0] || 'ExecTimer';
  const build = (text.match(/\b\d+\.\d+\.\d+-(?:live|ptu|eptu)\.\d+\b/i) || [])[0] || '';
  const status = (text.match(/Current Status\s+([^\n]+)/i) || [])[1]?.trim() || '';
  return { remainingMs, remainingText: cycleMatch[1], lastSync, version, build, status };
}

async function readExisting() {
  try { return JSON.parse(await readFile(OUT, 'utf8')); }
  catch { return null; }
}

const browser = findBrowser();
const startedAt = Date.now();
const run = spawnSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--lang=en-US',
  '--virtual-time-budget=12000',
  '--dump-dom',
  SOURCE_URL
], {
  encoding: 'utf8',
  maxBuffer: 25 * 1024 * 1024,
  env: { ...process.env, TZ: 'UTC' }
});
const observedAtMs = Date.now();
if (run.status !== 0 || !String(run.stdout || '').trim()) {
  throw new Error(`Browser scrape failed (${run.status ?? 'unknown'}): ${String(run.stderr || '').slice(0, 1000)}`);
}

const text = visibleText(run.stdout);
const live = extractState(text);
const cyclePositionMs = CYCLE_MS - live.remainingMs;
const anchorEpochMs = observedAtMs - cyclePositionMs;
const previous = await readExisting();

const payload = {
  schema: 'celestial-nexus.pyro-hangar-sync.v1',
  status: 'ok',
  source: SOURCE_URL,
  sourceVersion: live.version,
  sourceBuild: live.build,
  sourceLastSync: live.lastSync,
  sourceStatus: live.status,
  cycleMinutes: CYCLE_MINUTES,
  cycleRemainingMs: live.remainingMs,
  cycleRemainingText: live.remainingText,
  anchorEpochMs,
  observedAt: new Date(observedAtMs).toISOString(),
  fetchedAt: new Date(observedAtMs).toISOString(),
  scrapeDurationMs: observedAtMs - startedAt,
  note: 'Derived from ExecTimer live Total Cycle countdown in a UTC-configured headless Chromium session.'
};

const previousAnchor = Number(previous?.anchorEpochMs);
const sourceSyncUnchanged = String(previous?.sourceLastSync || '') === String(payload.sourceLastSync || '');
const sourceVersionUnchanged = String(previous?.sourceVersion || '') === String(payload.sourceVersion || '');
const anchorUnchanged = Number.isFinite(previousAnchor) && Math.abs(previousAnchor - anchorEpochMs) <= ANCHOR_CHANGE_THRESHOLD_MS;

if (previous?.status === 'ok' && sourceSyncUnchanged && sourceVersionUnchanged && anchorUnchanged) {
  console.log(`Pyro Hangar global anchor unchanged (Δ ${Math.round(anchorEpochMs - previousAnchor)} ms).`);
  process.exit(0);
}

await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Updated ${path.relative(ROOT, OUT)}`);
console.log(`ExecTimer ${live.version}; remaining ${live.remainingText}; anchor ${new Date(anchorEpochMs).toISOString()}`);
