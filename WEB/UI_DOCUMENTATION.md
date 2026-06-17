# CardVault Web — UI Documentation

> **Module:** `WEB/` — Next.js 14 admin console for managers, tenant admins, and platform super admins.  
> **Last analyzed:** June 2026 · Source: actual values extracted from `WEB/` codebase.

---

## 1. Overview

### Purpose

CardVault Web is the **manager and platform admin console** for the CardVault business-card capture platform. Field sales (`employee` role) are redirected to the MOBILE app. This web module provides org-wide visibility and control over contacts, event sessions, users, compliance audit logs, data exports, billing, and (for platform super admins) multi-tenant organization management.

### Main User Flow

```
Sign in (/login)
    → Dashboard (/admin/dashboard) — KPI overview
    → Navigate via sidebar or ⌘K/Ctrl+K command palette
    → Manage data (Contacts, Sessions, Users, Export, Billing, Audit)
    → [Super Admin only] Organizations (/admin/organizations)
    → Sign out (sidebar footer or command palette)
```

### Key Screens

| Screen                          | Route                                                                  | Audience                  |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| Login                           | `/login`                                                               | Unauthenticated admins    |
| Dashboard                       | `/admin/dashboard`                                                     | All web admins            |
| Analytics                       | `/admin/analytics`                                                     | All web admins            |
| Contacts (list / detail / edit) | `/admin/contacts`, `/admin/contacts/[id]`, `/admin/contacts/[id]/edit` | All web admins            |
| Sessions                        | `/admin/sessions`                                                      | All web admins            |
| Users                           | `/admin/users`                                                         | All web admins            |
| Audit Log                       | `/admin/audit-log`                                                     | All web admins            |
| Export Center                   | `/admin/export`                                                        | All web admins            |
| Billing                         | `/admin/billing`                                                       | All web admins            |
| Organizations                   | `/admin/organizations`                                                 | Platform super admin only |

### Business Objective

Enable organizational leadership to **monitor lead capture performance**, **manage team and tenant data**, **export contacts for CRM workflows**, **maintain compliance visibility**, and **manage SaaS subscriptions** — without requiring access to the mobile field app.

**Source references:** `WEB/README.md`, `WEB/middleware.ts`, `WEB/app/page.tsx`

---

## 2. Screen Inventory

### Global Layout Shell (All Admin Screens)

Every route under `/admin/*` is wrapped by `AdminDrawer` (`WEB/components/layout/admin-drawer.tsx`).

```
┌─────────────────────────────────────────────────────────────┐
│ AdminDrawer (flex min-h-screen)                             │
├──────────────┬──────────────────────────────────────────────┤
│ Sidebar      │ Main Content Area                            │
│ (md+)        │ ┌──────────────────────────────────────────┐ │
│              │ │ Mobile Header (md:hidden, sticky z-30)   │ │
│ Logo/Title   │ │ [☰ Menu] CardVault Admin                 │ │
│ Nav Links    │ └──────────────────────────────────────────┘ │
│ User Card    │ <main p-4 lg:p-8 bg-canvas>                  │
│ Theme/Logout │   {Page Content}                             │
│              │ </main>                                      │
├──────────────┴──────────────────────────────────────────────┤
│ Mobile Drawer (md:hidden, Framer Motion slide-in, z-50)     │
│ Command Palette (global overlay, ⌘K, z-[9999])              │
└─────────────────────────────────────────────────────────────┘
```

**Entry points:** Successful login, direct URL (middleware-gated), sidebar nav, command palette.  
**Exit points:** Logout, browser navigation, middleware redirect to `/login`.

---

### Root Redirect

| Property    | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| **Route**   | `/`                                                         |
| **Purpose** | Redirect authenticated admins to dashboard; others to login |
| **File**    | `WEB/app/page.tsx`                                          |

---

### Login

| Property    | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| **Route**   | `/login`                                                     |
| **Purpose** | Admin sign-in for manager / tenant admin / platform roles    |
| **File**    | `WEB/app/(auth)/login/page.tsx`                              |
| **Layout**  | `WEB/app/(auth)/layout.tsx` — minimal `min-h-screen` wrapper |

**Entry points:** Middleware redirect (unauthenticated), `?error=admin_only` query param, logout from command palette.  
**Exit points:** Successful login → `/admin/dashboard` (or `?from=` deep link if valid `/admin` path).

#### Layout Structure

```
Full-screen login-gradient background (160deg navy gradient)
├── FloatingCard decorations (2×, Framer Motion float animation)
└── glass-card centered panel (max-w-md, p-8)
    ├── Logo area (CreditCard icon in accent/30 rounded-2xl box)
    ├── Title: "CardVault Admin" (text-2xl)
    ├── Subtitle: "Manager & platform admin console"
    └── Form
        ├── Form-level error banner (bg-error/20)
        ├── Email Input
        ├── Password Input
        ├── Sign in Button (full width)
        └── Demo credentials hint (text-xs white/50)
```

**Loading state:** `WEB/app/(auth)/loading.tsx` — centered skeleton card mimicking login form.  
**Error state:** `WEB/app/(auth)/error.tsx` — `EmptyState` with AlertTriangle, "Sign-in unavailable".

---

### Dashboard

| Property    | Value                                                              |
| ----------- | ------------------------------------------------------------------ |
| **Route**   | `/admin/dashboard`                                                 |
| **Purpose** | KPI overview, lead funnel, capture timeline, recent audit activity |
| **File**    | `WEB/app/(admin)/admin/dashboard/page.tsx`                         |

**Entry points:** Default post-login redirect, sidebar "Dashboard", command palette.  
**Exit points:** "View all activity →" link to `/admin/audit-log`.

#### Layout Structure

```
PageHeader (title + description)
├── Stat grid (sm:2 cols, xl:4 cols) — 4× AdminStatCard
│   Contacts | Users | Active sessions | Exports
├── Chart grid (lg:2 cols)
│   Card: Lead funnel (BarChart, Flame icon)
│   Card: Captures 7 days (BarChart)
├── Card: By capture mode (BarChart, conditional)
└── Card: Recent activity list (8 items max)
    └── Link → /admin/audit-log
```

**Loading:** 4 skeleton stat cards + PageHeader.  
**Error:** PageHeader with error description only (no stat cards).

---

### Analytics

| Property    | Value                                                                                 |
| ----------- | ------------------------------------------------------------------------------------- |
| **Route**   | `/admin/analytics`                                                                    |
| **Purpose** | Lead funnel, encounter types, session performance table, platform stats (super admin) |
| **File**    | `WEB/app/(admin)/admin/analytics/page.tsx`                                            |

#### Layout Structure

```
PageHeader
├── Stat grid (4× AdminStatCard): Hot / Warm / Cold leads, Active sessions
├── Chart grid (lg:2 cols): Lead funnel | Encounter types
├── Card + DataTable: Session performance
└── [Super Admin] Card: Platform stats (4× AdminStatCard)
```

---

### Contacts (List)

| Property    | Value                                             |
| ----------- | ------------------------------------------------- |
| **Route**   | `/admin/contacts`                                 |
| **Purpose** | Searchable, filterable org-wide contact directory |
| **File**    | `WEB/app/(admin)/admin/contacts/page.tsx`         |

**Entry points:** Sidebar, command palette.  
**Exit points:** "View" row action → `/admin/contacts/[id]`.

#### Layout Structure

