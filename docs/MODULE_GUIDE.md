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

## 3. Item Finder

The **Universal Item Finder** is a dedicated equipment-intelligence workspace for researching weapons, armor, ship components, utility equipment, loot, and other cataloged items.

### What it provides

- Category and item-name search.
- Equipment specifications and descriptive metadata.
- Known in-game store locations and community-reported prices.
- UEX marketplace references when live data is available.
- Item artwork and links to supporting community databases.
- A larger blueprint-match panel that prioritizes unlock sources, craft time, recipe quantities, and direct access to the full Blueprint Finder.

### Typical workflow

1. Select an item category.
2. Search for or choose an item.
3. Review specifications, acquisition locations, prices, and marketplace references.
4. Open any matching fabrication recipe in **Blueprint Finder**.
5. Refresh the dataset when newer live information is required.

> [!NOTE]
> Item availability, store inventories, and prices can change between Star Citizen patches. Treat results as planning intelligence and verify critical purchases in game.

---

## 4. Blueprint Finder

The **Blueprint Finder & Quality Lab** is now an independent fabrication-intelligence module rather than a tab inside Item Finder.

### What it provides

- Free-text search across blueprint outputs, recipe keys, missions, and materials.
- Output-type filtering.
- Acquisition filtering for obtainable records, default availability, mission or contract unlocks, and records with no listed source.
- Material filtering and complete bill-of-materials inspection.
- Recipe, unlock, dismantle, and acquisition references where provided by the underlying data.
- A quality simulator for modeling how input quality changes crafted stat multipliers.
- Direct SCMDB fabrication links for community pool verification.

### Typical workflow

1. Open **Blueprint Finder** from its own home-page module card.
2. Search or filter the fabrication catalog.
3. Select a blueprint to inspect its recipe and acquisition path.
4. Review every required material and mission unlock.
5. Adjust quality values to model the crafted output.
6. Open external fabrication references when live verification is required.

> [!NOTE]
> Recipes, acquisition rules, quality ranges, and available blueprint pools can change after patches. Verify mission-critical crafting plans against current live game behavior.

---

## 5. Vehicle Loadout Manager

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

## 6. Language Pack Lab

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

## 7. Game Status and Intelligence

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

## 8. Wikelo Trade Center

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

## 9. Organization Picture Creator

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

## 10. Commodity Trading Command

The **Commodity Trading Command** is an exchange-first hauling and convoy-planning workspace. It begins with a complete commodity market board, then lets operators move from commodity research into ship-sized routes, fuel planning, and convoy coordination.

### Market Exchange

The default tab presents a stock-market-inspired overview without claiming that terminal observations are a true historical securities chart. It includes:

- The available UEX commodity catalog, including records without a complete two-sided price market.
- Commodity code, lowest observed buy price, highest observed sell price, spread per SCU, ROI, report freshness, and terminal coverage.
- Search, legality, availability, and market-ranking controls.
- A moving opportunity tape for the strongest current two-sided markets.
- A selected-commodity dossier with larger **Where to buy** and **Where to sell** lists.
- Reported stock and demand where the source provides them.
- A market signal comparing current terminal observations with UEX-reported averages. This is explicitly labeled as a comparison, not a future-price prediction.
- One-click transfer of the selected commodity into Trade Routes.
- A copyable commodity market brief.

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

1. Refresh the market dataset and review the Market Exchange.
2. Select a commodity and compare the larger buy and sell terminal lists.
3. Send the commodity into Trade Routes.
4. Select the cargo platform and enter capital limits.
5. Apply route, age, legality, and risk filters.
6. Send the selected route into the fuel planner.
7. Add approved legs to the convoy board.
8. Copy or export the final convoy briefing.

> [!WARNING]
> Commodity prices, stock, demand, legality, terminal availability, interdiction risk, and server conditions can change quickly. The module is a forecasting and coordination tool, not a guarantee of profit.

---

## 11. Mining Resources Command

