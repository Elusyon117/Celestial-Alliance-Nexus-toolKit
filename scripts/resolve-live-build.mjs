#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const writeIndex = process.argv.indexOf('--write');
const outFile = writeIndex >= 0 ? process.argv[writeIndex + 1] : 'data/live-build.json';
const githubOutput = args.has('--github-output');
const UA = 'Celestial-Nexus-Live-Build-Resolver/1.0 (+https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit)';

const URLS = {
  patchNotes: 'https://robertsspaceindustries.com/en/patch-notes',
  knownIssues: 'https://support.robertsspaceindustries.com/hc/en-us/articles/360056254754',
  loanerMatrix: 'https://support.robertsspaceindustries.com/hc/en-us/articles/360003093114-Loaner-Ship-Matrix',
  uex: 'https://api.uexcorp.uk/2.0/data_parameters',
  wiki: 'https://api.star-citizen.wiki/api/game-versions?filter%5Bchannel%5D=live&page%5Bsize%5D=50&sort=-released_at',
};

function patchParts(value) {
  return String(value || '').match(/\d+(?:\.\d+){1,3}/)?.[0]
    ?.split('.').map(Number).concat([0,0,0,0]).slice(0,4) || [0,0,0,0];
}
function comparePatch(a,b) {
  const aa=patchParts(a), bb=patchParts(b);
  for(let i=0;i<4;i++) if(aa[i]!==bb[i]) return aa[i]-bb[i];
  return 0;
}
function samePatch(a,b){ return comparePatch(a,b)===0; }
function identity(value, channelHint='LIVE') {
  const text=String(value||'');
  const full=text.match(/(\d+(?:\.\d+){1,3})[._-](live|ptu|eptu)(?:[._-](\d+))?/i);
  if(full){ const patch=full[1], channel=full[2].toUpperCase(), build=full[3]||''; return {patch,channel,build,code:`${patch}-${channel}${build?`.${build}`:''}`}; }
  const patch=text.match(/\b(\d+(?:\.\d+){1,3})\b/)?.[1];
  return patch ? {patch,channel:channelHint,build:'',code:`${patch}-${channelHint}`} : null;
}
function rows(payload){
  if(Array.isArray(payload)) return payload;
  if(Array.isArray(payload?.data)) return payload.data;
  if(Array.isArray(payload?.results)) return payload.results;
  if(payload?.data && typeof payload.data==='object') return [payload.data];
  return payload && typeof payload==='object' ? [payload] : [];
}
async function fetchRaw(url, type='text', timeoutMs=18000) {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(url,{headers:{'user-agent':UA,accept:type==='json'?'application/json':'text/html, text/plain;q=0.9, */*;q=0.8'},redirect:'follow',signal:controller.signal});
    if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return type==='json' ? await response.json() : await response.text();
  } finally { clearTimeout(timer); }
}
async function fetchOfficialText(url) {
  try { return {text:await fetchRaw(url,'text'), transport:'direct'}; }
  catch (directError) {
    try { return {text:await fetchRaw(`https://r.jina.ai/${url}`,'text',22000), transport:'Jina read-through'}; }
    catch (proxyError) { throw new Error(`direct: ${directError.message}; read-through: ${proxyError.message}`); }
  }
}
function highest(ids){ return ids.filter(Boolean).sort((a,b)=>comparePatch(b.patch,a.patch)||Number(b.build||0)-Number(a.build||0))[0]||null; }
function explicitLiveBuilds(text) {
  const ids=[];
  for(const match of String(text||'').matchAll(/(\d+(?:\.\d+){1,3})[._-]live[._-](\d+)/gi)) ids.push(identity(`${match[1]}-LIVE.${match[2]}`));
  return ids.filter(Boolean);
}
function firstCurrentAlphaTitle(text) {
  const source=String(text||'');
  for(const match of source.matchAll(/Star Citizen Alpha\s+(\d+(?:\.\d+){1,2})/gi)) {
    const context=source.slice(Math.max(0,(match.index||0)-80),(match.index||0)+match[0].length+120);
    if(/\b(?:EPTU|PTU|TECH\s+PREVIEW)\b/i.test(context)) continue;
    return identity(`${match[1]}-LIVE`);
  }
  return null;
}
function currentOfficialIdentity(text) {
  return highest(explicitLiveBuilds(text)) || firstCurrentAlphaTitle(text);
}
function extractUex(payload){
  for(const row of rows(payload)){ const id=identity(row?.game_version||row?.gameVersion||row?.version); if(id?.channel==='LIVE') return id; }
  return null;
}
function extractWiki(payload){
  const ids=[];
  for(const row of rows(payload)){
    const channel=String(row?.channel||row?.attributes?.channel||'').toUpperCase();
    const raw=row?.code||row?.name||row?.version||row?.game_version||row?.attributes?.code||row?.attributes?.name;
    const id=identity(raw, channel==='LIVE'?'LIVE':'LIVE');
    if(id && (id.channel==='LIVE'||channel==='LIVE')) ids.push(id);
  }
  return highest(ids);
}

