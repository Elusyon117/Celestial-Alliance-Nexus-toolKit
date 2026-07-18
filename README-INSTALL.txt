CELESTIAL NEXUS LANGUAGE LAB — DIRECT-INSTALL EXPORT V4

This update fixes the exported language-pack ZIP layout.

Repository files to replace/add:
  index.html
  sw.js
  .github/workflows/sync-mrkraken-language-pack.yml
  data/mrkraken-release.json

Keep the workflow and generated data/mrkraken-global.ini from V3. If the mirror
has not yet been generated, run the Sync MrKraken language pack workflow once.

IMPORTANT EXPORT CHANGE
The Language Lab export now places these directly at the ZIP root:
  Data/Localization/english/global.ini
  USER.cfg
  README_INSTALL_FIRST.txt

Users must extract the ZIP contents into the active StarCitizen channel folder
(LIVE, PTU, EPTU, or PREVIEW). They must not create an extra wrapper folder.

After pushing this update, wait for GitHub Pages to deploy and hard-refresh the
toolkit before exporting a new pack. Older exported ZIPs retain the bad nested
folder layout and should not be redistributed.
