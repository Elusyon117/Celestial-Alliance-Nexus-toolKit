# Module Guide

## 1. Alliance Tool Hub and Organization Roster

The **Alliance Tool Hub** is the landing page and navigation center for the entire toolkit. It presents every major module as a dedicated command card and keeps the organization roster visible alongside the operational tools.

### What it provides

- Direct access to all Nexus modules from one screen.
- A public **Celestial Alliance roster** with member count, rank information, profile links, and carousel navigation.
- Manual roster synchronization using the public RSI organization source when available.
- A packaged `data/roster.json` snapshot that can act as a fallback when live retrieval is unavailable.
- Quick access to the organization Discord and the external sources used throughout the toolkit.

### Typical workflow

1. Open the Nexus home screen.
2. Review the roster or synchronize it with the public organization source.
3. Select the module that matches the current task: planning, intelligence, engineering, logistics, creative work, or mining.
4. Return to the Tool Hub at any time through the **Hub** or **Tool Hub** controls in each workspace.

---

## 2. Event Planner

The **Event Planner** is the operational core of Celestial Nexus. It is designed for scheduled organization events, fleet operations, FPS deployments, training sessions, industrial expeditions, and mixed ship-and-ground missions.

### Mission briefing controls

The planner records the common command information needed before launch:

- Operation name and current status: **Planning**, **Briefing**, **Staging**, **Active**, or **Complete**.
- Operation date, start time, and time zone.
- Operation commander.
- Server or shard information.
- Rally point.
- General participant list.
- Primary objective.
- Special instructions and rules of engagement.

### Ships, vehicles, and FPS units

Each operational element can be created as a **Ship / Unit**. This supports conventional ship crews as well as FPS squads, security teams, medical groups, boarding parties, logistics cells, and other force templates.

For every ship or unit, commanders can configure:

- Name, activity subtitle, badge, emoji, and color theme.
- Generated, searched, or uploaded cover artwork.
- Crew stations or team roles.
- Assigned players.
- Custom role names and descriptions.
- Priority levels: **Critical**, **High priority**, or **Standard**.
- Default station sets for faster setup.
- Drag-and-drop reordering of ships, units, and roles.

### Save and export options

- **Save Setup** stores a reusable operation configuration.
- **Load Setup** restores a saved configuration.
- **Export `.txt`** creates a portable text roster or operation record.
- **Copy Briefing** generates a Discord-ready briefing for quick distribution.
- Cover controls allow commanders to use generated art, search for a specific cover, or upload a custom image.

### Typical workflow

1. Enter the mission briefing details.
2. Add each ship, vehicle, squad, or specialist unit.
3. Add crew stations or team roles and assign players.
4. Reorder the force structure to match the command plan.
5. Save the setup for reuse.
6. Copy the briefing to Discord or export the final roster.

---

## 3. Item and Blueprint Finder

The **Universal Item Finder** combines equipment research and blueprint intelligence in one module. It can be switched between **Item Finder** and **Blueprint Finder** modes.

### Item Finder mode

Use this mode to research equipment such as:

- Personal weapons and ammunition.
- Armor and clothing.
- Ship and vehicle components.
- Utility equipment and tools.
- Loot and other cataloged items.

The interface can display item details, availability, known in-game store locations, price information, and marketplace references when those sources are available.

### Blueprint Finder mode

The blueprint catalog is designed for crafting and progression research. It supports:

- Free-text blueprint search.
- Output-type filtering.
- Acquisition filtering, including documented/obtainable records, default availability, mission or contract unlocks, and records with no listed source.
- Material filtering.
- Recipe, unlock, and quality-tuning reference information where provided by the underlying data.

### Typical workflow

1. Choose **Item Finder** or **Blueprint Finder**.
2. Select a category or apply blueprint filters.
3. Search for the desired item or output.
4. Review acquisition, store, recipe, material, price, and quality information.
5. Refresh the dataset when newer live information is required.

> [!NOTE]
> Item availability, store inventories, prices, recipes, and blueprint acquisition rules can change between Star Citizen patches. Treat results as planning intelligence and verify critical purchases in game.

