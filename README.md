<!--
  Vibe Code Tours — Project Starter
  A ready-to-build repo with CI, security scanning, and team practices baked in.
  Click "Use this template" → "Create a new repository" to start your project.
  Then replace THIS README with your project's own (keep the Quickstart working).
-->

# Fundraising Website

A web-based preorder management platform that helps community fundraising events manage food orders, payment confirmations, and pickup preparation through a centralized website.

![ci](../../actions/workflows/ci.yml/badge.svg) ![security](../../actions/workflows/security.yml/badge.svg)

<!-- A screenshot or GIF of the app goes here — it's the best README section. -->

---

## Prerequisites

### 1. Node.js (Required)

```bash
node --version  # v20+ required
npm --version
```

### 2. MySQL

A running MySQL instance is required for the backend database.

### 3. Git

```bash
git --version
```

---

## Quickstart

Keep this Quickstart working — it's how a new teammate onboards in 5 minutes.

```bash
git clone <repo-url> && cd <repo>
cp .env.example .env                    # fill in real values LOCALLY — never commit .env
cd app && npm install                   # install all dependencies (workspaces)
```

Create a `.env` file inside `app/packages/server`:

```env
DATABASE_URL="mysql://user:your_password@localhost:3306/fundraising"
OPENAI_API_KEY=your_openai_key
MY_AWS_REGION=your_region
MY_AWS_ACCESS_KEY_ID=your_key
MY_AWS_SECRET_ACCESS_KEY=your_secret
MY_AWS_S3_BUCKET_NAME=your_bucket
```

Replace with your actual credentials.

Run database migrations

```bash
cd app/packages/server && npx prisma migrate dev
```

Add sample data

Reference files:
[Sample Data](./app/packages/server/docs/sample-data.sql)
[Sample Data](./app/packages/server/docs/migration_add_july2026_menu_items.sql)

Run both files from the project root:

```bash
mysql -u your_username -p your_database_name < app/packages/server/docs/sample-data.sql
mysql -u your_username -p your_database_name < app/packages/server/docs/migration_add_july2026_menu_items.sql
```

Replace your_username and your_database_name with your actual MySQL credentials.

From the project root, run both simultaneously:

```bash
cd app
npm run dev
```

This uses `concurrently` to start the backend on `http://localhost:3000` and the frontend on `http://localhost:5173` or `http://localhost:5174`.

Or start them individually:

```bash
# Backend only
cd app/packages/server && npm run dev

# Frontend only
cd app/packages/client && npm run dev
```

## Stack

### Frontend (`packages/client`)

- React
- TypeScript
- TailwindCSS

### Backend (`packages/server`)

- Express.js
- TypeScript
- Prisma ORM
- MySQL

### Tooling

- Prettier (code formatting)
- Husky + lint-staged (pre-commit hooks)
- ESLint (client and server)

### Storage

- Amazon S3 for payment screenshots

### AI

- OpenAI API for optional chatbot assistance

### Deployment

- Frontend: Netlify
- Backend: Netlify Functions (serverless via `serverless-http`)

## Project structure

| Path       | What                               |
| ---------- | ---------------------------------- |
| `app/`     | application code                   |
| `tests/`   | tests                              |
| `docs/`    | ARCHITECTURE.md + decision records |
| `.github/` | CI, security, PR/issue templates   |

## Team

<!-- Members + this week's roles (Anchor / Reviewer). Link your board. -->

---

## What's already set up for you

This repo was created from the **Vibe Code Tours project starter**. It ships with:

| File                                                                  | Gives you                                                                           |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                                            | lint · typecheck · test · build on every PR (stays green until you add each script) |
| `.github/workflows/security.yml`                                      | gitleaks (leaked keys) + semgrep (SAST) — advisory, report-only                     |
| `.github/dependabot.yml`                                              | weekly PRs for vulnerable / outdated dependencies                                   |
| `.env.example`                                                        | secret hygiene — copy to `.env`, never commit real keys                             |
| `.github/pull_request_template.md` · `ISSUE_TEMPLATE/` · `CODEOWNERS` | small reviewed PRs, one-owner issues                                                |
| `docs/ARCHITECTURE.md` · `docs/decisions/`                            | a 1-page overview + lightweight ADRs                                                |
| `working-agreement.md`                                                | how your team works (GitHub Flow + rotating roles)                                  |

**First thing to do:** follow [`SETUP.md`](./SETUP.md) — a ~1-hour checklist to turn it all on.

**Git rule:** branch → PR → 1 teammate review → merge. No push to `main`, no self-merge.

> A green pipeline ≠ secure. Scanners catch leaked keys, known-CVE deps, and injection
> patterns. They do **not** catch prompt-injection, over-scoped tokens, or hallucinated
> packages — a human still reviews for those.
