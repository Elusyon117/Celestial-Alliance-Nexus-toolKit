#!/usr/bin/env node
import { readFile, writeFile, stat, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const indexPath=path.join(ROOT,'index.html');
const reportPath=path.join(ROOT,'docs/validation-report.json');
const index=await readFile(indexPath,'utf8');
const checks=[];
const check=(name,ok,detail,severity='error')=>checks.push({name,ok:Boolean(ok),severity,detail:String(detail||'')});

const version=(index.match(/<meta[^>]+name=["']nexus-version["'][^>]+content=["']([^"']+)/i)||index.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']nexus-version/i)||[])[1];
check('version-meta',version==='1.8.1',version||'missing');
check('index-size',Buffer.byteLength(index)<7_000_000,`${Buffer.byteLength(index)} bytes`,'warning');

// Ignore JavaScript/CSS source text; only IDs on the static document tree count here.
const staticMarkup=index
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, match => match.replace(/>[\s\S]*<\/script>/i, '></script>'))
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, match => match.replace(/>[\s\S]*<\/style>/i, '></style>'));
const ids=[...staticMarkup.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
check('unique-dom-ids',duplicates.length===0,duplicates.join(', ')||'all unique');

const scripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let syntaxErrors=[];
for(let i=0;i<scripts.length;i++){
  const attrs=scripts[i][1], code=scripts[i][2];
  if (/\bsrc\s*=/.test(attrs) || /type=["'](?:application\/ld\+json|importmap)["']/.test(attrs)) continue;
  try { new vm.Script(code,{filename:`index-inline-${i+1}.js`}); }
  catch(error){ syntaxErrors.push(`${i+1}: ${error.message}`); }
}
check('inline-script-syntax',syntaxErrors.length===0,syntaxErrors.join('\n')||`${scripts.length} script tags checked`);

const required=[
  'manifest.webmanifest','sw.js','icon-192.png','icon-512.png','icons/icon-192.png','icons/icon-512.png',
  'data/scmdb-missions-live.json','data/scmdb-missions-live.js','data/game-data-status.json','data/roster.json',
  'data/mrkraken-global.ini','data/mrkraken-release.json','scripts/sync-scmdb-missions.mjs','scripts/audit-patch-data.mjs'
];
const missing=[];
for(const rel of required) try{await access(path.join(ROOT,rel));}catch{missing.push(rel)}
check('required-files',missing.length===0,missing.join(', ')||`${required.length} required files found`);

for(const rel of ['data/scmdb-missions-live.json','data/game-data-status.json','data/roster.json','data/mrkraken-release.json','manifest.webmanifest']){
  try{JSON.parse(await readFile(path.join(ROOT,rel),'utf8'));check(`json:${rel}`,true,'valid')}catch(error){check(`json:${rel}`,false,error.message)}
}

const localMarkup=[...index.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)[^"']*["']/g)].map(m=>m[1].replace(/^\.\//,''));
const missingMarkup=[];
for(const rel of [...new Set(localMarkup)]) try{await access(path.join(ROOT,rel));}catch{missingMarkup.push(rel)}
check('local-markup-references',missingMarkup.length===0,missingMarkup.join(', ')||`${new Set(localMarkup).size} local markup references resolved`);

const errors=checks.filter(c=>!c.ok&&c.severity==='error');
const warnings=checks.filter(c=>!c.ok&&c.severity==='warning');
const report={schema:'celestial-nexus.validation.v1',generatedAt:new Date().toISOString(),status:errors.length?'failed':warnings.length?'passed-with-warnings':'passed',errors:errors.length,warnings:warnings.length,metrics:{bytes:Buffer.byteLength(index),lines:index.split(/\r?\n/).length,ids:ids.length,scriptTags:scripts.length},checks};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
