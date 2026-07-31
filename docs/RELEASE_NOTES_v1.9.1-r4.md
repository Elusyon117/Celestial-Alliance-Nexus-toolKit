# Celestial Nexus Toolkit v1.9.1-r4

This update packages the current FPS Loadout Manager, Language Pack Lab, and GitHub automation changes as a repository-root overlay.

## Included application changes

- Full-width FPS Loadout Manager dashboard.
- Relative performance, hip-fire/ADS spread, and recoil charts remain visible.
- Reliable weapon image loading with an immediate local schematic fallback.
- Wikelo item and reward tags using the verified current localization keys.
- Offline text export for all embedded Wikelo trades.
- Original-quality FPS card background remains embedded.

## Workflow reliability changes

- Updated official actions to `actions/checkout@v7`, `actions/setup-node@v7`, and `actions/upload-artifact@v7`.
- Removed the validation workflow's undeclared PyYAML dependency.
- Added repository-specific workflow checks to `scripts/validate-repo.mjs`.
- Added validation for workflow script references, action versions, permissions, concurrency, data mirrors, cache revision alignment, checksums, duplicate static IDs, and inline JavaScript syntax.
- MrKraken synchronization now preserves the last verified mirror when the upstream release is temporarily unavailable.
- SCMDB validation accepts the tracked `stale-upstream-unavailable` state when the preserved snapshot remains internally valid.

## Cache revision

The application version remains `1.9.1`. The service-worker cache revision is now `1.9.1-r4` so existing GitHub Pages installations refresh the updated HTML and workflows cleanly.
