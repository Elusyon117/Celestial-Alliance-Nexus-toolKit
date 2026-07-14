# Celestial Nexus — Flight Profile Builder

## Version 3: drag, move, and image export

This package updates the NX-13 Flight Profile Builder inside the single-file Celestial Nexus Toolkit.

### New in this pass

- Action-library rows can be dragged directly onto any button, hat direction, or axis.
- The drag operation no longer rerenders and destroys its own source element, which was the main cause of unreliable drops in some browsers.
- Drag data now uses both a custom payload and a `text/plain` fallback for broader browser compatibility.
- Every assigned action appears as a draggable label on its control.
- Mapping Summary entries are draggable as well.
- Dragging an existing assignment to another control **moves** it.
- Holding **Alt** on Windows/Linux or **Option** on macOS while dropping **copies** the assignment instead.
- Drop targets receive clear hover, move, and copy feedback.
- Dropping the same library action onto the same input is now idempotent instead of unexpectedly removing it.
- A new **Export profile image** button creates a polished PNG reference sheet.
- The PNG includes both selected devices, profile/build information, assignment totals, shared-control warnings, input labels, action names, action-map IDs, and device artwork.
- Image generation is local and uses browser Canvas/SVG APIs; no screenshot service or external image library is required.

## Installation

### Easiest: replace the single HTML file

1. Back up the repository's current `index.html`.
2. Rename `index_with_flight_profile_builder.html` to `index.html`.
3. Place it at the repository root.
4. Commit and push the change.

### Upgrade an existing V2 installation

From the repository root, place `flight_profile_builder_v3.patch` beside `index.html`, then run:

```bash
git apply flight_profile_builder_v3.patch
```

### Patch the original toolkit directly

Use the full patch instead:

```bash
git apply flight_profile_builder_full_v3.patch
```

## Using drag and drop

- Drag an action from the left library onto a control to assign it.
- Drag the small action label displayed inside an assigned control to move it.
- You can also drag an entry from Mapping Summary.
- Hold Alt/Option during the drop to copy rather than move an existing assignment.
- Clicking an action and then clicking a control remains available as a keyboard/touch-friendly alternative.

## Image export

Select **Export profile image** under Profile configuration. The builder downloads:

```text
<profile-name>_flight-profile.png
```

The image expands vertically for larger profiles, so the complete T16K2 starter layout fits without clipping.

## Included files

- `index_with_flight_profile_builder.html` — complete updated toolkit
- `flight_profile_builder_v3.patch` — incremental patch for the previous V2 builder
- `flight_profile_builder_full_v3.patch` — patch against the original supplied toolkit
- `flight_profile_builder_v3_preview.png` — updated builder preview
- `flight_profile_export_example.png` — example exported PNG sheet
- `README_FLIGHT_PROFILE_BUILDER.md` — this file

## Compatibility notes

- Existing locally saved NX-13 projects remain compatible. The storage key and project schema were not changed.
- XML import/export, round-trip preservation, JSON backups, input testing, conflict detection, and the starter layout remain intact.
- Device illustrations are mapping-oriented references. Firmware mode and Windows device ordering can change button numbering, so imported known-good XML remains the safest baseline.
