# Deployment Guide

## Supported publishing model

The recommended production configuration is:

```text
Source: Deploy from a branch
Branch: main
Folder: /(root)
```

The application requires no build command. GitHub Pages must find `index.html` directly at the selected publishing root.

## Required runtime files

Do not publish only `index.html`. These files and folders form the runtime release:

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `icon-192.png` and `icon-512.png`
- `assets/wikelo/`
- `data/roster.json`

The remaining Markdown and report files document and maintain the repository but are not required by the browser application.

## Why `.nojekyll` is included

The application is already-built static content. `.nojekyll` tells GitHub Pages not to process the files as a Jekyll site.

## Production verification checklist

- [ ] Pages workflow is green.
- [ ] `index.html` opens at the repository Pages URL.
- [ ] All nine tool cards open their workspaces.
- [ ] Hub roster shows live or packaged fallback data.
- [ ] Event Planner can create and export a small test operation.
- [ ] Wikelo artwork loads from `assets/wikelo/`.
- [ ] Manifest and icons return HTTP 200.
- [ ] Service worker registers without a fatal error.
- [ ] The app works after one reload.
- [ ] A private/incognito window shows the current release.

## Updating production

Commit tested changes to `main`. GitHub Pages will create a new deployment from the publishing source. Avoid making repeated trigger commits while a deployment is active.

When updating cached runtime files, change `CACHE_NAME` in `sw.js`. This release already uses a cache identifier unique to the new-repository package.

## New repository and browser storage

The new Pages URL has a different browser origin from the old repository. Saved plans, locker state, preferences, and other local data do not automatically move to the new URL. Export important data from the old site before organization members migrate.
