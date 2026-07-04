# GitHub upload instructions

Repository: https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit

This ZIP is a root-level patch package. Extract it locally, then copy/upload these files into the repository root:

- index.html
- sw.js
- VERSION.txt
- CHANGELOG_PATCH.md
- SHA256SUMS_PATCH.txt
- PATCH_REPORT.json

Recommended Git commands:

```bash
git clone https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit.git
cd Celestial-Alliance-Nexus-toolKit
# copy the extracted patch files into this folder, replacing index.html, sw.js, and VERSION.txt
git status
git add index.html sw.js VERSION.txt CHANGELOG_PATCH.md SHA256SUMS_PATCH.txt PATCH_REPORT.json
git commit -m "Update toolkit item finder and VLM fixes"
git push origin main
```

After GitHub Pages deploys, hard refresh the site once. Because `sw.js` has a new cache name, returning visitors should also receive the fresh version automatically.

I did not overwrite PACKAGE_REPORT.json or the full repository SHA256SUMS.txt because this patch package does not contain every repository file. The included SHA256SUMS_PATCH.txt covers only the changed patch files.
