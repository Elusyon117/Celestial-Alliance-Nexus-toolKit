# Troubleshooting

## Pages run remains `deployment_queued`

A successfully created artifact followed by a deployment that remains queued indicates a GitHub Pages deployment-service problem, not a missing `index.html`. For this new repository, avoid repeated retries; confirm only one deployment is active and check GitHub status/support if it times out.

## No Pages run appears

In **Settings → Pages**, temporarily select branch **None**, save, then select **main / (root)** and save again. Confirm the latest commit was authored by an account with a verified email address and that Pages is allowed for the repository visibility/plan.

## 404 at the site URL

- Confirm Pages points to `main / (root)`.
- Confirm `index.html` is in the repository root, not inside the release folder.
- Confirm the Pages workflow completed successfully.
- Use the exact URL shown in Settings → Pages.

## Old release still appears

- Hard-refresh with `Ctrl+Shift+R`.
- Test in a private window.
- Unregister the service worker in browser developer tools.
- Close and reopen an installed PWA.
- Clear site data only after exporting important browser-local information.

## Roster does not update

The toolkit first attempts live/public synchronization and can fall back to `data/roster.json`. Confirm that the JSON file exists and returns HTTP 200. Live RSI markup or access policy can change independently.

## Local artwork is missing

Confirm that every file in `assets/wikelo/` was committed with the same spelling and letter case used in `index.html`.

## Live data fails but the app loads

Public services can be offline, rate-limited, changed, or blocked by browser CORS policy. Use the linked source for critical confirmation and retry later. A source failure should not require rebuilding the repository.

## Saved data is absent on the new repository

That is expected when moving to a new Pages URL. Browser storage is origin-specific. Restore from module exports where available.

## Downloads or exports are blocked

Allow downloads/pop-ups for the site, reduce large image output dimensions, and use a current desktop browser when producing memory-intensive PNG or PDF files.
