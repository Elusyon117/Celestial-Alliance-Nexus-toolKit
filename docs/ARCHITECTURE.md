# Architecture

## Application model

Celestial Nexus is a static, client-side progressive web application. The UI, datasets, calculations, storage logic, integrations, and export tools are primarily contained in one large `index.html` file.

There is no server-side code in this repository. Live modules call public third-party endpoints directly from the browser and must handle unavailable, rate-limited, changed, or CORS-restricted sources.

## Runtime files

| Path | Responsibility |
|---|---|
| `index.html` | Complete application UI, styles, module logic, embedded datasets, and external-source integrations |
| `manifest.webmanifest` | PWA identity, start URL, scope, colors, and install icons |
| `sw.js` | App-shell caching, navigation fallback, runtime cache updates, and old-cache cleanup |
| `.nojekyll` | Disables Jekyll processing for branch-based GitHub Pages deployment |
| `404.html` | Returns unknown GitHub Pages routes to the repository-site root |
| `data/roster.json` | Packaged organization roster fallback used when live synchronization is unavailable |
| `assets/wikelo/*` | Local reference artwork used by Wikelo trade cards |
| `icon-192.png`, `icon-512.png` | PWA icons |

## Persistence

The toolkit uses browser storage for many user-created values. Storage is scoped to the exact protocol, host, and path origin. Changing the repository name changes the Pages URL and therefore creates a separate storage environment.

## Network behavior

External sources may include RSI, community databases, market services, status feeds, mining tools, media hosts, and public GitHub content. No private server proxy is bundled. Network failures should be treated as degraded-source conditions rather than a total application failure.

## Portability changes in this package

The uploaded build contained fallback URLs pointing to the previous GitHub repository. This new-repository package removes those absolute roster fallbacks and uses only `./data/roster.json`. Bundled Wikelo source references now use the local `./assets/wikelo/` path. The functional application build is otherwise preserved.
