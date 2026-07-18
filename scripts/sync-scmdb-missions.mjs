#!/usr/bin/env node
/**
 * Celestial Nexus v1.8.0 SCMDB mission synchronizer.
 *
 * Supports:
 *   - SCMDB_MISSIONS_URL=file:///... or https://...
 *   - automatic latest LIVE discovery through SCMDB versions manifests
 *   - MISSION_PATCH / MISSION_CHANNEL identity validation
 *   - preservation of the last valid tracked snapshot during temporary upstream failures
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const JSON_PATH = path.join(DATA_DIR, 'scmdb-missions-live.json');
const JS_PATH = path.join(DATA_DIR, 'scmdb-missions-live.js');
const STATUS_PATH = path.join(DATA_DIR, 'game-data-status.json');

const TARGET_PATCH = String(process.env.MISSION_PATCH || '').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const DIRECT_URL = String(process.env.SCMDB_MISSIONS_URL || '').trim();
const STRICT_SYNC = /^(1|true|yes)$/i.test(String(process.env.STRICT_SYNC || ''));
const MIN_MISSIONS = Math.max(5, Number(process.env.MIN_MISSION_COUNT || 100));
const TIMEOUT_MS = Math.max(5000, Number(process.env.SCMDB_TIMEOUT_MS || 30000));
const VERSION_URLS = String(process.env.SCMDB_VERSIONS_URLS || 'https://scmdb.net/data/versions.json,https://scmdb.net/data/game-versions.json')
  .split(',').map(v => v.trim()).filter(Boolean);

const now = () => new Date().toISOString();
const exists = async file => access(file).then(() => true).catch(() => false);
const sha256 = text => createHash('sha256').update(text).digest('hex');
const naturalVersion = value => (String(value || '').match(/\b(\d+\.\d+(?:\.\d+)?)\b/) || [,''])[1];
const normalizePatch = value => {
  const raw = naturalVersion(value);
  if (!raw) return '';
  const parts = raw.split('.');
  return parts.length === 2 ? `${raw}.0` : raw;
};
const compareVersion = (a,b) => {
  const av = normalizePatch(a).split('.').map(Number), bv = normalizePatch(b).split('.').map(Number);
  for (let i=0;i<3;i++) if ((av[i]||0)!==(bv[i]||0)) return (av[i]||0)-(bv[i]||0);
  return 0;
};

function jsonStringify(value, pretty=false) {
  return JSON.stringify(value, null, pretty ? 2 : 0) + '\n';
}

async function fetchWithRetry(url, attempts=3) {
  let last;
  for (let i=1;i<=attempts;i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'accept': 'application/json,text/plain;q=0.9,*/*;q=0.5',
          'user-agent': 'Celestial-Nexus-Toolkit/1.8.0 (+https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit)'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      last = error;
      if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
    } finally { clearTimeout(timer); }
  }
  throw last || new Error(`Unable to load ${url}`);
}

async function readSource(source) {
  if (!source) throw new Error('No SCMDB source was selected.');
  if (/^file:/i.test(source)) {
    const file = fileURLToPath(source);
    return { text: await readFile(file, 'utf8'), sourceUrl: pathToFileURL(file).href };
  }
  if (/^https?:/i.test(source)) return { text: await fetchWithRetry(source), sourceUrl: source };
  const file = path.resolve(ROOT, source);
  return { text: await readFile(file, 'utf8'), sourceUrl: pathToFileURL(file).href };
}

function parseJson(text, label) {
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`Invalid JSON from ${label}: ${error.message}`); }
}

function objectStrings(value, depth=0, out=[]) {
  if (depth > 5 || out.length > 4000) return out;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.slice(0,100).forEach(v => objectStrings(v, depth+1, out));
  else if (value && typeof value === 'object') Object.entries(value).slice(0,150).forEach(([k,v]) => {
    out.push(k); objectStrings(v, depth+1, out);
  });
  return out;
}

function identityFrom(payload, sourceUrl='') {
  const direct = [
    payload?.gameVersion, payload?.game_version, payload?.version, payload?.patch,
    payload?.meta?.gameVersion, payload?.meta?.game_version, payload?.meta?.version,
    payload?.metadata?.gameVersion, payload?.metadata?.version, sourceUrl
  ].filter(Boolean).join(' ');
  const haystack = `${direct} ${objectStrings(payload).slice(0,800).join(' ')}`;
  const patch = normalizePatch(haystack) || normalizePatch(TARGET_PATCH);
  const channelMatch = haystack.match(/\b(LIVE|EPTU|PTU)\b/i);
  const channel = (channelMatch?.[1] || TARGET_CHANNEL || 'LIVE').toUpperCase();
  const build = (haystack.match(/(?:LIVE|EPTU|PTU)[._-]?(\d{5,})/i) || haystack.match(/[._-](\d{5,})(?:\D|$)/) || [,''])[1];
  const code = patch ? `${patch}-${channel}${build ? `.${build}` : ''}` : '';
  return { patch, channel, build, code };
}

