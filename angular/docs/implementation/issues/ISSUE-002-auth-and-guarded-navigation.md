# ISSUE-002 — Authentication + Guarded Navigation

## Parent Docs
- `../../ANGULAR_ARCHITECTURE.md` (§4 `AuthService`, §7 `authGuard`, §9)
- `../../FRONTEND_BLUEPRINT.md` (§6.1, §6.2, §9 Auth flow)
- `../../FRONTEND_IMPLEMENTATION_PLAN.md` (Phase 1)

## Slice Metadata
- Type: AFK
- Blocked by: ISSUE-001
- User stories covered:
  - As an existing user, I can log in and reach protected pages.
  - As a new user, I can sign up with validation.
  - As an unauthenticated user, I am redirected from protected routes.

## What to build
Implement end-to-end auth for login/signup/logout with `AuthService` signal state, guard enforcement, loading states, and redirect-back behavior after successful authentication. `AuthService.init()` is the function called by `provideAppInitializer` (wired in ISSUE-001) — it resolves the session before any route activates.

## Acceptance criteria
- [x] `AuthService` exposes a `currentUser` signal and an `isInitialised` signal; `init()` populates both by calling `supabase.auth.getSession()`.
- [x] `authGuard` reads `currentUser` synchronously — this is safe because `provideAppInitializer` guarantees `init()` has resolved before any route guard runs.
- [x] Login and signup screens submit to auth backend and show loading + error/success states.
- [x] Successful login redirects to intended protected destination.
- [x] Navigation visibility rules are applied on auth pages versus protected pages.
- [x] Auth flow tests cover success, failure, redirect cases, and the `init()` bootstrap path.

## Blocked by
- Blocked by ISSUE-001.
