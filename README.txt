Pyro Hangar Watch — Precision global sync fix

Why this update exists
-----------------------
The automated ExecTimer scrape was deriving its phase anchor from the time the
headless Chrome process finished, not the exact browser timestamp associated
with the countdown text being sampled. The latest automated sync shifted the
phase by about 69.8 seconds relative to the prior user-verified alignment.

What changed
------------
- Uses Chrome DevTools Protocol instead of --dump-dom timing.
- Captures ExecTimer's visible countdown and browser Date.now() atomically.
- Samples consecutive countdown ticks and publishes the median phase anchor.
- Rejects the update if the samples disagree by more than 1.8 seconds.
- Compares anchors modulo the 185-minute cycle.
- No index.html changes are required for this fix.

Install
-------
1. Replace:
   scripts/sync-pyro-hangar.mjs
2. Commit/push it to the repository.
3. In GitHub Actions run "Sync game data" once manually.
4. Refresh Pyro Hangar Watch after the workflow finishes.

The existing scheduled workflow will continue checking ExecTimer automatically.