const probes = await Promise.allSettled([
  fetchOfficialText(URLS.patchNotes),
  fetchOfficialText(URLS.knownIssues),
  fetchOfficialText(URLS.loanerMatrix),
  fetchRaw(URLS.uex,'json'),
  fetchRaw(URLS.wiki,'json'),
]);
const candidates=[]; const errors=[];
function add(id, source, authority, transport='direct') { if(id?.channel==='LIVE') candidates.push({...id,source,authority,transport}); }
if(probes[0].status==='fulfilled') add(currentOfficialIdentity(probes[0].value.text),URLS.patchNotes,'CIG',probes[0].value.transport); else errors.push(`CIG patch notes: ${probes[0].reason?.message}`);
if(probes[1].status==='fulfilled') add(currentOfficialIdentity(probes[1].value.text),URLS.knownIssues,'CIG',probes[1].value.transport); else errors.push(`CIG Known Issues: ${probes[1].reason?.message}`);
if(probes[2].status==='fulfilled') add(highest(explicitLiveBuilds(probes[2].value.text))||firstCurrentAlphaTitle(probes[2].value.text),URLS.loanerMatrix,'CIG',probes[2].value.transport); else errors.push(`CIG Loaner Matrix: ${probes[2].reason?.message}`);
if(probes[3].status==='fulfilled') add(extractUex(probes[3].value),URLS.uex,'UEX'); else errors.push(`UEX: ${probes[3].reason?.message}`);
if(probes[4].status==='fulfilled') add(extractWiki(probes[4].value),URLS.wiki,'Star Citizen Wiki'); else errors.push(`Wiki: ${probes[4].reason?.message}`);

const official=highest(candidates.filter(c=>c.authority==='CIG'));
const uex=highest(candidates.filter(c=>c.authority==='UEX'));
const wiki=highest(candidates.filter(c=>c.authority==='Star Citizen Wiki'));
let authority=official;
let verificationMethod='official CIG';
if(!authority && uex && wiki && samePatch(uex.patch,wiki.patch)) { authority=highest([uex,wiki]); verificationMethod='UEX + Star Citizen Wiki agreement'; }
if(!authority) throw new Error(`Unable to verify the current LIVE patch. ${errors.join(' | ')}`);

const matching=candidates.filter(c=>samePatch(c.patch,authority.patch));
const exact=highest(matching.filter(c=>c.build)) || authority;
const mismatches=candidates.filter(c=>!samePatch(c.patch,authority.patch)).map(c=>({source:c.source,reported:c.code,authority:c.authority}));
const result={
  schema:'celestial-nexus.live-build.v1',
  generatedAt:new Date().toISOString(),
  channel:'LIVE', patch:authority.patch, build:exact.build||'',
  code:exact.build?`${authority.patch}-LIVE.${exact.build}`:`${authority.patch}-LIVE`,
  verified:true, verificationMethod,
  sources:matching.map(({source,authority,transport,code})=>({source,authority,transport,code})),
  mismatches, errors,
};

await fs.mkdir(path.dirname(outFile),{recursive:true});
await fs.writeFile(outFile,JSON.stringify(result,null,2)+'\n');
console.log(`Current LIVE: ${result.code} (${verificationMethod})`);
if(mismatches.length) console.warn('Source version mismatches:',mismatches);
if(githubOutput && process.env.GITHUB_OUTPUT){
  await fs.appendFile(process.env.GITHUB_OUTPUT,[`patch=${result.patch}`,`code=${result.code}`,`build=${result.build}`,`verified=true`].join('\n')+'\n');
}
