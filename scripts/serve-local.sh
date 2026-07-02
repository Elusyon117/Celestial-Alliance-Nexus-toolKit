#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
echo "Serving Celestial Nexus at http://localhost:8080/"
python3 -m http.server 8080
