<!-- Sync Impact Report
Version change: 0.0.0 → 1.0.0 (initial ratification)
Added sections: Core Principles (I–VII), Stack & Constraints, Development Workflow, Governance
Templates requiring updates: ✅ constitution.md written from scratch
Follow-up TODOs: none
-->

# Ygor Luan Pro Constitution

## Core Principles

### I. TDD First (NON-NEGOTIABLE)
TDD is the primary methodology. Every new feature or significant change MUST follow Red → Green → Refactor.
Tests MUST be written before implementation code. Tests define the expected behavior.
The cycle is: write failing tests → run `pnpm test:unit` (must FAIL) → implement minimum code → run `pnpm test:unit` (must PASS) → refactor → tests still pass.
Skipping TDD is not permitted under any circumstances.

### II. Clean Code & Naming
Names MUST be descriptive and intention-revealing. Functions MUST have a single, clear purpose.
Dead code and unnecessary comments are forbidden. Self-documenting code is the standard.
File naming: kebab-case. Components: PascalCase. Functions/variables: camelCase. Constants: SCREAMING_SNAKE_CASE. Types/Interfaces: PascalCase.

### III. SOLID Principles
Single Responsibility: each module, component, and function does one thing.
Services in `src/services/` contain business logic only. Pages/islands handle presentation only.
Dependencies MUST be injectable and mockable for testing. Pure functions preferred where possible.

### IV. KISS & YAGNI
Simplest solution that passes the tests is the right solution.
No feature is built for hypothetical future requirements.
No premature abstractions, wrappers, or extra layers without concrete, immediate need.
Three similar lines of code is better than a premature abstraction.

### V. Strict TypeScript (No `any`)
`any` is strictly forbidden. Use explicit types, `unknown` with narrowing, generics, or utility types.
All Supabase query results MUST be typed against `src/types/database.types.ts`.
`strict` mode is enabled in `tsconfig.json` and must remain enabled.

### VI. Security First
RLS must be enabled on all Supabase tables. Service role key (`SUPABASE_SERVICE_ROLE_KEY`) must never be exposed to the frontend.
Secrets MUST be in `.env` — never committed. All user input MUST be validated at system boundaries.
HMAC signatures on webhooks (`timingSafeEqual`). No `any` cast to bypass type safety in auth/payment flows.

### VII. No Comments in Code
Well-written code does not need comments. Clear names and small functions ARE the documentation.
Architectural decisions belong in PR descriptions or this constitution, never in inline comments.
Exception: JSDoc on exported public APIs only when consumed by other packages.

## Stack & Constraints

### Technology Stack (LOCKED)
Frontend: Astro 5 (SSR mode, `@astrojs/vercel` adapter) + React 19 Islands + Tailwind CSS 3.
Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions — Deno runtime).
Payment: Cakto webhook (migrated from Mercado Pago).
Email: Resend + templates in `src/lib/email-templates/`.
Tests: Vitest 4 (unit + integration) + Playwright (E2E). Package manager: pnpm.

### Testing Distribution
Unit tests: 70% of coverage. Integration tests: 20%. E2E (Playwright): 10%.
All new services MUST have unit tests. All API routes MUST have integration tests.
No mocking databases in integration tests — use real Supabase test instance.

### Design System (LOCKED)
See `docs/design-brief.md`. CSS tokens defined in `src/styles/global.css`.
Flat design: no box-shadows — borders replace shadows.
Color palette: espresso/mahogany/tobacco (backgrounds), cream/parchment/fade (text), copper (accent).
Border-radius: 2px standard. Transitions: 0.2s ease standard.

## Development Workflow

### Feature Development
All new features MUST start with `/speckit.specify` to create a spec before any code is written.
Spec defines: goal, user stories, acceptance criteria, scope boundaries, test strategy.
Implementation ONLY starts after spec is approved by the user.

### Quality Gates
Every PR MUST: pass `pnpm type-check` (0 TypeScript errors), pass `pnpm test:unit` (all tests), have no `any` types.
Code review: use `/speckit.checklist` before marking PR as ready.

### Commit Convention (Conventional Commits)
`feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`
Example: `feat(quiz): adiciona limite de tentativas por módulo`

## Governance

This constitution supersedes all other development practices except explicit user instructions.
Amendments require: documenting the change, version bump per semantic versioning, update to `LAST_AMENDED_DATE`.
All specs, plans, and PRs must verify compliance with these principles before merge.
Complexity must be justified against KISS/YAGNI — if it cannot be justified, it is not built.

**Version**: 1.0.0 | **Ratified**: 2026-04-01 | **Last Amended**: 2026-04-01