---

## 4. Vehicle Loadout Manager

The **Vehicle Loadout Manager** is an engineering and acquisition workspace for configuring ships and ground vehicles. It combines hardpoint management, component compatibility, crafted-quality modeling, performance comparison, and shopping preparation.

### Vehicle configuration

- Filter vehicles by manufacturer.
- Search the vehicle catalog.
- Load a vehicle engineering profile and stock configuration.
- Review supported hardpoints and compatible component options.
- Reset the current vehicle to its stock loadout.
- Save configurations locally for later use.

### Engineering and quality modeling

The module can model component performance using available recipe and modifier information. It supports:

- Exact recipe curves when the relevant data is available.
- Crafted quality and material-bonus projections.
- A configurable fallback quality bonus when no exact modifier data exists.
- Summary and detailed performance views.
- Recalculated combat, shield, power, cooling, quantum, and other vehicle statistics according to the data available for the selected platform.

### Acquisition planner

The loadout workspace also turns a configuration into a practical shopping plan:

- Refresh component prices.
- Build a required-parts checklist.
- Group purchases by location or planned shopping stop.
- Copy the checklist for use in Discord or external notes.
- Export acquisition information to CSV.

### Save and export options

- Save the current loadout.
- Export a presentation image.
- Export the configuration as JSON.
- Import a previously exported JSON configuration.
- Export shopping or component information as CSV.

### Typical workflow

1. Select a manufacturer and vehicle.
2. Load the stock configuration.
3. Replace components in the supported hardpoints.
4. Review summary and detailed performance changes.
5. Apply quality or crafted-material assumptions where appropriate.
6. Refresh prices and prepare the acquisition checklist.
7. Save or export the finished build.

---

## 5. Language Pack Lab

The **Language Pack Lab** creates a customized Star Citizen `global.ini` package. It layers community localization improvements with organization-specific component naming and ASOP organization tools.

### Base-file workflow

- Synchronize the recommended language pack.
- Refresh the Dymerz English base.
- Import a clean `global.ini` as a custom starting point.
- Preview the combined output before export.

### Optional enhancement layers

The module can apply selected community and Nexus layers in sequence:

- **MrKraken contracts, blueprints, and reputation**: clearer contract wording, blueprint indicators, possible blueprint pools, reputation values, and progression details.
- **MrKraken mining and journal quality-of-life**: shortened mining labels, mining guidance, refueling notes, and related journal improvements.
- **MrKraken items, components, and ordnance**: expanded component metadata, item warnings, shortcuts, multitool labels, missile notation, and ordnance naming.
- **Celestial Nexus component naming**: rebuilds recognized component names using a user-defined field order and naming format.
- **Celestial Nexus ASOP ordering**: applies numbered ship ordering, favorites, and optional aliases after the other layers.

### Customization tools

- Choose numbering width such as `01`, `001`, or unpadded values.
- Choose compact, scanner-focused, detailed-code, readable, name-first, or source-preserving component formats.
- Select title, uppercase, lowercase, or source-preserved casing.
- Drag fields into a custom naming order.
- Add custom text to generated component names.
- Build a preferred ship order.
- Mark favorite ships.
- Add display aliases.
- Add or override advanced `key=value` entries.

### Output

**Export language pack ZIP** creates the organization-ready package for installation in the appropriate Star Citizen localization folder.

### Typical workflow

1. Load or refresh the base localization file.
2. Enable the desired community enhancement layers.
3. Configure component naming.
4. Arrange ships, aliases, and favorites.
5. Add any advanced key overrides.
6. Refresh the preview.
7. Export the final ZIP.

> [!CAUTION]
> Star Citizen updates can change localization keys. Rebuild and verify the pack after major patches, and retain a clean backup of any existing `global.ini` installation.

---

## 6. Game Status and Intelligence

The **Game Status & Intelligence** module provides a single monitoring surface for official platform health, current LIVE-build awareness, official news, and clearly separated community intelligence.

### Status monitoring

