# Upload Patch Instructions — Celestial Nexus Toolkit v1.6.0

1. Download and extract `celestial-nexus-toolkit-v1.6.0-repo-update.zip`.
2. Open your GitHub repository.
3. Choose **Add file → Upload files**.
4. Drag the extracted files and the `docs/` folder into the repository root.
5. Make sure the files are not uploaded into a nested `celestial-nexus-toolkit-v1.6.0-repo-update/` folder.
6. Commit with a message such as `Celestial Nexus Toolkit v1.6.0`.
7. Wait for GitHub Pages or your deployment workflow to finish.
8. Open the hosted site and hard-refresh once. If the old app remains visible, unregister the old service worker from browser dev tools or clear site data.

## Minimum files to upload

At minimum, upload:

- `index.html`
- `README.md`
- `VERSION.txt`
- `CHANGELOG.md`
- `manifest.webmanifest`
- `sw.js`

The report/checksum/docs files are optional but recommended for repository hygiene.