```
PageHeader (dynamic total count in description)
├── Card: Filters
│   ├── Search Input (300ms debounce)
│   └── Mode pill filters: All | Visitor | Exhibitor | Quick
└── Card
    ├── DataTable (5 columns)
    └── PaginationBar (15 per page)
```

---

### Contact Detail

| Property    | Value                                          |
| ----------- | ---------------------------------------------- |
| **Route**   | `/admin/contacts/[id]`                         |
| **Purpose** | View contact fields; merge duplicate contacts  |
| **File**    | `WEB/app/(admin)/admin/contacts/[id]/page.tsx` |

**Entry points:** Contacts list "View" link.  
**Exit points:** Back → `/admin/contacts`, Edit → `/admin/contacts/[id]/edit`.

#### Layout Structure

```
PageHeader (contact name + Back/Edit actions)
└── Grid (lg:2 cols)
    ├── Card: Badges + definition list (company, title, emails, phones, etc.)
    └── Card: Merge duplicate form (source UUID input + merge button)
```

**Loading:** Plain text "Loading contact…"  
**Error:** Red "Contact not found" + back link.

---

### Contact Edit

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| **Route**   | `/admin/contacts/[id]/edit`                         |
| **Purpose** | Edit contact fields and lead qualifier              |
| **File**    | `WEB/app/(admin)/admin/contacts/[id]/edit/page.tsx` |

#### Layout Structure

```
PageHeader ("Edit contact" + Cancel button)
└── Card
    └── Form (max-w-xl, centered)
        Full name | Company | Title | Email | Phone | Website
        Lead qualifier (native select)
        Notes (textarea, min-h 100px)
        Save changes Button
```

---

### Sessions

| Property    | Value                                      |
| ----------- | ------------------------------------------ |
| **Route**   | `/admin/sessions`                          |
| **Purpose** | List event sessions; close active sessions |
| **File**    | `WEB/app/(admin)/admin/sessions/page.tsx`  |

#### Layout Structure

```
PageHeader
├── Card: Status pill filters (All | Active | Closed)
└── Card: DataTable (7 columns) + PaginationBar (15/page)
    Row action: "Close" ghost button for active sessions
```

---

### Users

| Property    | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| **Route**   | `/admin/users`                                               |
| **Purpose** | Create, edit, delete org users; super admin cross-org filter |
| **File**    | `WEB/app/(admin)/admin/users/page.tsx`                       |

#### Layout Structure

```
PageHeader + "Add User" primary button
├── [Inline Modal] Create User (fixed overlay, max-w-md)
├── Card: Search + [Super Admin] Organization select
└── Card: DataTable + PaginationBar
    Row actions: Edit (ghost) | Delete (danger)
├── [Inline Modal] Edit User
```

**Note:** Create/Edit modals use custom inline overlays (`bg-black/40 z-50`), not the shared `Modal` component.

---

### Audit Log

| Property    | Value                                      |
| ----------- | ------------------------------------------ |
| **Route**   | `/admin/audit-log`                         |
| **Purpose** | Immutable compliance event browser         |
| **File**    | `WEB/app/(admin)/admin/audit-log/page.tsx` |

#### Layout Structure

```
PageHeader
├── Card: Search Input (300ms debounce via useDebouncedValue)
└── Card: DataTable (5 columns) + PaginationBar (20/page)
```

---

### Export Center

| Property    | Value                                                 |
| ----------- | ----------------------------------------------------- |
| **Route**   | `/admin/export`                                       |
| **Purpose** | Request CSV/XLSX/PDF exports; download completed jobs |
| **File**    | `WEB/app/(admin)/admin/export/page.tsx`               |

#### Layout Structure

```
PageHeader
├── Card: Export request form
│   ├── 3-column filter grid (Session | Lead qualifier | Capture mode)
│   └── Action buttons: Excel | CSV | PDF (secondary variant + icons)
└── Card: Export jobs DataTable + PaginationBar (10/page)
```

---

### Billing

| Property    | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| **Route**   | `/admin/billing`                                           |
| **Purpose** | View plan; Stripe checkout upgrade; Stripe customer portal |
| **File**    | `WEB/app/(admin)/admin/billing/page.tsx`                   |

#### Layout Structure

```
PageHeader
└── Card
    ├── Current plan name (text-2xl)
    ├── Price (₹ or "Free tier")
    ├── Upgrade to Pro (primary) | Manage subscription (secondary)
    └── Stripe-not-configured notice (conditional)
```

---

### Organizations (Super Admin Only)

| Property    | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| **Route**   | `/admin/organizations`                                     |
| **Purpose** | CRUD SaaS tenants with manager provisioning                |
| **File**    | `WEB/app/(admin)/admin/organizations/page.tsx`             |
| **Access**  | Middleware + client redirect if not `platform_super_admin` |

#### Layout Structure

```
PageHeader + "New Organization" button
└── Card: DataTable (no pagination — full list)
    Row actions: Edit | Archive (danger, window.confirm)
└── [Inline Modal] Create/Edit Organization (max-w-xl)
    Fields: name, slug, max users, storage GB, plan select
    Create-only: manager email/password/name section
    Edit-only: isActive checkbox
```

---

## 3. Typography System

### Font Family

| Role             | Font       | CSS Variable        | Fallback                                   |
| ---------------- | ---------- | ------------------- | ------------------------------------------ |
| **Primary (UI)** | Geist Sans | `--font-geist-sans` | `system-ui, -apple-system, sans-serif`     |
| **Monospace**    | Geist Mono | `--font-geist-mono` | `'JetBrains Mono', 'Fira Code', monospace` |

Applied in `WEB/app/layout.tsx` via `geist/font/sans` and `geist/font/mono`. Body uses `font-sans antialiased`.

### Font Sizes & Styles

| Type                   | Size                 | Weight                | Line Height           | Letter Spacing             | Usage                                         |
| ---------------------- | -------------------- | --------------------- | --------------------- | -------------------------- | --------------------------------------------- |
| **Page Title (H1)**    | 20px (`text-xl`)     | 600 (`font-semibold`) | default               | default                    | `PageHeader` titles                           |
| **Section Title (H2)** | 18px (`text-lg`)     | 600                   | default               | default                    | Card titles, modal titles, analytics headings |
| **Login Title**        | 24px (`text-2xl`)    | 600                   | default               | tight (`tracking-tight`)   | Login page H1                                 |
| **Stat Value**         | 28px (`text-[28px]`) | 700 (`font-bold`)     | none (`leading-none`) | tight                      | `AdminStatCard` numbers                       |
| **Billing Plan**       | 24px (`text-2xl`)    | 600                   | default               | default                    | Billing current plan                          |
| **Body**               | 14px (`text-sm`)     | 400 (default)         | default / relaxed     | default                    | Tables, forms, descriptions, modal body       |
| **Body Large**         | 16px (`text-base`)   | 400–500               | default               | default                    | Button lg, some card titles                   |
| **Empty State Title**  | 15px (`text-[15px]`) | 600                   | default               | default                    | `EmptyState` h3                               |
| **Caption / Meta**     | 12px (`text-xs`)     | 400–600               | default               | default                    | Badges, timestamps, sidebar email             |
| **Form Label**         | 11px (`text-[11px]`) | 600                   | default               | wider (`tracking-wider`)   | Input/Select labels (uppercase)               |
| **Micro / Kbd**        | 10px (`text-[10px]`) | 500–600               | default               | widest (`tracking-widest`) | Command palette kbd, sidebar email            |
| **Table Header**       | 11px (`text-[11px]`) | 600                   | default               | wider                      | DataTable thead                               |
| **Chart Label**        | 10px (`text-[10px]`) | 500                   | default               | default                    | BarChart x-axis labels                        |

