#!/usr/bin/env node
/**
 * Mission catalog synchronizer — strict 4.8.3 LIVE targeting.
 *
 * 1. Discovers SCMDB mission datasets, but only accepts 4.8.3 LIVE sources.
 * 2. Falls back to the Star Citizen Wiki API only after discovering an exact
 *    4.8.3 LIVE game-version code and passing it to every mission request.
 * 3. Refuses to overwrite the repository with PTU, 4.9, 4.8.2, or an
 *    unversioned/default API response.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'data', 'scmdb-missions-live.json');
const outJs = path.join(root, 'data', 'scmdb-missions-live.js');
const wikiBase = 'https://api.star-citizen.wiki/api/missions';
const wikiVersionsUrl = 'https://api.star-citizen.wiki/api/game-versions';
const TARGET_PATCH = String(process.env.MISSION_PATCH || '4.8.3').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const KNOWN_TARGET_VERSION = String(process.env.MISSION_VERSION || '4.8.3-LIVE.12122953').trim();

const start = [
  `https://scmdb.net/data/merged-${TARGET_PATCH.toLowerCase()}-${TARGET_CHANNEL.toLowerCase()}.12122953.json`,
  'https://scmdb.net/'
];
if (process.env.SCMDB_MISSIONS_URL) start.unshift(process.env.SCMDB_MISSIONS_URL);
start.push(
  'https://scmdb.net/data/versions.json',
  'https://scmdb.net/data/manifest.json',
  'https://scmdb.net/data/index.json',
  'https://scmdb.net/data/missions.json',
  'https://scmdb.net/data/missions-live.json',
  'https://scmdb.net/data/contracts.json',
  'https://scmdb.net/api/missions',
  'https://scmdb.net/api/contracts'
);

function scoreArray(rows) {
  if (!Array.isArray(rows) || !rows.length) return -1;
  let score = Math.min(rows.length, 5000);
  for (const row of rows.slice(0, 15)) {
    if (!row || typeof row !== 'object') continue;
    for (const key of ['title','name','description','debug_name','debugName','mission_giver','missionGiver','reward_min','rewardUEC','reward_scope','reputation_gained','blueprints','blueprintRewards','faction','uuid','id']) {
      if (key in row || (row.attributes && key in row.attributes)) score += 18;
    }
  }
  return score;
}

function findMissionArray(payload) {
  let found = [], score = -1;
  const walked = new Set();
  function walk(value, depth = 0) {
    if (depth > 8 || value == null || typeof value !== 'object' || walked.has(value)) return;
    walked.add(value);
    if (Array.isArray(value)) {
      const nextScore = scoreArray(value);
      if (nextScore > score) { found = value; score = nextScore; }
      for (const item of value.slice(0, 40)) walk(item, depth + 1);
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (['missions','contracts','records','results','data','items'].includes(key.toLowerCase()) && Array.isArray(child)) {
        const nextScore = scoreArray(child) + 50;
        if (nextScore > score) { found = child; score = nextScore; }
      }
      walk(child, depth + 1);
    }
  }
  walk(payload);
  return { rows: found, score };
}

function flattenApiRecord(row) {
  if (!row || typeof row !== 'object') return row;
  if (!row.attributes || typeof row.attributes !== 'object') return row;
  return {
    ...row.attributes,
    id: row.id ?? row.attributes.id,
    type: row.type,
    relationships: row.relationships,
    links: row.links,
    __raw_api_record: row
  };
}

function recordKey(row, index) {
  return String(row?.uuid || row?.id || row?.mission_uuid || row?.debug_name || row?.debugName || row?.name || row?.title || index);
}

function parseVersionIdentity(value) {
  const text = String(value || '');
  const match = text.match(/(\d+\.\d+\.\d+)[._-](live|ptu|eptu)(?:[._-](\d+))?/i);
  if (!match) return null;
  const patch = match[1];
  const channel = match[2].toUpperCase();
  const build = match[3] || '';
  return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
}

function metadataStrings(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [
    payload.gameVersion, payload.game_version, payload.version, payload.patch, payload.build,
    payload.meta?.gameVersion, payload.meta?.game_version, payload.meta?.version, payload.meta?.patch,
    payload.metadata?.gameVersion, payload.metadata?.game_version, payload.metadata?.version, payload.metadata?.patch
  ];
  return candidates.filter(Boolean).map(String);
}

function identifySource(url, payload) {
  for (const value of [url, ...metadataStrings(payload)]) {
    const identity = parseVersionIdentity(value);
    if (identity) return identity;
  }
  return null;
}

function isTarget(identity) {
  return Boolean(identity && identity.patch === TARGET_PATCH && identity.channel === TARGET_CHANNEL);
}

async function fetchJson(url, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Celestial-Nexus-Mission-Sync/3.0'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function discoverScmdb() {
  const queue = [...new Set(start)], seen = new Set();
  let best = null, bestScore = -1, bestUrl = '', bestIdentity = null;
  const maxRequests = 80;

  function addUrl(base, value) {
    if (typeof value !== 'string' || value.length > 500) return;
    const clean = value.replaceAll('\\/', '/');
    if (!/(mission|contract|version|manifest|index|merged|data|\.json)/i.test(clean)) return;
    if (!/^(?:https?:)?\/\//i.test(clean) && !clean.startsWith('/') && !/\.(?:json|js)(?:[?#]|$)/i.test(clean)) return;
    try {
      const url = new URL(clean, base);
      if ((url.hostname === 'scmdb.net' || url.hostname.endsWith('.supabase.co')) && !seen.has(url.href)) queue.push(url.href);
    } catch {}
  }

  function discoverJson(base, value, depth = 0) {
    if (depth > 7 || value == null) return;
    if (typeof value === 'string') { addUrl(base, value); return; }
    if (Array.isArray(value)) { for (const child of value.slice(0, 300)) discoverJson(base, child, depth + 1); return; }
    if (typeof value === 'object') for (const child of Object.values(value)) discoverJson(base, child, depth + 1);
  }

  function discoverText(base, text) {
    for (const match of text.matchAll(/(?:https?:\\?\/\\?\/[^"'`\s)]+|\/[A-Za-z0-9_./?=&%{}-]+(?:\.json|\.js)(?:\?[^"'`\s)]*)?)/g)) addUrl(base, match[0]);
    for (const match of text.matchAll(/["'`]([^"'`]*(?:mission|contract|version|manifest|merged|data)[^"'`]*)["'`]/gi)) addUrl(base, match[1]);
  }

  while (queue.length && seen.size < maxRequests) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    console.log(`Checking SCMDB candidate ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json,text/javascript,text/html;q=0.9,*/*;q=0.8',
          'User-Agent': 'Celestial-Nexus-Mission-Sync/3.0'
        }
      });
      if (!response.ok) continue;
      const text = await response.text();
      const contentType = response.headers.get('content-type') || '';
      let payload = null;
      if (contentType.includes('json') || /^\s*[\[{]/.test(text)) {
        try { payload = JSON.parse(text); } catch {}
      }
      if (payload) {
        const identity = identifySource(url, payload);
        const found = findMissionArray(payload);
        if (found.rows.length >= 5) {
          if (!isTarget(identity)) {
            console.warn(`Skipping mission dataset outside target ${TARGET_PATCH} ${TARGET_CHANNEL}: ${identity?.code || 'unversioned'} (${url})`);
          } else if (found.score > bestScore) {
            best = found.rows;
            bestScore = found.score;
            bestUrl = url;
            bestIdentity = identity;
          }
        }
        discoverJson(url, payload);
      } else {
        discoverText(url, text);
      }
    } catch (error) {
      console.warn(`SCMDB candidate failed: ${error.message}`);
    }
  }
  if (!best || best.length < 5 || !bestIdentity) return null;
  return { rows: best.map(flattenApiRecord), sourceUrl: bestUrl, identity: bestIdentity };
}

