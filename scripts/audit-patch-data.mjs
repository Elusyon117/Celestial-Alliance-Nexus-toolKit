#!/usr/bin/env node
/** Celestial Nexus v1.8.0 generated-data integrity audit. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  index: path.join(ROOT,'index.html'),
  payload: path.join(ROOT,'data/scmdb-missions-live.json'),
  status: path.join(ROOT,'data/game-data-status.json'),
  output: path.join(ROOT,'data/patch-audit.json')
};
const strict = /^(1|true|yes)$/i.test(String(process.env.STRICT_AUDIT || ''));
const readJson = async file => JSON.parse(await readFile(file,'utf8'));
const norm = value => {
  const m = String(value||'').match(/\b(\d+\.\d+(?:\.\d+)?)\b/);
  if (!m) return '';
  return m[1].split('.').length===2 ? `${m[1]}.0` : m[1];
};

const checks = [];
const check = (name, ok, detail, severity='error') => checks.push({name,ok:Boolean(ok),severity,detail:String(detail||'')});
let payload={}, status={}, index='';
try { [payload,status,index] = await Promise.all([readJson(files.payload),readJson(files.status),readFile(files.index,'utf8')]); }
catch (error) { check('required-files-readable',false,error.message); }

const missions = Array.isArray(payload?.missions) ? payload.missions : [];
const module = status?.modules?.contractFinder || {};
const payloadPatch = norm(payload?.targetPatch || payload?.gameVersion);
const statusPatch = norm(module?.patch || status?.detectedPatch || module?.gameVersion);
const payloadChannel = String(payload?.targetChannel || '').toUpperCase();
const statusChannel = String(module?.channel || status?.detectedChannel || '').toUpperCase();
check('payload-schema', payload?.schema === 'celestial-nexus.scmdb-missions.v2', payload?.schema || 'missing');
check('payload-patch-verified', payload?.patchVerified === true, `patchVerified=${payload?.patchVerified}`);
check('mission-count-minimum', missions.length >= 100, `missions=${missions.length}`);
check('mission-count-consistent', Number(payload?.missionCount) === missions.length, `declared=${payload?.missionCount}; actual=${missions.length}`);
check('status-count-consistent', Number(module?.totalCount) === missions.length, `status=${module?.totalCount}; actual=${missions.length}`);
check('patch-consistent', Boolean(payloadPatch && statusPatch && payloadPatch === statusPatch), `payload=${payloadPatch}; status=${statusPatch}`);
check('channel-consistent', Boolean(payloadChannel && statusChannel && payloadChannel === statusChannel), `payload=${payloadChannel}; status=${statusChannel}`);
check('status-current', module?.status === 'current', module?.status || 'missing', 'warning');
check('index-version-1.8.0', /name="nexus-version"[^>]*content="1\.8\.0"|content="1\.8\.0"[^>]*name="nexus-version"/.test(index), 'nexus-version meta');

const patchRefs = [...new Set((index.match(/\b4\.\d+(?:\.\d+)?\b/g)||[]).map(norm))].sort();
const staleRefs = patchRefs.filter(v => statusPatch && v !== statusPatch);
check('index-patch-reference-review', staleRefs.length === 0, staleRefs.length ? `Non-current patch strings: ${staleRefs.join(', ')}` : 'No stale 4.x strings detected', 'warning');

const errors = checks.filter(c => !c.ok && c.severity === 'error');
const warnings = checks.filter(c => !c.ok && c.severity === 'warning');
const report = {
  schema:'celestial-nexus.patch-audit.v1', generatedAt:new Date().toISOString(),
  status: errors.length ? 'failed' : warnings.length ? 'passed-with-warnings' : 'passed',
  patch: statusPatch || payloadPatch, channel: statusChannel || payloadChannel,
  missionCount: missions.length, errors: errors.length, warnings: warnings.length,
  patchReferences: patchRefs, checks
};
await writeFile(files.output, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (strict && errors.length) process.exitCode = 1;
