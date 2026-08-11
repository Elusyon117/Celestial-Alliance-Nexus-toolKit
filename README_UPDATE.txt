Celestial Nexus — Star Citizen PU banner localization fix

Correct target:
Frontend_play_star_citizen

Generated value:
Welcome to the ’Verse, Celestial Alliance member. Your journey among the stars begins here.

This replaces the StarStrings reminder banner shown inside the JOIN THE UNIVERSE
tile. The separate ui_pregame_persistentuniverse_desc localization entry is no
longer overridden by Celestial Nexus and remains whatever the synchronized
MrKraken/source pack provides.

Replace index.html and SHA256SUMS.txt in the repository.
The existing Pyro Hangar cover is included only for completeness.

Validation:
- All executable inline JavaScript blocks passed node --check.
- No duplicate static DOM IDs were found.
