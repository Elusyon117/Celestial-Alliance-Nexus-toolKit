# Celestial Alliance Nexus Toolkit v1.9.1

## Cargo Grid Manager export redesign

The Cargo Grid Manager now exports a professional, dynamically sized cargo-loading manifest rather than a basic schematic board.

### Included in the PNG

- Selected ship name, cargo capacity, cargo-bay profile, and ship artwork.
- Starting location and complete optimized route order.
- Planned SCU, capacity utilization, contract count, delivery count, placement state, and total payout when available.
- The selected isometric, free-look, top, side, or front cargo-grid perspective.
- Placed versus unplaced container totals.
- A material manifest with a rendered 3D crate visual for every commodity.
- Exact 32, 24, 16, 8, 4, 2, and 1 SCU crate breakdowns.
- Contract color mapping and associated contract numbers.
- Pickup location, each delivery location and quantity, payout, and exact container allocation for every contract.
- Generation timestamp and planning disclaimer.

### Ship artwork behavior

The exporter first uses the ship image already loaded by Cargo Hauling Routing. For standalone manual manifests, it attempts to resolve ship artwork from the Star Citizen community wiki. A clean generated ship profile is used when an image is unavailable, so export never depends on the image request succeeding.

### Technical changes

- The PNG is rendered at 2560 pixels wide with dynamic height so contract and material records are not discarded.
- Remote artwork is fetched as a local blob before drawing to avoid tainting the export canvas.
- Network image resolution has a timeout and safe fallback.
- Cargo Hauling Routing now includes its currently loaded ship image in the Cargo Grid handoff payload.
- Service-worker caches were bumped to v1.9.1.