const missionHints = new Set(['title','name','mission_name','contract_name','display_name','reward','rewards','mission_type','contract_type','faction','mission_giver','objectives','uuid','mission_id']);
function rowScore(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return -100;
  const keys = Object.keys(row).map(k => k.toLowerCase());
  let score = keys.reduce((n,k) => n + (missionHints.has(k) ? 2 : /mission|contract|reward|objective|faction|giver/.test(k) ? 1 : 0), 0);
  if (keys.includes('title') || keys.includes('name') || keys.includes('mission_name')) score += 3;
  return score;
}

function findMissionArray(payload) {
  const candidates = [];
  const visited = new Set();
  const queue = [{ value: payload, path: '$', depth: 0 }];
  while (queue.length) {
    const { value, path: currentPath, depth } = queue.shift();
    if (!value || typeof value !== 'object' || visited.has(value) || depth > 8) continue;
    visited.add(value);
    if (Array.isArray(value)) {
      if (value.length && value.some(v => v && typeof v === 'object')) {
        const sample = value.filter(v => v && typeof v === 'object').slice(0,20);
        const avg = sample.reduce((n,v) => n + rowScore(v), 0) / Math.max(1,sample.length);
        const pathBonus = /mission|contract/i.test(currentPath) ? 15 : /data|record|item|entry/i.test(currentPath) ? 3 : 0;
        candidates.push({ rows: value.filter(v => v && typeof v === 'object'), path: currentPath, score: avg + pathBonus + Math.log10(value.length+1) });
      }
      value.slice(0,40).forEach((v,i) => queue.push({value:v,path:`${currentPath}[${i}]`,depth:depth+1}));
    } else {
      const entries = Object.entries(value);
      if (/mission|contract/i.test(currentPath) && entries.length >= MIN_MISSIONS && entries.every(([,v]) => v && typeof v === 'object' && !Array.isArray(v))) {
        const rows = entries.map(([key,v]) => ({ __sourceKey:key, ...v }));
        const sample = rows.slice(0,20);
        candidates.push({ rows, path: currentPath, score: 18 + sample.reduce((n,v)=>n+rowScore(v),0)/sample.length + Math.log10(rows.length+1) });
      }
      for (const [key,v] of entries.slice(0,500)) queue.push({ value:v, path:`${currentPath}.${key}`, depth:depth+1 });
    }
  }
  candidates.sort((a,b) => b.score-a.score || b.rows.length-a.rows.length);
  const selected = candidates[0];
  if (!selected || selected.rows.length < MIN_MISSIONS) {
    const summary = candidates.slice(0,5).map(c => `${c.path}:${c.rows.length}`).join(', ');
    throw new Error(`Could not locate at least ${MIN_MISSIONS} mission records. Candidates: ${summary || 'none'}`);
  }
  return selected;
}

function isInactive(row) {
  const value = row?.active ?? row?.is_active ?? row?.enabled ?? row?.released ?? row?.isReleased;
  if (value === false || value === 0 || value === '0') return true;
  const status = String(row?.status ?? row?.state ?? row?.availability ?? '').toLowerCase();
  return /inactive|disabled|deprecated|legacy|removed|unreleased|archived/.test(status);
}

function discoverUrls(payload, baseUrl) {
  const found = [];
  const walk = (value, context='', depth=0) => {
    if (depth > 7) return;
    if (typeof value === 'string') {
      if (/\.json(?:\?|$)/i.test(value) && /live/i.test(`${context} ${value}`)) {
        try { found.push(new URL(value, baseUrl).href); } catch (_) {}
      }
      return;
    }
    if (Array.isArray(value)) return value.forEach(v => walk(v, context, depth+1));
    if (value && typeof value === 'object') Object.entries(value).forEach(([k,v]) => walk(v, `${context} ${k}`, depth+1));
  };
  walk(payload);
  return [...new Set(found)].sort((a,b) => compareVersion(b,a));
}

async function chooseSource() {
  if (DIRECT_URL) return DIRECT_URL;
  let last;
  for (const versionsUrl of VERSION_URLS) {
    try {
      const text = await fetchWithRetry(versionsUrl);
      const payload = parseJson(text, versionsUrl);
      let urls = discoverUrls(payload, versionsUrl);
      if (TARGET_PATCH) urls = urls.filter(url => normalizePatch(url) === normalizePatch(TARGET_PATCH));
      if (urls[0]) return urls[0];
      throw new Error(`No ${TARGET_CHANNEL} JSON file was listed by ${versionsUrl}`);
    } catch (error) { last = error; }
  }
  throw last || new Error('SCMDB versions discovery failed.');
}

