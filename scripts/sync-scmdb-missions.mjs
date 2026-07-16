#!/usr/bin/env node
/**
 * Synchronize the Contract Finder with the newest SCMDB dataset for a channel.
 *
 * By default the newest LIVE patch is selected automatically from SCMDB's
 * versions manifest. Set MISSION_PATCH only for a deliberate one-off pin.
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
const VERSIONS_URL = String(
  process.env.SCMDB_VERSIONS_URL || new URL('data/versions.json', SCMDB_BASE).href,
);
const PATCH_OVERRIDE = String(process.env.MISSION_PATCH || '').trim();
const DIRECT_DATASET_URL = String(process.env.SCMDB_MISSIONS_URL || '').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const MIN_ACTIVE = Number(process.env.MISSION_MIN_ACTIVE || 100);
const ALLOW_LARGE_DROP = /^(1|true|yes)$/i.test(String(process.env.ALLOW_LARGE_DROP || ''));

function parseIdentity(value) {
  const match = String(value || '').match(
    /(\d+(?:\.\d+){1,3})[._-](live|ptu|eptu)(?:[._-](\d+))?/i,
  );
  if (!match) return null;
  const patch = match[1];
  const channel = match[2].toUpperCase();
  const build = match[3] || '';
  return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
}

function identityFromEntry(entry, keyHint = '') {
  if (typeof entry === 'string') return parseIdentity(entry) || parseIdentity(keyHint);
  const candidates = [
    entry?.version,
    entry?.gameVersion,
    entry?.game_version,
    entry?.file,
    entry?.filename,
    entry?.path,
    entry?.name,
    entry?.code,
    entry?.id,
    entry?.url,
    entry?.href,
    keyHint,
  ];
  for (const value of candidates) {
    const parsed = parseIdentity(value);
    if (parsed) return parsed;
  }
  const patch = String(entry?.patch || '').trim();
  const channel = String(entry?.channel || entry?.environment || '').trim().toUpperCase();
  const build = String(entry?.build || entry?.buildNumber || '').trim();
  if (/^\d+(?:\.\d+){1,3}$/.test(patch) && /^(LIVE|PTU|EPTU)$/.test(channel)) {
    return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
  }
  return null;
}

function patchParts(value) {
  return String(value || '')
    .split('.')
    .map((part) => Number(part) || 0)
    .concat([0, 0, 0, 0])
    .slice(0, 4);
}

function comparePatch(a, b) {
  const aa = patchParts(a);
  const bb = patchParts(b);
  for (let i = 0; i < aa.length; i += 1) {
    if (aa[i] !== bb[i]) return aa[i] - bb[i];
  }
  return 0;
}

function samePatch(a, b) {
  return comparePatch(a, b) === 0;
}

function compareDataset(a, b) {
  const patch = comparePatch(b.identity.patch, a.identity.patch);
  if (patch) return patch;
  return Number(b.identity.build || 0) - Number(a.identity.build || 0);
}

async function readJsonSource(url, timeout = 45_000) {
  const parsed = new URL(url);
  if (parsed.protocol === 'file:') {
    return JSON.parse(await fs.readFile(fileURLToPath(parsed), 'utf8'));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Celestial-Nexus-Game-Data-Sync/2.0',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
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

    if (Array.isArray(value)) {
      for (const item of value) visit(item, keyHint, depth + 1);
      return;
    }

    const identity = identityFromEntry(value, keyHint);
    if (identity) rows.push({ entry: value, keyHint, identity });
    for (const [key, child] of Object.entries(value)) visit(child, key, depth + 1);
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

function datasetFile(entry, identity) {
  if (typeof entry === 'string' && /(?:\.json(?:[?#]|$)|^https?:|^file:|^\.?\.?\/|^\/)/i.test(entry)) {
    return entry;
  }
  const explicit = [
    entry?.file,
    entry?.filename,
    entry?.url,
    entry?.href,
    entry?.path,
    entry?.download,
    entry?.dataset,
    entry?.missions,
    entry?.contracts,
  ].find((value) => typeof value === 'string' && value.trim());
  if (explicit) return explicit;
  return `merged-${identity.patch.toLowerCase()}-${identity.channel.toLowerCase()}${identity.build ? `.${identity.build}` : ''}.json`;
}

async function chooseDataset() {
  if (DIRECT_DATASET_URL) {
    const identity = parseIdentity(DIRECT_DATASET_URL);
    if (!identity) {
      throw new Error('SCMDB_MISSIONS_URL must contain a patch and channel, such as 4.9-LIVE.12345678.');
    }
    if (identity.channel !== TARGET_CHANNEL || (PATCH_OVERRIDE && !samePatch(identity.patch, PATCH_OVERRIDE))) {
      throw new Error(`SCMDB_MISSIONS_URL identifies as ${identity.code}, outside the requested target.`);
    }
    return { url: DIRECT_DATASET_URL, identity, manifestCount: 0, selection: 'explicit override' };
  }

  const manifest = await readJsonSource(VERSIONS_URL);
  const rows = manifestRows(manifest);
  const candidates = rows
    .filter(({ identity }) => {
      if (identity.channel !== TARGET_CHANNEL) return false;
      if (PATCH_OVERRIDE && !samePatch(identity.patch, PATCH_OVERRIDE)) return false;
      return true;
    })
    .sort(compareDataset);

  if (!candidates.length) {
    const available = rows.map(({ identity }) => identity.code).slice(0, 40).join(', ');
    throw new Error(
      `SCMDB does not list ${PATCH_OVERRIDE || 'any'} ${TARGET_CHANNEL} dataset. ` +
        `Available: ${available || 'none'}.`,
    );
  }

  const selected = candidates[0];
  const dataBase = new URL('data/', SCMDB_BASE);
  return {
    url: new URL(selected.file, dataBase).href,
    identity: selected.identity,
    manifestCount: rows.length,
    selection: 'newest manifest dataset',
  };
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
  let best = [];
  let bestScore = -1;
  const walked = new Set();
  function walk(value, depth = 0) {
    if (depth > 8 || value == null || typeof value !== 'object' || walked.has(value)) return;
    walked.add(value);
    if (Array.isArray(value)) {
      if (!excluded.has(value)) {
        const score = scoreMissionArray(value);
        if (score > bestScore) { best = value; bestScore = score; }
      }
      for (const item of value.slice(0, 40)) walk(item, depth + 1);
      return;
    }
    for (const child of Object.values(value)) walk(child, depth + 1);
  }
  walk(payload);
  return best;
}

function firstArray(payload, aliases) {
  const queue = [payload];
  const walked = new Set();
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
  return { ...row.attributes, id: row.id ?? row.attributes.id, type: row.type, relationships: row.relationships, links: row.links, __raw_api_record: row };
}

function datasetIdentity(source, url) {
  const candidates = [
    source?.version,
    source?.gameVersion,
    source?.game_version,
    source?.targetVersion,
    source?.meta?.version,
    source?.meta?.gameVersion,
    source?.metadata?.version,
    source?.metadata?.gameVersion,
    url,
  ];
  for (const candidate of candidates) {
    const parsed = parseIdentity(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function enrichBlueprintRewards(rows, pools) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((entry) => {
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
  return rows.map((entry) => {
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

function enrichRecord(row, context, legacyContract) {
  const result = {
    ...row,
    gameVersion: context.gameVersion,
    legacyContract: Boolean(legacyContract),
    scmdb_url: `https://scmdb.net/?m=${encodeURIComponent(String(row?.id || row?.debugName || ''))}`,
  };
  const faction = row?.factionGuid ? context.factions?.[row.factionGuid] : null;
  if (faction) result.faction = { guid: row.factionGuid, ...clone(faction) };

  const rewardIndex = row?.factionRewardsIndex;
  if (
    Number.isInteger(rewardIndex) &&
    rewardIndex >= 0 &&
    rewardIndex < context.factionRewardsPools.length
  ) {
    result.reputation_gained = clone(context.factionRewardsPools[rewardIndex]);
  }
  if (Array.isArray(row?.factionRewards_fail)) {
    result.reputation_lost = clone(row.factionRewards_fail);
  }
  if (Array.isArray(row?.blueprintRewards)) {
    result.blueprintRewards = enrichBlueprintRewards(row.blueprintRewards, context.blueprintPools);
  }
  if (Array.isArray(row?.haulingOrders)) {
    result.haulingOrders = enrichHaulingOrders(row.haulingOrders, context.resourcePools);
  }
  return result;
}

function fieldInventory(rows) {
  return [...new Set(rows.flatMap((row) => (row && typeof row === 'object' ? Object.keys(row) : [])))].sort();
}

async function readExistingSnapshot() {
  try {
    return JSON.parse(await fs.readFile(outJson, 'utf8'));
  } catch {
    return null;
  }
}

async function writeStatus(moduleStatus) {
  let status = {};
  try {
    status = JSON.parse(await fs.readFile(statusJson, 'utf8'));
  } catch {
    status = {};
  }
  const next = {
    schema: 'celestial-nexus.game-data-status.v1',
    generatedAt: new Date().toISOString(),
    detectedPatch: moduleStatus.patch,
    detectedChannel: moduleStatus.channel,
    modules: {
      ...(status.modules || {}),
      contractFinder: moduleStatus,
    },
  };
  await fs.writeFile(statusJson, `${JSON.stringify(next, null, 2)}\n`);
}

async function synchronize() {
  const selected = await chooseDataset();
  console.log(`Selected newest ${TARGET_CHANNEL}: ${selected.identity.code}`);
  console.log(`Downloading ${selected.url}`);

  const source = await readJsonSource(selected.url, 90_000);
  const sourceIdentity = datasetIdentity(source, selected.url);
  if (!sourceIdentity) throw new Error('Downloaded SCMDB dataset did not identify its version.');
  if (
    sourceIdentity.channel !== TARGET_CHANNEL ||
    !samePatch(sourceIdentity.patch, selected.identity.patch)
  ) {
    throw new Error(
      `Manifest selected ${selected.identity.code}, but dataset identifies as ${sourceIdentity.code}.`,
    );
  }

  const legacy = firstArray(source, new Set(['legacycontracts', 'legacy_contracts', 'legacy-missions', 'legacymissions']));
  const preferredCurrent = firstArray(source, new Set(['contracts', 'missions', 'currentcontracts', 'current_contracts']));
  const current = (preferredCurrent.length ? preferredCurrent : findMissionArray(source, new Set([legacy]))).map(flattenRecord);
  const flattenedLegacy = legacy.map(flattenRecord);
  if (current.length < MIN_ACTIVE) {
    throw new Error(`SCMDB returned only ${current.length} active contracts; minimum is ${MIN_ACTIVE}.`);
  }

  const existing = await readExistingSnapshot();
  const previousActive = Number(existing?.activeMissionCount || 0);
  if (
    previousActive >= MIN_ACTIVE &&
    current.length < previousActive * 0.55 &&
    !ALLOW_LARGE_DROP
  ) {
    throw new Error(
      `Active contract count dropped from ${previousActive} to ${current.length}. ` +
        'Set ALLOW_LARGE_DROP=true only after reviewing the patch.',
    );
  }

  const context = {
    gameVersion: sourceIdentity.code,
    factions: source?.factions || {},
    resourcePools: source?.resourcePools || {},
    blueprintPools: source?.blueprintPools || {},
    factionRewardsPools: Array.isArray(source?.factionRewardsPools)
      ? source.factionRewardsPools
      : [],
  };
  const missions = [
    ...current.map((row) => enrichRecord(row, context, false)),
    ...flattenedLegacy.map((row) => enrichRecord(row, context, true)),
  ];
  const sourceFingerprint = createHash('sha256')
    .update(JSON.stringify(source))
    .digest('hex');
  const fetchedAt = new Date().toISOString();
  const snapshot = {
    schema: 'celestial-nexus.scmd-missions.v5',
    source: 'SCMDB public mission data',
    sourceUrl: selected.url,
    versionsUrl: VERSIONS_URL,
    sourceFingerprint,
    isFallback: false,
    fetchedAt,
    targetPatch: sourceIdentity.patch,
    targetChannel: TARGET_CHANNEL,
    gameVersion: sourceIdentity.code,
    patchVerified: true,
    verificationMethod:
      'Newest matching channel selected from SCMDB versions.json; downloaded dataset version was cross-checked before write.',
    missionCount: missions.length,
    activeMissionCount: current.length,
    legacyMissionCount: flattenedLegacy.length,
    fields: fieldInventory(missions),
    missions,
  };

  const unchanged =
    existing?.sourceFingerprint === sourceFingerprint &&
    existing?.gameVersion === sourceIdentity.code &&
    Number(existing?.missionCount) === missions.length;

  await fs.mkdir(path.dirname(outJson), { recursive: true });
  if (!unchanged) {
    const compact = JSON.stringify(snapshot);
    await fs.writeFile(outJson, `${compact}\n`);
    await fs.writeFile(outJs, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${compact};\n`);
    console.log(
      `Saved ${missions.length} contracts (${current.length} active + ${flattenedLegacy.length} legacy).`,
    );
  } else {
    console.log(`Mission snapshot is already current for ${sourceIdentity.code}.`);
  }

  await writeStatus({
    status: 'current',
    source: 'SCMDB',
    sourceUrl: selected.url,
    versionsUrl: VERSIONS_URL,
    patch: sourceIdentity.patch,
    channel: TARGET_CHANNEL,
    gameVersion: sourceIdentity.code,
    fetchedAt,
    activeCount: current.length,
    legacyCount: flattenedLegacy.length,
    totalCount: missions.length,
    fingerprint: sourceFingerprint,
  });
}

await synchronize();