**Source files:** `WEB/components/layout/page-header.tsx`, `WEB/components/ui/modal.tsx`, `WEB/components/admin/admin-stat-card.tsx`, `WEB/components/ui/input.tsx`, `WEB/components/admin/data-table.tsx`

---

## 4. Color System

Colors are defined as CSS custom properties in `WEB/styles/tokens.css` and mapped in `WEB/tailwind.config.ts`. Theme toggles via `.dark` class on `<html>`.

### Primary Colors

| Name                   | Light Hex | Dark Hex  | Usage                                                                         |
| ---------------------- | --------- | --------- | ----------------------------------------------------------------------------- |
| **Primary (Navy)**     | `#1E3A5F` | `#1E3A5F` | Secondary buttons (`bg-primary`), badge default tint, login gradient mid-stop |
| **Primary Foreground** | `#FFFFFF` | `#FFFFFF` | Text on primary/secondary buttons                                             |

### Accent Colors (Interactive)

| Name                  | Light Hex              | Dark Hex               | Usage                                                                        |
| --------------------- | ---------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| **Accent**            | `#4F46E5` (Indigo 600) | `#6366F1` (Indigo 500) | Primary buttons, links, active filter pills, focus rings, avatar backgrounds |
| **Accent Hover**      | `#4338CA`              | `#818CF8`              | Link hover states                                                            |
| **Accent Subtle**     | `#EEF2FF`              | `#1E1B4B`              | Active pill filter background                                                |
| **Accent Foreground** | `#FFFFFF`              | `#FFFFFF`              | Text on accent buttons                                                       |

### Background Colors

| Name                    | Light Hex             | Dark Hex               | Usage                                            |
| ----------------------- | --------------------- | ---------------------- | ------------------------------------------------ |
| **Canvas / Background** | `#F8FAFC`             | `#09090B`              | Main content area (`bg-canvas`), body background |
| **Surface**             | `#FFFFFF`             | `#18181B`              | Cards, inputs, modals, mobile header             |
| **Surface Raised**      | `#FFFFFF`             | `#27272A`              | Elevated surfaces (token available)              |
| **Sidebar**             | `zinc-50` / `#FAFAFA` | `zinc-900` / `#18181B` | Desktop sidebar background                       |

### Text Colors

| Token                         | Light Hex | Dark Hex  | Usage                            |
| ----------------------------- | --------- | --------- | -------------------------------- |
| **text-primary / foreground** | `#09090B` | `#FAFAFA` | Headings, primary body text      |
| **text-secondary**            | `#52525B` | `#A1A1AA` | Secondary content, table cells   |
| **text-tertiary**             | `#A1A1AA` | `#52525B` | Labels, timestamps, placeholders |
| **text-disabled**             | `#D4D4D8` | `#3F3F46` | Disabled text                    |
| **text-inverse**              | `#FFFFFF` | `#09090B` | Text on dark backgrounds         |

### Border Colors

| Token             | Light Hex | Dark Hex  | Usage                              |
| ----------------- | --------- | --------- | ---------------------------------- |
| **border**        | `#E4E4E7` | `#3F3F46` | Cards, inputs, dividers            |
| **border-strong** | `#D4D4D8` | `#52525B` | Stronger borders (token available) |

### Semantic Colors

| State       | Light     | Dark      | Background Tint (Light)    |
| ----------- | --------- | --------- | -------------------------- |
| **Success** | `#16A34A` | `#22C55E` | `#F0FDF4` / dark `#052E16` |
| **Warning** | `#B45309` | `#F59E0B` | `#FFFBEB` / dark `#1C1300` |
| **Error**   | `#DC2626` | `#EF4444` | `#FEF2F2` / dark `#1C0101` |
| **Info**    | `#0284C7` | `#38BDF8` | `#F0F9FF` / dark `#0C1A2E` |

### Lead Qualifier Colors

| Qualifier | Text Hex  | Badge Background | Border      |
| --------- | --------- | ---------------- | ----------- |
| **Hot**   | `#B91C1C` | `red-50`         | `red-200`   |
| **Warm**  | `#B45309` | `amber-50`       | `amber-200` |
| **Cold**  | `#1D4ED8` | `blue-50`        | `blue-200`  |

Bar chart lead colors: Hot `bg-red-500`, Warm `bg-amber-500`, Cold `bg-blue-500`, Unqualified `bg-slate-300`.

### Login-Specific Colors

| Element            | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **login-gradient** | `linear-gradient(160deg, #0F172A 0%, #1E3A5F 45%, #1E40AF 100%)`     |
| **glass-card**     | `bg-white/10`, `border-white/20`, `backdrop-blur-xl`, `shadow-glass` |
| **Floating cards** | `border-white/10`, `bg-white/5`                                      |

### Overlay Colors

| Context                  | Value                                    |
| ------------------------ | ---------------------------------------- |
| Modal/drawer backdrop    | `bg-black/40` (40% black)                |
| Command palette backdrop | `bg-zinc-950/40` + `backdrop-blur-[3px]` |
| Mobile drawer panel      | `bg-zinc-900 text-white`                 |

---

## 5. Spacing System

### CSS Token Scale (`WEB/styles/tokens.css`)

| Token        | Value |
| ------------ | ----- |
| `--space-1`  | 4px   |
| `--space-2`  | 8px   |
| `--space-3`  | 12px  |
| `--space-4`  | 16px  |
| `--space-5`  | 20px  |
| `--space-6`  | 24px  |
| `--space-8`  | 32px  |
| `--space-10` | 40px  |
| `--space-12` | 48px  |
| `--space-16` | 64px  |

### Tailwind Usage Patterns

| Context                   | Spacing                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| **Page vertical rhythm**  | `space-y-6` (24px between sections)                                  |
| **Card internal padding** | `p-4` (filters), `p-5` (stat cards), `p-6` (detail/forms)            |
| **Main content padding**  | `p-4` mobile, `lg:p-8` (32px) desktop                                |
| **Grid gaps**             | `gap-4` (16px) stat/chart grids, `gap-6` (24px) larger grids         |
| **Form field spacing**    | `space-y-4` (16px) between fields                                    |
| **Sidebar nav items**     | `space-y-1` (4px), item padding `px-3 py-2.5`                        |
| **Table cell padding**    | `px-4 py-2.5` (header), `px-4 py-0` (body, row height `h-11` = 44px) |
| **Pagination bar**        | `px-4 py-3`                                                          |
| **Empty state**           | `py-12 px-4`, icon margin `mb-4`, description `mb-6`                 |

### Container Widths

| Element            | Max Width                                       |
| ------------------ | ----------------------------------------------- |
| Login card         | `max-w-md` (448px)                              |
| Contact edit form  | `max-w-xl` (576px)                              |
| Modal sm / md / lg | `max-w-md` / `max-w-xl` / `max-w-2xl`           |
| Command palette    | `max-w-lg` (512px)                              |
| Empty state        | `max-w-md` (448px), description `max-w-[300px]` |
| Toast viewport     | `max-w-sm` (384px)                              |
| Mobile drawer      | `280px` fixed width                             |
| DataTable          | `min-w-[640px]` (horizontal scroll)             |

### Sidebar Widths

| Breakpoint     | Width                                |
| -------------- | ------------------------------------ |
| Tablet (`md`)  | 72px (icon-only collapsed)           |
| Desktop (`lg`) | 256px (`w-64`, expanded with labels) |

