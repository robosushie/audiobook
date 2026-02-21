# Audiobook

A monorepo containing the mobile app, web app, and API service for the Audiobook platform.

## Repository structure

```text
apps/
├── mobile/          # Expo (React Native) mobile app
└── web/             # Next.js web app
src/                 # Python FastAPI backend + workers
docs/                # Architecture and design docs (primarily for AI context)
scripts/             # Developer CLI runner
```

> **Note on `docs/`:** The documentation in `docs/` is written primarily as context for AI coding assistants (e.g. Cursor). It captures architectural decisions, conventions, and known pitfalls so the AI doesn't repeat past mistakes. Read it if you're curious, but you don't need to follow it as a manual.

---

## Prerequisites

Make sure these are installed on your machine before starting.

| Tool | Version | Purpose |
| --- | --- | --- |
| Node.js | 20+ | JavaScript runtime |
| pnpm | 9+ | Monorepo package manager |
| Python | 3.12.x | API and migration tooling |
| Poetry | 2.x | Python dependency manager |
| PostgreSQL | 15+ | Database (local or Docker) |

---

## First-time setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd Audiobook
```

### 2. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and replace every placeholder:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=audiobook
```

Get the Clerk keys from the [Clerk dashboard](https://dashboard.clerk.com). The database values must match your local PostgreSQL setup (see step 5).

### 3. Install JavaScript dependencies

```bash
pnpm install
```

### 4. Set up the Python virtual environment

```bash
poetry install
```

This creates a `.venv` folder at the root and installs all Python dependencies listed in `pyproject.toml` (FastAPI, SQLModel, Alembic, psycopg2, etc.).

> All `pnpm run` scripts that invoke Python automatically use `.venv`. You never need to activate the venv manually.

### 5. Start PostgreSQL

#### Option A — Docker (recommended, no local install needed)

```bash
docker run -d \
  --name audiobook-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=audiobook \
  -p 5432:5432 \
  postgres:16
```

#### Option B — Local PostgreSQL

Make sure PostgreSQL is running, then create the database manually:

```bash
psql -U postgres -c "CREATE DATABASE audiobook;"
```

Or use the script (reads credentials from `.env` automatically):

```bash
pnpm run db:create
```

### 6. Run database migrations

```bash
pnpm run db:upgrade
```

This applies all pending migrations and creates the tables in the database.

---

## Running the apps

### API

| Command | What it does |
| --- | --- |
| `pnpm run service:api` | Start the FastAPI backend on `http://localhost:8000` |

### Web

| Command | What it does |
| --- | --- |
| `pnpm run app:web dev` | Start the Next.js web app on `http://localhost:3000` |

### Mobile

The mobile app is built with Expo. The `app:mobile` script accepts any Expo CLI command as its argument.

| Command | What it does |
| --- | --- |
| `pnpm run app:mobile start` | Start the Expo dev server (scan QR with Expo Go) |
| `pnpm run app:mobile android` | Run on a connected Android device or emulator |
| `pnpm run app:mobile ios` | Run on a connected iOS device or simulator (macOS only) |
| `pnpm run app:mobile web` | Run in the browser |

#### Android requirements

- Install [Android Studio](https://developer.android.com/studio)
- Open **Android Studio → Virtual Device Manager** and create an emulator (Pixel 6, API 34 recommended), or connect a physical device via USB with USB debugging enabled
- Make sure `ANDROID_HOME` is set in your environment and `adb` is on your `PATH`

```bash
pnpm run app:mobile android
```

#### iOS requirements (macOS only)

- Install Xcode from the App Store
- Install Xcode Command Line Tools: `xcode-select --install`
- Accept the Xcode license: `sudo xcodebuild -license`
- Open Simulator from Xcode or let Expo launch it automatically

```bash
pnpm run app:mobile ios
```

#### Physical device (any OS)

Install the **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), start the dev server, and scan the QR code:

```bash
pnpm run app:mobile start
```

---

## Database scripts

All database commands are run via `pnpm`. They read credentials from `.env` and use the `.venv` Python environment automatically.

| Command | What it does |
| --- | --- |
| `pnpm run db:create` | Creates the database if it does not already exist |
| `pnpm run db:make "description"` | Generates a new migration file from model changes |
| `pnpm run db:upgrade` | Applies all pending migrations (`upgrade head`) |

### Migration workflow

Any time you change a SQLModel table model, you need to generate and apply a migration:

```bash
# 1. Generate a migration file describing your changes
pnpm run db:make "add column foo to users"

# 2. Review the generated file in src/alembic/versions/
#    Make sure the upgrade() and downgrade() functions look correct.

# 3. Apply it
pnpm run db:upgrade
```

Migration files are committed to the repo. Everyone on the team runs `pnpm run db:upgrade` after pulling changes that include new migration files.

### Fresh clone checklist (quick reference)

```bash
git clone <repo-url> && cd Audiobook
cp .env.example .env        # fill in your values
pnpm install                 # JS deps
poetry install               # Python deps + .venv
pnpm run db:create           # create the database
pnpm run db:upgrade          # apply all migrations
pnpm run service:api         # start the API
```

---

## Project scripts reference

All scripts live in `scripts/run.py` and are exposed through `package.json`. You can call them via `pnpm run <script>`.

| Script | Arguments | Description |
| --- | --- | --- |
| `db:create` | — | Create the app database (reads `.env`) |
| `db:make` | `"migration name"` | Autogenerate an Alembic migration |
| `db:upgrade` | — | Apply all pending migrations |
| `app:mobile` | `<pnpm script>` | Run a script inside `apps/mobile` |
| `app:web` | `<pnpm script>` | Run a script inside `apps/web` |
| `service:api` | — | Start the FastAPI server |
