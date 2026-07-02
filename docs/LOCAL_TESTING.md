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
4. Confirm Item Finder renders its initial screen.
5. Load a vehicle in Vehicle Loadout Manager.
6. Confirm Language Pack Lab opens without a script error.
7. Confirm Game Status degrades gracefully if a source is blocked.
8. Confirm Wikelo local artwork appears.
9. Export a small Picture Studio PNG.
10. Confirm Commodity Trading and Mining Resources open and retain selections after reload.
