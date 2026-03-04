# Mission Control

Personal **Mission Control** for tracking work across:
- your own tasks (Kanban)
- OpenClaw **sub-agent spawns** (import runs into tasks)
- OpenClaw **sessions** (quick visibility)

Built with **Next.js App Router + Tailwind + Prisma (SQLite)**.

## What's in here

- `/board` - Task Board (Inbox / Doing / Waiting / Blocked / Done)
- `/tasks` - Tasks list view (Linear-ish)
- `/notes` — Markdown notes stored in the vault (Notion-ish, but files)
- `/sketches` — Excalidraw sketches stored in the vault
- `/openclaw` — edit OpenClaw workspace files (SOUL/HEARTBEAT/MEMORY/etc.)
- `/mail` - Gmail watch rules (via `gog gmail search`) + one-click "create task"
- `/g-tasks` - Google Tasks (via `gog tasks`) + import to board
- Task detail page - push a Mission Control task into Google Tasks
- `/runs` - parses OpenClaw session JSONL logs and finds `sessions_spawn` tool calls
- `/sessions` - reads OpenClaw `sessions.json`

## Setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

## Docker

This app runs well in Docker, but it needs **volume mounts** for:
- the sqlite DB (optional but recommended)
- OpenClaw home (to read sessions/runs)
- the vault directory (notes + sketches)

### Docker Compose (recommended)

From the repo root:

```bash
docker compose up --build
```

Then open: http://localhost:3010

Edit `docker-compose.yml` if your vault/OpenClaw paths differ.

Open: http://localhost:3000 (redirects to `/board`).

## Keyboard shortcuts

- `Cmd/Ctrl + K` - command palette
- `C` - new task
- `G` then `B/T/N/D/O/M/G/R/S` - go to Board / Tasks / Notes / Sketches / OpenClaw / Mail / Google Tasks / Runs / Sessions

### SQLite driver

This uses Prisma v7 with the **better-sqlite3** driver adapter (`@prisma/adapter-better-sqlite3`).
If `npm install` fails on your machine, you may need basic build tooling (make/g++/python) for native modules.

## Environment

### Database

Default `.env` uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

### Vault (notes + sketches)

Notes and sketches are stored as files outside the repo in a vault directory.

Set in `.env`:

```env
MISSION_CONTROL_VAULT_DIR="../../mission-control-vault"
```

The vault contains:
- `notes/` (Markdown)
- `sketches/` (Excalidraw JSON)

### OpenClaw log location

By default this reads from:

```text
~/.openclaw/agents/main/sessions
```

Override with:

```bash
export OPENCLAW_HOME=/path/to/.openclaw
```

### Gmail (optional)

The `/mail` page shells out to the local `gog` CLI.

- Ensure `gog login you@company.com` has been run on this machine.
- Optionally set `GOG_ACCOUNT` in `.env`.

### Google Tasks (optional)

The `/g-tasks` page shells out to:

- `gog tasks lists list`
- `gog tasks list <tasklistId>`
- `gog tasks add/done/undo ...`

Make sure your gog token includes the `tasks` service.

You can also create a Google Task directly from any Mission Control task on `/tasks/:id`.

## Notes / security

- This MVP can be protected with an **auth gate** (HTTP Basic Auth via `middleware.ts`).
  - Set `MC_AUTH_PASSWORD` (and optionally `MC_AUTH_USER`) in `.env`.
- OpenClaw session logs may contain sensitive data. Treat this app as a privileged internal tool.

## Roadmap ideas

- Drag & drop between columns
- Auto-sync task status from sub-agent completion events
- ACP session ingestion (if/when ACP emits structured events)
- "Tools" registry: build internal tools as pages with server actions
