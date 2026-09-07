#!/usr/bin/env node
/** Regression tests for the Contract Finder/Wikelo data-resilience fixes. */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const syncSource = fs.readFileSync(path.join(root, 'scripts', 'sync-scmdb-missions.mjs'), 'utf8');

function assert(condition, message) { if (!condition) throw new Error(message); }

async function browserRegression() {
  const match = index.match(/<script\s+id="nexus-data-resilience-patch-v1"[^>]*>([\s\S]*?)<\/script>/i);
  assert(match, 'Data-resilience browser patch was not found in index.html.');
  const trade = {
    id: 'fixture-trade', mission: 'Fixture Wikelo Mission', reward: 'Fixture Reward',
    materials: [], rewards: [],
    __legacyMaterials: [{ name: 'Savrilium', qty: 48 }],
    __legacyRewards: ['Fixture Reward'], patch: 'LIVE unresolved', notes: '',
  };
  const quietConsole = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
  const context = {
    console: quietConsole, URL, URLSearchParams,
    fetch: async () => { throw new Error('offline fixture'); },
    NEXUS_WIKELO_TRADES: [trade],
    nexusWikeloOwned: name => name === 'Savrilium' ? 48 : 0,
    nexusWikeloTradeReady: () => false,
    nexusWikeloProgress: () => 0,
    nexusWikeloPlanTotals: () => ({}),
    nexusWikeloSyncMissionData: async () => {},
    nexusWikeloState: { repSync: 'idle', plan: ['fixture-trade'], missionData: {} },
    nexusWikeloSetSyncStatus: () => {}, nexusWikeloRenderTrades: () => {}, nexusWikeloRenderPlan: () => {},
    nexusWikeloCalculateRep: () => {}, nexusWikeloUpdateStats: () => {}, nexusWikeloSave: () => {},
    nexusWikeloMissionMatch: () => null, nexusWikeloParseRep: () => null,
    nexusMissionNormalize: payload => ({ rows: payload?.missions || [], meta: {} }),
    nexusMissionApplyPayload: () => true,
    nexusMissionFaction: record => String(record?.factionGuid || ''),
    nexusMissionBuildFilters: () => {}, nexusMissionApplyFilters: () => {}, nexusMissionRenderDetail: () => {},
    nexusMissionState: { records: [], selectedId: '' },
    document: { readyState: 'complete', querySelector: () => null, addEventListener: () => {} },
    window: {
      NEXUS_LIVE_BUILD: { code: '4.10.0-LIVE.12519617' },
      NEXUS_SCMDB_MISSIONS_PAYLOAD: { factions: { 'fac-guid-1': { name: 'Nine Tails' } }, missions: [] },
      addEventListener: () => {},
    },
  };
  vm.createContext(context);
  new vm.Script(match[1], { filename: 'nexus-data-resilience-patch-v1.js' }).runInContext(context);
  assert(context.nexusMissionFaction({ factionGuid: 'fac-guid-1' }) === 'Nine Tails', 'Known faction GUID did not resolve.');
  assert(context.nexusMissionFaction({ factionGuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }) === 'Unspecified faction', 'Unknown faction GUID leaked into UI text.');
  assert(trade.materials?.[0]?.name === 'Savrilium' && trade.materials[0].qty === 48, 'Wikelo fallback materials were not restored.');
  assert(context.nexusWikeloTradeReady(trade), 'Wikelo readiness ignored retained recipe data.');
  assert(context.nexusWikeloPlanTotals().Savrilium === 48, 'Wikelo plan totals ignored retained recipe data.');
  await context.nexusWikeloSyncMissionData();
  assert(trade.materials?.[0]?.name === 'Savrilium', 'Offline Wikelo sync erased the retained recipe.');
  assert(!/Recipe (?:shown|cross-checked)/i.test(String(trade.notes || '')), 'Wikelo card provenance notice was re-injected.');
}


