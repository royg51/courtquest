# CLAUDE.md (courtquest)

Project-specific guidance for working in `courtquest/`. See the root [`/Users/roygutta/Coding/CLAUDE.md`](../CLAUDE.md) for the overall workspace structure and architecture overview — this file only adds rules specific to this project.

## Working style

- Senior production engineer mindset: prefer minimal, production-safe changes over broad rewrites.
- Before editing, briefly state what will change and which files are affected.
- Don't refactor or modify unrelated code/files while doing a focused task.
- Don't introduce new architecture, libraries, or UI frameworks unless the task requires it.
- When a task is done, summarize what changed and suggest the next logical step only if relevant.

## TypeScript & Prisma safety

- No `any` types.
- Prisma queries must be safe and properly typed — no unchecked raw queries.
- Auth/session logic must stay minimal and correct; don't duplicate auth logic across files — route through `lib/auth.ts`.

## Auth rules

- Auth.js is the source of truth for session state.
- `middleware.ts` protects `/dashboard/*`, `/organizer/*`, `/admin/*`, `/api/admin/*` (see file for exact matcher). Role checks beyond "is logged in" happen in routes/pages via `requireRole()` from `lib/auth.ts`, since middleware only has the JWT, not DB access.
- Public routes: `/`, `/login`, `/signup`, `/api/auth/*`.

## Frontend conventions

- Next.js App Router conventions only.
- Prefer server components; use client components only when client state/interactivity is required.
- Tailwind only — no extra UI frameworks unless explicitly requested (Radix UI primitives already in use are fine).

## Git workflow

- Use feature branches (e.g. `dev/auth-ui`, `dev/middleware`).
- Conventional Commits format: `feat:`, `fix:`, `chore:`, `refactor:`.
  - Example: `feat(auth): add login page UI scaffold`
  - Example: `fix(auth): correct middleware redirect logic`
- Stage only the files relevant to the change — never broad `git add -A`.
- Never commit a build that doesn't pass `npm run build` / `npm run lint`.
