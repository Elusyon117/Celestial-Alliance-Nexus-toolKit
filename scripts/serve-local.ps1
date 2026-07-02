$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host 'Serving Celestial Nexus at http://localhost:8080/'
python -m http.server 8080