---

## 6. Component Library

### Button

**File:** `WEB/components/ui/button.tsx`

| Prop                       | Type                                              | Default     |
| -------------------------- | ------------------------------------------------- | ----------- |
| `variant`                  | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` |
| `size`                     | `'sm' \| 'md' \| 'lg'`                            | `'md'`      |
| `loading`                  | `boolean`                                         | `false`     |
| Standard HTML button attrs | —                                                 | —           |

| Variant       | Styles                                                     |
| ------------- | ---------------------------------------------------------- |
| **Primary**   | `bg-accent text-white hover:bg-accent/90 shadow-sm`        |
| **Secondary** | `bg-primary text-white hover:bg-primary/90`                |
| **Ghost**     | `bg-transparent border border-border hover:bg-neutral-100` |
| **Danger**    | `bg-error text-white hover:bg-error/90`                    |

| Size   | Height        | Padding | Font |
| ------ | ------------- | ------- | ---- |
| **sm** | 36px (`h-9`)  | `px-3`  | 14px |
| **md** | 44px (`h-11`) | `px-4`  | 14px |
| **lg** | 48px (`h-12`) | `px-6`  | 16px |

| State        | Behavior                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| **Default**  | Base variant styles                                                                  |
| **Hover**    | Variant-specific hover (150ms `transition-colors`)                                   |
| **Focus**    | `focus-visible:ring-2 ring-accent ring-offset-2`                                     |
| **Disabled** | `opacity-50 pointer-events-none`                                                     |
| **Loading**  | Spinner (`h-4 w-4 animate-spin`), `aria-busy`, children still rendered after spinner |

---

### Input

**File:** `WEB/components/ui/input.tsx`

| Prop             | Type                |
| ---------------- | ------------------- |
| `label`          | `string` (optional) |
| `error`          | `string` (optional) |
| `labelClassName` | `string` (optional) |

| Element     | Styles                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| Label       | 11px uppercase semibold, `text-text-tertiary`, `tracking-wider`         |
| Input       | `h-9`, `rounded-md`, `border-border`, `bg-surface`, `px-3 py-1.5`, 14px |
| Placeholder | `text-text-tertiary/75`                                                 |
| Focus       | `border-accent ring-1 ring-accent/20`                                   |
| Error       | `border-error ring-error/20` + error text `text-xs text-error`          |

---

### Select

**File:** `WEB/components/ui/select.tsx`

Same label pattern as Input. Select uses shared `selectClassName`:

- `rounded-md border border-border bg-surface px-3 py-2 text-sm`
- Focus: `border-accent ring-1 ring-accent/20`
- Disabled: `opacity-50 cursor-not-allowed`

**Note:** Several pages use raw `<select>` with `border-input` / `ring-ring` classes instead of the `Select` component — these tokens are **not defined** in `tailwind.config.ts` and may not render as intended.

---

### Card

**File:** `WEB/components/ui/card.tsx`

| Sub-component   | Styles                                                 |
| --------------- | ------------------------------------------------------ |
| **Card**        | `rounded-xl border border-border bg-surface shadow-sm` |
| **CardHeader**  | `p-4 pb-0`, flex column gap-1                          |
| **CardTitle**   | `text-lg font-semibold text-foreground`                |
| **CardContent** | `p-4`                                                  |

---

### Badge

**File:** `WEB/components/ui/badge.tsx`

| Variant   | Styles                                                    |
| --------- | --------------------------------------------------------- |
| `default` | `bg-primary/10 text-primary`                              |
| `accent`  | `bg-accent/10 text-accent`                                |
| `success` | `bg-success/10 text-success`                              |
| `warning` | `bg-warning/10 text-warning`                              |
| `error`   | `bg-error/10 text-error`                                  |
| `hot`     | `bg-red-50 text-qualifier-hot border border-red-200`      |
| `warm`    | `bg-amber-50 text-qualifier-warm border border-amber-200` |
| `cold`    | `bg-blue-50 text-qualifier-cold border border-blue-200`   |

Base: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium`

---

### Modal & ConfirmDialog

**File:** `WEB/components/ui/modal.tsx`