The **Mining Resources Command** is an industrial intelligence and field-configuration workspace for hand mining, ground-vehicle mining, and ship mining. Its interface is organized around the operator's real decision sequence rather than a collection of disconnected tables.

### Four-stage workflow

1. **Discover** — search and compare every mapped resource.
2. **Route** — review known systems, regions, approach notes, and location confidence.
3. **Evaluate** — inspect resistance, instability, mass class, quality potential, and fracture-planning guidance.
4. **Configure** — choose a recommended platform and send its engineering package into Vehicle Loadout Manager.

### Resource intelligence board

- Search the catalog by resource name.
- Filter by FPS/hand, ground vehicle, or mining ship.
- Filter by Stanton, Pyro, and Nyx where records are available.
- Filter by legendary, very-high, high, standard, special-mineral, or gemstone tiers.
- Sort by operational value, name, resistance, or quality potential.
- Save priority resources as favorites.
- Read larger at-a-glance indicators for platform, resistance, instability, quality, and location confidence.

### Resource dossier

The selected resource opens a large dossier containing:

- Recommended extraction platform and deposit scale.
- Known or confirmed regions with practical routing notes.
- Resistance, instability, mass, density, and quality guidance.
- Fracture-planning controls and operational interpretation.
- A recommended engineering package with mining head/tool, installed modules, field support, and crew baseline.
- Alternative platform comparisons, crew roles, and a launch checklist.

### Owned-platform optimizer

The owned-platform advisor can generate a plan for FPS gear, ATLS GEO, ROC, ROC-DS, Golem, Prospector, or MOLE. It adjusts the recommended head/tool, module package, reserve equipment, gadget, and field sequence to the selected resource and platform.

### Vehicle Loadout Manager handoff

Use **Open in Vehicle Loadout Manager** from either the primary recommendation or the owned-platform optimizer.

The handoff will:

1. Open Vehicle Loadout Manager.
2. Apply the matching manufacturer and vehicle-name filters.
3. Select and load the recommended platform.
4. Search editable mining-laser hardpoints for the recommended head.
5. Search mining-module slots for the recommended modules and quantities.
6. Display a handoff status banner showing what matched and what requires manual review.
7. Provide a return button to the originating mining plan.

FPS tools, integrated mining equipment, and fixed ground-vehicle systems may not appear as editable hardpoints in VLM. In those cases the recommendation is transferred as an advisory rather than silently discarded. Always review the resulting hardpoints against current LIVE data before saving or sharing the loadout.

### Briefing output

**Copy operation brief** creates a portable mining summary for Discord or the Event Planner. Loadout and owned-platform plans can also be copied independently.

### Typical workflow

1. Search or filter for the target resource.
2. Compare value, location confidence, resistance, instability, and quality potential.
3. Review the recommended region and route notes.
4. Use the fracture planner for the expected deposit.
5. Open the Loadout tab and choose the default or owned-platform recommendation.
6. Send the plan to VLM and verify every matched hardpoint.
7. Save the VLM configuration and copy the mining operation brief.

> [!NOTE]
> Mining locations, resource distributions, resistance values, component compatibility, refinery behavior, and profitability can change between patches. Confirm high-value plans against current in-game conditions and current live hardpoint data.

---


## Mission Finder

Mission Finder browses current-patch mission and contract records. Search and filter by system, category, faction, legality, release state, blueprint availability, combat, hauling, sharing, prerequisites, and mission chains. The detail workspace surfaces briefing, reward, reputation, access requirements, blueprint pools, hauling manifests, variants, and every unmodified source field. SCMDB is the primary synchronized source; the Star Citizen Wiki mission API is clearly labelled when used as a live fallback.


## Mission Finder — 4.8.3 LIVE

The Mission Finder header includes a patch-integrity console. Green **Patch verified** means the source identifies as 4.8.3 LIVE. A red mismatch means the stored snapshot is only a fallback and should not be treated as current. Use the compensation filter to isolate fixed aUEC payouts, item/blueprint rewards, or contracts with no exposed fixed payout. Sorting is available by payout, reputation, duration, and name.
