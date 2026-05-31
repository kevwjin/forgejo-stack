Local Forgejo stack: Forgejo + Postgres + Caddy + a small access-code gate.

Setup
- Install Nix and direnv.
- Copy `.env.example` to `.env`, fill in the values, and restrict the file: `chmod 600 .env`.
- Allow the repo environment: `direnv allow`.
- `.env` is ignored by git and is the runtime secret source for Docker Compose.

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
- systemd runs Docker Compose directly from this directory. It uses Compose's normal `.env` loading, not direnv.

Developer environment
- `.envrc` enters the Nix flake dev shell, loads `.env` if present, and validates required variables.
- `flake.nix` provides local tooling for Node, Docker Compose, direnv, age, and SOPS.
- Do not put secret values in Nix files or `.envrc`.

Future secret management
- A later upgrade can use SOPS with age: keep `secrets.env.enc` in git and decrypt only at runtime.
- Example local command: `sops exec-env secrets.env.enc 'docker compose up -d'`.
- For a NixOS-managed service, consider `sops-nix` or `agenix`.

Notes
- Registration is disabled by default; invite users manually. Repos default to private.
- This is a fresh Forgejo install. Existing Gitea volumes are retained for rollback/manual export and are not reused automatically.
- Back up volumes `forgejo-data` and `forgejo-db-data`.
- Old Gitea volumes from the previous stack may still exist as `gitea-stack_gitea-data` and `gitea-stack_db-data`.
- Runtime secrets and host settings live in `.env`, which is intentionally ignored by git.
