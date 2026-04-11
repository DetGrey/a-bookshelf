# ISSUE-001 — Foundation Shell + Angular Guardrails

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§1, §2, §7, §12, §13)
- `../../FRONTEND_BLUEPRINT.md` (§2, §3)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 0)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-000
- User stories covered:
  - As a developer, I can start from a strict Angular baseline with enforced architecture boundaries.
  - As a user, I can load a stable app shell with route placeholders.

## What to build
Create the Angular app skeleton and architectural enforcement baseline: standalone components, `OnPush` defaults, strict TypeScript flags, ESLint boundaries rules, root route map, shell layout, SCSS token entrypoint, `SUPABASE_CLIENT` injection token, `provideAppInitializer` bootstrap hook, and foundational `Result<T>` error contract types.

## Acceptance criteria
- [x] `app.config.ts` wires providers, router, `provideAppInitializer` (calling `AuthService.init()`), and `SUPABASE_CLIENT` token.
- [x] `SUPABASE_CLIENT` injection token is defined in `core/supabase.token.ts` and provided via `useFactory` in `app.config.ts`.
- [x] `Result<T>`, `AppError`, and `ErrorCode` enum are defined in `models/result.model.ts` — used by all repository methods from ISSUE-003 onward.
- [x] `angular.json` schematics default all generated components to `OnPush`, standalone, and SCSS — no manual flags needed per component.
- [x] Route skeleton exists for `/login`, `/signup`, `/bookshelf`, `/dashboard`, `/add`, `/book/:bookId`.
- [x] Compiler and lint settings enforce `strict`, `strictTemplates`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `eslint-plugin-boundaries` import rules.
- [x] `styles.scss` contains import-only setup and token files are in place.
- [x] Minimal shell renders navigation + content outlet without feature logic.

## Blocked by
- Blocked by ISSUE-000.
