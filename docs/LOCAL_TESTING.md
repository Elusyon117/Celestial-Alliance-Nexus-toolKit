# Local Testing

Do not evaluate the complete toolkit by double-clicking `index.html`. Browser security restrictions on `file://` URLs can block JSON requests, service workers, and other functionality.

## Python

From the repository root:

```powershell
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

## Included PowerShell helper

```powershell
.\scripts\serve-local.ps1
```

The helper starts Python's HTTP server on port 8080.

## Validation

```powershell
python .\scriptsalidate_package.py
```

The validator checks required files, JSON syntax, local HTML dependencies, service-worker app-shell paths, and SHA-256 report consistency.

## Minimum smoke test

1. Open the Tool Hub.
2. Open and close every module.
3. Create one Event Planner ship/unit and role.
4. Confirm Item Finder renders its independent item-research screen.
5. Confirm Blueprint Finder opens as a separate module and loads its fabrication catalog.
6. Load a vehicle in Vehicle Loadout Manager.
7. Confirm Language Pack Lab opens without a script error.
8. Confirm Game Status degrades gracefully if a source is blocked.
9. Confirm Wikelo local artwork appears.
10. Export a small Picture Studio PNG.
11. Confirm Commodity Trading and Mining Resources open and retain selections after reload.