async function browserWikiPagingRegression() {
  const match = index.match(/<script\s+id="nexus-v203-scmdb-parity-browser-patch"[^>]*>([\s\S]*?)<\/script>/i);
  assert(match, 'v2.0.4 SCMDB parity/browser paging patch was not found.');
  const current = '4.10.0-LIVE.12519617';
  const makeRows = (start, count) => Array.from({ length: count }, (_, offset) => ({
    uuid: `wiki-${start + offset}`, title: `Wiki Mission ${start + offset}`, faction: { name: `Faction ${(start + offset) % 24}` }
  }));
  const quietConsole = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
  const context = {
    console: quietConsole, URL, Date,
    NEXUS_MISSION_WIKI_URL: 'https://api.star-citizen.wiki/api/missions',
    nexusMissionFetchWikiAll: async () => ({ missions: [] }),
    nexusMissionFetchJson: async url => {
      const parsed = new URL(url);
      if (parsed.pathname.includes('game-versions')) return { data: [{ code: current }] };
      const page = Number(parsed.searchParams.get('page[number]') || 1);
      const rows = page === 1 ? makeRows(0, 200) : page === 2 ? makeRows(200, 200) : page === 3 ? makeRows(400, 50) : [];
      return { data: rows, meta: { pagination: { current_page: page, total: 450 } } };
    },
    nexusMissionFindArray: payload => Array.isArray(payload?.data) ? payload.data : [],
    nexusMissionId: row => row.uuid,
    nexusMissionGet: (row, ...keys) => {
      for (const key of keys) {
        let value = row;
        for (const part of key.split('.')) value = value && typeof value === 'object' ? value[part] : undefined;
        if (value !== undefined && value !== null && value !== '') return value;
      }
      return null;
    },
    nexusMissionNormalize: payload => ({ rows: payload?.missions || [], meta: {} }),
    nexusMissionRenderStatus: () => {},
    nexusMissionFaction: row => row?.faction?.name || 'Unspecified faction',
    nexusMissionState: { records: [], filtered: [], source: '', meta: {} },
    document: { getElementById: () => null },
    window: { NEXUS_LIVE_BUILD: { code: current } },
  };
  vm.createContext(context);
  new vm.Script(match[1], { filename: 'nexus-v203-scmdb-parity-browser-patch.js' }).runInContext(context);
  const payload = await context.nexusMissionFetchWikiAll();
  assert(payload.missions.length === 450, `Wiki browser paging stopped early at ${payload.missions.length} rows.`);
  assert(payload.meta.missionCount === 450, 'Wiki browser paging metadata has the wrong mission count.');
}