| Prop          | Type                   | Default |
| ------------- | ---------------------- | ------- |
| `open`        | `boolean`              | —       |
| `onClose`     | `() => void`           | —       |
| `title`       | `string`               | —       |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'sm'`  |
| `dismissible` | `boolean`              | `true`  |
| `footer`      | `ReactNode`            | —       |

| Feature          | Implementation                                   |
| ---------------- | ------------------------------------------------ |
| Backdrop         | `fixed inset-0 z-50 bg-black/40 p-4`             |
| Panel            | `rounded-xl border bg-surface p-6 shadow-modal`  |
| Title            | `text-lg font-semibold mb-4`                     |
| Escape           | Closes if `dismissible`                          |
| Backdrop click   | Closes if `dismissible`                          |
| Focus trap       | Tab cycles within panel; focus restored on close |
| Body scroll lock | `document.body.style.overflow = 'hidden'`        |

**ConfirmDialog:** Wraps Modal with danger confirm button (`bg-error`), ghost cancel, message in `text-sm text-text-secondary`.

---

### Skeleton

**File:** `WEB/components/ui/skeleton.tsx`

Shimmer animation: `shimmer` class (1.5s infinite gradient), `rounded-md`, `bg-zinc-100 dark:bg-zinc-800`.

---

### ToastViewport

**File:** `WEB/components/ui/toast.tsx`

| Prop         | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| Position     | `fixed bottom-4 right-4 z-[100]`                                     |
| Max width    | `max-w-sm`                                                           |
| Variants     | `error`: red-50/red-800 border; `success`: green-50/green-800 border |
| Auto-dismiss | 5 seconds (via `useToastStore`)                                      |
| ARIA         | `aria-live="polite"`, `role="status"`                                |

**⚠ Note:** `ToastViewport` is **not mounted** in `Providers` — toast store exists but UI is not rendered globally.

---

### DataTable

**File:** `WEB/components/admin/data-table.tsx`

| Prop           | Type                   | Default              |
| -------------- | ---------------------- | -------------------- |
| `columns`      | `DataTableColumn<T>[]` | —                    |
| `rows`         | `T[]`                  | —                    |
| `keyField`     | `(row: T) => string`   | —                    |
| `isLoading`    | `boolean`              | `false`              |
| `emptyMessage` | `string`               | `'No records found'` |
| `emptyState`   | `ReactNode`            | —                    |

| Feature               | Behavior                                                                              |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Column visibility** | "Columns" dropdown (Settings2 icon), toggle checkmarks, actions column always visible |
| **Loading**           | 6 skeleton rows matching column count                                                 |
| **Empty**             | Custom `emptyState` or default `EmptyState`                                           |
| **Row hover**         | `hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20`                                       |
| **Horizontal scroll** | `overflow-x-auto`, `min-w-[640px]`                                                    |

**No sorting** is implemented in the UI layer.

---

### PaginationBar

**File:** `WEB/components/admin/pagination-bar.tsx`

| Prop                          | Type                     |
| ----------------------------- | ------------------------ |
| `page`, `totalPages`, `total` | `number`                 |
| `onPageChange`                | `(page: number) => void` |

Displays: `Page X of Y · Z total`. Previous/Next ghost sm buttons, disabled at bounds.

---

### AdminStatCard

**File:** `WEB/components/admin/admin-stat-card.tsx`

| Prop             | Type               |
| ---------------- | ------------------ |
| `label`, `value` | `string`, `number` |
| `icon`, `hint`   | optional           |
| `loading`        | `boolean`          |

Card with uppercase 11px label, 28px bold animated count (`CountUp`), optional Lucide icon top-right.

---

### BarChart

**File:** `WEB/components/admin/bar-chart.tsx`

CSS-only vertical bar chart. Container height 128px (`h-32`), bars max-width 48px, `rounded-t-md`, height proportional to max value (min 4%). Default bar color `bg-accent`.

---

### CommandPalette

**File:** `WEB/components/admin/command-palette.tsx`

Global overlay triggered by **⌘K / Ctrl+K**. Search filters commands by title/category. Keyboard: ↑↓ navigate, Enter execute, Esc close. Categories: Navigation, Preferences, Account.

---

### PageHeader

**File:** `WEB/components/layout/page-header.tsx`

| Prop          | Type                                  |
| ------------- | ------------------------------------- |
| `title`       | `string`                              |
| `description` | `string` (optional)                   |
| `action`      | `ReactNode` (optional, right-aligned) |

Title: `text-xl font-semibold`. Description: `text-sm text-muted`.

---

### AdminDrawer

**File:** `WEB/components/layout/admin-drawer.tsx`

Full app shell — see Section 2. Nav items (Lucide icons, 16×16):

| Label           | Route                  | Icon            |
| --------------- | ---------------------- | --------------- |
| Dashboard       | `/admin/dashboard`     | LayoutDashboard |
| Analytics       | `/admin/analytics`     | BarChart3       |
| Contacts        | `/admin/contacts`      | Contact         |
| Sessions        | `/admin/sessions`      | CalendarDays    |
| Users           | `/admin/users`         | Users           |
| Audit Log       | `/admin/audit-log`     | Shield          |
| Export          | `/admin/export`        | Download        |
| Billing         | `/admin/billing`       | CreditCard      |
| Organizations\* | `/admin/organizations` | Users           |

\*Super admin only.

**Active nav state:** `bg-zinc-200/80 text-zinc-900` (light) / `bg-zinc-800 text-zinc-50` (dark).

---

### EmptyState

**File:** `WEB/components/shared/empty-state.tsx`

| Prop                      | Type         |
| ------------------------- | ------------ |
| `icon`                    | LucideIcon   |
| `title`, `description`    | `string`     |
| `actionLabel`, `onAction` | optional CTA |

Dashed border container, circular icon well (48×48), optional sm primary button.

---

### LeadBadge

**File:** `WEB/components/shared/lead-badge.tsx`

Wraps `Badge` with qualifier-specific variant via `leadBadgeVariant()` and `formatLeadLabel()` from `WEB/lib/format.ts`.

---

### ListSkeleton

**File:** `WEB/components/shared/list-skeleton.tsx`

Vertical stack of `rows` (default 5) skeleton bars, `h-[72px] rounded-xl`.

---

### CountUp

**File:** `WEB/components/shared/count-up.tsx`

Animates number from 0 to `value` over `duration` ms (default 600) using `requestAnimationFrame`. Output uses `toLocaleString()`.

---

## 7. Form System

### Form Libraries

| Library                             | Usage                                                          |
| ----------------------------------- | -------------------------------------------------------------- |
| **react-hook-form**                 | Login page                                                     |
| **Zod** (`@hookform/resolvers/zod`) | Login validation                                               |
| **Native controlled state**         | Contact edit, user modals, organization modals, export filters |

### Input Types Used

| Control                 | Component / Pattern                                     |
| ----------------------- | ------------------------------------------------------- |
| Text / email / password | `Input` component                                       |
| Native select           | `Select` component OR raw `<select>` (inconsistent)     |
| Textarea                | Raw `<textarea>` (contact edit notes)                   |
| Checkbox                | Raw `<input type="checkbox">` (user/org active toggles) |
| Pill filter buttons     | Custom `<button>` with rounded-full styles              |

### Validation Rules (`WEB/lib/validation.ts`)

| Schema                  | Rules                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **loginSchema**         | Email: valid email; Password: min 8 chars                                                     |
| **contactSearchSchema** | Optional q, mode enum, sessionId UUID, page/limit coercion                                    |
| **createContactSchema** | fullName required max 200; optional company/title/email; captureMode enum; leadQualifier enum |

Contact edit page validates only via HTML `required` on full name — no Zod on submit.

### Validation Behavior

| Context                 | Pattern                                             |
| ----------------------- | --------------------------------------------------- |
| **Login (field-level)** | Zod → react-hook-form `errors` → Input `error` prop |
| **Login (form-level)**  | API/role errors → red banner above form             |
| **Contact edit**        | Try/catch → red bordered banner                     |
| **User/Org modals**     | Try/catch → red bordered banner in modal            |
| **Merge contact**       | Inline validation + success/error banners           |

### Error Display Pattern

```html
<!-- Field error (Input component) -->
<p class="text-xs text-error mt-0.5">{message}</p>

<!-- Form/modal error banner -->
<p
  class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
>
  {message}
</p>

<!-- Success banner -->
<p
  class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
>
  {message}
