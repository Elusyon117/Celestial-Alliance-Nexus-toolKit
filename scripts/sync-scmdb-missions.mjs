#!/usr/bin/env node
/**
 * Discovers SCMDB's public mission data and writes a complete local snapshot.
 * The crawler preserves every mission field. Set SCMDB_MISSIONS_URL to an exact
 * JSON endpoint when SCMDB publishes one; otherwise it discovers HTML/JS/JSON links.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outJson=path.join(root,'data','scmdb-missions-live.json');
const outJs=path.join(root,'data','scmdb-missions-live.js');
const start=['https://scmdb.net/'];
if(process.env.SCMDB_MISSIONS_URL)start.unshift(process.env.SCMDB_MISSIONS_URL);
start.push('https://scmdb.net/data/versions.json','https://scmdb.net/data/manifest.json','https://scmdb.net/data/index.json','https://scmdb.net/data/missions.json','https://scmdb.net/data/missions-live.json','https://scmdb.net/data/contracts.json','https://scmdb.net/api/missions','https://scmdb.net/api/contracts');
const queue=[...new Set(start)],seen=new Set();let best=null,bestScore=-1,bestUrl='';const maxRequests=55;
function scoreArray(a){if(!Array.isArray(a)||!a.length)return-1;let s=Math.min(a.length,5000);for(const o of a.slice(0,15)){if(!o||typeof o!=='object')continue;for(const k of ['title','name','description','debug_name','mission_giver','reward_min','reward_scope','reputation_gained','blueprints','faction','uuid'])if(k in o)s+=18}return s}
function findMissionArray(payload){let found=[],score=-1;const walked=new Set();function walk(v,d=0){if(d>8||v==null||typeof v!=='object'||walked.has(v))return;walked.add(v);if(Array.isArray(v)){const n=scoreArray(v);if(n>score){found=v;score=n}for(const x of v.slice(0,40))walk(x,d+1);return}for(const [k,x]of Object.entries(v)){if(['missions','contracts','records','results','data'].includes(k.toLowerCase())&&Array.isArray(x)){const n=scoreArray(x)+50;if(n>score){found=x;score=n}}walk(x,d+1)}}walk(payload);return{rows:found,score}}
function addUrl(base,value){if(typeof value!=='string'||value.length>500)return;const clean=value.replaceAll('\\/','/');if(!/(mission|contract|version|manifest|index|data|\.json)/i.test(clean))return;try{const u=new URL(clean,base);if((u.hostname==='scmdb.net'||u.hostname.endsWith('.supabase.co'))&&!seen.has(u.href))queue.push(u.href)}catch{}}
function discover(base,text){for(const match of text.matchAll(/(?:https?:\\?\/\\?\/[^"'`\\s)]+|\/[A-Za-z0-9_./?=&%{}-]+(?:\.json|\.js)(?:\?[^"'`\\s)]*)?)/g))addUrl(base,match[0]);for(const match of text.matchAll(/["'`]([^"'`]*(?:mission|contract|version|manifest|data)[^"'`]*)["'`]/gi))addUrl(base,match[1])}
function discoverJson(base,v,d=0){if(d>7||v==null)return;if(typeof v==='string'){addUrl(base,v);return}if(Array.isArray(v)){for(const x of v.slice(0,200))discoverJson(base,x,d+1);return}if(typeof v==='object')for(const x of Object.values(v))discoverJson(base,x,d+1)}
for(let i=0;queue.length&&seen.size<maxRequests;i++){
 const url=queue.shift();if(seen.has(url))continue;seen.add(url);process.stdout.write(`Checking ${url}\n`);
 try{const r=await fetch(url,{headers:{Accept:'application/json,text/javascript,text/html;q=0.9,*/*;q=0.8','User-Agent':'Celestial-Nexus-SCMDB-Sync/1.0'}});if(!r.ok)continue;const text=await r.text();const ct=r.headers.get('content-type')||'';let data=null;if(ct.includes('json')||/^\s*[\[{]/.test(text)){try{data=JSON.parse(text)}catch{}}
 if(data){const found=findMissionArray(data);if(found.score>bestScore){best=found.rows;bestScore=found.score;bestUrl=url}discoverJson(url,data)}else discover(url,text);
 }catch(e){process.stderr.write(`  ${e.message}\n`)}
}
if(!best||best.length<5){console.error('No SCMDB mission array was discovered. Set repository variable SCMDB_MISSIONS_URL to SCMDB\'s current public JSON endpoint and re-run. Existing snapshot was left unchanged.');process.exit(2)}
const versions=best.map(x=>x?.game_version||x?.version||x?.patch).filter(Boolean);const version=versions.sort((a,b)=>versions.filter(x=>x===b).length-versions.filter(x=>x===a).length)[0]||'';
const payload={schema:'celestial-nexus.scmd-missions.v1',source:'SCMDB public mission data',sourceUrl:bestUrl,isFallback:false,fetchedAt:new Date().toISOString(),gameVersion:version,missionCount:best.length,fields:[...new Set(best.flatMap(x=>x&&typeof x==='object'?Object.keys(x):[]))].sort(),missions:best};
await fs.mkdir(path.dirname(outJson),{recursive:true});await fs.writeFile(outJson,JSON.stringify(payload,null,2)+'\n');await fs.writeFile(outJs,'window.NEXUS_SCMDB_MISSIONS_PAYLOAD = '+JSON.stringify(payload)+';\n');console.log(`Saved ${best.length} SCMDB missions from ${bestUrl}`);
