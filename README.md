# kodrkoder-5-hack

Monorepo with a Next.js frontend and two backends (Node.js/Express and Flask), managed with
npm workspaces and [Turborepo](https://turbo.build).

## Structure

```
apps/
├── web/        # Next.js app            http://localhost:3000
├── api/        # Express + TypeScript   http://localhost:4000
└── flask-api/  # Flask                  http://localhost:5001
```

| App       | Stack               | Health check              |
| --------- | ------------------- | ------------------------- |
| web       | Next.js 16          | http://localhost:3000     |
| api       | Express 5 + tsx     | http://localhost:4000/health |
| flask-api | Flask 3 + Python venv | http://localhost:5001/health |

## Prerequisites

- Node.js 24+ and npm
- Python 3.11+

## Setup

Install all JavaScript dependencies from the repo root (workspaces are hoisted):

```bash
npm install
```

Create the Flask virtual environment and install its dependencies:

```bash
# Windows (PowerShell)
python -m venv apps/flask-api/.venv
apps/flask-api/.venv/Scripts/python -m pip install -r apps/flask-api/requirements.txt

# macOS / Linux
python3 -m venv apps/flask-api/.venv
apps/flask-api/.venv/bin/python -m pip install -r apps/flask-api/requirements.txt
```

## Running the apps

Run everything at once (web + api + flask) with Turborepo:

```bash
npm run dev
```

Or run a single app:

```bash
npm run dev:web     # Next.js        -> http://localhost:3000
npm run dev:api     # Express API    -> http://localhost:4000
npm run dev:flask   # Flask API      -> http://localhost:5001
```

No need to activate the Python venv manually: `apps/flask-api/run.mjs` resolves the venv
interpreter automatically. Note Flask uses port 5001 because port 5000 may be reserved by
system services on Windows.

## Other commands

```bash
npm run build       # production build for web and api
npm run lint        # ESLint (web) + TypeScript check (api)
npm run typecheck   # type checks across workspaces
```

Turbo caches task results; use `npx turbo run <task> --force` to bypass the cache.
