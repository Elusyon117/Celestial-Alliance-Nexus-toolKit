#!/usr/bin/env node

/**
 * Celestial Nexus Mission Finder — SCMDB-only LIVE synchronizer.
 *
 * SCMDB's versions manifest is the source of truth. The script selects the
 * newest matching LIVE build, downloads its merged contract file, preserves
 * current and legacy contracts, enriches useful lookup fields, and writes the
 * two repository snapshots consumed by GitHub Pages.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, 'data', 'scmdb-missions-live.json');
const outJs = path.join(root, 'data', 'scmdb-missions-live.js');

const SCMDB_BASE = 'https://scmdb.net/';
const VERSIONS_URL = new URL('data/versions.json', SCMDB_BASE).href;

const TARGET_PATCH = String(process.env.MISSION_PATCH || '4.8.3').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE')
  .trim()
  .toUpperCase();

function parseIdentity(value) {
  const match = String(value || '').match(
    /(\d+\.\d+\.\d+)[._-](live|ptu|eptu)(?:[._-](\d+))?/i,
  );

  if (!match) return null;

  const patch = match[1];
  const channel = match[2].toUpperCase();
  const build = match[3] || '';

  return {
    patch,
    channel,
    build,
    code: `${patch}-${channel}${build ? `.${build}` : ''}`,
  };
}

function isTarget(identity) {
  return Boolean(
    identity
      && identity.patch === TARGET_PATCH
      && identity.channel === TARGET_CHANNEL,
  );
}

async function fetchJson(url, timeout = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Celestial-Nexus-Mission-Sync/4.1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function newestFirst(a, b) {
  return Number(b.identity.build || 0) - Number(a.identity.build || 0);
}

async function chooseDataset() {
  const versions = await fetchJson(VERSIONS_URL);

  if (!Array.isArray(versions)) {
    throw new Error('SCMDB versions.json did not return an array.');
  }

  const matches = versions
    .map((entry) => {
      const identity = parseIdentity(entry?.version || entry?.file);
      return { entry, identity };
    })
    .filter((item) => isTarget(item.identity) && item.entry?.file)
    .sort(newestFirst);

  if (!matches.length) {
    const available = versions
      .map((entry) => entry?.version || entry?.file)
      .filter(Boolean)
      .join(', ');

    throw new Error(
      `SCMDB does not currently list ${TARGET_PATCH} ${TARGET_CHANNEL}.\n`
      + `Available: ${available || 'none'}.`,
    );
  }

  const selected = matches[0];

  return {
    url: new URL(String(selected.entry.file), VERSIONS_URL).href,
    identity: selected.identity,
  };
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
    scmdb_url: `https://scmdb.net/?m=${encodeURIComponent(
      String(row?.id || row?.debugName || ''),
    )}`,
  };

  const faction = row?.factionGuid
    ? context.factions?.[row.factionGuid]
    : null;

  if (faction) {
    result.faction = {
      guid: row.factionGuid,
      ...clone(faction),
    };
  }

  const rewardIndex = row?.factionRewardsIndex;

  if (
    Number.isInteger(rewardIndex)
    && rewardIndex >= 0
    && rewardIndex < context.factionRewardsPools.length
  ) {
    result.reputation_gained = clone(
      context.factionRewardsPools[rewardIndex],
    );
  }

  if (Array.isArray(row?.factionRewards_fail)) {
    result.reputation_lost = clone(row.factionRewards_fail);
  }

  if (Array.isArray(row?.blueprintRewards)) {
    result.blueprintRewards = enrichBlueprintRewards(
      row.blueprintRewards,
      context.blueprintPools,
    );
  }

  if (Array.isArray(row?.haulingOrders)) {
    result.haulingOrders = enrichHaulingOrders(
      row.haulingOrders,
      context.resourcePools,
    );
  }

  return result;
}

function fieldInventory(rows) {
  return [
    ...new Set(
      rows.flatMap((row) => (
        row && typeof row === 'object' ? Object.keys(row) : []
      )),
    ),
  ].sort();
}

async function writeSnapshot() {
  const selected = await chooseDataset();

  console.log(
    `Downloading SCMDB ${selected.identity.code} from ${selected.url}`,
  );

  const source = await fetchJson(selected.url, 90_000);
  const sourceIdentity = parseIdentity(source?.version || selected.url);

  if (!isTarget(sourceIdentity)) {
    throw new Error(
      `Downloaded dataset identifies as ${sourceIdentity?.code || 'unknown'}, `
      + `not ${TARGET_PATCH} ${TARGET_CHANNEL}.`,
    );
  }

  const sourceFingerprint = createHash('sha256')
    .update(JSON.stringify(source))
    .digest('hex');

  const current = Array.isArray(source?.contracts) ? source.contracts : [];
  const legacy = Array.isArray(source?.legacyContracts)
    ? source.legacyContracts
    : [];

  if (current.length < 100) {
    throw new Error(
      `SCMDB returned only ${current.length} current contracts; `
      + 'refusing to replace the repository snapshot.',
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
    ...legacy.map((row) => enrichRecord(row, context, true)),
  ];

  const snapshot = {
    schema: 'celestial-nexus.scmd-missions.v4',
    source: 'SCMDB public mission data',
    sourceUrl: selected.url,
    versionsUrl: VERSIONS_URL,
    sourceFingerprint,
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    targetPatch: TARGET_PATCH,
    targetChannel: TARGET_CHANNEL,
    gameVersion: sourceIdentity.code,
    patchVerified: true,
    verificationMethod:
      'SCMDB versions.json selected the matching LIVE merged dataset. '
      + 'Current and legacy contract arrays were preserved.',
    missionCount: missions.length,
    activeMissionCount: current.length,
    legacyMissionCount: legacy.length,
    fields: fieldInventory(missions),
    missions,
  };

  try {
    const existing = JSON.parse(await fs.readFile(outJson, 'utf8'));

    if (
      existing?.sourceFingerprint === sourceFingerprint
      && existing?.gameVersion === sourceIdentity.code
      && Number(existing?.missionCount) === missions.length
    ) {
      console.log(
        `Repository snapshot is already current for ${sourceIdentity.code}.`,
      );
      return;
    }
  } catch {
    // A missing or unreadable old snapshot is replaced below.
  }

  await fs.mkdir(path.dirname(outJson), { recursive: true });

  const compact = JSON.stringify(snapshot);
  await fs.writeFile(outJson, `${compact}\n`);
  await fs.writeFile(
    outJs,
    `window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${compact};\n`,
  );

  console.log(
    `Saved ${missions.length} SCMDB contracts `
    + `(${current.length} current + ${legacy.length} legacy).`,
  );
  console.log(`Verified version: ${sourceIdentity.code}`);
}

try {
  await writeSnapshot();
} catch (error) {
  console.error(
    `SCMDB sync could not update the snapshot: ${error?.message || error}`,
  );

  try {
    await fs.access(outJson);
    console.log(
      'Keeping the existing repository snapshot unchanged. '
      + 'The workflow will try again next time.',
    );
  } catch {
    throw error;
  }
}
