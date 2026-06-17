# CardVault: SaaS → Consumer Transformation Plan

## How to read this document

**What I actually have:** the top-level README and your transformation brief. I do not have the repository itself — no `schema.prisma`, no NestJS controllers/services/guards, no Next.js pages, no Expo screens, no migration files, no auth middleware, no Stripe webhook handlers. The README tells me what apps exist, what scripts run them, what roles and routes exist by name, and the tech stack. It does not tell me how tenant isolation is actually implemented, what the Prisma schema looks like, or how authorization is wired.

So this plan operates at the level the README supports: architecture and migration strategy, not a line-by-line module audit. Every claim below is tagged:

- **[CONFIRMED]** — stated directly in the README
- **[INFERRED]** — a reasonable assumption from NestJS/Prisma/Next.js/Expo conventions, not verified
- **[UNKNOWN — VERIFY]** — something the real audit cannot skip, because the answer changes the plan

Before any coding agent executes the prompts in Phase 6, someone needs to resolve the **[UNKNOWN — VERIFY]** items against the actual code. I've written Phase 0 specifically to produce that resolution.

---

## Phase 0 — The audit I can't do yet, and how to unblock it

You asked for a deep module-by-module audit with KEEP/REFACTOR/REMOVE/REBUILD classifications and justification for each. That audit has to be grounded in actual files. Doing it from a README would mean guessing at a Prisma schema, guessing at how `tenantId` scoping is enforced, and guessing at guard implementations — and then handing an AI coding agent a sequence of prompts built on those guesses. If the guesses are wrong, the agent executes confidently against a system that isn't there.

Instead, here's the audit checklist itself — the exact things to look at, organized so that a few hours of reading (by you or an agent with repo access) fills in every classification this plan needs:

| Area | Files to open | What determines KEEP vs REFACTOR vs REMOVE vs REBUILD |
|---|---|---|
| Tenant isolation mechanism | `API/src/**/*.guard.ts`, `API/prisma/schema.prisma`, any `prisma-tenant-middleware` or similar | Is tenancy enforced via Postgres RLS, Prisma middleware, or per-query `where: { organizationId }`? This single answer changes almost every downstream step. |
| Auth strategy | `API/src/auth/**` | JWT claims shape — does the token carry `organizationId`, `role`, both? Refresh token storage (DB table vs stateless)? |
| Org/tenant data model | `schema.prisma` — `Organization`, `User`, and every model with an `organizationId` FK | Which tables are tenant-scoped vs already global? This is the literal map of what "removing multi-tenancy" touches. |
| WEB role gating | `WEB/middleware.ts` or route-group layouts, e.g. `app/(admin)/layout.tsx` | Is role-checking centralized (one middleware) or scattered per-page? Centralized = cheap to collapse to two roles. |
| MOBILE auth/session | `MOBILE/app/_layout.tsx` or equivalent, plus API client | Does it already assume single-user context, or does it carry org context anywhere (e.g. picking an org after login)? |
| Billing coupling | `API/src/billing/**`, webhook handler | Is Stripe billing tied to **organizations** or could it bind to a **user** with no schema change? README marks billing optional — confirm it's actually decoupled from auth/signup gating. |
| OCR pipeline | `API/src/ocr/**` | README says this is provider-abstracted (Google Vision / PaddleOCR) — almost certainly tenant-agnostic and fully reusable as-is. Low risk either way. |
| Seed data structure | `API/prisma/seed.ts` | Shows you the exact shape of demo orgs/users — fastest way to confirm the org model without reading every controller. |

Recommended sequencing: read `schema.prisma` first. Everything else — including whether "remove multi-tenancy" is a migration script or a schema rewrite — follows from how `organizationId` is modeled today.

---

## Phase 1 — Provisional module classification

Given the constraint above, here is the classification at the **app/module level** the README exposes, with the caveat that sub-module detail (individual controllers, individual screens) needs Phase 0's findings to confirm.

### KEEP — works as-is, no SaaS coupling implied by the README