- Review official Star Citizen service and platform status.
- Refresh the status panel independently.
- Refresh all status and intelligence sources together.
- Use cached status information when a live source is temporarily unreachable.

### LIVE build and intelligence pulse

The module summarizes current build and service information available from connected public sources. It is intended to help members determine whether an issue is likely local, shard-specific, or platform-wide before an operation begins.

### News and community feeds

Feed filters include:

- **All**.
- **Official news**.
- **Leaks & datamines**.
- **Images only**.

Official and community material are intentionally presented as different source classes. Leaks, rumors, datamines, and community reports should not be treated as confirmed game information.

### Typical workflow

1. Refresh service status before a scheduled event.
2. Review the current LIVE-build pulse.
3. Check official news for maintenance or patch information.
4. Use community intelligence as supplemental context only.

---

## 7. Wikelo Trade Center

The **Wikelo Trade Center** is an alien-commerce planning module for evaluating Wikelo exchanges, coordinating organization materials, tracking reputation, and preparing shared projects.

### Trade catalog

- Search by reward, mission, or required material.
- Filter by category.
- Filter by required reputation rank.
- Hide completed exchanges.
- Show only trades that are currently completable from the material locker.
- Add selected trades to a shared requirements plan.

### Material locker

The locker represents the organization’s available materials. It can be used to:

- Record current quantities.
- Compare stock against selected trade requirements.
- Identify fully completable trades.
- Identify missing quantities.
- Reset the locker when a new inventory count is taken.

### Project and requirements planning

- Build a multi-trade plan.
- Combine duplicate material requirements.
- Copy the consolidated requirements for Discord, spreadsheets, or logistics assignments.
- Mark trades complete and hide completed work when desired.

### Reputation calculator

The calculator tracks:

- Starting reputation points.
- Reputation gained from tracked completions.
- Other planned or pending reputation gains.
- Progress toward the next supported reputation level.
- Completion history, with an option to clear that history.

### Typical workflow

1. Enter the organization’s current locker quantities.
2. Filter the catalog by rank or reward.
3. Add desired trades to the plan.
4. Review what is completable and what is missing.
5. Copy the consolidated material list for collection teams.
6. Record completed exchanges and reputation gains.

---

## 8. Organization Picture Creator

The **Celestial Alliance Picture Studio** creates branded organization graphics directly in the browser. It is intended for Discord announcements, event covers, recruitment, recognition, training, mission briefs, fleet showcases, and social posts.

### Templates and layouts

The studio includes a large library of ready-made layouts, including:

- Event posters, RSVP banners, schedules, and save-the-date graphics.
- Member spotlights, honor rolls, service medals, and recognition certificates.
- Recruitment cards, division callouts, role advertisements, and open-position graphics.
- Mission launches, command briefs, objective cards, red alerts, and classified OPORD layouts.
- Training notices, academy cards, certification badges, and curriculum briefs.
- Ship spotlights, hangar showcases, fleet registry cards, and technical profiles.
- Mission-complete, victory, commendation, results, and after-action graphics.
- Weekly dispatches, headlines, community spotlights, bulletins, and newsletter layouts.

### Output formats

The editor includes presets for common platform dimensions, such as:

- Discord scheduled-event covers, server banners, server icons, invite backgrounds, and profile banners.
- 16:9 event covers, HD thumbnails, 4K cinematic images, and ultrawide layouts.
- Square, portrait, story, landscape, and wide social formats.
- Community banners, profile headers, promotional posters, A4 pages, and phone wallpapers.
- Custom width and height values with orientation swapping.

### Editing controls

- Upload PNG, JPG, or WebP artwork.
- Replace or clear the current background.
- Adjust image zoom and position.
- Adjust background brightness.
- Choose from multiple brand styles and color treatments.
- Edit and reposition reusable text and overlay elements.
- Select native, high-resolution, 4K-class, or 6K-class output quality.
- Save and reload project files.
- Reset the active template.

### Output

**Download PNG** renders the completed composition at the selected size and quality.

### Privacy behavior

