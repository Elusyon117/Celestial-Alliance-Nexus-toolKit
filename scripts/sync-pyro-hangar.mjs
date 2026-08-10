#!/usr/bin/env node
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'pyro-hangar-sync.json');
const SOURCE_URL = process.env.PYRO_HANGAR_SOURCE_URL || 'https://exectimer.com/index.html?lang=en';
const CYCLE_MINUTES = 185;
const CYCLE_MS = CYCLE_MINUTES * 60 * 1000;
const ANCHOR_CHANGE_THRESHOLD_MS = 2500;
const LOAD_TIMEOUT_MS = 25000;

function findBrowser() {
  if (process.env.PYRO_HANGAR_BROWSER) return process.env.PYRO_HANGAR_BROWSER;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const check = spawnSync('bash', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
    const bin = String(check.stdout || '').trim();
    if (check.status === 0 && bin) return bin;
  }
  throw new Error('No Chrome/Chromium browser binary found on the runner.');
}

function parseDurationMs(value) {
  const text = String(value || '').trim();
  const h = Number((text.match(/(\d+)h/i) || [])[1] || 0);
  const m = Number((text.match(/(\d+)m/i) || [])[1] || 0);
  const s = Number((text.match(/(\d+)s/i) || [])[1] || 0);
  return ((h * 60 + m) * 60 + s) * 1000;
}

function extractState(text) {
  const cycleMatch = String(text || '').match(/Total Cycle\s+((?:\d{1,2}h\s+)?\d{1,3}m\s+\d{1,2}s)\b/i);
  if (!cycleMatch) throw new Error('ExecTimer rendered page did not expose a live Total Cycle countdown.');
  const remainingMs = parseDurationMs(cycleMatch[1]);
  if (!(remainingMs > 0 && remainingMs <= CYCLE_MS)) throw new Error(`Unexpected cycle remaining value: ${cycleMatch[1]}`);

  const lastSync = (text.match(/Last Sync:\s*([^\n]+)/i) || [])[1]?.trim() || '';
  if (!lastSync || lastSync === '--') throw new Error('ExecTimer global Last Sync has not loaded; refusing to publish an unverified clock.');
  const version = (text.match(/\bv\d+\.\d+\.\d+\b/i) || [])[0] || 'ExecTimer';
  const build = (text.match(/\b\d+\.\d+\.\d+-(?:live|ptu|eptu)\.\d+\b/i) || [])[0] || '';
  const status = (text.match(/Current Status\s+([^\n]+)/i) || [])[1]?.trim() || '';
  if (!status || /unknown/i.test(status)) throw new Error('ExecTimer live phase status has not loaded; refusing to publish an unverified clock.');
  return { remainingMs, remainingText: cycleMatch[1], lastSync, version, build, status };
}

async function readExisting() {
  try { return JSON.parse(await readFile(OUT, 'utf8')); }
  catch { return null; }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function connectWebSocket(url) {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => { try { ws.close(); } catch {} reject(new Error('CDP websocket timeout')); }, 8000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(ws); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP websocket connection failed')); }, { once: true });
  });
}

function createCdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    let msg;
    try { msg = JSON.parse(String(event.data)); } catch { return; }
    if (!msg.id || !pending.has(msg.id)) return;
    const item = pending.get(msg.id);
    pending.delete(msg.id);
    clearTimeout(item.timer);
    if (msg.error) item.reject(new Error(msg.error.message || 'CDP command failed'));
    else item.resolve(msg.result || {});
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const commandId = ++id;
    const timer = setTimeout(() => {
      if (!pending.has(commandId)) return;
      pending.delete(commandId);
      reject(new Error(`CDP ${method} timed out`));
    }, 7000);
    pending.set(commandId, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: commandId, method, params }));
  });
}

async function waitForDebugPort(stderr) {
  return await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not expose a DevTools endpoint')), 10000);
    stderr.setEncoding('utf8');
    stderr.on('data', chunk => {
      buffer += chunk;
      const match = buffer.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (!match) return;
      clearTimeout(timer);
      resolve(Number(match[1]));
    });
  });
}

