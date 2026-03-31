#!/bin/sh

set -eu

if ! command -v trekker >/dev/null 2>&1; then
  printf '%s\n' 'Trekker: CLI not found. Install `@obsfx/trekker` to enable Trekker workflows in Codex.'
  exit 0
fi

if [ ! -d ".trekker" ]; then
  printf '%s\n' 'Trekker: no `.trekker` directory in this workspace. Run `trekker init` when you want persistent task tracking.'
  exit 0
fi

in_progress="$(trekker --toon task list --status in_progress 2>/dev/null || true)"
ready="$(trekker --toon ready 2>/dev/null || true)"
history="$(trekker --toon history --limit 5 2>/dev/null || true)"

printf '# Trekker Session Context\n\n'
printf '%s\n\n' 'Search first with `trekker search "<keyword>"` before creating or updating tracked work.'

if [ -n "$in_progress" ]; then
  printf '## In-Progress Tasks\n\n'
  printf '%s\n\n' "$in_progress"
elif [ -n "$ready" ]; then
  printf '## Ready Tasks\n\n'
  printf '%s\n\n' "$ready"
else
  printf '%s\n\n' 'No in-progress or ready tasks found.'
fi

if [ -n "$history" ]; then
  printf '## Recent Activity\n\n'
  printf '%s\n' "$history"
fi
