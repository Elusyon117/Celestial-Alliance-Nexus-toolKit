#!/usr/bin/env node
/**
 * Mission catalog synchronizer.
 * 1. Attempts to discover SCMDB's public mission data without discarding fields.
 * 2. If SCMDB is unavailable, downloads every page from the Star Citizen Wiki
 *    mission API (200 records per page) and writes a clearly labelled fallback.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'data', 'scmdb-missions-live.json');
const outJs = path.join(root, 'data', 'scmdb-missions-live.js');
const wikiBase = 'https://api.star-citizen.wiki/api/missions';
const start = ['https://scmdb.net/'];
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
    for (const key of ['title','name','description','debug_name','mission_giver','reward_min','reward_scope','reputation_gained','blueprints','faction','uuid']) {
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
  return String(row?.uuid || row?.id || row?.mission_uuid || row?.debug_name || row?.name || row?.title || index);
}

async function fetchJson(url, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Celestial-Nexus-Mission-Sync/2.0'
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
  let best = null, bestScore = -1, bestUrl = '';
  const maxRequests = 55;

  function addUrl(base, value) {
    if (typeof value !== 'string' || value.length > 500) return;
    const clean = value.replaceAll('\\/', '/');
    if (!/(mission|contract|version|manifest|index|data|\.json)/i.test(clean)) return;
    try {
      const url = new URL(clean, base);
      if ((url.hostname === 'scmdb.net' || url.hostname.endsWith('.supabase.co')) && !seen.has(url.href)) queue.push(url.href);
    } catch {}
  }

  function discoverJson(base, value, depth = 0) {
    if (depth > 7 || value == null) return;
    if (typeof value === 'string') { addUrl(base, value); return; }
    if (Array.isArray(value)) { for (const child of value.slice(0, 200)) discoverJson(base, child, depth + 1); return; }
    if (typeof value === 'object') for (const child of Object.values(value)) discoverJson(base, child, depth + 1);
  }

  function discoverText(base, text) {
    for (const match of text.matchAll(/(?:https?:\\?\/\\?\/[^"'`\s)]+|\/[A-Za-z0-9_./?=&%{}-]+(?:\.json|\.js)(?:\?[^"'`\s)]*)?)/g)) addUrl(base, match[0]);
    for (const match of text.matchAll(/["'`]([^"'`]*(?:mission|contract|version|manifest|data)[^"'`]*)["'`]/gi)) addUrl(base, match[1]);
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
          'User-Agent': 'Celestial-Nexus-Mission-Sync/2.0'
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
        const found = findMissionArray(payload);
        if (found.score > bestScore) { best = found.rows; bestScore = found.score; bestUrl = url; }
        discoverJson(url, payload);
      } else discoverText(url, text);
    } catch (error) {
      console.warn(`SCMDB candidate failed: ${error.message}`);
    }
  }
  if (!best || best.length < 5) return null;
  return { rows: best.map(flattenApiRecord), sourceUrl: bestUrl };
}

async function fetchAllWikiMissions() {
  const rows = [], keys = new Set();
  let page = 1, lastPage = 1, firstMeta = {};
  const maxPages = 100;
  do {
    const url = new URL(wikiBase);
    url.searchParams.set('page[size]', '200');
    url.searchParams.set('page[number]', String(page));
    console.log(`Downloading Wiki mission page ${page}${lastPage > 1 ? `/${lastPage}` : ''}`);
    const payload = await fetchJson(url.href, 30000);
    if (page === 1) firstMeta = payload?.meta || payload?.metadata || {};
    const found = findMissionArray(payload).rows.map(flattenApiRecord);
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
  if (!rows.length) throw new Error('Wiki mission API returned no mission records.');
  return { rows, meta: firstMeta };
}

function dominantVersion(rows) {
  const values = rows.map(row => row?.game_version || row?.version || row?.patch || row?.gameVersion).filter(Boolean);
  if (!values.length) return '';
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

const scmdb = await discoverScmdb();
let payload;
if (scmdb) {
  payload = {
    schema: 'celestial-nexus.scmd-missions.v2',
    source: 'SCMDB public mission data',
    sourceUrl: scmdb.sourceUrl,
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    gameVersion: dominantVersion(scmdb.rows),
    missionCount: scmdb.rows.length,
    fields: [...new Set(scmdb.rows.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))].sort(),
    missions: scmdb.rows
  };
} else {
  console.warn('SCMDB mission data was unavailable. Downloading every page from the Star Citizen Wiki mission API fallback.');
  const wiki = await fetchAllWikiMissions();
  payload = {
    schema: 'celestial-nexus.scmd-missions.v2',
    source: 'Star Citizen Wiki API fallback',
    sourceUrl: wikiBase,
    isFallback: true,
    fetchedAt: new Date().toISOString(),
    gameVersion: wiki.meta?.game_version || wiki.meta?.gameVersion || wiki.meta?.version || dominantVersion(wiki.rows),
    notice: 'SCMDB was unavailable when this snapshot was generated. Every paginated mission record exposed by the current Wiki API was preserved as a labelled fallback.',
    missionCount: wiki.rows.length,
    fields: [...new Set(wiki.rows.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))].sort(),
    missions: wiki.rows
  };
}

await fs.mkdir(path.dirname(outJson), { recursive: true });
await fs.writeFile(outJson, JSON.stringify(payload, null, 2) + '\n');
await fs.writeFile(outJs, 'window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ' + JSON.stringify(payload) + ';\n');
console.log(`Saved ${payload.missionCount} mission records from ${payload.source}.`);
