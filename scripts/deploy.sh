#!/bin/bash
# Daily: add new NYT answers, then publish build/ to the gh-pages branch (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/answers.mjs public build
# Back up the answers on main too, so a fresh clone can rebuild without NYT.
git -c user.name="Csaba Palfi" -c user.email="csaba@palfi.co.uk" commit -q -m "answers $(date +%F)" -- scripts/answers.json && git push -q || true
out=$(mktemp -d); trap 'rm -rf "$out"' EXIT
cp -r build/. "$out/" && touch "$out/.nojekyll"
cd "$out" && git init -q -b gh-pages && git add -A
git -c user.name="Csaba Palfi" -c user.email="csaba@palfi.co.uk" commit -q -m "Deploy $(date +%F)"
git push -q -f https://github.com/csabapalfi/wordle.git gh-pages
