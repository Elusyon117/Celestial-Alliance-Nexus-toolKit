# Celestial Nexus Toolkit repository update

This package builds on the optimized/clean toolkit version and includes the latest fixes requested in chat.

## Included fixes

- Cargo Hauling Routing: `Cargo Transfer from Shuttered Facility` contracts now use `Onyx Facility` as the generic origin instead of incorrectly forcing `HDMS-Bezdek`.
- Cargo Hauling Routing: Onyx Facility has been added to the local route/location profile list with a dedicated `ONX` marker and Star Citizen Wiki image lookup query.
- Cargo Hauling Routing: ship selector fallback list has been expanded so the module is not limited to only a small handful of cargo ships when live vehicle data is unavailable.
- Hub: the visible Organization Roster panel has been removed from the main page, while the roster data/sync logic remains available for Event Planner participant selection.
- Layout: wide module containers now use a shared centered width so module sections line up more consistently.
- Scrolling: added a lightweight scroll-performance guard that pauses animations/transitions and reduces paint-heavy shadows while the user is actively scrolling.
- Preserved previous fixes: module color identities, smooth hub card pointer motion, cleaned module banners/backgrounds, Gladius Pirate Event Planner image mapping, real ship artwork behavior, and Blueprint Finder selected-stat matching.

## Upload instructions

1. Extract this ZIP.
2. Copy everything into the repository root.
3. Replace existing files when prompted.
4. Make sure `assets/images/ships/catalog/` is deleted if it still exists from the earlier placeholder package.
5. Commit and push with GitHub Desktop or git.

Suggested commit message:

```text
Fix cargo Onyx routing, expand cargo ships, and polish layout scrolling
```
