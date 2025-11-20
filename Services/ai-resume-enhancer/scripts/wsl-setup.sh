#!/usr/bin/env bash
# WSL helper: install system deps, create venv and install python deps
set -euo pipefail

echo "Installing system packages..."
sudo apt update
sudo apt install -y build-essential python3.11 python3.11-venv python3.11-dev libpq-dev libssl-dev libffi-dev libmagic-dev git

WORKDIR="$(pwd)"
echo "Working directory: $WORKDIR"

if [ ! -d ".venv" ]; then
  echo "Creating venv with python3.11"
  python3.11 -m venv .venv
fi

echo "Activating venv and installing Python packages..."
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "Done. Activate with: source .venv/bin/activate"