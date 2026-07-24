# Publish Celestial Alliance Nexus Toolkit v1.9.1

This is an incremental repository update. Extract the ZIP over the root of the existing Git repository and allow it to overwrite matching files.

1. Back up or commit your current working tree.
2. Extract all files into the repository root.
3. Confirm `VERSION.txt` reads `1.9.1`.
4. Commit and push the changed files.
5. Wait for GitHub Pages to redeploy.
6. Hard-refresh the published site once so the v1.9.1 service worker replaces the previous cache.

The update keeps the repository asset layout and replaces the Cargo Grid Manager export renderer with the professional loading-manifest design.
