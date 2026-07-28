# v1.9.1-r3 hotfix validation

The overlay was checked before packaging with the following local tests:

- Parsed all inline classic JavaScript blocks in `index.html` with Node.js `vm.Script`: **145 script tags, 0 syntax errors**.
- Checked `scripts/validate-repo.mjs`, `scripts/audit-patch-data.mjs`, and `sw.js` with Node.js syntax validation.
- Ran `scripts/validate-repo.mjs` in a repository-shaped test fixture: **passed, 0 errors, 0 warnings**.
- Ran `STRICT_AUDIT=1 node scripts/audit-patch-data.mjs` against a valid 100-record fixture: **passed, 0 errors, 0 warnings**.
- Confirmed static DOM IDs remain unique through the repository validator.
- Confirmed app version `1.9.1`, cache revision `1.9.1-r3`, service-worker registration, service-worker source, manifest icon tags, and `release.json` agree.

## Limitation

The live Star Citizen Wiki API and the deployed GitHub Pages environment could not be exercised from the packaging container. The Vehicle Loadout Manager repair is therefore validated statically and structurally; the deployment checklist in `DEPLOY_UPDATE.md` includes the required live browser test.