- **OCR pipeline** (Google Vision primary, PaddleOCR fallback) — card scanning has no inherent tenant concept beyond "whose contact does this become." [INFERRED: provider abstraction is clean since README documents two interchangeable providers via one env var]
- **MOBILE shell**: tab structure (Home, Contacts, Export, Profile) and Scan/Events flows. A field-sales scanning app and a consumer card-scanning app want the same primitives: scan → review → save → export.
- **Storage layer** (local fs dev / Supabase prod) — storage doesn't care whose contact it's storing.
- **Core Contact data model and CRUD** — scanning, storing, searching, exporting one user's contacts is the actual product, SaaS or not.
- **Export functionality** — already a feature for `employee` role; consumer users want the same capability (export their contacts to CSV/vCard/etc.).
- **JWT-based auth mechanism itself** (login, token issuance) — the *mechanism* survives; what changes is what claims go in the token and what self-registration looks like.

### REFACTOR — real and useful, but currently shaped around organizations

- **Authentication & user model** — [UNKNOWN — VERIFY: does `User` have a required `organizationId` FK, or is it nullable/optional already?] If required, this is a schema migration, not just an app-layer change. The login flow itself (JWT issuance) likely needs no change; what changes is removing the org-selection/org-context step if one exists, and opening self-registration (currently: none of the seeded roles self-register, per the demo account table — there's no signup flow visible in the README at all, which itself is something Phase 0 needs to confirm: does a signup endpoint exist today, even if unused?).
- **Authorization / RBAC** — collapsing `employee / manager / platform_super_admin` into `user / super_admin`. [INFERRED: if WEB's role-gating is centralized middleware, this is a small, safe change. If it's scattered `if (user.role === 'manager')` checks across many files, it's a larger, riskier one — Phase 0's WEB row determines which.]
- **WEB admin console** — dashboard, analytics, users, audit log, export, billing routes mostly map directly onto Super Admin needs ("manage notifications," "manage reports," "access analytics," "access audit logs," "moderate users" are nearly a 1:1 restatement of WEB's existing route list). The **organizations** route (platform-super-admin-only per the README) is the one piece this app loses entirely.
- **Billing** — Stripe checkout/portal/webhooks. README marks this optional today; for a consumer app with "millions of users," billing likely becomes mandatory eventually (in-app purchase / subscription), but the *infrastructure* (Stripe webhooks, checkout sessions) is reusable. What needs to change is the subject of billing: organization → individual user.
- **Database schema** — see Phase 3. Reusable in structure; the tenant-scoping column is what's being removed or repurposed, not the tables themselves.

### REMOVE — exists specifically because this is multi-tenant SaaS

- **Organizations / Organization model as a first-class entity** — replaced by a flat user base. [UNKNOWN — VERIFY: whether `Organization` is referenced by foreign key from many tables (high removal cost) or just a couple (low cost) — this is the single biggest unknown in the whole plan, and Phase 0's schema read resolves it directly.]
- **Manager role and any "team" or "company account" concept** — the consumer model has no manager-of-other-users tier between User and Super Admin.
- **Org-scoped billing / per-organization seats or plans** — replaced by per-user billing (if/when billing is reintroduced).
- **Multi-org switching UX** (if it exists in WEB — README doesn't show this explicitly for non-super-admin users, but it's implied by "Platform super admins also get organizations") — super admin's organization-browsing view either goes away entirely or becomes a simple "all users" view with no org grouping.
- **SaaS onboarding flows** (org creation, inviting teammates to an org) — README doesn't explicitly describe these existing, but they're implied by a multi-tenant model with manager/employee roles within an org; if present, removed. **[UNKNOWN — VERIFY: confirm these exist before "removing" anything — don't delete what isn't there.]**

### REBUILD — likely cannot be adapted cleanly

- Nothing at the app/module level, based on what the README shows. The one candidate would be **WEB's "sessions" route** if "sessions" refers to *event sessions* shared across an org's team (a SaaS concept of a shared scanning event) rather than user login sessions — in which case it either gets removed (if org-shared) or kept as-is (if it's just "my scanning events," which the MOBILE app's own "Events" feature suggests is the more likely reading). **[UNKNOWN — VERIFY: what WEB's "sessions" route actually represents.]** This is exactly the kind of ambiguity a README can't resolve and code can.

---

## Phase 2 — Architecture transformation plan

### Target model

```
Super Admin (exactly 1, seeded)          Regular User (unbounded, self-registered)
  │                                         │
  ├─ WEB admin dashboard only               ├─ MOBILE app only (App Store / Play Store)
  ├─ users, analytics, audit, content,      ├─ scan cards, manage own contacts,
  │  notifications, reports, settings       │  manage own events, export own data
  └─ no "organization" concept to manage    └─ no visibility into other users' data
```

### What changes vs. what doesn't

**Doesn't change:** NestJS as the API framework, Prisma as the ORM, Postgres as the database, Next.js for the admin web app, Expo for mobile, JWT as the auth mechanism, Google Vision as primary OCR, the local-fs/Supabase storage split, the no-Docker local dev pattern, Stripe as the billing provider if/when reintroduced.

**Changes:**
1. **Tenant key removal/repurposing.** Wherever queries are scoped by `organizationId`, they become scoped by `userId` only (every user is effectively their own "tenant of one"). This is mechanically the same kind of code — a scoping clause — just simplified from "match my org" to "match my user id," which in most ORMs is a smaller filter, not a structural rewrite.
2. **Role enum collapse.** `employee | manager | platform_super_admin` → `user | super_admin`. Existing `employee`-role code paths become the default `user` experience (this is most of the MOBILE app already). `manager`-only WEB features get re-homed under `super_admin` or removed if they were purely about managing other org members.
3. **WEB app scope shrinks to one audience.** Instead of serving managers and platform admins, WEB serves exactly one logged-in account: the Super Admin. No role-branching UI needed inside WEB at all once this lands — which is itself a simplification (Phase 0 should confirm whether WEB currently branches on role in shared layouts; if so, that branching logic deletes cleanly).
4. **MOBILE gets self-registration.** Today's demo accounts are pre-seeded; a consumer app needs a real sign-up flow (email/password at minimum, possibly social login — **[UNKNOWN — VERIFY: does a registration endpoint exist in the API already, even if WEB/MOBILE don't expose it?]**). If JWT issuance already exists for login, registration is "create a User row + issue the same JWT," not new auth infrastructure.
5. **Super Admin seeding replaces org-based admin creation.** A deploy-time seed script (Prisma seed, extended) creates exactly one `super_admin` user from environment-provided credentials, with no self-registration path to that role ever exposed.

### Mobile-first implications

The README already shows MOBILE as a complete, role-scoped (`employee`) app with the exact shape a consumer app needs: scan, contacts, export, profile. The work here is less "build a consumer mobile app" and more "stop gating it behind an organization and let anyone sign up." That's a strong reuse story and worth stating plainly to stakeholders: **the mobile app is closer to done than the business model is.**

---

## Phase 3 — Database transformation strategy

Caveat up front: this section describes a **migration strategy shape**, not exact Prisma migration files, because I haven't seen `schema.prisma`. The shape is sound regardless of the exact column names; the *risk level* of each step depends on facts only the schema can confirm.

### Step 1 — Add the target state alongside the old one (non-destructive)

- Keep `organizationId` columns in place initially. Do not drop anything yet.
- Add `role` value `super_admin` to the existing role enum (or repurpose `platform_super_admin` directly into it — **[UNKNOWN — VERIFY: is role a Postgres enum or a string/lookup table? Enums need a migration to add a value; strings don't.]**).

### Step 2 — Backfill and collapse

- Pick (or seed) exactly one user to become `super_admin`; reassign all current `platform_super_admin` and `manager` users' role to `user`, except that one. **[Decision needed from you: should existing manager/employee demo or production accounts become regular users, or does this transformation imply a clean break with no migrated user accounts at all? The brief says "millions of regular users" as the target state — confirm whether current seeded/production users carry forward or whether this is launching with zero existing end users.]**
- For every table with `organizationId`, the migration either: (a) drops the column if no cross-user sharing depended on it, or (b) if data ownership genuinely needs to move from "owned by org" to "owned by user," writes a backfill that sets `userId` based on who created/owns each row (the README's existing `Contact`, `Event`, etc. models almost certainly already have a creator/owner user reference alongside the org reference — **[UNKNOWN — VERIFY]**).

### Step 3 — Drop SaaS-only tables/columns

- Drop `Organization` table (after confirming nothing else references it).
- Drop organization-scoped billing tables/columns if billing moves to per-user.
- Drop any team/invite/membership join tables.

### Step 4 — Use existing tooling, not a new one

The README is explicit that `db:migrate:deploy` (not `db:push`) is the staging/production path. That doesn't change. Each step above is one or more ordinary Prisma migrations, run through the existing pipeline — no new migration tooling needed.

### Rollback posture

Because Step 1 is additive and Step 2 is a backfill (not a destructive drop), the schema is reversible up through Step 2. Step 3 (drops) should only run after the application code is fully cut over and verified against the new shape in staging — this is standard practice, not something specific to this migration, but worth stating since "preserves existing data" was an explicit requirement.

---

## Phase 4 — Authentication & authorization refactor

### Target roles

```
super_admin   — exactly one account, seeded at deploy time, never created via signup
user          — unlimited, self-registered via MOBILE (and possibly WEB if a consumer
                web experience is ever wanted, though README implies WEB is admin-only)
```

### What's reused

- JWT issuance, validation, and the guard pattern itself (NestJS `@UseGuards`) — the *mechanism* doesn't change.
- Password hashing/storage, login endpoint, token refresh — all role-agnostic infrastructure.

### What's refactored

- **JWT payload**: if it currently carries `organizationId`, that claim is dropped (or kept but always equal to the user's own id, if that's a lower-risk transitional step). Role claim collapses to the two-value enum.
- **Guards**: any guard checking "is this user a manager of this organization" simplifies to "is this user the super_admin" or "is this the resource owner." This is very likely a net reduction in guard complexity, since org-relative checks (e.g., "manager of org X can see employee Y's data because Y is in org X") disappear — every non-admin check becomes "is this your own data."
- **Super Admin security hardening** (explicitly required by your brief): MFA and audit logging for this one account. **[UNKNOWN — VERIFY: does the API already have an audit-log mechanism, given WEB has an "audit log" route? If so, this is "make sure super_admin actions are captured," not new infrastructure. MFA is more likely genuinely new — check for any existing TOTP/MFA library or column on `User` before assuming it must be built from scratch.]**

### What's removed

- Org-relative permission checks (manager-can-see-employees-in-my-org logic).
- Any "invite user to organization" or "assign role within organization" endpoints.

---

## Phase 5 — Implementation roadmap

Ordered for maximum reuse, minimum disruption, and to surface schema-level unknowns early (since they gate almost everything else).

1. **Resolve Phase 0's unknowns.** Read `schema.prisma`, the auth module, and WEB's role-gating. This is a few hours of reading, not engineering, and it determines whether Phases 2 below are "small" or "medium" risk.
2. **Schema Step 1 (additive only)** — add `super_admin` role value, no drops yet.
3. **Seed script: create the one Super Admin account** from env vars at deploy time; document the MFA enrollment step.
4. **API: registration endpoint** for regular users (new, or expose an existing-but-unused one).
5. **API: strip organization-relative authorization logic**, replacing org-scoped queries with user-scoped queries. Run against staging data copied via Step 2's backfill.
6. **WEB: remove organizations route and manager-tier UI**; collapse remaining routes to a single super-admin-only experience.
7. **MOBILE: remove any org-context UI** (if Phase 0 finds any — e.g., an org picker at login); wire up the new registration endpoint; this app needed the least change of the three.
8. **Schema Step 3 (destructive drops)** — only after Steps 5–7 are verified in staging against the new shape.
9. **Billing**: decide and implement per-user billing model if monetization is in scope for this phase (your brief doesn't say whether billing is in scope for launch — worth confirming).
10. **App store submission prep** for MOBILE (this is new work the README's current scope doesn't cover at all — app store accounts, privacy policy, store listings, review compliance — and is worth scoping separately since it's calendar-time-bound by app review, not engineering-bound).

---

## Open questions that materially change this plan

These aren't nitpicks — each one changes which phase is "small" and which is "large":

1. Does `Organization` get referenced by foreign key from a handful of tables, or dozens? (Determines Phase 3 effort.)
2. Is tenant isolation enforced via Postgres row-level security, or application-level query filters? (Determines whether "removing multi-tenancy" touches the database engine config or just application code.)
3. Do current seeded/production users carry forward as the first regular users, or does consumer launch start from zero users?
4. Is billing in scope for this transformation phase, or a later phase?
5. Does a self-registration endpoint already exist anywhere in the API (even if unused by current clients)?

I'd treat resolving these as the literal next step before any coding agent touches the repository — not because the plan above is wrong, but because Phase 6 below needs to *cite specific files*, and right now it can only describe intent.

---

## Phase 6 — Sequential implementation prompts for a coding agent

These are written to be handed to an agent **that has repository access** (which I don't). Each prompt tells the agent to verify a specific file before acting, rather than assuming the file's contents — this is the safeguard against the unknowns above causing bad edits.

**Prompt 1 — Audit and report**
> Open `API/prisma/schema.prisma` in full. Report: (a) every model with an `organizationId` or similar tenant-scoping field, (b) the `Role` enum or equivalent and its current values, (c) whether `User.organizationId` is required or optional, (d) any model representing organization membership, teams, or invites. Do not modify anything yet. Output a table of model name → tenant-scoped (yes/no) → foreign keys to Organization.

**Prompt 2 — Auth and guard audit**
> Open every file under `API/src/auth/**` and any `*.guard.ts` files in the API. Report: the JWT payload shape, where `organizationId` and `role` are checked, and which guards implement organization-relative logic (e.g., "manager can access employee in same org") versus simple role checks. List file paths and line numbers.

**Prompt 3 — WEB role-gating audit**
> Open `WEB/middleware.ts` (or the equivalent Next.js route-protection mechanism) and any role-conditional rendering in shared layouts. Report whether role checks are centralized or scattered across individual pages, and list every file that branches on `role === 'manager'` or `role === 'platform_super_admin'`.

**Prompt 4 — Additive schema migration**
> Based on Prompt 1's findings, write a Prisma migration that adds a `super_admin` role value without removing or renaming any existing enum value or column. Do not drop or rename anything. Run `db:migrate` (not `db:push`) against local dev and confirm it applies cleanly.

**Prompt 5 — Super Admin seed script**
> Extend the existing `API/prisma/seed.ts` (or wherever seeding lives, per Prompt 1's findings) to create exactly one `super_admin` user from environment variables (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD_HASH` or similar — match existing seed conventions). Do not allow this seed step to run more than once idempotently-unsafely; guard against creating duplicate super admins on repeated `db:seed` runs.

**Prompt 6 — Registration endpoint**
> Based on Prompt 2's findings, either expose the existing (if any) registration endpoint to MOBILE, or implement a new `POST /api/v1/auth/register` following the exact patterns already used in the existing login endpoint (same validation library, same error response shape, same JWT issuance call). New users get role `user` and no `organizationId`.

**Prompt 7 — Strip org-relative authorization**
> Based on Prompt 2's findings, refactor each guard that currently checks organization-relative permissions to instead check resource ownership by `userId` directly, or `role === 'super_admin'` for admin-only routes. Do this one guard at a time, running existing tests after each change. Do not touch guards that only check role with no organization logic — those are likely already correct for the new model.

**Prompt 8 — WEB simplification**
> Based on Prompt 3's findings, remove the `organizations` route and any manager-tier-only UI from WEB. Collapse any role-branching logic in shared layouts down to a single super-admin experience, since WEB will now only ever be accessed by one role.

**Prompt 9 — MOBILE registration wiring**
> Add a sign-up screen to MOBILE that calls the new registration endpoint from Prompt 6, following the existing login screen's form patterns, validation, and navigation flow exactly. Remove any UI implying organization selection or org-scoped context if Prompt 1/2 found such a flow exists.

**Prompt 10 — Destructive schema cleanup**
> Only after Prompts 4–9 are verified against staging data: write a Prisma migration that drops the `Organization` table and any now-unreferenced organization-scoped columns identified in Prompt 1, plus a backfill migration (run and verified *before* the drop) that ensures every row previously scoped by `organizationId` has the correct `userId` ownership already in place.

**Prompt 11 — MFA and audit logging for Super Admin**
> Check whether `API/src` already contains an audit-log mechanism (likely, given WEB's existing audit-log route) and/or any MFA/TOTP library already in `package.json`. If audit logging exists, extend it to specifically capture all super_admin actions. If MFA does not exist, implement TOTP-based MFA scoped only to the `super_admin` role, reusing the existing JWT issuance flow as the post-MFA-verification step.

---

*Note: I treated "give a high-level plan with assumptions flagged" as the instruction to produce architecture and sequencing — not invented file paths or line-level diffs, since I have no code to diff against. If you can share the actual repository (even just `schema.prisma`, the auth module, and WEB's middleware), I can replace every [UNKNOWN — VERIFY] tag above with a real answer and tighten Phase 6's prompts to reference exact files and current logic.*