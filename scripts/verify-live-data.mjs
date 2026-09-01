#!/usr/bin/env node
import fs from 'node:fs/promises';
const strict = process.argv.includes('--strict');
const normalize = value => String(value || '').match(/\d+(?:\.\d+){1,3}/)?.[0]?.split('.').map(Number).concat([0,0,0,0]).slice(0,4).join('.') || '';
const same = (a,b) => normalize(a) === normalize(b);
const live = JSON.parse(await fs.readFile('data/live-build.json','utf8'));
let status = {}; try { status = JSON.parse(await fs.readFile('data/game-data-status.json','utf8')); } catch {}
const html = await fs.readFile('index.html','utf8');
let sw = ''; try { sw = await fs.readFile('sw.js','utf8'); } catch {}
const contract = status?.modules?.contractFinder || {};
const reported = contract.patch || contract.gameVersion || '';
const contractCurrent = Boolean(reported) && same(reported,live.patch) && contract.patchVerified !== false && contract.status !== 'stale-upstream-unavailable';

const checks = {
  sharedLiveAuthority: html.includes('nexus-live-build-authority-v1') && html.includes('nexus-live-data-standardization-v2'),
  hubBuildLabel: html.includes('id="nexus-hub-live-build"') && html.includes('GAME DATA · resolving LIVE'),
  wikiVersionPin: html.includes("u.searchParams.set('version',live.code)") && html.includes('fetchApiCollection.__nexusLiveStandardized'),
  uexVersionGate: html.includes('nexusEnsureUexCurrent') && html.includes('UEX current-LIVE validation failed'),
  contractPayoutAliases: html.includes("'rewardUEC'") && html.includes('No fixed payout exposed'),
  wikeloLiveOnly: html.includes('__liveVerified') && html.includes('historical recipe values are withheld') && !html.includes('"patch":"4.8.1"'),
  vehiclePriceFallbackRetired: html.includes('Historical hard-coded seller snapshots are intentionally not used as active data') && !html.includes("__source:'Verified Wiki/UEX snapshot'"),
  cargoCapacityFallbackRetired: html.includes('Current LIVE vehicle capacity data is supplied by the shared vehicle catalog') && html.includes('CANONICAL_CARGO_SHIPS = []'),
  itemDemoFallbackRetired: html.includes('const NEXUS_FALLBACK_ITEMS = []') && html.includes('stale demonstration items are withheld'),
  miningOldBaselineRetired: !html.includes('Alpha 4.8.2 component and gadget records') && html.includes('recommendation logic is a planning heuristic'),
  oldMissionDetailPinRetired: !html.includes('/^4\\.8\\.3[-_.]LIVE/i'),
  oldTradeTabRetired: !html.includes('trade-tab-new">4.9</span>'),
  tradeWikiAndUexStandardized: html.includes('nexusTradeFetchJson.__nexusLiveStandardized=true') && html.includes('nexusEnsureUexCurrent'),
  fpsDemoFallbackRetired: html.includes("state.weapons=[];state.attachments=[];state.catalogMode='unavailable'") && html.includes('stale/demo gameplay records are withheld'),
  fpsUsesSharedLiveAuthority: html.includes('async function loadDefaultGameVersion(){') && html.includes('nexusLiveBuildResolve'),
  teachHistoricalOverrideRetired: html.includes('historical Teach overrides withheld') && !html.includes("status:'verified-fallback',source:\"Teach's Ship Shop published loadout table\""),
  moduleBuildBadges: html.includes('nexus-module-live-build-badge') && html.includes('GAME DATA · resolving LIVE…'),
  serviceWorkerRevision: html.includes('sw.js?v=2.0.1-live-current-r3') && sw.includes("VERSION = '2.0.1-live-current-r3'"),
};
const policyCurrent = Object.values(checks).every(Boolean);
const payoutCoverage = contract.payoutCoverage || {};
const report = {
  schema: 'celestial-nexus.live-data-verification.v3',
  checkedAt: new Date().toISOString(),
  liveBuild: live.code,
  livePatch: live.patch,
  modules: {
    contractFinder: {
      current: contractCurrent,
      reportedPatch: reported || null,
      gameVersion: contract.gameVersion || null,
      status: contract.status || 'unknown',
      payoutCoverage,
      reason: contractCurrent ? 'Matches authoritative LIVE patch' : reported ? `Contract snapshot is ${reported}; authoritative LIVE is ${live.patch}` : 'Contract snapshot did not report a patch',
    },
    sharedDataFabric: {
      current: policyCurrent,
      checks,
      reason: policyCurrent ? 'Patch-sensitive browser data paths use the shared LIVE authority.' : 'One or more LIVE-data guard checks failed.',
    },
  },
};
await fs.writeFile('data/live-data-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (strict && (!contractCurrent || !policyCurrent)) process.exitCode = 2;
