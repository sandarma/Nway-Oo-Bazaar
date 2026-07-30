# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fundraising Website — a web-based preorder management platform for community fundraising events. Helps organize food orders, payment confirmations, and pickups.

## Common Commands

### Development

```bash
# Run both frontend and backend
cd app && npm run dev

# Run individually
cd app/packages/client && npm run dev   # Frontend (Vite, port 5173/5174)
cd app/packages/server && npm run dev  # Backend (Express, port 3000)
```

### Database

```bash
cd app/packages/server && npx prisma migrate dev  # Run migrations
```

### Linting & Formatting

```bash
# Lint
cd app/packages/client && npm run lint
cd app/packages/server && npm run lint

# Format (pre-commit hook runs this automatically)
cd app && npm run format
```

### Build

```bash
cd app/packages/client && npm run build  # Production build
```

## Architecture

```
[frontend] --> [backend] --> [data]
                   |
                   v
             [AI / LLM proxy]
```

### Backend (Express + Prisma + MySQL)

**Layered architecture:** Controller → Service → Repository

- `app/packages/server/index.ts` — Express entry point
- `app/packages/server/routes.ts` — All API routes defined here
- `app/packages/server/controllers/` — Request validation (Zod), error handling
- `app/packages/server/services/` — Business logic, orchestration
- `app/packages/server/repositories/` — Prisma queries, database transactions
- `app/packages/server/prisma.ts` — Singleton Prisma client (global cache pattern)

**Key patterns:**

- Stock management is transactional — order creation/cancellation/updates use `prisma.$transaction`
- Order numbers follow format: `ORD-YYYYMMDD-NNNN` (NZ timezone)
- Menu items have categories: `MAIN_DISH`, `SNACK`, `DESSERT`, `DRINK`
- Order statuses: `PENDING` → `CONFIRMED` → `COMPLETED` (or `CANCELLED`)

**External services:**

- OpenAI API (gpt-4o-mini) — chatbot and order extraction via `llm/client.ts`
- Amazon S3 — payment screenshot uploads via `utils/s3.ts` and `services/payment.service.ts`

### Frontend (React + Vite + TailwindCSS)

- `app/packages/client/src/App.tsx` — React Router routes
- `app/packages/client/src/pages/` — Page components
- `app/packages/client/src/components/` — Reusable components
  - `chat/` — ChatBot with phase-based conversation flow (choose_event → show_menu → choose_items → collect_profile → confirm → placed)
  - `layout/` — NavLayout wrapper

**Key libraries:** react-router-dom, axios, react-hook-form, shadcn, react-icons, react-markdown, @base-ui/react

## Data Model (Prisma)

```
Event → MenuItem (1:N, cascade delete)
Event → Order (1:N, cascade delete)
Customer → Order (1:N)
Order → OrderItem (1:N)
MenuItem → OrderItem (1:N)
```

- `MenuItem` has `@@unique([eventId, itemCode])` constraint
- `Customer` identified by phone number (indexed)
- `OrderItem` stores `unitPrice` and `subtotal` at time of order

## Environment Variables

Required in `app/packages/server/.env`:

- `DATABASE_URL` — MySQL connection string
- `OPENAI_API_KEY` — OpenAI API key
- `PORT` — Server port (default: 3000)
- `MY_AWS_REGION` — AWS region for S3
- `MY_AWS_ACCESS_KEY_ID` — AWS access key for S3
- `MY_AWS_SECRET_ACCESS_KEY` — AWS secret key for S3
- `MY_AWS_S3_BUCKET_NAME` — S3 bucket name for payment screenshots

## Git Workflow

### Git Workflow & Branching Strategy

Our team uses a Feature-Isolation Workflow. The develop branch is used exclusively for shared testing (Staging/Sandbox), while features are merged into main individually via Pull Requests (PR) from their respective feature branches.

### Branch Roles

- **main:** Production-ready code. Always stable and deployable.
- **develop:** Testing environment. Contains all ongoing features mixed together for staging.
- **<feat_branch>:** Isolated development branch for a specific feature/bugfix.

### Step-by-Step Guide for Developers and AI (Claude Code)

#### 1. Start a New Feature

Always branch out from the latest `main`, NOT from `develop`.

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

#### 2. Testing Your Feature on Develop

When your feature is ready for the team to test, merge it into `develop`. Do not worry, this will not overwrite other features in `develop`.

```bash
# Switch to develop and update it
git checkout develop
git pull origin develop

# Merge your feature into develop
git merge feat/your-feature-name

# Push to deploy/test
git push origin develop
```

> Note: If there is a merge conflict on `develop`, resolve it locally before pushing.

#### 3. Deploying to Production (Merging to `main`)

Once the feature is tested and approved on `develop`, **DO NOT create a PR** from `develop` to `main`. Instead, create a PR from your **isolated feature branch** directly to `main`.

1. Go to GitHub.
2. Create a **Pull Request**.
3. Set **Base**: `main` ← **Compare:** `feat/your-feature-name`.

#### Important Rules to Follow

1. **Never PR** `develop` into `main` – doing so will accidentally push unfinished/unwanted testing features to production.
2. **Keep Feature Branches Clean – Never merge** `develop` back into your `<feat_branch>`. If you need updates from other merged features, pull from `main` instead.

#### Request a Code Review. Once approved, merge the PR and close it.

- Branch → PR → 1 teammate review → merge
- No direct pushes to `main`, no self-merges
- Pre-commit: lint-staged runs Prettier on staged files
- CI: lint → typecheck → test → build on every PR

## AI + Human Collaboration Workflow

To ensure seamless coordination between the Developer (Human) and Claude (AI), this project enforces an Agentic Development Workflow guided by state tracking.

### Phase 1: Pre-Execution & Safety Checks (CRITICAL)

Before writing any code or analyzing the task, AI must perform the following checks:

1. **Branch Check:** Check the current active Git branch.

   - ⚠️ **Warning Rule:** If the active branch is `main` or `develop`, **STOP IMMEDIATELY**. Do not implement changes. Warn the user that they are on a protected branch and explicitly ask for confirmation/permission to proceed.

2. **Context Sync:** Read the existing `doc/<current-branch-name>/state.md` file (if it exists) to restore memory and context from previous sessions.

### Phase 2: Planning

- **Small Tasks:** Proceed directly using Claude's standard internal planning.

- **Large Tasks:** Prioritize planning before coding. Create a directory structure: `doc/<current-branch-name>/<task_name>_plan.md`. Write down the implementation plan and wait for human approval.

### Phase 3: Implementation & State Logging

1. AI implements the codebase changes based on the approved plan or task.
2. Immediately after implementation, AI must update or create the state log file at:
   `doc/<current-branch-name>/state.md`
3. **Appending Rule:** The new log entry must be appended to the **TOP** of the `state.md` file using the exact format provided in `TEMPLATE_state.md`.
4. The entry heading `## [YYYY-MM-DD HH:MM AM/PM] <type>: <description>` **MUST** serve as the official Git commit message.

### Phase 4: Manual Testing & Iteration

1. After updating `state.md`, AI must **STOP** and hand over control to the human developer.
2. The Human performs **Manual Testing** (No automated tests required).
3. If issues are found, the Human will instruct AI to modify the code. AI will repeat **Phase 3** and append a new entry to `state.md`.

### Phase 5: Commit & Push

1. Once testing passes, the Human (or AI, if instructed) will commit and push the changes.
2. The commit message must strictly match the latest heading text from the top of `state.md`.

## Team

- Client liaison: @sandarma
- CEO (Chief Everything Officer 😜) - @lwinmoe51
- @rolexstar27
- @nyein-sat-thaw
