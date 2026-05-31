#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
unit_name="forgejo-stack.service"
old_unit_name="gitea-stack.service"
unit_path="/etc/systemd/system/${unit_name}"
old_unit_path="/etc/systemd/system/${old_unit_name}"

if systemctl list-unit-files "${old_unit_name}" --no-legend --no-pager | grep -q "^${old_unit_name}[[:space:]]"; then
  sudo systemctl disable --now "${old_unit_name}"
fi

sudo rm -f "${old_unit_path}"
sudo install -m 0644 "${repo_root}/systemd/${unit_name}" "${unit_path}"
sudo systemctl daemon-reload
sudo systemctl enable --now "${unit_name}"
systemctl status "${unit_name}" --no-pager
