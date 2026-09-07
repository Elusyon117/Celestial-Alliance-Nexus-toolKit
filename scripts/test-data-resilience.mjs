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
    __legacyRewards: ['Fixture Reward'], patch: 'LIVE unresolved',
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
  const env = { ...process.env, MISSION_CHANNEL: 'LIVE', MISSION_MIN_ACTIVE: '100' };
  if (kind === 'scmdb') {
    const upstream = path.join(temp, 'scmdb');
    await fsp.mkdir(path.join(upstream, 'data'), { recursive: true });
    await fsp.writeFile(path.join(upstream, 'data', 'versions.json'), JSON.stringify({ versions: [{ version, file: 'merged-4.10.0-live.12519617.json' }] }));
    const factions = { 'fac-guid-1': { name: 'Wikelo Emporium' } };
    const contracts = missionRows(120, undefined).map(row => ({ ...row, faction: undefined, factionGuid: 'fac-guid-1' }));
    await fsp.writeFile(path.join(upstream, 'data', 'merged-4.10.0-live.12519617.json'), JSON.stringify({ gameVersion: version, factions, contracts }));
    env.SCMDB_BASE_URL = pathToFileURL(`${upstream}${path.sep}`).href;
  } else {
    const upstream = path.join(temp, 'wiki');
    await fsp.mkdir(upstream, { recursive: true });
    const versions = path.join(upstream, 'versions.json');
    const missions = path.join(upstream, 'missions.json');
    await fsp.writeFile(versions, JSON.stringify({ data: [{ code: version, channel: 'LIVE' }] }));
    await fsp.writeFile(missions, JSON.stringify({ data: missionRows(125, { uuid: 'wiki-faction', name: 'Citizens For Prosperity' }), meta: { last_page: 1 } }));
    env.SCMDB_VERSIONS_URL = pathToFileURL(path.join(temp, 'missing-scmdb.json')).href;
    env.STAR_CITIZEN_WIKI_VERSIONS_URL = pathToFileURL(versions).href;
    env.STAR_CITIZEN_WIKI_MISSIONS_URL = pathToFileURL(missions).href;
  }

  const result = spawnSync(process.execPath, ['scripts/sync-scmdb-missions.mjs'], { cwd: repo, env, encoding: 'utf8' });
  assert(result.status === 0, `${kind} sync fixture failed: ${result.stderr || result.stdout}`);
  const snapshot = JSON.parse(await fsp.readFile(path.join(repo, 'data', 'scmdb-missions-live.json'), 'utf8'));
  assert(snapshot.activeMissionCount >= 100, `${kind} fixture produced an unusable snapshot.`);
  if (kind === 'scmdb') {
    assert(snapshot.source === 'SCMDB public mission data', 'SCMDB fixture did not remain on preferred source.');
    assert(snapshot.missions[0]?.faction?.name === 'Wikelo Emporium', 'SCMDB faction enrichment failed.');
  } else {
    assert(snapshot.isFallback === true && /Star Citizen Wiki/.test(snapshot.source), 'Wiki fallback did not activate.');
    assert(snapshot.missions[0]?.faction?.name === 'Citizens For Prosperity', 'Wiki fallback lost faction names.');
  }
  await fsp.rm(temp, { recursive: true, force: true });
}

await browserRegression();
await runSyncFixture('scmdb');
await runSyncFixture('wiki');
console.log('PASS: Wikelo retention, faction-name resolution, SCMDB enrichment, and Wiki fallback regression tests.');
