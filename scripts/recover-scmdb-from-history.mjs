#!/usr/bin/env node
/**
 * Recover the newest verified SCMDB mission snapshot from repository history.
 *
 * This is intentionally local-only: it does not contact SCMDB or GitHub APIs.
 * It is used when the current branch contains the v1.8.0 bootstrap files and
 * the upstream SCMDB endpoint or a temporary release asset is unavailable.
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

function normalizePatch(value = '') {
  const match = String(value).match(/(?:^|\D)(\d+)\.(\d+)(?:\.(\d+))?/);
  return match ? `${Number(match[1])}.${Number(match[2])}.${Number(match[3] || 0)}` : '';
}

function normalizeChannel(value = '') {
  const match = String(value).toUpperCase().match(/\b(LIVE|EPTU|PTU)\b/);
  return match?.[1] || '';
}

function isInactive(row) {
  const value = row?.active ?? row?.is_active ?? row?.enabled ?? row?.released ?? row?.isReleased;
  if (value === false || value === 0 || value === '0') return true;
  const status = String(row?.status ?? row?.state ?? row?.availability ?? '').toLowerCase();
  return /inactive|disabled|deprecated|legacy|removed|unreleased|archived/.test(status);
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
  const escaped = String(value).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  execFileSync('bash', ['-lc', `printf '%s=%s\\n' "$1" "$2" >> "$GITHUB_OUTPUT"`, 'bash', name, escaped], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore'
  });
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
    const text = readAtCommit(commit, SOURCE_PATH);
    if (!text) continue;
    try {
      const payload = JSON.parse(text);
      const check = validatePayload(payload);
      if (check.valid) {
        selected = { commit, payload, missions: check.missions };
        break;
      }
    } catch {
      // Ignore malformed historical revisions and continue searching backward.
    }
  }

  if (!selected) {
    console.error(`No verified ${TARGET_PATCH} ${TARGET_CHANNEL} SCMDB snapshot with at least ${MIN_MISSIONS} missions exists in repository history.`);
    process.exitCode = 2;
    return;
  }

  const { commit, payload, missions } = selected;
  const activeCount = missions.filter(row => !isInactive(row)).length;
  const legacyCount = missions.length - activeCount;
  const generatedAt = new Date().toISOString();
  const gameVersion = String(payload.gameVersion || `${TARGET_PATCH}-${TARGET_CHANNEL}`);
  const jsonText = `${JSON.stringify(payload)}\n`;
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
        fetchedAt: payload.fetchedAt || generatedAt,
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
    writeFile(JS_PATH, `window.NEXUS_SCMDB_MISSIONS_PAYLOAD=${JSON.stringify(payload)};\n`),
    writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`)
  ]);

  appendOutput('recovered', 'true');
  appendOutput('commit', commit);
  appendOutput('mission_count', missions.length);
  appendOutput('active_count', activeCount);
  console.log(`Recovered ${missions.length} verified SCMDB missions (${activeCount} active) from ${commit}.`);
}

await main();
