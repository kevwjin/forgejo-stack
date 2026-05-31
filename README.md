Local Forgejo stack: Forgejo + Postgres + Caddy + a small access-code gate.

Quick start
- `docker compose up -d`
- Open http://localhost and enter the `ACCESS_CODE` from `.env`.
- Cloudflare Tunnel is configured separately in `~/.cloudflared/config.yml` to send `git.kevwjin.com` to `http://localhost:80`.
- Start the tunnel with `cloudflared tunnel run gitea` if it is not already running.
- For SSH testing, use port 2222: `git clone ssh://git@localhost:2222/<owner>/<repo>.git`

Keep it running
- Install the systemd unit: `sudo install -m 0644 systemd/forgejo-stack.service /etc/systemd/system/forgejo-stack.service`
- Enable and start it: `sudo systemctl daemon-reload && sudo systemctl enable --now forgejo-stack.service`
- Check it: `systemctl status forgejo-stack.service --no-pager`

Notes
- Registration is disabled by default; invite users manually. Repos default to private.
- This is a fresh Forgejo install. Existing Gitea volumes are retained for rollback/manual export and are not reused automatically.
- Back up volumes `forgejo-data` and `forgejo-db-data`.
- Old Gitea volumes from the previous stack may still exist as `gitea-stack_gitea-data` and `gitea-stack_db-data`.
- Runtime secrets and host settings live in `.env`, which is intentionally ignored by git.