</p>
```

### Success Pattern

- Contact merge: green bordered inline banner
- Navigation after save: redirect to detail page (contact edit)
- Toast store available but viewport not mounted

---

## 8. Tables

All data tables use the shared `DataTable` component. **No column sorting or bulk actions** are implemented.

### Contacts Table

| Column  | Key       | Width     | Content                      |
| ------- | --------- | --------- | ---------------------------- |
| Contact | `name`    | min 200px | Full name + company subtitle |
| Mode    | `mode`    | 145px     | Accent badge (capture mode)  |
| Lead    | `lead`    | 130px     | LeadBadge                    |
| Email   | `email`   | min 180px | First email or —             |
| Actions | `actions` | 100px     | "View" link with Eye icon    |

**Filtering:** Search (debounced 300ms), mode pills. **Pagination:** 15/page.

---

### Sessions Table

| Column    | Key       | Content                       |
| --------- | --------- | ----------------------------- |
| Session   | `name`    | Name + location               |
| Mode      | `mode`    | Accent badge                  |
| Status    | `status`  | success/warning/default badge |
| Scans     | `scans`   | Count                         |
| H / W / C | `leads`   | Hot/warm/cold counts          |
| Dates     | `dates`   | start → end                   |
| Actions   | `actions` | Close button (active only)    |

**Filtering:** Status pills (All/Active/Closed). **Pagination:** 15/page.

---

### Users Table

| Column         | Key            | Content                               |
| -------------- | -------------- | ------------------------------------- |
| User           | `user`         | Name + email                          |
| Organization\* | `organization` | Org name (super admin only)           |
| Role           | `role`         | Default badge                         |
| Status         | `status`       | success/error badge (Active/Inactive) |
| Last active    | `lastActive`   | Date or —                             |
| Actions        | `actions`      | Edit + Delete buttons                 |

**Filtering:** Search (300ms debounce), org select (super admin). **Pagination:** 15/page.  
**Row actions:** Edit opens modal; Delete uses `window.confirm`.

---

### Audit Log Table

| Column    | Key      | Content                         |
| --------- | -------- | ------------------------------- |
| Event     | `event`  | eventType + entityType subtitle |
| Actor     | `actor`  | Email or "System"               |
| Role      | `role`   | Badge or —                      |
| Entity ID | `entity` | First 8 chars monospace + …     |
| When      | `time`   | Locale datetime                 |

**Filtering:** Search (300ms debounce). **Pagination:** 20/page.

---

### Export Jobs Table

| Column    | Key        | Content                                 |
| --------- | ---------- | --------------------------------------- |
| Type      | `type`     | Uppercase export type                   |
| Status    | `status`   | Badge + spinner if processing           |
| Records   | `records`  | Count or —                              |
| Requested | `created`  | Locale datetime                         |
| Download  | `download` | Download button / error / "Processing…" |

**Pagination:** 10/page.

---

### Analytics Session Performance Table

| Column    | Key      | Content                |
| --------- | -------- | ---------------------- |
| Session   | `name`   | Session name           |
| Mode      | `mode`   | Formatted capture mode |
| Status    | `status` | Raw status string      |
| Scans     | `scans`  | scanCount              |
| H / W / C | `leads`  | hot/warm/cold          |

No pagination (full session list from API).

---

### Organizations Table

| Column          | Key            | Content                   |
| --------------- | -------------- | ------------------------- |
| Organization    | `organization` | Name, slug, manager email |
| Plan            | `plan`         | Plan name + price         |
| Seats / Storage | `quota`        | maxUsers / storageQuotaGb |
| Status          | `status`       | Active/Inactive badge     |
| Created         | `createdAt`    | Date                      |
| Actions         | `actions`      | Edit + Archive            |

No pagination.

---

## 9. Navigation System

### Sidebar (Desktop/Tablet)

- **Hidden below `md` (768px)**
- **Tablet (`md–lg`):** 72px collapsed, icons only with `title` tooltips
- **Desktop (`lg+`):** 256px expanded with labels, user card, logout text

Background: `bg-zinc-50 dark:bg-zinc-900`, right border `border-border`.

### Mobile Header

- Visible `< md`: sticky `h-14`, hamburger opens drawer
- Brand: "CardVault Admin" `text-sm font-semibold`

### Mobile Drawer

- Slides from left, 280px wide, dark theme (`bg-zinc-900`)
- Framer Motion: `x: -280 → 0`, 200ms easeInOut
- Backdrop: `bg-black/40 z-40`

### Breadcrumbs

**Not implemented.** Navigation relies on PageHeader titles and Back buttons on detail/edit pages.

### Command Palette (Global)

| Shortcut    | Action         |
| ----------- | -------------- |
| ⌘K / Ctrl+K | Toggle palette |
| ↑ / ↓       | Select command |
| Enter       | Execute        |
| Esc         | Close          |

### Route Hierarchy

```
/                           → redirect
/login                      → Auth layout
/admin/
├── dashboard               → Default landing
├── analytics
├── contacts
│   ├── [id]                → Detail
│   └── [id]/edit           → Edit form
├── sessions
├── users
├── audit-log
├── export
├── billing
└── organizations           → Super admin only (middleware gated)
```

**Middleware (`WEB/middleware.ts`):**

- Unauthenticated → `/login?from={path}`
- Non-admin role → `/login?error=admin_only`
- Non-super-admin on `/admin/organizations` → `/admin/dashboard`
- Authenticated on `/login` → `/admin/dashboard`

---

## 10. Responsive Design

Uses Tailwind default breakpoints:

| Breakpoint | Min Width | Label                           |
| ---------- | --------- | ------------------------------- |
| `sm`       | 640px     | Mobile landscape / small tablet |
| `md`       | 768px     | Tablet                          |
| `lg`       | 1024px    | Laptop                          |
| `xl`       | 1280px    | Desktop                         |
| `2xl`      | 1536px    | Wide (unused explicitly)        |

### Adaptation by Screen

| Element         | Mobile (<768px)          | Tablet (768–1023px) | Desktop (≥1024px)  |
| --------------- | ------------------------ | ------------------- | ------------------ |
| Sidebar         | Hidden; hamburger drawer | 72px icon rail      | 256px full sidebar |
| Main padding    | 16px                     | 16px                | 32px               |
| Stat grids      | 1 col                    | 2 cols (`sm`)       | 4 cols (`xl`)      |
| Chart grids     | 1 col                    | 1 col               | 2 cols (`lg`)      |
| Contact detail  | 1 col                    | 1 col               | 2 cols (`lg`)      |
| Export filters  | 1 col                    | 3 cols (`md`)       | 3 cols             |
| Org form grids  | 1 col                    | 2–3 cols (`md`)     | 2–3 cols           |
| DataTable       | Horizontal scroll        | Horizontal scroll   | Full width         |
| User org filter | Full width               | max-w-sm (`md`)     | max-w-sm           |

### Hidden / Collapsed Elements

- Sidebar text labels hidden `< lg` (shows "CV" abbreviation on tablet)
- User info card hidden `< lg` in desktop sidebar
- Logout text hidden `< lg` (icon only)
- Mobile header hidden `≥ md`

---

## 11. Animation System

### CSS Transitions

| Element                    | Duration | Easing                                     |
| -------------------------- | -------- | ------------------------------------------ |
| Buttons, inputs, nav links | 150ms    | default (`transition-colors duration-150`) |
| Sidebar width              | 200ms    | default                                    |
| Empty state                | —        | `transition-colors`                        |
| Table rows                 | —        | `transition-colors` on hover               |

### Motion Tokens (`tokens.css`)

| Token           | Value |
| --------------- | ----- |
| `--motion-fast` | 120ms |
| `--motion-base` | 180ms |
| `--motion-slow` | 220ms |

### Shimmer Loading

```css
animation: shimmer 1.5s ease-in-out infinite;
background-size: 200% 100%;
```

Used by `Skeleton` component and `.shimmer` utility.

### Framer Motion

| Location                   | Animation                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **Login FloatingCard**     | `y: [0, -12, 0]`, `rotate: [0, 2, 0]`, 6s infinite, easeInOut |
| **Login form panel**       | `opacity: 0→1`, `y: 16→0`, 300ms                              |
| **Mobile drawer backdrop** | `opacity: 0→1`, AnimatePresence                               |
| **Mobile drawer panel**    | `x: -280→0`, 200ms easeInOut                                  |

### Other Animations

| Animation       | Usage                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `animate-spin`  | Button loading spinner, export processing icon                                                               |
| `animate-pulse` | AdminStatCard loading placeholder                                                                            |
| `CountUp`       | RAF-based number tween, 600ms default                                                                        |
| Command palette | `scale-[1.01]`, `transition-opacity duration-200`                                                            |
| Column dropdown | `animate-in fade-in slide-in-from-top-1 duration-100` (Tailwind animate plugin pattern — may require plugin) |

### Modal Transitions

No enter/exit animation — instant render at `z-50`.

---

## 12. Design Tokens

### Border Radius

| Token / Class                | Value          |
| ---------------------------- | -------------- |
| `--radius-sm`, `--radius-md` | 6px            |
| `--radius-lg`                | 8px            |
| `--radius-xl`                | 10px           |
| `--radius-2xl`               | 12px           |
| Tailwind `rounded-lg`        | 8px            |
| Tailwind `rounded-xl`        | 10px           |
| Tailwind `rounded-2xl`       | 12px           |
| Pills / badges               | `rounded-full` |

### Shadows

| Token          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| `shadow-xs`    | `0 1px 2px rgba(0,0,0,0.05)`                                |
| `shadow-sm`    | `0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)`    |
| `shadow-md`    | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`   |
| `shadow-modal` | `0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)` |
| `shadow-frame` | `0 25px 50px -12px rgba(15, 23, 42, 0.25)`                  |
| `shadow-glass` | `0 8px 32px rgba(15, 23, 42, 0.12)`                         |

