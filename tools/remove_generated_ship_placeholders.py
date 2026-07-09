#!/usr/bin/env python3
"""Remove generated placeholder ship covers from a Celestial Nexus repo checkout.

Run this from the root of the repository after copying the corrected ZIP files.
It deletes assets/images/ships/catalog, which belonged to the mistaken generated-cover package.
"""
from pathlib import Path
import shutil

root = Path.cwd()
target = root / "assets" / "images" / "ships" / "catalog"
if target.exists():
    shutil.rmtree(target)
    print(f"Removed {target}")
else:
    print("No generated ship placeholder folder found. Nothing to remove.")
