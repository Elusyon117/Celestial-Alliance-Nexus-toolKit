#!/usr/bin/env node
/**
 * Refresh data/live-build.json from the Star Citizen Wiki default game-version endpoint.
 *
 * This file is the repository-side authority consumed by index.html. It deliberately
 * preserves the previous valid LIVE record on temporary upstream failures so a short
 * outage does not make every patch-sensitive browser module unusable.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'data', 'live-build.json');
const DEFAULT_URL = 'https://api.star-citizen.wiki/api/game-versions/default';
const SOURCE_URL = process.env.LIVE_BUILD_URL || DEFAULT_URL;
const TIMEOUT_MS = Number(process.env.LIVE_BUILD_TIMEOUT_MS || 15_000);

function identity(value, channelHint = 'LIVE') {
  const text = String(value ?? '').trim();
  const full = text.match(/(\d+(?:\.\d+){1,3})[._-](live|ptu|eptu)(?:[._-](\d+))?/i);
  if (full) {
    const patch = full[1];
    const channel = full[2].toUpperCase();
    const build = full[3] || '';
    return { patch, channel, build, code: `${patch}-${channel}${build ? `.${build}` : ''}` };
  }
  const patch = text.match(/\b(\d+(?:\.\d+){1,3})\b/)?.[1];
  return patch ? { patch, channel: channelHint, build: '', code: `${patch}-${channelHint}` } : null;
}

function parseDefaultVersion(payload) {
  const seen = new Set();
  const candidates = [];

  function add(raw, channel = '') {
    const id = identity(raw, String(channel || 'LIVE').toUpperCase() === 'LIVE' ? 'LIVE' : 'LIVE');
    if (id) candidates.push(id);
  }

  function walk(value, depth = 0) {
    if (value == null || depth > 8) return;
    if (typeof value !== 'object') {
      if (/\b(?:LIVE|PTU|EPTU)\b/i.test(String(value)) || /\b4\.\d+/i.test(String(value))) add(value);
      return;
    }
    if (seen.has(value)) return;
    seen.add(value);

    const channel = value.channel ?? value.attributes?.channel ?? value.environment ?? value.branch;
    for (const key of ['code', 'name', 'version', 'game_version', 'gameVersion', 'label', 'build_version']) {
      if (value[key] != null) add(value[key], channel);
      if (value.attributes?.[key] != null) add(value.attributes[key], channel);
    }
    for (const nested of Object.values(value)) walk(nested, depth + 1);
  }

  walk(payload);
  const live = candidates.filter(row => row.channel === 'LIVE');
  live.sort((a, b) => {
    const pa = a.patch.split('.').map(Number), pb = b.patch.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
      const delta = (pb[i] || 0) - (pa[i] || 0);
      if (delta) return delta;
    }
    return Number(b.build || 0) - Number(a.build || 0);
  });
  return live[0] || null;
}

async function readExisting() {
  try {
    const value = JSON.parse(await fs.readFile(OUTPUT, 'utf8'));
    const id = identity(value.code || `${value.patch || ''}-${value.channel || 'LIVE'}.${value.build || ''}`);
    if (id?.channel === 'LIVE' && id.patch) return { ...value, ...id };
  } catch (_) {}
  return null;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Celestial-Nexus-Game-Data-Sync/1.0' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const existing = await readExisting();
  try {
    const payload = await fetchJson(SOURCE_URL);
    const id = parseDefaultVersion(payload);
    if (!id || id.channel !== 'LIVE' || !id.patch) throw new Error('Default game-version response did not contain a LIVE identity.');

    const now = new Date().toISOString();
    const output = {
      schema: 'celestial-nexus.live-build.v1',
      patch: id.patch,
      channel: 'LIVE',
      build: id.build,
      code: id.code,
      source: 'Star Citizen Wiki default game version',
      sourceUrl: SOURCE_URL,
      verifiedAt: now,
      generatedAt: now,
    };
    await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
    await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`Current LIVE build: ${output.code}`);
  } catch (error) {
    if (existing) {
      console.warn(`LIVE build refresh failed (${error?.message || error}); preserving ${existing.code}.`);
      return;
    }
    throw error;
  }
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
