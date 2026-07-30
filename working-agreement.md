# Working Agreement — Fundraising Website

> How this team works together. Agreed by all members. Sensible defaults — edit to fit,
> but keep each section answered.

## Communication

- Main channel: team Discord
- Async **standup** daily: post _yesterday / today / blockers_.
- Weekly **planning** (30–60 min) + a short **retro** each week.
- Expected response time on a mention: ~24h.

## Decisions

- Default: consensus. If stuck, the week's **Anchor** decides and records it as an ADR
  (`docs/decisions/`).
- Big choices (framework, DB, AI model, hosting) get a one-line ADR.
- For technical decisions related to architecture, the teammate responsible for that feature will propose a solution for team review.
- Any major changes to project scope or architecture should be discussed before implementation.

## Code & reviews

- **GitHub Flow:** branch off `main` (`feat/…` / `fix/…`) → PR → **1 review from a
  teammate (not the author)** → merge. **No direct push to `main`. No self-merge.**
- Keep PRs small (< ~300 lines). Open a **Draft PR** early.
- CI (`ci`) must be green. Never commit secrets or `.env`.
- Pull `main` daily to avoid merge conflicts.

- We use GitHub with feature branches.
- No one pushes directly to the main branch.
- Every feature should be developed in its own branch.
- Every Pull Request should be reviewed by at least one teammate before merging.
- Pull Requests should include a clear description of the changes made.
- Keep commits small, meaningful, and easy to review.

## Roles (rotate weekly)

Roles rotate throughout the project.

Current roles:

- **Anchor** — owns the board + `main` health + unblocking. (this week: \_\_\_\_)
- **Driver / Navigator** — pair on hard issues, swap who types.
- **Reviewer of the week** — first to review open PRs. (this week: \_\_\_\_)
- **Builder** - Focuses on implementing assigned features.

All members contribute to planning, implementation, testing, and documentation.

AI-assisted development is encouraged, but every team member is responsible for reviewing, understanding, and testing AI-generated code before it is merged.

## When someone is stuck or absent

- Say so early — being blocked is normal, staying silent is the problem.
- Pair with the Anchor or a teammate. Use `good-first-issue` labels for newer members.
- If a member goes quiet 3+ days, the Anchor checks in privately first.

---

## _Signed (all members):_

- @sandarma
- @rolexstar27
- @lwinmoe51
- @nyein-sat-thaw
