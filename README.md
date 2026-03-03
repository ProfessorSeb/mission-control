# Mission Control

Personal **Mission Control** for tracking work across:
- your own tasks (Kanban)
- OpenClaw **sub-agent spawns** (import runs into tasks)
- OpenClaw **sessions** (quick visibility)

Built with **Next.js App Router + Tailwind + Prisma (SQLite)**.

## What’s in here

- `/board` — Task Board (Inbox / Doing / Waiting / Blocked / Done)
- `/tasks` — Tasks list view (Linear-ish)
- `/mail` — Gmail watch rules (via `gog gmail search`) + one-click “create task”
- `/g-tasks` — Google Tasks (via `gog tasks`) + import to board
- `/runs` — parses OpenClaw session JSONL logs and finds `sessions_spawn` tool calls
- `/sessions` — reads OpenClaw `sessions.json`

## Setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Open: http://localhost:3000 (redirects to `/board`).

## Keyboard shortcuts

- `Cmd/Ctrl + K` — command palette
- `C` — new task
- `G` then `B/T/M/G/R/S` — go to Board / Tasks / Mail / Google Tasks / Runs / Sessions

### SQLite driver

This uses Prisma v7 with the **better-sqlite3** driver adapter (`@prisma/adapter-better-sqlite3`).
If `npm install` fails on your machine, you may need basic build tooling (make/g++/python) for native modules.

## Environment

### Database

Default `.env` uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

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

## Notes / security

- This MVP has **no auth**. Run it locally or behind your own access controls.
- OpenClaw session logs may contain sensitive data. Treat this app as a privileged internal tool.

## Roadmap ideas

- Drag & drop between columns
- Auto-sync task status from sub-agent completion events
- ACP session ingestion (if/when ACP emits structured events)
- “Tools” registry: build internal tools as pages with server actions
