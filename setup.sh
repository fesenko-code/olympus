#!/usr/bin/env bash
# Olympus setup — clone the repo, link the 7 god skills into Hermes, reload.
# No API keys, no Docker, no OAuth. Works on Linux / macOS / Windows (git-bash).
set -euo pipefail

REPO_URL="https://github.com/fesenko-code/olympus.git"

# Resolve the Hermes skills directory (where Hermes loads SKILL.md from).
if [ -n "${HERMES_HOME:-}" ]; then
  HERMES_SKILLS="$HERMES_HOME/skills"
elif [ -d "$HOME/.hermes/skills" ]; then
  HERMES_SKILLS="$HOME/.hermes/skills"
elif [ -n "${USERPROFILE:-}" ] && [ -d "$USERPROFILE/AppData/Local/hermes/profiles/brain/skills" ]; then
  HERMES_SKILLS="$USERPROFILE/AppData/Local/hermes/profiles/brain/skills"
else
  HERMES_SKILLS="$HOME/.hermes/skills"
fi

OLYMPUS_DIR="$HERMES_SKILLS/olympus"
GODS=(zeus athena hermes-ag hades hera apollo hephaestus)

echo "[olympus] Hermes skills dir: $HERMES_SKILLS"

# 1. Clone (or update) the Olympus repo.
if [ ! -d "$OLYMPUS_DIR/.git" ]; then
  echo "[olympus] Cloning $REPO_URL"
  git clone --depth 1 "$REPO_URL" "$OLYMPUS_DIR"
else
  echo "[olympus] Repo exists — pulling latest"
  git -C "$OLYMPUS_DIR" pull --ff-only || true
fi

# 2. Link each god skill so Hermes sees it as 'olympus-<god>'.
mkdir -p "$HERMES_SKILLS"
for god in "${GODS[@]}"; do
  src="$OLYMPUS_DIR/skills/$god"
  dst="$HERMES_SKILLS/olympus-$god"
  if [ -d "$src" ]; then
    # Symlink when possible; fall back to copy (e.g. cross-drive on Windows).
    ln -sf "$src" "$dst" 2>/dev/null || cp -r "$src" "$dst"
    echo "  linked olympus-$god"
  else
    echo "  skip olympus-$god (missing $src)"
  fi
done

# 3. Reload Hermes so the new skills are registered.
echo "[olympus] Reloading Hermes profiles"
if command -v hermes >/dev/null 2>&1; then
  hermes profiles reload
else
  echo "[olympus] 'hermes' not on PATH — run 'hermes profiles reload' manually."
fi

echo "[olympus] Done. Try: 'Use olympus-zeus to plan this feature.'"
