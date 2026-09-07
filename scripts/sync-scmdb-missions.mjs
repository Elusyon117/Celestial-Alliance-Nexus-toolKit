#!/usr/bin/env node
/**
 * Celestial Nexus Contract Finder data mirror — v2.0.3
 *
 * Authority order:
 *   1. SCMDB versions manifest + selected dataset (exact contracts + legacyContracts semantics)
 *   2. Optional SCMDB mirror URLs supplied through SCMDB_MIRROR_URLS
 *   3. Current version-pinned Star Citizen Wiki mission API fallback
 *   4. Previously checked-in usable snapshot
 *
 * SCMDB records are never reduced to a custom schema. Every source field is preserved and
 * additional resolved fields are layered on top so the browser can use readable factions,
 * resource names, blueprint pools, reputation pools, location pools, and payout pools.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outJson = path.join(root, 'data', 'scmdb-missions-live.json');
const outJs = path.join(root, 'data', 'scmdb-missions-live.js');
const statusJson = path.join(root, 'data', 'game-data-status.json');

const SCMDB_BASE = String(process.env.SCMDB_BASE_URL || 'https://scmdb.net/');
const VERSIONS_URL = String(process.env.SCMDB_VERSIONS_URL || new URL('data/versions.json', SCMDB_BASE).href);
const DIRECT_DATASET_URL = String(process.env.SCMDB_MISSIONS_URL || '').trim();
const SCMDB_MIRROR_URLS = String(process.env.SCMDB_MIRROR_URLS || '').split(/[\n,;]/).map(value => value.trim()).filter(Boolean);
const WIKI_VERSIONS_URL = String(process.env.STAR_CITIZEN_WIKI_VERSIONS_URL || 'https://api.star-citizen.wiki/api/game-versions');
const WIKI_MISSIONS_URL = String(process.env.STAR_CITIZEN_WIKI_MISSIONS_URL || 'https://api.star-citizen.wiki/api/missions');
const WIKI_FACTIONS_URL = String(process.env.STAR_CITIZEN_WIKI_FACTIONS_URL || 'https://api.star-citizen.wiki/api/factions');
const PATCH_OVERRIDE = String(process.env.MISSION_PATCH || '').trim();
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const MIN_ACTIVE = Math.max(5, Number(process.env.MISSION_MIN_ACTIVE || 100));
const WIKI_MIN_TOTAL = Math.max(MIN_ACTIVE, Number(process.env.WIKI_MIN_TOTAL || 500));
const ALLOW_LARGE_DROP = /^(1|true|yes)$/i.test(String(process.env.ALLOW_LARGE_DROP || ''));
const KNOWN_LIVE_VERSION = String(process.env.KNOWN_LIVE_VERSION || '4.10.0-LIVE.12519617');
const SCMDB_REFERENCE_TOTAL = Math.max(0, Number(process.env.SCMDB_REFERENCE_TOTAL || 1381));
const PAGE_SIZE = 200;

const SCMDB_SUPPORT_KEYS = [
  'factions', 'locationPools', 'shipPools', 'blueprintPools', 'scopes', 'availabilityPools',
  'factionRewardsPools', 'resourcePools', 'partialRewardPayoutPools'
];
const MISSION_KEYS = new Set(['contracts', 'missions', 'currentContracts', 'current_contracts', 'legacyContracts', 'legacy_contracts', 'legacyMissions', 'legacy_missions']);

function parseIdentity(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+){1,3})[._-](live|ptu|eptu)(?:[._-](\d+))?/i);
  if (!match) return null;
  const patch = match[1], channel = match[2].toUpperCase(), build = match[3] || '';
  return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
}
function identityFromEntry(entry, keyHint = '') {
  if (typeof entry === 'string') return parseIdentity(entry) || parseIdentity(keyHint);
  for (const value of [entry?.version, entry?.gameVersion, entry?.game_version, entry?.file, entry?.filename, entry?.path, entry?.name, entry?.code, entry?.id, entry?.url, entry?.href, entry?.attributes?.code, entry?.attributes?.name, keyHint]) {
    const identity = parseIdentity(value); if (identity) return identity;
  }
  const patch = String(entry?.patch || entry?.attributes?.patch || '').trim();
  const channel = String(entry?.channel || entry?.environment || entry?.attributes?.channel || '').trim().toUpperCase();
  const build = String(entry?.build || entry?.buildNumber || entry?.attributes?.build || '').trim();
  if (/^\d+(?:\.\d+){1,3}$/.test(patch) && /^(LIVE|PTU|EPTU)$/.test(channel)) {
    return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
  }
  return null;
}
function patchParts(value) { return String(value || '').split('.').map(part => Number(part) || 0).concat([0,0,0,0]).slice(0,4); }
function comparePatch(a, b) { const aa=patchParts(a),bb=patchParts(b); for(let i=0;i<4;i+=1) if(aa[i]!==bb[i]) return aa[i]-bb[i]; return 0; }
function samePatch(a,b){ return comparePatch(a,b)===0; }
function compareDataset(a,b){ const patch=comparePatch(b.identity.patch,a.identity.patch); return patch || Number(b.identity.build||0)-Number(a.identity.build||0); }
function clone(value){ return value == null ? value : JSON.parse(JSON.stringify(value)); }
function fingerprint(value){ return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

async function readJsonSource(url, timeout = 45_000) {
  const parsed = new URL(url);
  if (parsed.protocol === 'file:') return JSON.parse(await fs.readFile(fileURLToPath(parsed), 'utf8'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'Celestial-Nexus-Game-Data-Sync/2.0.3' } });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

function datasetFile(entry, identity) {
  if (typeof entry === 'string' && /(?:\.json(?:[?#]|$)|^https?:|^file:|^\.?\.?\/|^\/)/i.test(entry)) return entry;
  const explicit = [entry?.file,entry?.filename,entry?.url,entry?.href,entry?.path,entry?.download,entry?.dataset].find(value=>typeof value==='string'&&value.trim());
  return explicit || `merged-${identity.patch.toLowerCase()}-${identity.channel.toLowerCase()}${identity.build ? `.${identity.build}` : ''}.json`;
}
function manifestRows(payload) {
  const rows=[],seen=new Set();
  function visit(value,keyHint='',depth=0){
    if(depth>8||value==null)return;
    if(typeof value==='string'){const identity=identityFromEntry(value,keyHint);if(identity)rows.push({entry:value,keyHint,identity});return;}
    if(typeof value!=='object'||seen.has(value))return;seen.add(value);
    if(Array.isArray(value)){value.forEach(item=>visit(item,keyHint,depth+1));return;}
    const identity=identityFromEntry(value,keyHint);if(identity)rows.push({entry:value,keyHint,identity});
    Object.entries(value).forEach(([key,child])=>visit(child,key,depth+1));
  }
  visit(payload);
  const deduped=new Map();
  for(const row of rows){const file=datasetFile(row.entry,row.identity),key=`${row.identity.code}|${file}`;if(!deduped.has(key))deduped.set(key,{...row,file});}
  return [...deduped.values()];
}
async function chooseScmdbDataset() {
  if (DIRECT_DATASET_URL) {
    const identity=parseIdentity(DIRECT_DATASET_URL)||parseIdentity(PATCH_OVERRIDE&&`${PATCH_OVERRIDE}-${TARGET_CHANNEL}`);
    if(!identity) throw new Error('SCMDB_MISSIONS_URL must identify a patch/channel or MISSION_PATCH must be provided.');
    if(identity.channel!==TARGET_CHANNEL||(PATCH_OVERRIDE&&!samePatch(identity.patch,PATCH_OVERRIDE))) throw new Error(`SCMDB_MISSIONS_URL identifies as ${identity.code}, outside requested target.`);
    return {url:DIRECT_DATASET_URL,identity,selection:'explicit override'};
  }
  const manifest=await readJsonSource(VERSIONS_URL);
  const candidates=manifestRows(manifest).filter(({identity})=>identity.channel===TARGET_CHANNEL&&(!PATCH_OVERRIDE||samePatch(identity.patch,PATCH_OVERRIDE))).sort(compareDataset);
  if(!candidates.length) throw new Error(`SCMDB does not list ${PATCH_OVERRIDE||'any'} ${TARGET_CHANNEL} dataset.`);
  const selected=candidates[0],dataBase=new URL('data/',SCMDB_BASE);
  return {url:new URL(selected.file,dataBase).href,identity:selected.identity,selection:'newest manifest dataset'};
}

function scoreMissionArray(rows){
  if(!Array.isArray(rows)||!rows.length)return -1;let score=Math.min(rows.length,5000);
  for(const row of rows.slice(0,20)){if(!row||typeof row!=='object')continue;for(const key of ['title','name','description','debugName','debug_name','rewardUEC','factionGuid','id','uuid']) if(key in row||(row.attributes&&key in row.attributes))score+=20;}
  return score;
}
function findMissionArray(payload, excluded=new Set()){
  let best=[],bestScore=-1;const walked=new Set();
  function walk(value,depth=0){if(depth>8||value==null||typeof value!=='object'||walked.has(value))return;walked.add(value);if(Array.isArray(value)){if(!excluded.has(value)){const score=scoreMissionArray(value);if(score>bestScore){best=value;bestScore=score;}}value.slice(0,40).forEach(item=>walk(item,depth+1));return;}Object.values(value).forEach(child=>walk(child,depth+1));}
  walk(payload);return best;
}
function firstArray(payload, aliases){
  const queue=[payload],walked=new Set();
  while(queue.length){const value=queue.shift();if(!value||typeof value!=='object'||walked.has(value))continue;walked.add(value);for(const [key,child] of Object.entries(value)){if(aliases.has(key.toLowerCase())&&Array.isArray(child))return child;if(child&&typeof child==='object'&&!Array.isArray(child))queue.push(child);}}
  return [];
}
function flattenRecord(row){if(!row||typeof row!=='object'||!row.attributes||typeof row.attributes!=='object')return row;return {...row.attributes,id:row.id??row.attributes.id,type:row.type,relationships:row.relationships,links:row.links};}
function datasetIdentity(source,url){for(const candidate of [source?.version,source?.gameVersion,source?.game_version,source?.targetVersion,source?.meta?.version,source?.meta?.gameVersion,source?.metadata?.version,source?.metadata?.gameVersion,url]){const identity=parseIdentity(candidate);if(identity)return identity;}return null;}
function normalizeDictionary(source){
  if(!source)return {};
  if(!Array.isArray(source)&&typeof source==='object')return source;
  const result={};if(Array.isArray(source))for(const row of source){const id=String(row?.guid??row?.uuid??row?.id??row?.code??'').trim();if(id)result[id]=row;}return result;
}
function lookup(dictionary,key){if(key==null||!dictionary)return null;if(dictionary[key]!=null)return dictionary[key];const wanted=String(key).toLowerCase();const actual=Object.keys(dictionary).find(candidate=>candidate.toLowerCase()===wanted);return actual?dictionary[actual]:null;}
function poolByIndexOrKey(pool,key){
  if(key==null||!pool)return null;
  if(Array.isArray(pool)){const index=Number(key);return Number.isInteger(index)&&index>=0&&index<pool.length?pool[index]:null;}
  return lookup(pool,key);
}
function enrichBlueprintRewards(rows,pools){if(!Array.isArray(rows))return rows;return rows.map(entry=>{if(!entry||typeof entry!=='object')return entry;const result={...entry},pool=poolByIndexOrKey(pools,entry.blueprintPool??entry.blueprint_pool??entry.pool);if(pool){result.blueprintPoolDetails=clone(pool);if(!result.poolName&&pool.name)result.poolName=pool.name;if(!result.blueprints&&pool.blueprints)result.blueprints=clone(pool.blueprints);}return result;});}
function enrichHaulingOrders(rows,resources){if(!Array.isArray(rows))return rows;return rows.map(entry=>{if(!entry||typeof entry!=='object')return entry;const result={...entry},resource=poolByIndexOrKey(resources,entry.resource??entry.resourceGuid??entry.resource_guid);if(resource){result.resourceName=resource.name||resource.displayName||entry.resource;result.resourceDetails=clone(resource);}return result;});}
function enrichLocations(value,locationPools){
  if(!Array.isArray(value))return value;
  return value.map(entry=>{if(entry&&typeof entry==='object')return entry;const details=poolByIndexOrKey(locationPools,entry);return details?{guid:entry,...clone(details)}:entry;});
}
function readableFactionName(faction){return String(faction?.displayName??faction?.display_name??faction?.name??faction?.title??'').trim();}
function enrichScmdbRecord(row,context,legacyContract){
  const result={...row,gameVersion:context.gameVersion,legacyContract:Boolean(legacyContract),scmdb_url:`https://scmdb.net/?m=${encodeURIComponent(String(row?.id||row?.debugName||row?.debug_name||''))}`};
  const guid=row?.factionGuid??row?.faction_guid??row?.faction?.guid??row?.faction?.id;
  const faction=guid?lookup(context.factions,guid):null;
  if(faction){result.faction={guid,...clone(faction)};const name=readableFactionName(faction);if(name&&!result.factionName)result.factionName=name;}
  const rewardIndex=row?.factionRewardsIndex??row?.faction_rewards_index;
  const reputation=poolByIndexOrKey(context.factionRewardsPools,rewardIndex);if(reputation)result.reputation_gained=clone(reputation);
  const payoutIndex=row?.partialRewardPayoutIndex??row?.partial_reward_payout_index;
  const partial=poolByIndexOrKey(context.partialRewardPayoutPools,payoutIndex);if(partial)result.partialRewardPayout=clone(partial);
  const availabilityIndex=row?.availabilityPoolIndex??row?.availability_pool_index??row?.availabilityPool;
  const availability=poolByIndexOrKey(context.availabilityPools,availabilityIndex);if(availability)result.availabilityPoolDetails=clone(availability);
  if(Array.isArray(row?.blueprintRewards))result.blueprintRewards=enrichBlueprintRewards(row.blueprintRewards,context.blueprintPools);
  if(Array.isArray(row?.haulingOrders))result.haulingOrders=enrichHaulingOrders(row.haulingOrders,context.resourcePools);
  if(Array.isArray(row?.locations))result.locationDetails=enrichLocations(row.locations,context.locationPools);
  if(Array.isArray(row?.destinations))result.destinationDetails=enrichLocations(row.destinations,context.locationPools);
  return result;
}
function fieldInventory(rows){return [...new Set(rows.flatMap(row=>row&&typeof row==='object'?Object.keys(row):[]))].sort();}
function copySourceExtras(source){
  const extras={};
  for(const [key,value] of Object.entries(source&&typeof source==='object'?source:{})){
    if(MISSION_KEYS.has(key)||SCMDB_SUPPORT_KEYS.includes(key))continue;
    extras[key]=clone(value);
  }
  return extras;
}
function sourceSupport(source){const result={};for(const key of SCMDB_SUPPORT_KEYS)result[key]=clone(source?.[key]??(key.endsWith('Pools')?{}:{}));return result;}

async function readExistingSnapshot(){try{return JSON.parse(await fs.readFile(outJson,'utf8'));}catch{return null;}}
function existingMissionCount(snapshot){return Math.max(Number(snapshot?.activeMissionCount||0),Array.isArray(snapshot?.missions)?snapshot.missions.length:0);}
function isUsableExisting(snapshot){return existingMissionCount(snapshot)>=MIN_ACTIVE;}
async function writeStatus(moduleStatus){
  let status={};try{status=JSON.parse(await fs.readFile(statusJson,'utf8'));}catch{}
  const next={schema:'celestial-nexus.game-data-status.v2',generatedAt:new Date().toISOString(),detectedPatch:moduleStatus.patch,detectedChannel:moduleStatus.channel,modules:{...(status.modules||{}),contractFinder:moduleStatus}};
  await fs.mkdir(path.dirname(statusJson),{recursive:true});await fs.writeFile(statusJson,`${JSON.stringify(next,null,2)}\n`);
}
async function writeSnapshot(snapshot){const compact=JSON.stringify(snapshot);await fs.mkdir(path.dirname(outJson),{recursive:true});await fs.writeFile(outJson,`${compact}\n`);await fs.writeFile(outJs,`window.NEXUS_SCMDB_MISSIONS_PAYLOAD = ${compact};\n`);}

async function normalizeScmdbSource(source, identity, sourceUrl, selection='SCMDB dataset'){
  const legacyRaw=firstArray(source,new Set(['legacycontracts','legacy_contracts','legacy-missions','legacymissions']));
  const currentRaw=firstArray(source,new Set(['contracts','missions','currentcontracts','current_contracts']));
  const current=(currentRaw.length?currentRaw:findMissionArray(source,new Set([legacyRaw]))).map(flattenRecord);
  const legacy=legacyRaw.map(flattenRecord);
  if(current.length<MIN_ACTIVE)throw new Error(`SCMDB returned only ${current.length} active contracts; minimum is ${MIN_ACTIVE}.`);
  const support=sourceSupport(source);
  const context={
    gameVersion:identity.code,
    factions:normalizeDictionary(support.factions),
    locationPools:normalizeDictionary(support.locationPools),
    shipPools:normalizeDictionary(support.shipPools),
    blueprintPools:normalizeDictionary(support.blueprintPools),
    scopes:normalizeDictionary(support.scopes),
    availabilityPools:support.availabilityPools||{},
    factionRewardsPools:support.factionRewardsPools||[],
    resourcePools:normalizeDictionary(support.resourcePools),
    partialRewardPayoutPools:support.partialRewardPayoutPools||[],
  };
  const missions=[...current.map(row=>enrichScmdbRecord(row,context,false)),...legacy.map(row=>enrichScmdbRecord(row,context,true))];
  const namedFactionIds=new Set(missions.map(row=>row?.factionName||readableFactionName(row?.faction)).filter(Boolean));
  const fetchedAt=new Date().toISOString(),sourceFingerprint=fingerprint(source);
  const parity={
    semantics:'SCMDB contracts + legacyContracts',activeContracts:current.length,legacyContracts:legacy.length,totalContracts:missions.length,
    factionDictionaryCount:Object.keys(context.factions).length,namedFactionCount:namedFactionIds.size,
    referenceTotal:SCMDB_REFERENCE_TOTAL||null,deltaFromReference:SCMDB_REFERENCE_TOTAL?missions.length-SCMDB_REFERENCE_TOTAL:null,referenceNote:'Reference count is informational only and may change when SCMDB updates.'
  };
  return {
    snapshot:{
      schema:'celestial-nexus.scmdb-missions.v7',source:'SCMDB public mission data',sourceUrl,versionsUrl:VERSIONS_URL,sourceFingerprint,isFallback:false,fetchedAt,
      targetPatch:identity.patch,targetChannel:TARGET_CHANNEL,gameVersion:identity.code,patchVerified:true,
      verificationMethod:`${selection}; exact SCMDB contracts + legacyContracts merge semantics with supporting dictionaries preserved.`,
      missionCount:missions.length,activeMissionCount:current.length,legacyMissionCount:legacy.length,factionCount:namedFactionIds.size,scmdbParity:parity,
      ...Object.fromEntries(SCMDB_SUPPORT_KEYS.map(key=>[key,clone(source?.[key]??support[key])])),
      sourceExtras:copySourceExtras(source),fields:fieldInventory(missions),missions,
    },
    status:{status:'current-scmdb-parity',source:'SCMDB',sourceUrl,versionsUrl:VERSIONS_URL,patch:identity.patch,channel:TARGET_CHANNEL,gameVersion:identity.code,fetchedAt,activeCount:current.length,legacyCount:legacy.length,totalCount:missions.length,factionCount:namedFactionIds.size,parity,fingerprint:sourceFingerprint}
  };
}

async function synchronizeScmdb(existing){
  const selected=await chooseScmdbDataset();console.log(`SCMDB selected ${selected.identity.code}: ${selected.url}`);
  const source=await readJsonSource(selected.url,90_000);const identity=datasetIdentity(source,selected.url)||selected.identity;
  if(identity.channel!==TARGET_CHANNEL||!samePatch(identity.patch,selected.identity.patch))throw new Error(`SCMDB manifest selected ${selected.identity.code}, but dataset identifies as ${identity.code}.`);
  const result=await normalizeScmdbSource(source,identity,selected.url,selected.selection);
  const previousActive=Number(existing?.activeMissionCount||0),current=result.snapshot.activeMissionCount;
  if(previousActive>=MIN_ACTIVE&&current<previousActive*0.55&&!ALLOW_LARGE_DROP)throw new Error(`Active contract count dropped from ${previousActive} to ${current}; set ALLOW_LARGE_DROP=true only after review.`);
  return result;
}
async function synchronizeScmdbMirrors(existing, firstError){
  if(!SCMDB_MIRROR_URLS.length)throw firstError||new Error('No SCMDB mirrors configured.');
  const errors=[];
  for(const url of SCMDB_MIRROR_URLS){
    try{
      const source=await readJsonSource(url,90_000);const identity=datasetIdentity(source,url)||parseIdentity(url);
      if(!identity||identity.channel!==TARGET_CHANNEL||(PATCH_OVERRIDE&&!samePatch(identity.patch,PATCH_OVERRIDE)))throw new Error(`Mirror ${url} is not the requested ${TARGET_CHANNEL} dataset.`);
      const result=await normalizeScmdbSource(source,identity,url,'configured SCMDB mirror');
      const previousActive=Number(existing?.activeMissionCount||0),current=result.snapshot.activeMissionCount;
      if(previousActive>=MIN_ACTIVE&&current<previousActive*0.55&&!ALLOW_LARGE_DROP)throw new Error(`Mirror active count dropped from ${previousActive} to ${current}.`);
      result.snapshot.source='SCMDB public mission data mirror';result.snapshot.isFallback=true;result.snapshot.fallbackReason=String(firstError?.message||firstError||'SCMDB primary unavailable');
      result.status.status='current-scmdb-mirror';result.status.source='SCMDB mirror';return result;
    }catch(error){errors.push(error);}
  }
  throw new AggregateError(errors,'All configured SCMDB mirrors failed.');
}

function collectionRows(payload){if(Array.isArray(payload))return payload;if(Array.isArray(payload?.data))return payload.data;for(const key of ['missions','contracts','records','results','items'])if(Array.isArray(payload?.[key]))return payload[key];return findMissionArray(payload);}
function paginationNumber(payload,paths){for(const pathText of paths){let value=payload;for(const part of pathText.split('.'))value=value&&typeof value==='object'?value[part]:undefined;const number=Number(value);if(Number.isFinite(number)&&number>=0)return number;}return 0;}
async function discoverWikiIdentity(){
  try{
    const base=new URL(WIKI_VERSIONS_URL);let payload;
    if(base.protocol==='file:')payload=await readJsonSource(base.href);else{base.searchParams.set('filter[channel]',TARGET_CHANNEL.toLowerCase());base.searchParams.set('page[size]','200');base.searchParams.set('sort','-released_at');payload=await readJsonSource(base.href,45_000);}
    const candidates=collectionRows(payload).map((row,index)=>({row,identity:identityFromEntry(row,String(index))})).filter(({identity})=>identity?.channel===TARGET_CHANNEL&&(!PATCH_OVERRIDE||samePatch(identity.patch,PATCH_OVERRIDE))).sort(compareDataset);
    if(candidates.length)return candidates[0].identity;
  }catch(error){console.warn(`Wiki game-version discovery failed: ${error?.message||error}`);}
  const fallback=parseIdentity(KNOWN_LIVE_VERSION);
  if(fallback&&fallback.channel===TARGET_CHANNEL&&(!PATCH_OVERRIDE||samePatch(fallback.patch,PATCH_OVERRIDE)))return fallback;
  throw new Error(`Star Citizen Wiki did not return a ${PATCH_OVERRIDE||'current'} ${TARGET_CHANNEL} game version and no matching known fallback is configured.`);
}
async function fetchWikiCollection(baseUrl, identity, {versioned=true,maxPages=100}={}){
  const base=new URL(baseUrl);
  if(base.protocol==='file:'){const payload=await readJsonSource(base.href);return {rows:collectionRows(payload).map(flattenRecord),meta:payload?.meta||payload?.metadata||{}};}
  const rows=[],seen=new Set();let firstMeta={};
  for(let page=1;page<=maxPages;page+=1){
    const url=new URL(base.href);if(versioned)url.searchParams.set('version',identity.code);url.searchParams.set('page[size]',String(PAGE_SIZE));url.searchParams.set('page[number]',String(page));if(/\/missions(?:\?|$)/.test(url.pathname))url.searchParams.set('filter[grouped]','false');
    const payload=await readJsonSource(url.href,90_000);if(page===1)firstMeta=payload?.meta||payload?.metadata||{};
    const batch=collectionRows(payload).map(flattenRecord);let added=0;
    batch.forEach((row,index)=>{const key=String(row?.uuid??row?.id??row?.guid??row?.code??row?.debugName??row?.debug_name??`${page}:${index}`);if(!seen.has(key)){seen.add(key);rows.push(row);added+=1;}});
    const meta=payload?.meta||payload?.metadata||{};
    const last=paginationNumber(meta,['last_page','lastPage','total_pages','totalPages','pagination.last_page','pagination.lastPage','pagination.total_pages','pagination.totalPages','page.last']);
    const total=paginationNumber(meta,['total','total_count','totalCount','pagination.total','pagination.total_count','pagination.totalCount','page.total']);
    if(!batch.length||!added)break;if(last&&page>=last)break;if(total&&rows.length>=total)break;
    // No explicit pagination? Keep requesting sequential pages until an empty/repeated page.
  }
  return {rows,meta:firstMeta};
}
function buildFactionDictionary(rows){const factions={};for(const row of rows){const faction=row?.faction;if(faction&&typeof faction==='object'){const id=String(faction.guid??faction.uuid??faction.id??row?.factionGuid??row?.faction_guid??'').trim();if(id)factions[id]=clone(faction);}}return factions;}
async function fetchWikiFactions(identity,missions){
  const fromMissions=buildFactionDictionary(missions);
  try{
    const {rows}=await fetchWikiCollection(WIKI_FACTIONS_URL,identity,{versioned:false,maxPages:30});
    const fromEndpoint=normalizeDictionary(rows);return {...fromEndpoint,...fromMissions};
  }catch(error){console.warn(`Wiki faction enrichment failed: ${error?.message||error}`);return fromMissions;}
}
async function synchronizeWikiFallback(upstreamError){
  const identity=await discoverWikiIdentity();console.warn(`SCMDB unavailable; building ${identity.code} fallback from Star Citizen Wiki.`);
  const {rows,meta}=await fetchWikiCollection(WIKI_MISSIONS_URL,identity,{versioned:true,maxPages:100});
  if(rows.length<WIKI_MIN_TOTAL)throw new Error(`Star Citizen Wiki returned only ${rows.length} missions; expected at least ${WIKI_MIN_TOTAL} for a complete fallback.`);
  const missions=rows.map(row=>({...row,gameVersion:identity.code,legacyContract:Boolean(row?.legacyContract)}));
  const factions=await fetchWikiFactions(identity,missions);const namedFactions=new Set(missions.map(row=>readableFactionName(row?.faction)||row?.factionName).filter(Boolean));
  const fetchedAt=new Date().toISOString(),sourceFingerprint=fingerprint({identity:identity.code,missions});
  const parity={semantics:'Wiki ungrouped current-version mission rows (SCMDB unavailable)',activeContracts:missions.length,legacyContracts:0,totalContracts:missions.length,factionDictionaryCount:Object.keys(factions).length,namedFactionCount:namedFactions.size,scmdbReferenceTotal:SCMDB_REFERENCE_TOTAL||null,scmdbParityAvailable:false};
  return {
    snapshot:{schema:'celestial-nexus.scmdb-missions.v7',source:'Star Citizen Wiki mission API fallback',sourceUrl:WIKI_MISSIONS_URL,versionsUrl:WIKI_VERSIONS_URL,sourceFingerprint,isFallback:true,fallbackReason:String(upstreamError?.message||upstreamError||'SCMDB unavailable'),fetchedAt,targetPatch:identity.patch,targetChannel:TARGET_CHANNEL,gameVersion:identity.code,patchVerified:true,verificationMethod:'Current channel/build discovered from Star Citizen Wiki; ungrouped mission pages fetched sequentially until pagination exhaustion after SCMDB was unavailable.',missionCount:missions.length,activeMissionCount:missions.length,legacyMissionCount:0,factionCount:namedFactions.size,scmdbParity:parity,factions,fields:fieldInventory(missions),apiMeta:meta,missions},
    status:{status:'current-wiki-fallback',source:'Star Citizen Wiki',sourceUrl:WIKI_MISSIONS_URL,versionsUrl:WIKI_VERSIONS_URL,patch:identity.patch,channel:TARGET_CHANNEL,gameVersion:identity.code,fetchedAt,activeCount:missions.length,legacyCount:0,totalCount:missions.length,factionCount:namedFactions.size,parity,fingerprint:sourceFingerprint,upstreamError:String(upstreamError?.message||upstreamError||'')}
  };
}
async function preserveUsableSnapshot(existing,scmdbError,wikiError){
  if(!isUsableExisting(existing))return false;
  const identity=parseIdentity(existing?.gameVersion)||parseIdentity(existing?.sourceUrl)||{patch:existing?.targetPatch||PATCH_OVERRIDE||'',channel:existing?.targetChannel||TARGET_CHANNEL,code:existing?.gameVersion||'unknown'};
  console.warn(`All live mission sources unavailable; preserving usable ${identity.code} snapshot with ${existingMissionCount(existing)} records.`);
  await writeStatus({status:'stale-all-upstreams-unavailable',source:existing.source||'Saved mission snapshot',sourceUrl:existing.sourceUrl||'',versionsUrl:existing.versionsUrl||VERSIONS_URL,patch:identity.patch,channel:identity.channel,gameVersion:identity.code,fetchedAt:existing.fetchedAt||null,activeCount:Number(existing.activeMissionCount||existingMissionCount(existing)),legacyCount:Number(existing.legacyMissionCount||0),totalCount:Number(existing.missionCount||existingMissionCount(existing)),factionCount:Number(existing.factionCount||0),parity:existing.scmdbParity||null,fingerprint:existing.sourceFingerprint||'',lastError:`SCMDB: ${String(scmdbError?.message||scmdbError)} | Wiki: ${String(wikiError?.message||wikiError)}`});return true;
}

async function main(){
  const existing=await readExistingSnapshot();let scmdbError;
  try{const result=await synchronizeScmdb(existing);await writeSnapshot(result.snapshot);await writeStatus(result.status);console.log(`Saved ${result.snapshot.missionCount} SCMDB rows (${result.snapshot.activeMissionCount} active + ${result.snapshot.legacyMissionCount} legacy) and ${result.snapshot.factionCount} named factions for ${result.snapshot.gameVersion}.`);return;}catch(error){scmdbError=error;console.warn(`SCMDB synchronization failed: ${error?.message||error}`);}
  if(SCMDB_MIRROR_URLS.length){try{const result=await synchronizeScmdbMirrors(existing,scmdbError);await writeSnapshot(result.snapshot);await writeStatus(result.status);console.log(`Saved ${result.snapshot.missionCount} rows from SCMDB mirror.`);return;}catch(error){scmdbError=new AggregateError([scmdbError,error].filter(Boolean),'SCMDB primary and mirrors failed');console.warn(error?.message||error);}}
  let wikiError;
  try{const result=await synchronizeWikiFallback(scmdbError);await writeSnapshot(result.snapshot);await writeStatus(result.status);console.log(`Saved ${result.snapshot.missionCount} current Wiki fallback missions and ${result.snapshot.factionCount} named factions (${result.snapshot.gameVersion}).`);return;}catch(error){wikiError=error;console.warn(`Star Citizen Wiki fallback failed: ${error?.message||error}`);}
  if(await preserveUsableSnapshot(existing,scmdbError,wikiError))return;
  throw new AggregateError([scmdbError,wikiError].filter(Boolean),'No usable Contract Finder mission dataset could be synchronized or preserved.');
}

await main();
