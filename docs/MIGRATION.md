# Migration notes

## Delete from the old repository

The clean package intentionally omits:

- `flight_profile_builder_full_v3.patch`
- `flight_profile_builder_full_v5.patch`
- `flight_profile_builder_v3.patch`
- `flight_profile_builder_v5.patch`
- `index-latest-live.patch`
- `flight_profile_builder_v3_preview.png`
- `flight_profile_export_example.png`
- `flight_profile_schematic_dark_example.png`
- experimental `assets/images/ships/catalog/`
- experimental `assets/images/embedded/`
- experimental `assets/images/remote/`
- superseded SCMDB instructions/workflows not present in this package

Do not copy these back after extracting the clean ZIP.

## Generated data

The current repository has previously contained a verified 4.9.0 LIVE snapshot. To retain it immediately, copy the five generated data files listed in INSTALL.md into the clean tree before committing. Otherwise, use the workflows after push.
