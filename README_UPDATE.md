# Celestial Nexus repository update — real ship artwork only

Generated: 2026-07-09T19:59:11Z

This corrected package **removes the generated placeholder ship-cover system** from the previous all-ship-image ZIP.

It keeps only actual artwork files that were already available/detectable from the toolkit package:

- PYAM Executive ship reward artwork
- Wikelo Polaris artwork
- Star Citizen Wiki ship cover artwork that was already resolved locally
- Existing embedded/remote images extracted from the toolkit

For ship selections that do not yet have a real local artwork file, the toolkit keeps using the original live/remote artwork flow and the service worker caches those images after the first successful load. This avoids showing fake/generated “ship name” cards.

## Important cleanup if you copied the previous all-ship-image ZIP

Before committing, delete this folder from your repo if it exists:

```text
assets/images/ships/catalog/
```

That folder contained the generated placeholder covers. It should **not** be committed.

You should also replace:

```text
assets/images/ships/ship-image-manifest.json
index.html
sw.js
```

with the versions from this ZIP.


---

# Celestial Nexus Toolkit repository update package

Built from `celestial_nexus_toolkit_optimized_smooth_module_identities.html`.

## What is included

- `index.html` — optimized single-page toolkit with cleaned module pages, static background, smooth hub card motion, and restored module color identity.
- `assets/images/embedded/` — 28 images extracted from base64 data URIs so the browser can cache them as normal files.
- `assets/images/remote/` — 7 literal remote images downloaded locally and converted/downscaled to WebP where useful.
- `assets/images/*manifest.json` — source maps and hashes for the bundled images.
- `data/scmdb-missions-live.js` and `data/scmdb-missions-live.json` — current repository SCMDB mission snapshot kept bundled because the app references it directly.
- `assets/wikelo/` — Wikelo artwork/reference images that the module already references directly.
- `manifest.webmanifest`, `sw.js`, root icons, and `icons/` — PWA/cache files needed by the HTML.
- `.nojekyll` — keeps GitHub Pages from applying Jekyll processing.

## Performance changes in this package

- Main HTML shrank from 5.88 MB to 3.16 MB by externalizing embedded images.
- Downloaded remote image originals total 26.34 MB; optimized bundled copies total 0.59 MB.
- The service worker pre-caches the app shell and local image assets, then runtime-caches data files, fonts, and dynamic remote images after first load. The large SCMDB data files are included in the ZIP but are not pre-cached during service-worker install.
- The SCMDB script is loaded with `defer` to avoid blocking initial document parsing.
- Extra CSS containment/content-visibility hints remain scoped so visuals stay intact.

## Upload steps

1. Extract this ZIP locally.
2. Copy the extracted contents into the root of your GitHub repository.
3. Commit and push.
4. After deploy, hard-refresh the site once, or unregister the previous service worker if the old page stays cached.

## Notes

The repository already contains `data/roster.json`; this package does not overwrite it because it is organization-specific roster data. Keep that file in place.

Some future images may still come from live APIs or search results. Those cannot be known ahead of time, so the included service worker caches them the first time the browser sees them.

## Real ship artwork bundle

This package includes a dedicated local ship image folder:

`assets/images/ships/`

It contains 12 known/bundled ship images used by the toolkit, including the PYAM Executive reward ships, Polaris Wikelo artwork, and the Star Citizen Wiki ship-cover images for Golem, Sabre Peregrine, Sabre Firebird, Asgard, F7C-M Super Hornet Mk II, and A2 Hercules Starlifter.

`index.html` now points those known ship image references at `assets/images/ships/`, and `sw.js` pre-caches that folder for faster repeat loads.

Note: ships/images that only appear later through live API/search results cannot be fully known in advance. Those are still cached by the service worker after the first time they load.
