# Celestial Nexus — Flight Profile Builder

## Version 5: dark schematic export

This package updates the NX-13 Flight Profile Builder inside the single-file Celestial Nexus Toolkit.

## New in this pass

- Converts **Export schematic PNG** from a white print sheet to a full Celestial Nexus dark-mode reference board.
- Adds a deep navy-to-black page gradient, faint cyan engineering grid, and a restrained center glow.
- Changes device sections and mapping callouts to dark glass-style panels with cyan borders.
- Restyles the joystick and throttle illustrations as dark technical line art with brighter control accents.
- Improves contrast for action names, Star Citizen action IDs, input badges, shared mappings, axes, hats, and buttons.
- Updates leader lines, anchor points, footer details, and empty-device states for dark-background readability.
- Keeps the exported PNG opaque, so it looks consistent in Discord, browsers, image viewers, and social posts.
- Leaves XML import/export, local saves, project backups, drag-and-drop mapping, and the compact mapping-list export unchanged.

## Installation

### Easiest: replace the single HTML file

1. Back up the repository's current `index.html`.
2. Rename `index_with_flight_profile_builder.html` to `index.html`.
3. Place it at the repository root.
4. Commit and push the change.

### Upgrade an existing V4 installation

Place `flight_profile_builder_v5.patch` in the repository root and run:

```bash
git apply flight_profile_builder_v5.patch
```

### Patch the original supplied toolkit directly

Use the full patch instead:

```bash
git apply flight_profile_builder_full_v5.patch
```

## Image exports

### Dark technical schematic

Select **Export schematic PNG**. The builder downloads:

```text
<profile-name>_flight-profile_schematic.png
```

The generated image contains both joystick slots in stacked dark-mode sections. Callout anchors are model-aware approximations based on the builder artwork; firmware modes can still change the button numbers reported by Windows and Star Citizen.

### Compact mapping list

Select **Export mapping list** to download:

```text
<profile-name>_flight-profile.png
```

This remains the compact dark Celestial Nexus overview with every action ID.

## Included files

- `index_with_flight_profile_builder.html` — complete updated toolkit
- `flight_profile_builder_v5.patch` — incremental patch for V4
- `flight_profile_builder_full_v5.patch` — patch against the original supplied toolkit
- `flight_profile_schematic_dark_example.png` — example dark schematic export
- `README_FLIGHT_PROFILE_BUILDER.md` — this guide

## Compatibility notes

- Existing locally saved NX-13 projects remain compatible; the storage key and project schema were not changed.
- Schematic creation is entirely local and uses browser Canvas and SVG APIs.
- Device illustrations and leader-line anchors are mapping references, not manufacturer firmware definitions. Importing a known-good current-patch XML remains the safest starting point.
