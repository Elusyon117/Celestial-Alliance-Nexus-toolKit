#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'data', 'scmdb-missions-live.json');
const jsPath = path.join(root, 'data', 'scmdb-missions-live.js');
const statusPath = path.join(root, 'data', 'game-data-status.json');

const MIN_PATHS = [
  'reward_min', 'rewardUEC', 'reward_uec', 'payoutUEC', 'payout_uec',
  'reward.minimum', 'reward.min', 'reward.amount', 'rewards.credits.min',
  'rewards.credits.amount', 'payout_min', 'payout.minimum', 'payout.amount', 'payout',
];
const MAX_PATHS = [
  'reward_max', 'rewardMaximum', 'reward_maximum', 'reward.maximum', 'reward.max',
  'rewards.credits.max', 'payout_max', 'payout.maximum',
];
const ITEM_PATHS = ['reward_items', 'item_rewards', 'items_rewarded', 'rewards.items', 'itemRewards'];
const BLUEPRINT_PATHS = ['blueprints', 'blueprint_rewards', 'blueprintRewards', 'rewards.blueprints'];
const REP_PATHS = [
  'reputation_gained', 'reputationGained', 'reputation_rewards.gained',
  'rewards.reputation.gained', 'reputation_rewards', 'rewards.reputation',
];

function get(rootValue, pathValue) {
  return String(pathValue).split('.').reduce(
    (value, key) => (value && typeof value === 'object' ? value[key] : undefined),
    rootValue,
  );
}

function numeric(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const match = value.replace(/[,\s]/g, '').match(/-?\d+(?:\.\d+)?/);
    return match && Number.isFinite(Number(match[0])) ? Number(match[0]) : null;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = numeric(entry);
      if (found != null) return found;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const key of ['amount', 'value', 'min', 'minimum', 'uec', 'credits', 'reward']) {
      const found = numeric(value[key]);
      if (found != null) return found;
    }
  }
  return null;
}

function firstNumber(record, paths) {
  for (const candidate of paths) {
    const raw = get(record, candidate);
    if (raw == null || raw === '') continue;
    const value = numeric(raw);
    if (value != null) return { value, path: candidate };
  }
  return { value: null, path: '' };
}

function hasRows(record, paths) {
  for (const candidate of paths) {
    const value = get(record, candidate);
    if (Array.isArray(value) && value.length) return true;
    if (value && typeof value === 'object' && Object.keys(value).length) return true;
  }
  return false;
}

function normalizeMission(record, stats) {
  if (!record || typeof record !== 'object') return record;
  const min = firstNumber(record, MIN_PATHS);
  const max = firstNumber(record, MAX_PATHS);
  const fixed = (min.value != null && min.value > 0) || (max.value != null && max.value > 0);
  const itemReward = hasRows(record, ITEM_PATHS);
  const blueprintReward = hasRows(record, BLUEPRINT_PATHS);
  const reputationReward = hasRows(record, REP_PATHS);
  const nonCurrency = itemReward || blueprintReward || reputationReward;
  const next = { ...record };

  if (fixed) {
    const low = min.value != null && min.value > 0 ? min.value : max.value;
    const high = max.value != null && max.value > 0 ? max.value : null;
    const priorAlias = /^SCMDB\s+(?!reward_min$)/i.test(String(next.__nexusPayoutSource || ''));
    if (priorAlias) stats.normalizedFromAliases += 1;
    if (!(Number(next.reward_min) > 0) && low != null) {
      next.reward_min = low;
      if (min.path && min.path !== 'reward_min') {
        next.__nexusPayoutSource = `SCMDB ${min.path}`;
        if (!priorAlias) stats.normalizedFromAliases += 1;
      }
    }
    if (!(Number(next.reward_max) > 0) && high != null) next.reward_max = high;
    if (!String(next.reward_currency || '').trim()) next.reward_currency = 'aUEC';
    next.reward_kind = 'fixed-currency';
    stats.fixedCurrency += 1;
  } else if (nonCurrency) {
    next.reward_kind = 'non-currency';
    stats.nonCurrency += 1;
  } else {
    next.reward_kind = 'unlisted';
    stats.unlisted += 1;
  }
  return next;
}

const snapshot = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
if (!Array.isArray(snapshot?.missions)) throw new Error('SCMDB mission snapshot does not contain a missions array.');

const stats = {
  total: snapshot.missions.length,
  fixedCurrency: 0,
  nonCurrency: 0,
  unlisted: 0,
  normalizedFromAliases: 0,
};
snapshot.missions = snapshot.missions.map((mission) => normalizeMission(mission, stats));
snapshot.payoutNormalization = {
  schema: 'celestial-nexus.contract-payouts.v1',
  normalizedAt: snapshot.fetchedAt || snapshot.payoutNormalization?.normalizedAt || new Date().toISOString(),
  ...stats,
  note: 'Only source-provided payout aliases are canonicalized; missing payouts are never invented.',
};

const compact = JSON.stringify(snapshot);
await fs.writeFile(jsonPath, `${compact}\n`);
await fs.writeFile(jsPath, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${compact};\n`);

let status = {};
try { status = JSON.parse(await fs.readFile(statusPath, 'utf8')); } catch {}
const contractFinder = status?.modules?.contractFinder || {};
status = {
  ...status,
  generatedAt: new Date().toISOString(),
  modules: {
    ...(status.modules || {}),
    contractFinder: {
      ...contractFinder,
      payoutCoverage: stats,
    },
  },
};
await fs.writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`);

console.log(`Contract payouts normalized: ${stats.normalizedFromAliases} aliases canonicalized; ${stats.fixedCurrency} fixed-currency, ${stats.nonCurrency} non-currency, ${stats.unlisted} unlisted.`);
