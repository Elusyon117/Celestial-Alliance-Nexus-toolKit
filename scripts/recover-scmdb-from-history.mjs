#!/usr/bin/env node
/**
 * Recover the newest verified SCMDB mission snapshot from repository history.
 *
 * The recovered payload is normalized to the current v1.8.0 schema before the
 * strict audit runs. Historical status counts are preserved when available.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const JSON_PATH = path.join(DATA_DIR, 'scmdb-missions-live.json');
const JS_PATH = path.join(DATA_DIR, 'scmdb-missions-live.js');
const STATUS_PATH = path.join(DATA_DIR, 'game-data-status.json');
const TARGET_PATCH = normalizePatch(process.env.MISSION_PATCH || '4.9.0');
const TARGET_CHANNEL = String(process.env.MISSION_CHANNEL || 'LIVE').trim().toUpperCase();
const MIN_MISSIONS = Math.max(5, Number(process.env.MIN_MISSION_COUNT || 100));
const SOURCE_PATH = 'data/scmdb-missions-live.json';
const STATUS_SOURCE_PATH = 'data/game-data-status.json';

function normalizePatch(value = '') {
  const match = String(value).match(/(?:^|\D)(\d+)\.(\d+)(?:\.(\d+))?/);
  return match ? `${Number(match[1])}.${Number(match[2])}.${Number(match[3] || 0)}` : '';
}

function normalizeChannel(value = '') {
  const match = String(value).toUpperCase().match(/\b(LIVE|EPTU|PTU)\b/);
  return match?.[1] || '';
}

function isInactive(row) {
  const explicitInactive = row?.inactive ?? row?.is_inactive ?? row?.isInactive
    ?? row?.unreleased ?? row?.is_unreleased ?? row?.isUnreleased
    ?? row?.legacy ?? row?.is_legacy ?? row?.isLegacy;
  if (explicitInactive === true || explicitInactive === 1 || explicitInactive === '1') return true;

  const explicitActive = row?.active ?? row?.is_active ?? row?.isActive
    ?? row?.enabled ?? row?.released ?? row?.isReleased;
  if (explicitActive === false || explicitActive === 0 || explicitActive === '0') return true;

  const status = String(
    row?.status ?? row?.state ?? row?.availability ?? row?.releaseStatus
    ?? row?.release_status ?? row?.publicationStatus ?? ''
  ).toLowerCase();
  return /inactive|disabled|deprecated|legacy|removed|unreleased|not[ _-]?released|archived|wip/.test(status);
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', options.quiet ? 'ignore' : 'pipe']
  });
}

function readAtCommit(commit, filePath) {
  try {
    return git(['show', `${commit}:${filePath}`], { quiet: true });
  } catch {
    return '';
  }
}

function parseJsonAtCommit(commit, filePath) {
  const text = readAtCommit(commit, filePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validatePayload(payload) {
  const missions = Array.isArray(payload?.missions) ? payload.missions : [];
  const patch = normalizePatch(payload?.targetPatch || payload?.gameVersion || payload?.meta?.targetPatch);
  const channel = normalizeChannel(payload?.targetChannel || payload?.gameVersion || payload?.meta?.targetChannel);
  const verified = payload?.patchVerified === true || payload?.meta?.patchVerified === true;
  return {
    valid: patch === TARGET_PATCH && channel === TARGET_CHANNEL && verified && missions.length >= MIN_MISSIONS,
    missions,
    patch,
    channel,
    verified
  };
}

function appendOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const escaped = String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
  execFileSync(
    'bash',
    ['-lc', `printf '%s=%s\\n' "$1" "$2" >> "$GITHUB_OUTPUT"`, 'bash', name, escaped],
    { cwd: ROOT, env: process.env, stdio: 'ignore' }
  );
}

function validHistoricalCounts(status, total) {
  const module = status?.modules?.contractFinder || {};
  const active = Number(module.activeCount);
  const legacy = Number(module.legacyCount);
  const declaredTotal = Number(module.totalCount);
  return Number.isFinite(active)
    && Number.isFinite(legacy)
    && active >= 0
    && legacy >= 0
    && active + legacy === total
    && (!Number.isFinite(declaredTotal) || declaredTotal === total)
    ? { activeCount: active, legacyCount: legacy }
    : null;
}

async function main() {
  const commits = git(['rev-list', '--all', '--', SOURCE_PATH], { quiet: true })
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);

  if (!commits.length) {
    console.error(`No historical revisions of ${SOURCE_PATH} were found.`);
    process.exitCode = 2;
    return;
  }

  let selected = null;
  for (const commit of commits) {
    const payload = parseJsonAtCommit(commit, SOURCE_PATH);
    if (!payload) continue;
    const check = validatePayload(payload);
    if (check.valid) {
      selected = {
        commit,
        payload,
        missions: check.missions,
        historicalStatus: parseJsonAtCommit(commit, STATUS_SOURCE_PATH)
      };
      break;
    }
  }

  if (!selected) {
    console.error(
      `No verified ${TARGET_PATCH} ${TARGET_CHANNEL} SCMDB snapshot with at least ${MIN_MISSIONS} missions exists in repository history.`
    );
    process.exitCode = 2;
    return;
  }

  const { commit, payload, missions, historicalStatus } = selected;
  const generatedAt = new Date().toISOString();
  const gameVersion = String(payload.gameVersion || `${TARGET_PATCH}-${TARGET_CHANNEL}`);
  const historicalCounts = validHistoricalCounts(historicalStatus, missions.length);
  const activeCount = historicalCounts?.activeCount ?? missions.filter(row => !isInactive(row)).length;
  const legacyCount = historicalCounts?.legacyCount ?? (missions.length - activeCount);

  // Historical snapshots predated the v1.8.0 strict audit and may not contain
  // missionCount/meta fields even though their mission records are valid.
  const normalizedPayload = {
    ...payload,
    schema: 'celestial-nexus.scmdb-missions.v2',
    source: payload.source || 'SCMDB snapshot recovered from repository history',
    sourceUrl: payload.sourceUrl || `git:${commit}`,
    gameVersion,
    targetPatch: TARGET_PATCH,
    targetChannel: TARGET_CHANNEL,
    patchVerified: true,
    isFallback: false,
    missionCount: missions.length,
    meta: {
      ...(payload.meta && typeof payload.meta === 'object' ? payload.meta : {}),
      status: 'current',
      missionCount: missions.length,
      targetPatch: TARGET_PATCH,
      targetChannel: TARGET_CHANNEL,
      patchVerified: true,
      restoredFromCommit: commit,
      restoredAt: generatedAt
    },
    missions
  };

  const jsonText = `${JSON.stringify(normalizedPayload)}\n`;
  const fingerprint = createHash('sha256').update(jsonText).digest('hex');
  const status = {
    schema: 'celestial-nexus.game-data-status.v1',
    generatedAt,
    detectedPatch: TARGET_PATCH,
    detectedChannel: TARGET_CHANNEL,
    modules: {
      contractFinder: {
        status: 'current',
        source: 'Verified SCMDB snapshot recovered from repository history',
        sourceUrl: `git:${commit}`,
        versionsUrl: 'https://scmdb.net/data/versions.json',
        patch: TARGET_PATCH,
        channel: TARGET_CHANNEL,
        gameVersion,
        fetchedAt: payload.fetchedAt || historicalStatus?.modules?.contractFinder?.fetchedAt || generatedAt,
        restoredAt: generatedAt,
        restoredFromCommit: commit,
        activeCount,
        legacyCount,
        totalCount: missions.length,
        fingerprint,
        lastError: ''
      }
    }
  };

  await mkdir(DATA_DIR, { recursive: true });
  await Promise.all([
    writeFile(JSON_PATH, jsonText),
    writeFile(JS_PATH, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD=${JSON.stringify(normalizedPayload)};\n`),
    writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`)
  ]);

  appendOutput('recovered', 'true');
  appendOutput('commit', commit);
  appendOutput('mission_count', missions.length);
  appendOutput('active_count', activeCount);
  appendOutput('legacy_count', legacyCount);

  console.log(
    `Recovered and normalized ${missions.length} verified SCMDB missions `
    + `(${activeCount} active, ${legacyCount} legacy) from ${commit}.`
  );
}

await main();
