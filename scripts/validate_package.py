#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'index.html', '404.html', 'manifest.webmanifest', 'sw.js', '.nojekyll',
    'icon-192.png', 'icon-512.png', 'data/roster.json',
    'data/scmdb-missions-live.json', 'data/scmdb-missions-live.js',
    'assets/wikelo/ana-endro.webp', 'assets/wikelo/bokto.webp',
    'assets/wikelo/boomtube-clanguard.webp', 'assets/wikelo/geist-snow.webp',
    'assets/wikelo/killshot-dominion-reference.webp', 'assets/wikelo/monde-crimson-reference.svg',
    'assets/wikelo/palatino-mark-1.webp', 'assets/wikelo/polaris-bit-reference.webp',
    'assets/wikelo/r97-crimson-reference.webp', 'assets/wikelo/strata-heatwave.webp'
]

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

errors = []
for rel in REQUIRED:
    if not (ROOT / rel).is_file():
        errors.append(f'Missing required file: {rel}')

for rel in ['manifest.webmanifest', 'data/roster.json', 'data/scmdb-missions-live.json', 'PACKAGE_REPORT.json']:
    try:
        json.loads((ROOT / rel).read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'Invalid JSON: {rel}: {exc}')

html = (ROOT / 'index.html').read_text(encoding='utf-8')
local_paths = set(re.findall(r"[\"'`](\./(?:assets|data)/[^\"'`?#]+|\./(?:manifest\.webmanifest|sw\.js))[\"'`]", html))
for rel in sorted(local_paths):
    normalized = rel[2:]
    target = ROOT / normalized
    exists = target.is_dir() if rel.endswith('/') else target.is_file()
    if not exists:
        errors.append(f'HTML references missing local path: {rel}')

sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
for rel in re.findall(r'["\'](\./[^"\']+)["\']', sw):
    if rel == './':
        continue
    normalized = rel[2:]
    if not (ROOT / normalized).is_file():
        errors.append(f'Service worker references missing file: {rel}')

sums_file = ROOT / 'SHA256SUMS.txt'
if sums_file.exists():
    for line in sums_file.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        expected, rel = line.split('  ', 1)
        path = ROOT / rel
        if not path.is_file():
            errors.append(f'Checksum file missing: {rel}')
        elif sha(path) != expected:
            errors.append(f'Checksum mismatch: {rel}')

if errors:
    print('VALIDATION FAILED')
    for error in errors:
        print(f'- {error}')
    sys.exit(1)

print('VALIDATION PASSED')
print(f'Required runtime files: {len(REQUIRED)}')
print(f'HTML local dependencies checked: {len(local_paths)}')
