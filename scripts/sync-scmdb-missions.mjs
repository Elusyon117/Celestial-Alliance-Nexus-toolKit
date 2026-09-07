#!/usr/bin/env node
/**
 * Celestial Nexus Contract Finder data synchronization (resilient v6).
 *
 * Authority order:
 *   1. Newest matching SCMDB dataset.
 *   2. Current Star Citizen Wiki mission API for the same LIVE/PTU/EPTU channel.
 *   3. Preserve an existing *usable* snapshot when every upstream is temporarily unavailable.
 *
 * An empty/bootstrap snapshot is never considered a successful fallback.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'data', 'scmdb-missions-live.json');
const outJs = path.join(root, 'data', 'scmdb-missions-live.js');
const statusJson = path.join(root, 'data', 'game-data-status.json');

const SCMDB_BASE = String(process.env.SCMDB_BASE_URL || 'https://scmdb.net/');
const VERSIONS_URL = String(process.env.SCMDB_VERSIONS_URL || new URL('data/versions.json', SCMDB_BASE).href);
const DIRECT_DATASET_URL = String(process.env.SCMDB_MISSIONS_URL || '').trim();
const WIKI_VERSIONS_URL = String(process.env.STAR_CITIZEN_WIKI_VERSIONS_URL || 'https://api.star-citizen.wiki/api/game-versions');
const WIKI_MISSIONS_URL = String(process.env.STAR_CITIZEN_WIKI_MISSIONS_URL || 'https://api.star-citizen.wiki/api/missions');
const PATCH_OVERRIDE = String(process.env.MISSION_PATCH || '').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const MIN_ACTIVE = Math.max(5, Number(process.env.MISSION_MIN_ACTIVE || 100));
const ALLOW_LARGE_DROP = /^(1|true|yes)$/i.test(String(process.env.ALLOW_LARGE_DROP || ''));

function parseIdentity(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+){1,3})[._-](live|ptu|eptu)(?:[._-](\d+))?/i);
  if (!match) return null;
  const patch = match[1];
  const channel = match[2].toUpperCase();
  const build = match[3] || '';
  return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
}

function identityFromEntry(entry, keyHint = '') {
  if (typeof entry === 'string') return parseIdentity(entry) || parseIdentity(keyHint);
  const values = [
    entry?.version, entry?.gameVersion, entry?.game_version, entry?.file, entry?.filename,
    entry?.path, entry?.name, entry?.code, entry?.id, entry?.url, entry?.href,
    entry?.attributes?.code, entry?.attributes?.name, keyHint,
  ];
  for (const value of values) {
    const identity = parseIdentity(value);
    if (identity) return identity;
  }
  const patch = String(entry?.patch || entry?.attributes?.patch || '').trim();
  const channel = String(entry?.channel || entry?.environment || entry?.attributes?.channel || '').trim().toUpperCase();
  const build = String(entry?.build || entry?.buildNumber || entry?.attributes?.build || '').trim();
  if (/^\d+(?:\.\d+){1,3}$/.test(patch) && /^(LIVE|PTU|EPTU)$/.test(channel)) {
    return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
  }
  return null;
}

function patchParts(value) {
  return String(value || '').split('.').map(part => Number(part) || 0).concat([0, 0, 0, 0]).slice(0, 4);
}
function comparePatch(a, b) {
  const aa = patchParts(a), bb = patchParts(b);
  for (let i = 0; i < aa.length; i += 1) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return 0;
}
function samePatch(a, b) { return comparePatch(a, b) === 0; }
function compareDataset(a, b) {
  const byPatch = comparePatch(b.identity.patch, a.identity.patch);
  if (byPatch) return byPatch;
  return Number(b.identity.build || 0) - Number(a.identity.build || 0);
}

async function readJsonSource(url, timeout = 45_000) {
  const parsed = new URL(url);
  if (parsed.protocol === 'file:') return JSON.parse(await fs.readFile(fileURLToPath(parsed), 'utf8'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Celestial-Nexus-Game-Data-Sync/2.0.2' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function datasetFile(entry, identity) {
  if (typeof entry === 'string' && /(?:\.json(?:[?#]|$)|^https?:|^file:|^\.?\.?\/|^\/)/i.test(entry)) return entry;
  const explicit = [entry?.file, entry?.filename, entry?.url, entry?.href, entry?.path, entry?.download, entry?.dataset, entry?.missions, entry?.contracts]
    .find(value => typeof value === 'string' && value.trim());
  return explicit || `merged-${identity.patch.toLowerCase()}-${identity.channel.toLowerCase()}${identity.build ? `.${identity.build}` : ''}.json`;
}

function manifestRows(payload) {
  const rows = [];
  const seen = new Set();
  function visit(value, keyHint = '', depth = 0) {
    if (depth > 8 || value == null) return;
    if (typeof value === 'string') {
      const identity = identityFromEntry(value, keyHint);
      if (identity) rows.push({ entry: value, keyHint, identity });
      return;
    }
    if (typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { value.forEach(item => visit(item, keyHint, depth + 1)); return; }
    const identity = identityFromEntry(value, keyHint);
    if (identity) rows.push({ entry: value, keyHint, identity });
    Object.entries(value).forEach(([key, child]) => visit(child, key, depth + 1));
  }
  visit(payload);
  const deduped = new Map();
  for (const row of rows) {
    const file = datasetFile(row.entry, row.identity);
    const key = `${row.identity.code}|${file}`;
    if (!deduped.has(key)) deduped.set(key, { ...row, file });
  }
  return [...deduped.values()];
}

async function chooseScmdbDataset() {
  if (DIRECT_DATASET_URL) {
    const identity = parseIdentity(DIRECT_DATASET_URL);
    if (!identity) throw new Error('SCMDB_MISSIONS_URL must contain a patch and channel identity.');
    if (identity.channel !== TARGET_CHANNEL || (PATCH_OVERRIDE && !samePatch(identity.patch, PATCH_OVERRIDE))) {
      throw new Error(`SCMDB_MISSIONS_URL identifies as ${identity.code}, outside the requested target.`);
    }
    return { url: DIRECT_DATASET_URL, identity, selection: 'explicit override' };
  }
  const manifest = await readJsonSource(VERSIONS_URL);
  const candidates = manifestRows(manifest)
    .filter(({ identity }) => identity.channel === TARGET_CHANNEL && (!PATCH_OVERRIDE || samePatch(identity.patch, PATCH_OVERRIDE)))
    .sort(compareDataset);
  if (!candidates.length) throw new Error(`SCMDB does not list ${PATCH_OVERRIDE || 'any'} ${TARGET_CHANNEL} dataset.`);
  const selected = candidates[0];
  const dataBase = new URL('data/', SCMDB_BASE);
  return { url: new URL(selected.file, dataBase).href, identity: selected.identity, selection: 'newest manifest dataset' };
}

function scoreMissionArray(rows) {
  if (!Array.isArray(rows) || !rows.length) return -1;
  let score = Math.min(rows.length, 5000);
  for (const row of rows.slice(0, 20)) {
    if (!row || typeof row !== 'object') continue;
    for (const key of ['title', 'name', 'description', 'debugName', 'debug_name', 'reward', 'rewardUEC', 'id', 'uuid']) {
      if (key in row || (row.attributes && key in row.attributes)) score += 20;
    }
  }
  return score;
}

function findMissionArray(payload, excluded = new Set()) {
  let best = [], bestScore = -1;
  const walked = new Set();
  function walk(value, depth = 0) {
    if (depth > 8 || value == null || typeof value !== 'object' || walked.has(value)) return;
    walked.add(value);
    if (Array.isArray(value)) {
      if (!excluded.has(value)) {
        const score = scoreMissionArray(value);
        if (score > bestScore) { best = value; bestScore = score; }
      }
      value.slice(0, 40).forEach(item => walk(item, depth + 1));
      return;
    }
    Object.values(value).forEach(child => walk(child, depth + 1));
  }
  walk(payload);
  return best;
}

function firstArray(payload, aliases) {
  const queue = [payload], walked = new Set();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== 'object' || walked.has(value)) continue;
    walked.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (aliases.has(key.toLowerCase()) && Array.isArray(child)) return child;
      if (child && typeof child === 'object' && !Array.isArray(child)) queue.push(child);
    }
  }
  return [];
}

function flattenRecord(row) {
  if (!row || typeof row !== 'object' || !row.attributes || typeof row.attributes !== 'object') return row;
  return { ...row.attributes, id: row.id ?? row.attributes.id, type: row.type, relationships: row.relationships, links: row.links };
}
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

function datasetIdentity(source, url) {
  for (const candidate of [source?.version, source?.gameVersion, source?.game_version, source?.targetVersion, source?.meta?.version, source?.meta?.gameVersion, source?.metadata?.version, source?.metadata?.gameVersion, url]) {
    const identity = parseIdentity(candidate);
    if (identity) return identity;
  }
  return null;
}

function enrichBlueprintRewards(rows, pools) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(entry => {
    if (!entry || typeof entry !== 'object') return entry;
    const result = { ...entry };
    const pool = entry.blueprintPool ? pools?.[entry.blueprintPool] : null;
    if (pool) {
      if (!result.poolName && pool.name) result.poolName = pool.name;
      result.blueprints = clone(pool.blueprints || []);
      if (pool.source != null) result.source = pool.source;
    }
    return result;
  });
}
function enrichHaulingOrders(rows, resources) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(entry => {
    if (!entry || typeof entry !== 'object') return entry;
    const result = { ...entry };
    const resource = entry.resource ? resources?.[entry.resource] : null;
    if (resource) {
      result.resourceName = resource.name || entry.resource;
      result.resourceDetails = clone(resource);
    }
    return result;
  });
}

function normalizeFactionDictionary(source) {
  if (!source) return {};
  if (!Array.isArray(source) && typeof source === 'object') return source;
  const result = {};
  if (Array.isArray(source)) {
    for (const row of source) {
      const id = String(row?.guid ?? row?.uuid ?? row?.id ?? row?.code ?? '').trim();
      if (id) result[id] = row;
    }
  }
  return result;
}
function lookupFaction(dictionary, guid) {
  if (!guid || !dictionary) return null;
  if (dictionary[guid]) return dictionary[guid];
  const wanted = String(guid).toLowerCase();
  const key = Object.keys(dictionary).find(candidate => candidate.toLowerCase() === wanted);
  return key ? dictionary[key] : null;
}

function enrichScmdbRecord(row, context, legacyContract) {
  const result = {
    ...row,
    gameVersion: context.gameVersion,
    legacyContract: Boolean(legacyContract),
    scmdb_url: `https://scmdb.net/?m=${encodeURIComponent(String(row?.id || row?.debugName || ''))}`,
  };
  const guid = row?.factionGuid ?? row?.faction_guid;
  const faction = guid ? lookupFaction(context.factions, guid) : null;
  if (faction) {
    result.faction = { guid, ...clone(faction) };
    if (!result.factionName && (faction.name || faction.displayName || faction.display_name)) {
      result.factionName = faction.name || faction.displayName || faction.display_name;
    }
  }
  const rewardIndex = row?.factionRewardsIndex;
  if (Number.isInteger(rewardIndex) && rewardIndex >= 0 && rewardIndex < context.factionRewardsPools.length) {
    result.reputation_gained = clone(context.factionRewardsPools[rewardIndex]);
  }
  if (Array.isArray(row?.factionRewards_fail)) result.reputation_lost = clone(row.factionRewards_fail);
  if (Array.isArray(row?.blueprintRewards)) result.blueprintRewards = enrichBlueprintRewards(row.blueprintRewards, context.blueprintPools);
  if (Array.isArray(row?.haulingOrders)) result.haulingOrders = enrichHaulingOrders(row.haulingOrders, context.resourcePools);
  return result;
}

function fieldInventory(rows) {
  return [...new Set(rows.flatMap(row => row && typeof row === 'object' ? Object.keys(row) : []))].sort();
}
function fingerprint(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

async function readExistingSnapshot() {
  try { return JSON.parse(await fs.readFile(outJson, 'utf8')); } catch { return null; }
}
function existingMissionCount(snapshot) {
  return Math.max(Number(snapshot?.activeMissionCount || 0), Array.isArray(snapshot?.missions) ? snapshot.missions.length : 0);
}
function isUsableExisting(snapshot) { return existingMissionCount(snapshot) >= MIN_ACTIVE; }

async function writeStatus(moduleStatus) {
  let status = {};
  try { status = JSON.parse(await fs.readFile(statusJson, 'utf8')); } catch { status = {}; }
  const next = {
    schema: 'celestial-nexus.game-data-status.v1',
    generatedAt: new Date().toISOString(),
    detectedPatch: moduleStatus.patch,
    detectedChannel: moduleStatus.channel,
    modules: { ...(status.modules || {}), contractFinder: moduleStatus },
  };
  await fs.mkdir(path.dirname(statusJson), { recursive: true });
  await fs.writeFile(statusJson, `${JSON.stringify(next, null, 2)}\n`);
}

async function writeSnapshot(snapshot) {
  const compact = JSON.stringify(snapshot);
  await fs.mkdir(path.dirname(outJson), { recursive: true });
  await fs.writeFile(outJson, `${compact}\n`);
  await fs.writeFile(outJs, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${compact};\n`);
}

async function synchronizeScmdb(existing) {
  const selected = await chooseScmdbDataset();
  console.log(`SCMDB selected ${selected.identity.code}: ${selected.url}`);
  const source = await readJsonSource(selected.url, 90_000);
  const identity = datasetIdentity(source, selected.url) || selected.identity;
  if (identity.channel !== TARGET_CHANNEL || !samePatch(identity.patch, selected.identity.patch)) {
    throw new Error(`SCMDB manifest selected ${selected.identity.code}, but dataset identifies as ${identity.code}.`);
  }

  const legacy = firstArray(source, new Set(['legacycontracts', 'legacy_contracts', 'legacy-missions', 'legacymissions']));
  const preferredCurrent = firstArray(source, new Set(['contracts', 'missions', 'currentcontracts', 'current_contracts']));
  const current = (preferredCurrent.length ? preferredCurrent : findMissionArray(source, new Set([legacy]))).map(flattenRecord);
  const flattenedLegacy = legacy.map(flattenRecord);
  if (current.length < MIN_ACTIVE) throw new Error(`SCMDB returned only ${current.length} active contracts; minimum is ${MIN_ACTIVE}.`);

  const previousActive = Number(existing?.activeMissionCount || 0);
  if (previousActive >= MIN_ACTIVE && current.length < previousActive * 0.55 && !ALLOW_LARGE_DROP) {
    throw new Error(`Active contract count dropped from ${previousActive} to ${current.length}; set ALLOW_LARGE_DROP=true only after review.`);
  }

  const context = {
    gameVersion: identity.code,
    factions: normalizeFactionDictionary(source?.factions),
    resourcePools: source?.resourcePools || {},
    blueprintPools: source?.blueprintPools || {},
    factionRewardsPools: Array.isArray(source?.factionRewardsPools) ? source.factionRewardsPools : [],
  };
  const missions = [
    ...current.map(row => enrichScmdbRecord(row, context, false)),
    ...flattenedLegacy.map(row => enrichScmdbRecord(row, context, true)),
  ];
  const fetchedAt = new Date().toISOString();
  const sourceFingerprint = fingerprint(source);
  return {
    snapshot: {
      schema: 'celestial-nexus.scmdb-missions.v6',
      source: 'SCMDB public mission data',
      sourceUrl: selected.url,
      versionsUrl: VERSIONS_URL,
      sourceFingerprint,
      isFallback: false,
      fetchedAt,
      targetPatch: identity.patch,
      targetChannel: TARGET_CHANNEL,
      gameVersion: identity.code,
      patchVerified: true,
      verificationMethod: 'Newest matching channel selected from SCMDB versions.json; dataset version cross-checked before write.',
      missionCount: missions.length,
      activeMissionCount: current.length,
      legacyMissionCount: flattenedLegacy.length,
      factions: clone(context.factions),
      fields: fieldInventory(missions),
      missions,
    },
    status: {
      status: 'current', source: 'SCMDB', sourceUrl: selected.url, versionsUrl: VERSIONS_URL,
      patch: identity.patch, channel: TARGET_CHANNEL, gameVersion: identity.code, fetchedAt,
      activeCount: current.length, legacyCount: flattenedLegacy.length, totalCount: missions.length,
      fingerprint: sourceFingerprint,
    },
  };
}

function collectionRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  for (const key of ['missions', 'contracts', 'records', 'results', 'items']) if (Array.isArray(payload?.[key])) return payload[key];
  return findMissionArray(payload);
}

async function discoverWikiIdentity() {
  const base = new URL(WIKI_VERSIONS_URL);
  let payload;
  if (base.protocol === 'file:') {
    payload = await readJsonSource(base.href);
  } else {
    base.searchParams.set('filter[channel]', TARGET_CHANNEL.toLowerCase());
    base.searchParams.set('page[size]', '200');
    base.searchParams.set('sort', '-released_at');
    payload = await readJsonSource(base.href, 45_000);
  }
  const rows = collectionRows(payload);
  const candidates = rows
    .map((row, index) => ({ row, identity: identityFromEntry(row, String(index)) }))
    .filter(({ identity }) => identity?.channel === TARGET_CHANNEL && (!PATCH_OVERRIDE || samePatch(identity.patch, PATCH_OVERRIDE)))
    .sort(compareDataset);
  if (!candidates.length) throw new Error(`Star Citizen Wiki did not return a ${PATCH_OVERRIDE || 'current'} ${TARGET_CHANNEL} game version.`);
  return candidates[0].identity;
}

async function fetchWikiMissionRows(identity) {
  const base = new URL(WIKI_MISSIONS_URL);
  if (base.protocol === 'file:') {
    const payload = await readJsonSource(base.href);
    return { rows: collectionRows(payload).map(flattenRecord), meta: payload?.meta || payload?.metadata || {} };
  }
  const rows = [], seen = new Set();
  let page = 1, lastPage = 1, firstMeta = {};
  do {
    const url = new URL(base.href);
    url.searchParams.set('version', identity.code);
    url.searchParams.set('page[size]', '200');
    url.searchParams.set('page[number]', String(page));
    url.searchParams.set('filter[grouped]', 'false');
    const payload = await readJsonSource(url.href, 90_000);
    if (page === 1) firstMeta = payload?.meta || payload?.metadata || {};
    const batch = collectionRows(payload).map(flattenRecord);
    batch.forEach((row, index) => {
      const key = String(row?.uuid ?? row?.id ?? row?.debugName ?? row?.debug_name ?? `${page}:${index}`);
      if (!seen.has(key)) { seen.add(key); rows.push(row); }
    });
    const meta = payload?.meta || payload?.metadata || {};
    const explicitLast = Number(meta.last_page ?? meta.lastPage ?? meta.total_pages ?? meta.totalPages ?? meta?.page?.last ?? 0);
    if (Number.isFinite(explicitLast) && explicitLast > 0) lastPage = explicitLast;
    else if (payload?.links?.next || batch.length >= 200) lastPage = page + 1;
    else lastPage = page;
    page += 1;
  } while (page <= lastPage && page <= 100);
  return { rows, meta: firstMeta };
}

function buildFactionDictionary(rows) {
  const factions = {};
  for (const row of rows) {
    const faction = row?.faction;
    if (!faction || typeof faction !== 'object') continue;
    const id = String(faction.guid ?? faction.uuid ?? faction.id ?? row?.factionGuid ?? row?.faction_guid ?? '').trim();
    if (id) factions[id] = clone(faction);
  }
  return factions;
}

async function synchronizeWikiFallback(scmdbError) {
  const identity = await discoverWikiIdentity();
  console.warn(`SCMDB unavailable; building ${identity.code} fallback from Star Citizen Wiki.`);
  const { rows, meta } = await fetchWikiMissionRows(identity);
  if (rows.length < MIN_ACTIVE) throw new Error(`Star Citizen Wiki returned only ${rows.length} missions; minimum is ${MIN_ACTIVE}.`);
  const missions = rows.map(row => ({ ...row, gameVersion: identity.code, legacyContract: Boolean(row?.legacyContract) }));
  const fetchedAt = new Date().toISOString();
  const sourceFingerprint = fingerprint({ identity: identity.code, missions });
  const factions = buildFactionDictionary(missions);
  return {
    snapshot: {
      schema: 'celestial-nexus.scmdb-missions.v6',
      source: 'Star Citizen Wiki mission API fallback',
      sourceUrl: WIKI_MISSIONS_URL,
      versionsUrl: WIKI_VERSIONS_URL,
      sourceFingerprint,
      isFallback: true,
      fallbackReason: String(scmdbError?.message || scmdbError || 'SCMDB unavailable'),
      fetchedAt,
      targetPatch: identity.patch,
      targetChannel: TARGET_CHANNEL,
      gameVersion: identity.code,
      patchVerified: true,
      verificationMethod: 'Current channel/build discovered from Star Citizen Wiki game versions; version-pinned mission pages synchronized after SCMDB was unavailable.',
      missionCount: missions.length,
      activeMissionCount: missions.length,
      legacyMissionCount: 0,
      factions,
      fields: fieldInventory(missions),
      apiMeta: meta,
      missions,
    },
    status: {
      status: 'current-wiki-fallback', source: 'Star Citizen Wiki', sourceUrl: WIKI_MISSIONS_URL,
      versionsUrl: WIKI_VERSIONS_URL, patch: identity.patch, channel: TARGET_CHANNEL,
      gameVersion: identity.code, fetchedAt, activeCount: missions.length, legacyCount: 0,
      totalCount: missions.length, fingerprint: sourceFingerprint,
      upstreamError: String(scmdbError?.message || scmdbError || ''),
    },
  };
}

async function preserveUsableSnapshot(existing, scmdbError, wikiError) {
  if (!isUsableExisting(existing)) return false;
  const identity = parseIdentity(existing?.gameVersion) || parseIdentity(existing?.sourceUrl) || {
    patch: existing?.targetPatch || PATCH_OVERRIDE || '',
    channel: existing?.targetChannel || TARGET_CHANNEL,
    code: existing?.gameVersion || 'unknown',
  };
  console.warn(`All live mission sources unavailable; preserving usable ${identity.code} snapshot with ${existingMissionCount(existing)} records.`);
  await writeStatus({
    status: 'stale-all-upstreams-unavailable', source: existing.source || 'Saved mission snapshot',
    sourceUrl: existing.sourceUrl || '', versionsUrl: existing.versionsUrl || VERSIONS_URL,
    patch: identity.patch, channel: identity.channel, gameVersion: identity.code,
    fetchedAt: existing.fetchedAt || null, activeCount: Number(existing.activeMissionCount || existingMissionCount(existing)),
    legacyCount: Number(existing.legacyMissionCount || 0), totalCount: Number(existing.missionCount || existingMissionCount(existing)),
    fingerprint: existing.sourceFingerprint || '',
    lastError: `SCMDB: ${String(scmdbError?.message || scmdbError)} | Wiki: ${String(wikiError?.message || wikiError)}`,
  });
  return true;
}

async function main() {
  const existing = await readExistingSnapshot();
  let scmdbError;
  try {
    const result = await synchronizeScmdb(existing);
    await writeSnapshot(result.snapshot);
    await writeStatus(result.status);
    console.log(`Saved ${result.snapshot.missionCount} contracts from SCMDB (${result.snapshot.gameVersion}).`);
    return;
  } catch (error) {
    scmdbError = error;
    console.warn(`SCMDB synchronization failed: ${error?.message || error}`);
  }

  let wikiError;
  try {
    const result = await synchronizeWikiFallback(scmdbError);
    await writeSnapshot(result.snapshot);
    await writeStatus(result.status);
    console.log(`Saved ${result.snapshot.missionCount} current missions from Star Citizen Wiki fallback (${result.snapshot.gameVersion}).`);
    return;
  } catch (error) {
    wikiError = error;
    console.warn(`Star Citizen Wiki fallback failed: ${error?.message || error}`);
  }

  if (await preserveUsableSnapshot(existing, scmdbError, wikiError)) return;
  throw new AggregateError([scmdbError, wikiError].filter(Boolean), 'No usable Contract Finder mission dataset could be synchronized or preserved.');
}

await main();