function extractRows(payload) {
  const direct = payload?.data;
  const rows = Array.isArray(direct) ? direct : findMissionArray(payload).rows;
  return rows.map(flattenApiRecord);
}

function versionCode(row) {
  return String(row?.code || row?.name || row?.version || row?.game_version || row?.gameVersion || row?.attributes?.code || row?.attributes?.name || row?.attributes?.version || '');
}

async function discoverWikiTargetVersion() {
  const url = new URL(wikiVersionsUrl);
  url.searchParams.set('filter[channel]', 'live');
  url.searchParams.set('page[size]', '200');
  url.searchParams.set('sort', '-released_at');
  const payload = await fetchJson(url.href, 30000);
  const rows = extractRows(payload);
  const matches = rows
    .map(row => ({ row, code: versionCode(row), identity: parseVersionIdentity(versionCode(row)) }))
    .filter(entry => isTarget(entry.identity));
  if (!matches.length) {
    const available = rows.map(versionCode).filter(Boolean).slice(0, 12).join(', ');
    console.warn(`The Wiki API does not currently expose ${TARGET_PATCH} ${TARGET_CHANNEL}. Available examples: ${available || 'none returned'}. Keeping the existing repository snapshot unchanged.`);
    return null;
  }
  matches.sort((a, b) => Number(b.identity.build || 0) - Number(a.identity.build || 0));
  return matches[0].identity.code || matches[0].code || KNOWN_TARGET_VERSION;
}