Cards use `shadow-sm`; stat cards use `shadow-xs`; modals/command palette use `shadow-modal`.

### Opacity Values (Common)

| Usage                  | Value                    |
| ---------------------- | ------------------------ |
| Modal backdrop         | 40% black                |
| Disabled button        | 50%                      |
| Login subtitle         | 70% white                |
| Login demo hint        | 50% white                |
| Toast dismiss          | 70% → 100% hover         |
| Sidebar active (light) | zinc-200/80              |
| Hover backgrounds      | zinc-100/50, zinc-800/20 |

### Z-Index Scale

| Layer                                 | Z-Index    |
| ------------------------------------- | ---------- |
| Mobile sticky header                  | `z-30`     |
| Mobile drawer backdrop                | `z-40`     |
| Modal / mobile drawer / inline modals | `z-50`     |
| DataTable column dropdown             | `z-30`     |
| Toast viewport                        | `z-[100]`  |
| Command palette                       | `z-[9999]` |

### Transition Values

| Property                | Value |
| ----------------------- | ----- |
| Color transitions       | 150ms |
| Sidebar                 | 200ms |
| Command palette opacity | 200ms |

---

## 13. Accessibility Audit

### Implemented

| Feature                                                  | Location                                  |
| -------------------------------------------------------- | ----------------------------------------- |
| `lang="en"` on `<html>`                                  | Root layout                               |
| `aria-label` on icon buttons                             | Menu open/close, theme toggle, logout     |
| `aria-hidden="true"` on decorative icons                 | Nav, buttons, empty states                |
| `aria-busy` / `aria-live="polite"`                       | Loading states, toasts                    |
| Modal `role="dialog"` + `aria-modal` + `aria-labelledby` | Modal component                           |
| Focus trap in Modal                                      | Tab cycling, focus restore                |
| `role="status"` on loading spinner                       | Button loading state                      |
| Keyboard nav in CommandPalette                           | ↑↓, Enter, Esc                            |
| Semantic table structure                                 | DataTable `<table>`, `<thead>`, `<tbody>` |
| Form labels via `htmlFor` / `id`                         | Input, Select components                  |

### Gaps & Improvements

| Issue                          | Severity | Detail                                                                                                                           |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **ToastViewport not mounted**  | Medium   | `useToast` store exists but no global toast rendering in `Providers`                                                             |
| **Undefined Tailwind tokens**  | Medium   | `text-muted`, `border-input`, `ring-ring` used but not in `tailwind.config.ts` — descriptions/pagination may lack intended color |
| **Delete uses window.confirm** | Low      | Users/Organizations delete — native dialog, not accessible styled ConfirmDialog                                                  |
| **Inline modals inconsistent** | Medium   | Users/Organizations modals lack focus trap, `role="dialog"`, Escape handler (unlike `Modal` component)                           |
| **No skip link**               | Low      | No "skip to main content" for keyboard users                                                                                     |
| **Table sorting**              | Info     | No sortable headers — N/A for a11y but limits keyboard data exploration                                                          |
| **Dark mode qualifier badges** | Low      | Hot/warm/cold badges use light-mode-only `red-50`/`amber-50`/`blue-50` backgrounds                                               |
| **Color-only status**          | Low      | Session/user status relies on badge color + text (text present — acceptable)                                                     |
| **Login Suspense fallback**    | Low      | Plain `bg-primary` div without loading announcement                                                                              |

### Focus States

- Buttons/inputs: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`
- Native selects in some pages: `focus:ring-2 focus:ring-ring` (undefined token)

---

## 14. UX Patterns

### Search Behavior

| Screen    | Debounce                    | Resets Page | API Param |
| --------- | --------------------------- | ----------- | --------- |
| Contacts  | 300ms                       | Yes         | `q`       |
| Users     | 300ms                       | Yes         | `q`       |
| Audit Log | 300ms (`useDebouncedValue`) | Yes         | `q`       |

Search is **client-side debounced** — fires on trim, empty string omitted from query.

### Filtering Behavior

| Screen   | UI Pattern       | Behavior                                                                            |
| -------- | ---------------- | ----------------------------------------------------------------------------------- |
| Contacts | Pill buttons     | Single-select capture mode; "All" clears filter                                     |
| Sessions | Pill buttons     | Single-select status                                                                |
| Users    | Native select    | Organization filter (super admin); resets page                                      |
| Export   | 3 native selects | Session, lead qualifier, capture mode — applied on export request, not table filter |

Active filter style: `bg-accent-subtle text-accent border-accent/20`.

### Sorting Behavior

**Not implemented** in any table.

### Pagination Behavior

- Server-side pagination via page/limit query params
- Previous/Next only (no page number picker)
- Pagination hidden when loading or empty results
- Page sizes: Contacts/Users/Sessions 15, Audit 20, Export 10

### Modal Interactions

| Pattern                          | Used In                                          |
| -------------------------------- | ------------------------------------------------ |
| Shared `Modal` / `ConfirmDialog` | Available but rarely used                        |
| Inline fixed overlay modals      | Users (create/edit), Organizations (create/edit) |
| `window.confirm`                 | User delete, org archive                         |

Inline modals: click outside does **not** close; no Escape handler.

### Confirmation Dialogs

- `ConfirmDialog` component exists (`WEB/components/ui/modal.tsx`) but **not used**
- Destructive actions use browser `confirm()`

### Empty State Strategy

Every list page passes custom `EmptyState` to `DataTable` with:

- Contextual icon (Lucide)
- Title + description (varies for filtered vs unfiltered)
- Optional CTA button (Users, Organizations)

Default fallback in DataTable: FileQuestion icon, "No data available".

### Loading Strategy

| Level           | Component                                                    |
| --------------- | ------------------------------------------------------------ |
| Route-level     | `(admin)/loading.tsx`, `(auth)/loading.tsx`                  |
| Page-level      | Skeleton grids, inline "Loading…" text                       |
| Component-level | DataTable skeleton rows, AdminStatCard pulse, Button spinner |
| Query cache     | TanStack Query `staleTime: 30s`, `retry: 1`                  |

### Error Strategy

| Level          | Component                                                          |
| -------------- | ------------------------------------------------------------------ |
| Route-level    | `(admin)/error.tsx`, `(auth)/error.tsx` with EmptyState + reset    |
| Page-level     | PageHeader error message (dashboard), red text (contact not found) |
| Mutation-level | Inline red banners in forms/modals                                 |

---

## 15. Technical Architecture

### Component Hierarchy

```
RootLayout (app/layout.tsx)
└── Providers (QueryClient + theme effect + AuthBootstrap)
    ├── (auth)/layout → login/page
    └── (admin)/layout → AdminDrawer
        ├── Sidebar + MobileDrawer + CommandPalette
        └── main → [admin pages]
            ├── PageHeader
            ├── Card(s)
            ├── AdminStatCard / BarChart / DataTable / forms
            └── EmptyState / PaginationBar
