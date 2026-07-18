CELESTIAL NEXUS LANGUAGE LAB — MRKRAKEN MIRROR V3

Copy these files into the matching locations in your repository:

  index.html
  sw.js
  .github/workflows/sync-mrkraken-language-pack.yml
  data/mrkraken-release.json

Do not delete your other repository files.

After committing and pushing:

1. Open the repository on GitHub.
2. Open Actions.
3. Select "Sync MrKraken language pack".
4. Choose "Run workflow" and run it on main.
5. Wait for the workflow to finish and commit data/mrkraken-global.ini.
6. Wait for GitHub Pages to redeploy.
7. Hard-refresh the toolkit or clear its site/service-worker cache.
8. Open Language Lab and press "Sync recommended pack".

The workflow also runs automatically every six hours. It downloads the release
server-side, validates at least 10,000 INI entries, and commits a same-origin
copy that GitHub Pages can read without CORS errors.