async function loadExistingStatus() {
  try { return JSON.parse(await readFile(STATUS_PATH,'utf8')); } catch (_) { return null; }
}

async function preserveExisting(error) {
  if (!(await exists(JSON_PATH))) return false;
  let payload;
  try { payload = JSON.parse(await readFile(JSON_PATH,'utf8')); } catch (_) { return false; }
  const missions = Array.isArray(payload?.missions) ? payload.missions : [];
  if (missions.length < MIN_MISSIONS || payload?.patchVerified === false) return false;
  const previous = await loadExistingStatus();
  const module = previous?.modules?.contractFinder || {};
  const status = {
    schema: 'celestial-nexus.game-data-status.v1',
    generatedAt: now(),
    detectedPatch: payload.targetPatch || normalizePatch(payload.gameVersion),
    detectedChannel: payload.targetChannel || TARGET_CHANNEL,
    modules: {
      contractFinder: {
        ...module,
        status: 'stale-upstream-unavailable',
        patch: payload.targetPatch || module.patch,
        channel: payload.targetChannel || module.channel,
        gameVersion: payload.gameVersion || module.gameVersion,
        activeCount: missions.filter(row => !isInactive(row)).length,
        legacyCount: missions.filter(isInactive).length,
        totalCount: missions.length,
        lastAttemptAt: now(),
        lastError: String(error?.message || error)
      }
    }
  };
  await writeFile(STATUS_PATH, jsonStringify(status, true));
  console.warn(`SCMDB unavailable; preserved ${missions.length} tracked mission records.`);
  return true;
}

async function main() {
  await mkdir(DATA_DIR, { recursive:true });
  let source;
  try {
    source = await chooseSource();
    const { text, sourceUrl } = await readSource(source);
    const raw = parseJson(text, sourceUrl);
    const identity = identityFrom(raw, sourceUrl);
    const expectedPatch = normalizePatch(TARGET_PATCH);
    if (expectedPatch && identity.patch && identity.patch !== expectedPatch) throw new Error(`SCMDB dataset patch ${identity.patch} does not match requested ${expectedPatch}.`);
    if (TARGET_CHANNEL && identity.channel && identity.channel !== TARGET_CHANNEL) throw new Error(`SCMDB dataset channel ${identity.channel} does not match requested ${TARGET_CHANNEL}.`);
    const patch = expectedPatch || identity.patch;
    if (!patch) throw new Error('Unable to determine SCMDB patch identity. Set MISSION_PATCH explicitly.');
    const channel = TARGET_CHANNEL || identity.channel || 'LIVE';
    const selected = findMissionArray(raw);
    const missions = selected.rows;
    const activeCount = missions.filter(row => !isInactive(row)).length;
    const legacyCount = missions.length - activeCount;
    if (activeCount < MIN_MISSIONS) throw new Error(`Only ${activeCount} active mission records were found; expected at least ${MIN_MISSIONS}.`);
    const gameVersion = identity.code || `${patch}-${channel}`;
    const fetchedAt = now();
    const payload = {
      schema: 'celestial-nexus.scmdb-missions.v2',
      source: `SCMDB ${gameVersion} mission snapshot`,
      sourceUrl,
      fetchedAt,
      gameVersion,
      targetPatch: patch,
      targetChannel: channel,
      patchVerified: true,
      isFallback: false,
      missionCount: missions.length,
      meta: {
        sourcePath: selected.path,
        sourceRecordCount: missions.length,
        activeCount,
        legacyCount,
        targetPatch: patch,
        targetChannel: channel,
        gameVersion,
        patchVerified: true,
        fetchedAt
      },
      missions
    };
    const jsonText = jsonStringify(payload, false);
    const fingerprint = sha256(jsonText);
    const status = {
      schema: 'celestial-nexus.game-data-status.v1',
      generatedAt: fetchedAt,
      detectedPatch: patch,
      detectedChannel: channel,
      modules: {
        contractFinder: {
          status: 'current', source: payload.source, sourceUrl,
          versionsUrl: DIRECT_URL ? '' : VERSION_URLS[0], patch, channel, gameVersion,
          fetchedAt, activeCount, legacyCount, totalCount: missions.length,
          fingerprint, lastError: ''
        }
      }
    };
    await Promise.all([
      writeFile(JSON_PATH, jsonText),
      writeFile(JS_PATH, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD=${JSON.stringify(payload)};\n`),
      writeFile(STATUS_PATH, jsonStringify(status, true))
    ]);
    console.log(`Synchronized ${missions.length} SCMDB missions (${activeCount} active) for ${gameVersion}.`);
  } catch (error) {
    const preserved = !STRICT_SYNC && !DIRECT_URL && await preserveExisting(error);
    if (preserved) return;
    console.error(error?.stack || error);
    process.exitCode = 1;
  }
}

await main();