async function fetchAllWikiMissions(version) {
  const identity = parseVersionIdentity(version);
  if (!isTarget(identity)) throw new Error(`Refusing Wiki mission download for non-target version: ${version}`);
  const rows = [], keys = new Set();
  let page = 1, lastPage = 1, firstMeta = {};
  const maxPages = 100;
  do {
    const url = new URL(wikiBase);
    url.searchParams.set('version', version);
    url.searchParams.set('page[size]', '200');
    url.searchParams.set('page[number]', String(page));
    url.searchParams.set('filter[grouped]', 'false');
    console.log(`Downloading Wiki ${version} mission page ${page}${lastPage > 1 ? `/${lastPage}` : ''}`);
    const payload = await fetchJson(url.href, 30000);
    if (page === 1) firstMeta = payload?.meta || payload?.metadata || {};
    const found = extractRows(payload);
    for (const row of found) {
      const key = recordKey(row, rows.length);
      if (!keys.has(key)) { keys.add(key); rows.push(row); }
    }
    const meta = payload?.meta || payload?.metadata || {};
    const numericLast = Number(meta.last_page || meta.lastPage || meta.total_pages || meta.totalPages || meta?.page?.last || 0);
    if (Number.isFinite(numericLast) && numericLast > 0) lastPage = numericLast;
    else if (payload?.links?.next) lastPage = Math.max(lastPage, page + 1);
    else lastPage = page;
    page += 1;
  } while (page <= lastPage && page <= maxPages);
  if (!rows.length) throw new Error(`Wiki mission API returned no records for ${version}.`);
  return { rows, meta: firstMeta, version };
}

function fieldInventory(rows) {
  return [...new Set(rows.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))].sort();
}

const scmdb = await discoverScmdb();
let payload;
if (scmdb) {
  payload = {
    schema: 'celestial-nexus.scmd-missions.v3',
    source: 'SCMDB public mission data',
    sourceUrl: scmdb.sourceUrl,
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    targetPatch: TARGET_PATCH,
    targetChannel: TARGET_CHANNEL,
    gameVersion: scmdb.identity.code,
    patchVerified: true,
    verificationMethod: 'SCMDB source URL/metadata matched the required patch and LIVE channel.',
    missionCount: scmdb.rows.length,
    fields: fieldInventory(scmdb.rows),
    missions: scmdb.rows
  };
} else {
  console.warn(`No verified SCMDB ${TARGET_PATCH} ${TARGET_CHANNEL} dataset was available. Discovering an exact Wiki API game-version code.`);
  const version = await discoverWikiTargetVersion();
  if (!version) {
    console.log(`No verified ${TARGET_PATCH} ${TARGET_CHANNEL} mission dataset is available yet. Nothing was changed; the workflow will check again next time.`);
    process.exit(0);
  }
  const wiki = await fetchAllWikiMissions(version);
  payload = {
    schema: 'celestial-nexus.scmd-missions.v3',
    source: 'Star Citizen Wiki API fallback',
    sourceUrl: `${wikiBase}?version=${encodeURIComponent(version)}`,
    isFallback: true,
    fetchedAt: new Date().toISOString(),
    targetPatch: TARGET_PATCH,
    targetChannel: TARGET_CHANNEL,
    gameVersion: version,
    patchVerified: true,
    verificationMethod: 'Exact LIVE game version discovered through /api/game-versions and supplied to every mission request.',
    notice: `SCMDB did not expose a verified ${TARGET_PATCH} ${TARGET_CHANNEL} dataset during this run. Every paginated mission record for the exact Wiki API version ${version} was preserved as a labelled fallback.`,
    missionCount: wiki.rows.length,
    fields: fieldInventory(wiki.rows),
    missions: wiki.rows
  };
}

const finalIdentity = parseVersionIdentity(payload.gameVersion || payload.sourceUrl);
if (!isTarget(finalIdentity)) {
  throw new Error(`Safety stop: generated snapshot identifies as ${finalIdentity?.code || 'unknown'}, not ${TARGET_PATCH} ${TARGET_CHANNEL}. Existing repository data was not overwritten.`);
}

await fs.mkdir(path.dirname(outJson), { recursive: true });
await fs.writeFile(outJson, JSON.stringify(payload, null, 2) + '\n');
await fs.writeFile(outJs, 'window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ' + JSON.stringify(payload) + ';\n');
console.log(`Saved ${payload.missionCount} verified ${payload.gameVersion} mission records from ${payload.source}.`);

