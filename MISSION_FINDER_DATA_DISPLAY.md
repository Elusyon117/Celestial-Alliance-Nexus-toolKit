# Mission Finder data display

## Payouts

Mission Finder shows a fixed monetary payout only when the selected source record publishes `reward_min`, `reward_max`, or an equivalent explicit payout field. A range is shown when both minimum and maximum values differ.

`No fixed payout exposed` means the source record itself does not publish a fixed aUEC amount. This commonly occurs on contracts with dynamic payment, cargo-value compensation, item rewards, reputation-only outcomes, or game-side reward calculations. Mission Finder does not invent or estimate a payout.

## Complete selected-contract detail

The synchronized catalog is optimized for browsing. When a contract is selected, Mission Finder attempts to request its complete detail record from the source API and merges it into the dossier. This adds any available:

- Reward groups and item rewards
- Reputation gained and lost
- Hauling orders, quantities, SCU ranges, and container limits
- Cooldown, lifetime, duration, and repeatability rules
- Starmap location groups and destinations
- Prerequisites, variants, completion tags, and unlock groups
- Combat, enemy-count, CrimeStat, standing, and access requirements

If that request is unavailable, the synchronized summary remains usable and every field already stored in the repository stays visible in the raw record inspector.

## Synchronization

The scheduled sync now requests `filter[grouped]=false` from the Wiki fallback so contract variants are not intentionally collapsed. Upload the updated `scripts/sync-scmdb-missions.mjs` with `index.html` and `sw.js`, then run the existing **Sync SCMDB mission data** workflow again.
