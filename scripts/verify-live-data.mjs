#!/usr/bin/env node
import fs from 'node:fs/promises';
const strict=process.argv.includes('--strict');
const normalize=v=>String(v||'').match(/\d+(?:\.\d+){1,3}/)?.[0]?.split('.').map(Number).concat([0,0,0,0]).slice(0,4).join('.')||'';
const same=(a,b)=>normalize(a)===normalize(b);
const live=JSON.parse(await fs.readFile('data/live-build.json','utf8'));
let status={}; try{status=JSON.parse(await fs.readFile('data/game-data-status.json','utf8'))}catch(_){}
const contract=status?.modules?.contractFinder||{};
const reported=contract.patch||contract.gameVersion||'';
const current=Boolean(reported)&&same(reported,live.patch)&&contract.patchVerified!==false&&contract.status!=='stale-upstream-unavailable';
const report={schema:'celestial-nexus.live-data-verification.v1',checkedAt:new Date().toISOString(),liveBuild:live.code,livePatch:live.patch,modules:{contractFinder:{current,reportedPatch:reported||null,gameVersion:contract.gameVersion||null,status:contract.status||'unknown',reason:current?'Matches authoritative LIVE patch':reported?`Contract snapshot is ${reported}; authoritative LIVE is ${live.patch}`:'Contract snapshot did not report a patch'}}};
await fs.writeFile('data/live-data-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(strict&&!current)process.exitCode=2;