async function browserFactionParityRegression() {
  const match = index.match(/<script\s+id="nexus-v204-faction-parity-patch"[^>]*>([\s\S]*?)<\/script>/i);
  assert(match, 'v2.0.4 faction relationship parity patch was not found.');
  const current = '4.10.0-LIVE.12519617';
  const sourceRows = [
    { uuid: 'direct-uppercase', Faction: { UUID: 'fac-hh', Name: 'Headhunters' }, title: '[DESTINATION] Errand' },
    { uuid: 'rep-scope', title: '[LOCATION] needs some repairs', ReputationGained: [
      { Faction: 'Citizens For Prosperity', Scope: 'Affinity', Amount: 50 },
      { Faction: 'Headhunters', Scope: 'FactionReputation', Amount: 25 },
    ] },
    { id: 'jsonapi-wrapper', attributes: { uuid: 'jsonapi-faction', title: 'Wrapped record', faction: { name: 'Citizens For Prosperity' } } },
    { uuid: 'filter-only', title: '[TARGET] needs stomping' },
  ];
  const state = { records: [], filtered: [], selectedId: '', source: 'Star Citizen Wiki fallback', meta: { gameVersion: current, isFallback: true } };
  const memory = new Map();
  const localStorage = { getItem: key => memory.has(key) ? memory.get(key) : null, setItem: (key, value) => memory.set(key, String(value)) };
  const get = (row, ...keys) => {
    for (const key of keys) {
      let value = row;
      for (const part of key.split('.')) value = value && typeof value === 'object' ? value[part] : undefined;
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };
  const quietConsole = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
  const context = {
    console: quietConsole, URL, URLSearchParams, Date, AbortController,
    setTimeout: () => 0, clearTimeout: () => {},
    nexusMissionState: state,
    NEXUS_MISSION_WIKI_URL: 'https://api.star-citizen.wiki/api/missions',
    nexusMissionId: (row, index = 0) => String(row?.uuid || row?.id || row?.attributes?.uuid || `mission-${index}`),
    nexusMissionGet: get,
    nexusMissionFindArray: payload => Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.missions) ? payload.missions : [],
    nexusMissionNormalize: payload => ({ rows: (payload?.data || payload?.missions || []).map((raw, index) => ({ ...raw, __nexusId: String(raw?.uuid || raw?.id || raw?.attributes?.uuid || index), __nexusRaw: raw })), meta: { gameVersion: current }, source: 'fixture' }),
    nexusMissionApplyPayload: parsed => { state.records = parsed.rows; state.meta = { ...state.meta, ...(parsed.meta || {}) }; return true; },
    nexusMissionFaction: () => 'Unspecified faction',
    nexusMissionBuildFilters: () => {}, nexusMissionApplyFilters: () => {}, nexusMissionRenderDetail: () => {}, nexusMissionRenderStatus: () => {},
    nexusMissionFetchJson: async url => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/missions/filters')) return { data: { faction: [{ value: 'Headhunters' }, { value: 'Citizens For Prosperity' }, { value: 'Covalex Shipping' }] } };
      if (parsed.pathname.endsWith('/factions')) return { data: [{ uuid: 'fac-hh', name: 'Headhunters' }, { uuid: 'fac-cfp', name: 'Citizens For Prosperity' }] };
      if (parsed.pathname.endsWith('/missions')) {
        const faction = parsed.searchParams.get('filter[faction]');
        const rows = faction === 'Headhunters' ? [{ uuid: 'filter-only', title: '[TARGET] needs stomping' }] : [];
        return { data: rows, meta: { last_page: 1, total: rows.length } };
      }
      throw new Error(`Unexpected fixture URL ${url}`);
    },
    document: { getElementById: () => null },
    window: { NEXUS_LIVE_BUILD: { code: current }, NEXUS_SCMDB_MISSIONS_PAYLOAD: null, localStorage, addEventListener: () => {} },
  };
  vm.createContext(context);
  new vm.Script(match[1], { filename: 'nexus-v204-faction-parity-patch.js' }).runInContext(context);
  const parsed = context.nexusMissionNormalize({ data: sourceRows }, 'Star Citizen Wiki fallback', context.NEXUS_MISSION_WIKI_URL);
  context.nexusMissionApplyPayload(parsed);
  await context.window.nexusMissionHydrateFactionsV204(current);
  const byId = new Map(state.records.map(row => [String(row.uuid || row.id), row]));
  assert(context.nexusMissionFaction(byId.get('direct-uppercase')) === 'Headhunters', 'Uppercase Faction.Name was not resolved.');
  assert(context.nexusMissionFaction(byId.get('rep-scope')) === 'Headhunters', 'FactionReputation did not take precedence over unrelated Affinity.');
  assert(context.nexusMissionFaction(state.records.find(row => row.uuid === 'jsonapi-faction' || row.attributes?.uuid === 'jsonapi-faction')) === 'Citizens For Prosperity', 'JSON:API attributes were not flattened for faction resolution.');
  assert(context.nexusMissionFaction(byId.get('filter-only')) === 'Headhunters', 'Wiki faction-filter membership did not resolve the issuer.');
  assert(state.records.every(row => context.nexusMissionFaction(row) !== 'Unspecified faction'), 'Legacy Unspecified faction text remains in the v2.0.4 fixture.');
}