Uploaded screenshots remain in the browser during editing. They are not uploaded to this repository by the toolkit itself.

### Typical workflow

1. Upload the source screenshot or artwork.
2. Choose a layout and output format.
3. Select a brand style.
4. Adjust the crop, brightness, text, and overlays.
5. Save the project when further editing may be needed.
6. Download the final PNG.

---

## 9. Commodity Trading Command

The **Commodity Trading Command** is a hauling and convoy-planning workspace. It evaluates available commodity reports against ship capacity, working capital, route scope, risk tolerance, freshness, and operational constraints.

### Market and route analysis

- Refresh market information.
- Import or export market snapshots.
- Search by commodity or location.
- Select a known cargo ship or enter custom usable capacity.
- Enter available working capital and an estimated cycle duration.
- Restrict origin and destination systems.
- Set a maximum acceptable report age.
- Rank results by load profit, aUEC per hour, profit per SCU, return on investment, confidence, freshness, hold utilization, or required investment.

### Advanced filters

The route finder can filter by:

- Same-system or cross-system routes.
- Legal, mixed, or illegal cargo.
- Volatile or non-volatile commodities.
- Freight-handling support at one or both terminals.
- Reported stock and demand.
- Full-hold availability.
- Minimum profit, ROI, profit per SCU, confidence, and hold utilization.
- Maximum investment.
- Minimum supported box size.
- Conservative, balanced, or aggressive risk profiles.

### Fuel-aware route planner

The fuel planner adds operational routing considerations:

- Departure and destination.
- Starting quantum-fuel percentage.
- Desired arrival reserve.
- Operational overhead for loaded or harsh-condition flying.
- Routing priority: fewest stops, safest serviced route, or shortest distance.
- Optional custom range override.
- Refueling locations used by the route.
- Copyable fuel and convoy briefs.

### Convoy and export tools

- Add candidate routes to a convoy board.
- Copy a convoy briefing.
- Export route data as CSV or JSON.
- Produce a top-route PDF with supporting images.
- Export the convoy board as a PDF with images.
- Clear the board when planning is complete.

### Typical workflow

1. Select the cargo platform and enter capital limits.
2. Refresh the market dataset.
3. Apply route, age, legality, and risk filters.
4. Compare the highest-ranked opportunities.
5. Send the selected route into the fuel planner.
6. Add approved legs to the convoy board.
7. Copy or export the final convoy briefing.

> [!WARNING]
> Commodity prices, stock, demand, legality, terminal availability, interdiction risk, and server conditions can change quickly. The module is a forecasting and coordination tool, not a guarantee of profit.

---

## 10. Mining Resources Command

The **Mining Resources Command** is a patch-sensitive field guide and operation planner for hand mining, ground-vehicle mining, and ship mining.

### Resource intelligence

- Search the resource catalog by name.
- Filter by mining platform: FPS/hand, ground vehicle, or mining ship.
- Filter by system, including Stanton, Pyro, and Nyx where data is available.
- Filter by resource tier or type, including high-priority minerals and gemstones.
- Sort by value/priority, name, resistance, or quality potential.
- Review known or confirmed mining regions and practical routing information.
- Compare resistance and quality potential before choosing equipment and crew.

### Operation preparation

The module is designed to support decisions such as:

- Which resource to target.
- Which mining platform is suitable.
- Where the team should search.
- What fracture difficulty or resistance to expect.
- Which resources should be marked as favorites.
- Which preparation or collection tasks are complete.

Selections, favorites, and checklist state can persist in browser storage.

### Briefing output

**Copy operation brief** creates a portable summary for Discord or the Event Planner.

### Typical workflow

1. Select the mining platform and system.
2. Filter or search for the target resource.
3. Compare value, resistance, location confidence, and quality potential.
4. Mark priority targets and preparation checks.
5. Copy the operation brief for the mining team.
6. Build the full crew and vehicle assignment in the Event Planner when required.

> [!NOTE]
> Mining locations, resource distributions, resistance values, refinery behavior, and profitability can change between patches. Confirm high-value plans against current in-game conditions.

---