const browser = findBrowser();
const profileDir = await mkdtemp(path.join(os.tmpdir(), 'nexus-pyro-sync-'));
const startedAt = Date.now();
let chrome;
let ws;
try {
  chrome = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--lang=en-US',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    SOURCE_URL
  ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TZ: 'UTC' } });

  const port = await waitForDebugPort(chrome.stderr);
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  let target;
  while (Date.now() < deadline) {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()).catch(() => []);
    target = list.find(item => item.type === 'page' && /exectimer\.com/i.test(item.url || '')) || list.find(item => item.type === 'page');
    if (target?.webSocketDebuggerUrl) break;
    await delay(250);
  }
  if (!target?.webSocketDebuggerUrl) throw new Error('Could not locate ExecTimer page target in Chrome.');

  ws = await connectWebSocket(target.webSocketDebuggerUrl);
  const cdp = createCdp(ws);
  await cdp('Runtime.enable');

  const samples = [];
  let lastRemainingText = '';
  while (Date.now() < deadline && samples.length < 3) {
    const result = await cdp('Runtime.evaluate', {
      expression: `(() => ({ text: document.body ? document.body.innerText : '', observedAtMs: Date.now(), readyState: document.readyState }))()`,
      returnByValue: true,
      awaitPromise: true
    });
    const sample = result?.result?.value;
    try {
      const live = extractState(String(sample?.text || ''));
      const observedAtMs = Number(sample?.observedAtMs);
      if (Number.isFinite(observedAtMs) && live.remainingText !== lastRemainingText) {
        const cyclePositionMs = CYCLE_MS - live.remainingMs;
        samples.push({ live, observedAtMs, anchorCandidateMs: observedAtMs - cyclePositionMs });
        lastRemainingText = live.remainingText;
      }
    } catch {}
    if (samples.length < 3) await delay(120);
  }
  if (samples.length < 2) throw new Error('ExecTimer did not provide enough verified live countdown samples before timeout.');

  const anchors = samples.map(item => item.anchorCandidateMs).sort((a, b) => a - b);
  const anchorEpochMs = anchors[Math.floor(anchors.length / 2)];
  const sampleSpreadMs = anchors.at(-1) - anchors[0];
  if (sampleSpreadMs > 1800) throw new Error(`ExecTimer samples disagreed by ${Math.round(sampleSpreadMs)} ms; refusing to publish an unstable clock.`);

  const representative = samples.reduce((best, item) =>
    Math.abs(item.anchorCandidateMs - anchorEpochMs) < Math.abs(best.anchorCandidateMs - anchorEpochMs) ? item : best
  , samples[0]);
  const live = representative.live;
  const browserObservedAtMs = representative.observedAtMs;
  const previous = await readExisting();
  const fetchedAtMs = Date.now();

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
    observedAt: new Date(browserObservedAtMs).toISOString(),
    fetchedAt: new Date(fetchedAtMs).toISOString(),
    scrapeDurationMs: fetchedAtMs - startedAt,
    samplingMethod: 'chrome-devtools-atomic-median',
    sampleCount: samples.length,
    sampleSpreadMs: Math.round(sampleSpreadMs),
    samplingQuantizationMs: 1000,
    note: 'ExecTimer countdown and browser timestamp are captured atomically through Chrome DevTools across consecutive countdown ticks; the median phase anchor is published.'
  };

  const previousAnchor = Number(previous?.anchorEpochMs);
  const normalizedDelta = Number.isFinite(previousAnchor)
    ? ((((anchorEpochMs - previousAnchor) + CYCLE_MS / 2) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS - CYCLE_MS / 2
    : Infinity;
  const sourceSyncUnchanged = String(previous?.sourceLastSync || '') === String(payload.sourceLastSync || '');
  const sourceVersionUnchanged = String(previous?.sourceVersion || '') === String(payload.sourceVersion || '');
  const anchorUnchanged = Number.isFinite(normalizedDelta) && Math.abs(normalizedDelta) <= ANCHOR_CHANGE_THRESHOLD_MS;

  if (previous?.status === 'ok' && sourceSyncUnchanged && sourceVersionUnchanged && anchorUnchanged) {
    console.log(`Pyro Hangar global anchor unchanged (cycle-normalized Δ ${Math.round(normalizedDelta)} ms).`);
    process.exitCode = 0;
  } else {
    await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(`Updated ${path.relative(ROOT, OUT)}`);
    console.log(`ExecTimer ${live.version}; remaining ${live.remainingText}; anchor ${new Date(anchorEpochMs).toISOString()}`);
  }
} finally {
  try { ws?.close(); } catch {}
  if (chrome && chrome.exitCode === null) {
    try { chrome.kill('SIGTERM'); } catch {}
    await Promise.race([
      new Promise(resolve => chrome.once('exit', resolve)),
      delay(1500).then(() => { try { if (chrome.exitCode === null) chrome.kill('SIGKILL'); } catch {} })
    ]).catch(() => {});
  }
  await rm(profileDir, { recursive: true, force: true }).catch(() => {});
}