function missionRows(count, faction) {
  return Array.from({ length: count }, (_, index) => ({
    uuid: `mission-${index}`, id: `mission-${index}`, title: `Mission ${index}`,
    faction, reward_scope: 'Hauling', star_systems: ['Pyro'],
  }));
}

async function runSyncFixture(kind) {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), `nexus-${kind}-`));
  const repo = path.join(temp, 'repo');
  await fsp.mkdir(path.join(repo, 'scripts'), { recursive: true });
  await fsp.mkdir(path.join(repo, 'data'), { recursive: true });
  await fsp.writeFile(path.join(repo, 'scripts', 'sync-scmdb-missions.mjs'), syncSource);
  const bootstrap = { gameVersion: '4.9.0-LIVE', activeMissionCount: 0, missionCount: 0, missions: [] };
  await fsp.writeFile(path.join(repo, 'data', 'scmdb-missions-live.json'), JSON.stringify(bootstrap));
  await fsp.writeFile(path.join(repo, 'data', 'scmdb-missions-live.js'), `window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${JSON.stringify(bootstrap)};\n`);

  const version = '4.10.0-LIVE.12519617';
  const env = { ...process.env, MISSION_CHANNEL: 'LIVE', MISSION_MIN_ACTIVE: '100', WIKI_MIN_TOTAL: '100' };
  if (kind === 'scmdb') {
    const upstream = path.join(temp, 'scmdb');
    await fsp.mkdir(path.join(upstream, 'data'), { recursive: true });
    await fsp.writeFile(path.join(upstream, 'data', 'versions.json'), JSON.stringify({ versions: [{ version, file: 'merged-4.10.0-live.12519617.json' }] }));
    const factions = { 'fac-guid-1': { name: 'Wikelo Emporium' }, 'fac-guid-2': { name: 'Covalex Shipping' } };
    const contracts = missionRows(120, undefined).map((row, index) => ({ ...row, faction: undefined, factionGuid: index % 2 ? 'fac-guid-1' : 'fac-guid-2', factionRewardsIndex: 0, partialRewardPayoutIndex: 0, locations: ['loc-1'] }));
    const legacyContracts = missionRows(20, undefined).map((row, index) => ({ ...row, uuid: `legacy-${index}`, id: `legacy-${index}`, title: `Legacy ${index}`, faction: undefined, factionGuid: 'fac-guid-2' }));
    const source = {
      gameVersion: version, factions, contracts, legacyContracts,
      locationPools: { 'loc-1': { name: 'Area18' } }, shipPools: { 'ship-1': { name: 'C2 Hercules' } },
      blueprintPools: { 'bp-1': { name: 'Fixture Blueprints', blueprints: [{ name: 'Fixture Blueprint' }] } },
      scopes: { 'scope-1': { scopeName: 'FactionReputation' } }, availabilityPools: { 'avail-1': { name: 'Always' } },
      factionRewardsPools: [[{ factionGuid: 'fac-guid-1', amount: 100 }]], resourcePools: { 'res-1': { name: 'Tungsten' } },
      partialRewardPayoutPools: [[{ minPercentage: 50, maxPercentage: 99, currencyRewardMultiplier: 0.75 }]],
      extraMetadata: { fixture: true }
    };
    await fsp.writeFile(path.join(upstream, 'data', 'merged-4.10.0-live.12519617.json'), JSON.stringify(source));
    env.SCMDB_BASE_URL = pathToFileURL(`${upstream}${path.sep}`).href;
  } else {
    const upstream = path.join(temp, 'wiki');
    await fsp.mkdir(upstream, { recursive: true });
    const versions = path.join(upstream, 'versions.json');
    const missions = path.join(upstream, 'missions.json');
    const factions = path.join(upstream, 'factions.json');
    const filters = path.join(upstream, 'filters.json');
    await fsp.writeFile(versions, JSON.stringify({ data: [{ code: version, channel: 'LIVE' }] }));
    const wikiRows = missionRows(125, undefined).map(row => ({ ...row, faction: undefined, ReputationGained: [{ Faction: 'Citizens For Prosperity', Scope: 'FactionReputation', Amount: 100 }] }));
    await fsp.writeFile(missions, JSON.stringify({ data: wikiRows, meta: { last_page: 1 } }));
    await fsp.writeFile(factions, JSON.stringify({ data: [{ uuid: 'wiki-faction', name: 'Citizens For Prosperity' }] }));
    await fsp.writeFile(filters, JSON.stringify({ data: { faction: [{ value: 'Citizens For Prosperity' }] } }));
    env.SCMDB_VERSIONS_URL = pathToFileURL(path.join(temp, 'missing-scmdb.json')).href;
    env.STAR_CITIZEN_WIKI_VERSIONS_URL = pathToFileURL(versions).href;
    env.STAR_CITIZEN_WIKI_MISSIONS_URL = pathToFileURL(missions).href;
    env.STAR_CITIZEN_WIKI_FACTIONS_URL = pathToFileURL(factions).href;
    env.STAR_CITIZEN_WIKI_MISSION_FILTERS_URL = pathToFileURL(filters).href;
  }

  const result = spawnSync(process.execPath, ['scripts/sync-scmdb-missions.mjs'], { cwd: repo, env, encoding: 'utf8' });
  assert(result.status === 0, `${kind} sync fixture failed: ${result.stderr || result.stdout}`);
  const snapshot = JSON.parse(await fsp.readFile(path.join(repo, 'data', 'scmdb-missions-live.json'), 'utf8'));
  assert(snapshot.activeMissionCount >= 100, `${kind} fixture produced an unusable snapshot.`);
  if (kind === 'scmdb') {
    assert(snapshot.source === 'SCMDB public mission data', 'SCMDB fixture did not remain on preferred source.');
    assert(snapshot.missionCount === 140 && snapshot.activeMissionCount === 120 && snapshot.legacyMissionCount === 20, 'SCMDB contracts + legacyContracts parity merge failed.');
    assert(snapshot.scmdbParity?.totalContracts === 140, 'SCMDB parity telemetry is wrong.');
    assert(snapshot.missions[0]?.faction?.name === 'Covalex Shipping', 'SCMDB faction enrichment failed.');
    assert(snapshot.locationPools?.['loc-1']?.name === 'Area18', 'SCMDB locationPools were not preserved.');
    assert(snapshot.shipPools?.['ship-1']?.name === 'C2 Hercules', 'SCMDB shipPools were not preserved.');
    assert(snapshot.blueprintPools?.['bp-1']?.name === 'Fixture Blueprints', 'SCMDB blueprintPools were not preserved.');
    assert(Array.isArray(snapshot.factionRewardsPools), 'SCMDB factionRewardsPools were not preserved.');
    assert(snapshot.sourceExtras?.extraMetadata?.fixture === true, 'Unknown SCMDB top-level metadata was not preserved.');
  } else {
    assert(snapshot.isFallback === true && /Star Citizen Wiki/.test(snapshot.source), 'Wiki fallback did not activate.');
    assert(snapshot.missions[0]?.factionName === 'Citizens For Prosperity', 'Wiki fallback did not derive faction names from ReputationGained.');
    assert(Number(snapshot.unresolvedFactionCount || 0) === 0, 'Wiki fallback fixture still has unresolved factions.');
  }
  await fsp.rm(temp, { recursive: true, force: true });
}

await browserRegression();
await browserWikiPagingRegression();
await browserFactionParityRegression();
await runSyncFixture('scmdb');
await runSyncFixture('wiki');
console.log('PASS: Wikelo concise cards, v2.0.4 faction relationship resolution, complete Wiki paging, SCMDB parity/schema preservation, and Wiki fallback regression tests.');
