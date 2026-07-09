#!/usr/bin/env python3
"""Download any remaining literal remote image URLs found after bundling.
Run from repository root:
    python tools/cache_remaining_remote_images.py
This is optional; the service worker already runtime-caches dynamic images after first load.
"""
from pathlib import Path
import json, urllib.request, urllib.parse, hashlib, re
root = Path(__file__).resolve().parents[1]
report_file = root / 'assets/images/remaining-image-like-urls.json'
out = root / 'assets/images/remote-extra'
out.mkdir(parents=True, exist_ok=True)
urls = json.loads(report_file.read_text(encoding='utf-8')).get('urls', [])
report = []
for url in urls:
    try:
        parsed = urllib.parse.urlparse(url)
        ext = Path(parsed.path).suffix.lower() or '.jpg'
        if ext not in {'.png','.jpg','.jpeg','.webp','.gif','.svg'}:
            ext = '.jpg'
        name = re.sub(r'[^a-zA-Z0-9._-]+', '-', Path(parsed.path).stem)[:70] or 'remote-image'
        digest = hashlib.sha256(url.encode()).hexdigest()[:10]
        dest = out / f'{name}-{digest}{ext}'
        if not dest.exists():
            req = urllib.request.Request(url, headers={'User-Agent':'Celestial-Nexus-Toolkit/1.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                dest.write_bytes(response.read())
        report.append({'url': url, 'file': str(dest.relative_to(root)), 'status': 'saved'})
    except Exception as exc:
        report.append({'url': url, 'error': str(exc), 'status': 'failed'})
(root / 'assets/images/remaining-image-download-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(f'Processed {len(urls)} URLs')
