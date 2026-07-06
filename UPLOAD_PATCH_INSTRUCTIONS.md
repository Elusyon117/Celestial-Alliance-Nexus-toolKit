# Upload Instructions — GitHub Website Method

1. Extract this ZIP file.
2. Open the repository on GitHub:
   https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit
3. Make sure you are on the `main` branch.
4. Click **Add file → Upload files**.
5. Drag all files from this extracted patch folder into the upload box.
6. GitHub should replace `index.html`, `sw.js`, and `VERSION.txt`.
7. Use this commit message:

   Update toolkit cargo workflow and VLM armor lab

8. Click **Commit changes**.
9. Wait a few minutes for GitHub Pages to deploy.
10. Hard refresh the live site with `Ctrl + F5`.

# Git Command Method

```bash
git clone https://github.com/Elusyon117/Celestial-Alliance-Nexus-toolKit.git
cd Celestial-Alliance-Nexus-toolKit

# Copy the extracted patch files into this folder, replacing existing files.

git status
git add index.html sw.js VERSION.txt CHANGELOG_PATCH.md PATCH_REPORT.json SHA256SUMS_PATCH.txt UPLOAD_PATCH_INSTRUCTIONS.md
git commit -m "Update toolkit cargo workflow and VLM armor lab"
git push origin main
```