```

### State Management

| Store / Hook              | Purpose                                        | Persistence                              |
| ------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `useAuthStore` (Zustand)  | User session, tokens, logout                   | Cookies + localStorage via `persistAuth` |
| `useThemeStore` (Zustand) | Light/dark mode                                | localStorage (`cardvault-theme-store`)   |
| `useToastStore` (Zustand) | Toast queue                                    | Ephemeral                                |
| TanStack Query hooks      | Server data (contacts, users, analytics, etc.) | In-memory cache                          |

### Context Providers

No React Context — Zustand stores + TanStack Query replace context pattern.

### Key Hooks

| Hook                                   | File                         | Purpose              |
| -------------------------------------- | ---------------------------- | -------------------- |
| `useDashboard`, `useAuditEvents`, etc. | `hooks/use-admin.ts`         | Admin API queries    |
| `useContactsList`, `useContact`        | `hooks/use-contacts.ts`      | Contact CRUD         |
| `useSessionsList`, `useCloseSession`   | `hooks/use-sessions.ts`      | Sessions             |
| `useOrgUsers`, `useCreateOrgUser`      | `hooks/use-org-users.ts`     | User management      |
| `useLeadFunnelAnalytics`, etc.         | `hooks/use-analytics.ts`     | Analytics            |
| `useBillingSubscription`, etc.         | `hooks/use-billing.ts`       | Stripe billing       |
| `useDebouncedValue`                    | `hooks/useDebouncedValue.ts` | Search debounce      |
| `useAuthProfile`                       | `hooks/use-auth-profile.ts`  | Profile sync on load |
| `useToast`                             | `hooks/useToast.ts`          | Toast push API       |

### Shared UI Utilities

| Utility                                   | File                | Purpose                                 |
| ----------------------------------------- | ------------------- | --------------------------------------- |
| `cn()`                                    | `lib/utils.ts`      | `clsx` + `tailwind-merge` class merging |
| `formatCaptureMode`, `formatLeadLabel`    | `lib/format.ts`     | Display formatting                      |
| `formatRoleLabel`, `isPlatformSuperAdmin` | `lib/roles.ts`      | Role display & guards                   |
| `loginSchema`                             | `lib/validation.ts` | Zod schemas                             |

### Styling Approach

1. **Tailwind CSS 3.4** with `darkMode: 'class'`
2. **CSS custom properties** in `styles/tokens.css` imported via `globals.css`
3. **Component-level Tailwind** — no CSS modules, no styled-components
4. **Utility classes** for special effects: `.glass-card`, `.login-gradient`, `.shimmer`

### Key Dependencies

| Package                   | Version     | UI Role                   |
| ------------------------- | ----------- | ------------------------- |
| `next`                    | 14.2.35     | App router, layouts       |
| `tailwindcss`             | 3.4.17      | Styling                   |
| `geist`                   | 1.7.2       | Typography                |
| `lucide-react`            | 0.469.0     | Icons                     |
| `framer-motion`           | 11.15.0     | Login + drawer animations |
| `react-hook-form` + `zod` | 7.54 / 3.24 | Form validation           |
| `@tanstack/react-query`   | 5.62        | Data fetching             |
| `zustand`                 | 5.0.2       | Client state              |

---

## 16. Rebuild Guide

### How to Recreate This UI

Follow this order to rebuild CardVault Web from scratch without reading source files.

#### Step 1 — Foundation

1. Create **Next.js 14** app with App Router.
2. Install: `tailwindcss`, `geist`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`.
3. Copy design tokens from `WEB/styles/tokens.css` into your global CSS.
4. Extend `tailwind.config.ts` with color mappings, shadows, border radii, shimmer keyframes (see Section 12).
5. Set `darkMode: 'class'`. Apply Geist Sans/Mono in root layout.

#### Step 2 — Design System Components (build in this order)

1. **`cn()` utility** — class merge helper.
2. **`Button`** — 4 variants × 3 sizes + loading spinner.
3. **`Input`** + **`Select`** — labeled fields with error states.
4. **`Card`** family — base container for all page content.
5. **`Badge`** — including hot/warm/cold qualifier variants.
6. **`Skeleton`** — shimmer loading placeholder.
7. **`Modal`** + **`ConfirmDialog`** — accessible dialog with focus trap.
8. **`EmptyState`** — dashed border empty pattern.
9. **`PageHeader`** — consistent page titles.
10. **`LeadBadge`** — qualifier wrapper.

#### Step 3 — Admin Components

1. **`AdminStatCard`** — KPI tile with CountUp animation.
2. **`BarChart`** — CSS vertical bar chart (h-32 container).
3. **`DataTable`** — generic table with column toggle, skeleton loading, empty state slot.
4. **`PaginationBar`** — Previous/Next footer.
5. **`ListSkeleton`** — route-level loading placeholder.
6. **`AdminDrawer`** — full app shell with responsive sidebar + mobile drawer.
7. **`CommandPalette`** — ⌘K global navigation overlay.

#### Step 4 — Layouts & Routing

```
app/
├── layout.tsx          # Root: fonts, Providers
├── page.tsx            # Redirect /
├── globals.css         # Tokens + utilities
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx  # Glass card login
│   ├── loading.tsx
│   └── error.tsx
└── (admin)/
    ├── layout.tsx      # AdminDrawer wrapper
    ├── loading.tsx
    ├── error.tsx
    └── admin/
        ├── dashboard/page.tsx
        ├── analytics/page.tsx
        ├── contacts/...
        ├── sessions/page.tsx
        ├── users/page.tsx
        ├── audit-log/page.tsx
        ├── export/page.tsx
        ├── billing/page.tsx
        └── organizations/page.tsx
```

#### Step 5 — Page Templates

Each admin page follows this structure:

```tsx
<div className="space-y-6">
  <PageHeader title="..." description="..." action={...} />
  <Card><CardContent>{/* filters */}</CardContent></Card>
  <Card><CardContent className="p-0">
    <DataTable ... />
    <PaginationBar ... />
  </CardContent></Card>
</div>
```

Dashboard/Analytics add stat grids (`grid gap-4 sm:grid-cols-2 xl:grid-cols-4`) and BarChart cards.

#### Step 6 — Theme & Auth Wiring

1. **Theme store:** Persist light/dark, toggle `.dark` on `<html>`.
2. **Auth store:** Session from cookies; bootstrap profile on load.
3. **Middleware:** Gate `/admin/*`, redirect employees to login error.
4. **Providers:** QueryClient + theme effect + AuthBootstrap.

#### Step 7 — Responsive Checklist

- [ ] Sidebar hidden `< md`, hamburger + 280px drawer
- [ ] Sidebar collapsed 72px at `md`, expanded 256px at `lg`
- [ ] Main padding `p-4` → `lg:p-8`
- [ ] Stat grids: 1 → 2 (`sm`) → 4 (`xl`) columns
- [ ] Tables scroll horizontally on small screens (`min-w-[640px]`)

#### Step 8 — Polish

- Login: navy gradient + floating card animations + glass morphism panel
- Command palette: ⌘K with keyboard navigation
- CountUp animation on stat cards
- Consistent 300ms search debounce on all list pages
- Empty states with contextual copy for filtered vs empty data

### File Reference Map

| Category         | Primary Files                                                |
| ---------------- | ------------------------------------------------------------ |
| Design tokens    | `styles/tokens.css`, `tailwind.config.ts`, `app/globals.css` |
| UI primitives    | `components/ui/*.tsx`                                        |
| Admin components | `components/admin/*.tsx`                                     |
| Layout           | `components/layout/admin-drawer.tsx`, `page-header.tsx`      |
| Shared           | `components/shared/*.tsx`                                    |
| Pages            | `app/(admin)/admin/**/page.tsx`, `app/(auth)/login/page.tsx` |
| State            | `stores/auth-store.ts`, `stores/theme-store.ts`              |
| Providers        | `components/providers.tsx`                                   |

---

_This document was generated from the CardVault `WEB/` codebase. All color, spacing, typography, and component values reflect the actual implementation as of the analysis date._
