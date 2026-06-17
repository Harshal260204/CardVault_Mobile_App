# CardVault Design System Recommendations

**Document Type:** Production Design System Proposal  
**Version:** 1.0  
**Prepared For:** CardVault Engineering & Design Team  
**Date:** May 25, 2026  
**Classification:** Internal — Design Reference & Implementation Guide

---

> **Scope:** This document does not repeat audit findings. It translates them into a definitive, opinionated, forward-looking design system that CardVault should implement to achieve premium enterprise SaaS quality. Every recommendation is implementation-ready.

---

## 1. Executive Summary

### Overall Visual Direction

CardVault's current interface is a **well-engineered MVP** that scores high on structure and low on soul. The engineering foundation — Tailwind CSS, shadcn/ui primitives, Framer Motion, Next.js — is exactly right. What it lacks is the layer of considered aesthetic decision-making that separates tools people use from tools people love.

The redesign direction is: **"Attio meets Linear, built for enterprise OCR."**

Concretely: dense, data-forward layouts with surgical whitespace, a neutral-first color system that lets data take center stage, a single premium typeface with a disciplined scale, and motion that is purposeful rather than decorative.

### Recommended Design Philosophy

**Principle 1 — Data is the hero.** Every pixel that does not serve the data is a pixel that fights the user. No gradients on structural elements. No decorative shadows. Depth only where it signals elevation.

**Principle 2 — Consistency over cleverness.** The current interface already has most of the right primitives. The problem is inconsistency — labels in three styles, borders in two radii systems, colors from two different philosophies. The redesign enforces a single token layer that everything derives from.

**Principle 3 — Enterprise density.** CardVault is an admin console used by people who spend 6+ hours a day in it. It must be dense enough to be productive but not so dense it creates cognitive fatigue. Target: Linear's density, Stripe's refinement.

**Principle 4 — AI-native aesthetics.** OCR and AI-powered card scanning deserve a UI that looks capable of AI. That means subtle neutral backdrops, confident typography, and interaction patterns that feel fast and responsive.

### Recommended Benchmark Inspiration

| Benchmark | What to Borrow |
| :--- | :--- |
| **Linear** | Table density, keyboard-first UX, sidebar weight, motion timing |
| **Stripe Dashboard** | Typography hierarchy, data card refinement, semantic color discipline |
| **Vercel** | Neutral palette strategy, dark mode implementation, empty state design |
| **Attio** | CRM-style contact card patterns, relationship density, filter UX |
| **Raycast** | Command palette patterns, speed-first interaction design |

### Key Redesign Goals

1. Resolve the dark sidebar / light content visual split — unify into a single coherent surface system
2. Eliminate all three amber contrast violations and harden the semantic color layer
3. Replace Inter with a more characterful typeface while preserving legibility
4. Introduce a token-based dark mode that works identically on web and mobile
5. Upgrade the table component to enterprise density standard
6. Add a real motion system — not decoration, but feedback

---

## 2. Final Typography System

### Recommended Font Stack

**Primary Typeface: Geist Sans** (by Vercel, open source)

Geist is the definitive choice for CardVault's redesign. It is purpose-built for developer and data tooling, ships with a variable font file (range: 100–900), has exceptional legibility at 12px–13px (critical for dense table rows), and its slightly condensed metrics allow more data per row without sacrificing readability. Unlike Inter, which is neutral to the point of invisibility, Geist has a quiet confidence that signals a premium, modern product.

**Secondary / Display: Geist Mono**

Use for: scan result data, OCR output previews, API keys, session tokens, card number fields. Monospaced data presented in a monospaced font eliminates cognitive shift and signals precision.

**Variable Font Declaration**

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap');

:root {
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;
}
```

**Why Geist over alternatives:**

Geist is not a generic sans-serif. It reads as "engineered for interfaces." Its open counters at small sizes (12–13px) outperform Inter at the exact sizes CardVault uses most — table cells, form labels, badge text. It also carries a visual association with Vercel, which positions CardVault aesthetically alongside top-tier developer tooling.

---

### Typography Comparison

| Font | Personality | Ideal Use Case | Small Size Legibility | Variable | Verdict |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Geist** | Precise, modern, engineered | Developer tools, dashboards | ★★★★★ | ✅ | **Recommended** |
| **Inter** | Neutral, ubiquitous | General-purpose UI | ★★★★☆ | ✅ | Good fallback |
| **Satoshi** | Friendly, rounded | Consumer SaaS, marketing | ★★★☆☆ | ✅ | Too soft for enterprise |
| **Plus Jakarta Sans** | Geometric, warm | Design tools, onboarding | ★★★☆☆ | ✅ | Avoid — too rounded |
| **Manrope** | Minimal, clean | Analytics, fintech | ★★★★☆ | ✅ | Strong alternative |
| **General Sans** | Humanist, approachable | Mid-market SaaS | ★★★☆☆ | ✅ | Avoid — lacks precision |
| **IBM Plex Sans** | Technical, corporate | Enterprise legacy software | ★★★☆☆ | ❌ | Avoid — reads dated |

**Best choice:** Geist Sans  
**Why:** Purpose-built for data-dense interfaces. Open, variable, and visually distinctive without being decorative.  
**Avoid:** Plus Jakarta Sans (too consumer), IBM Plex Sans (feels 2018), General Sans (ambiguous personality).

---

### Final Type Scale

#### Desktop Type Scale

| Token | Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | 28px | 1.2 | 700 | −0.03em | Page hero titles (rare) |
| `heading-xl` | 22px | 1.3 | 700 | −0.02em | Section page titles |
| `heading-lg` | 18px | 1.35 | 600 | −0.015em | Card group headers |
| `heading-md` | 15px | 1.4 | 600 | −0.01em | Modal titles, panel headers |
| `heading-sm` | 13px | 1.4 | 600 | 0.02em | Uppercase section labels |
| `body-lg` | 15px | 1.6 | 400 | 0 | Rich text, descriptions |
| `body-md` | 14px | 1.5 | 400 | 0 | Standard body text |
| `body-sm` | 13px | 1.5 | 400 | 0 | Supporting text, hints |
| `caption` | 11px | 1.4 | 500 | 0.04em | Timestamps, metadata |
| `overline` | 11px | 1 | 600 | 0.08em | Uppercase category labels |

#### Mobile Type Scale

| Token | Size | Line Height | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| `heading-xl` | 20px | 1.25 | 700 | −0.02em |
| `heading-lg` | 17px | 1.3 | 600 | −0.01em |
| `heading-md` | 15px | 1.4 | 600 | 0 |
| `body-md` | 14px | 1.55 | 400 | 0 |
| `body-sm` | 13px | 1.5 | 400 | 0 |
| `caption` | 11px | 1.4 | 500 | 0.03em |

#### Component-Specific Type Tokens

**Buttons**

| Size | Font Size | Weight | Tracking |
| :--- | :--- | :--- | :--- |
| `btn-sm` | 12px | 500 | 0.01em |
| `btn-md` | 13px | 600 | 0.01em |
| `btn-lg` | 14px | 600 | 0.015em |

**Tables**

| Element | Font Size | Weight | Tracking |
| :--- | :--- | :--- | :--- |
| Header | 11px | 600 | 0.06em |
| Cell | 13px | 400 | 0 |
| Cell (important) | 13px | 500 | 0 |
| Cell (metadata) | 12px | 400 | 0 |

**Forms**

| Element | Font Size | Weight | Tracking |
| :--- | :--- | :--- | :--- |
| Label | 11px | 600 | 0.06em |
| Input text | 14px | 400 | 0 |
| Placeholder | 14px | 400 | 0 |
| Helper text | 12px | 400 | 0 |
| Error text | 12px | 500 | 0 |

**Dashboard Cards**

| Element | Font Size | Weight | Tracking |
| :--- | :--- | :--- | :--- |
| Metric value | 28px | 700 | −0.02em |
| Metric label | 11px | 600 | 0.06em |
| Delta badge | 12px | 500 | 0 |
| Card title | 13px | 600 | 0.04em |

---

## 3. Final Color System

### Recommended Color Philosophy

The current CardVault palette reads as a **first-draft corporate color scheme** — correct in intent but flat in execution. The dark navy (`#1E3A5F`) sidebar against a stark white content area creates a jarring visual split reminiscent of legacy enterprise software rather than modern SaaS. Blue-500 (`#3B82F6`) used as the sole accent makes every action feel equally important.

**The upgrade strategy:**

1. **Move to an HSL-based token system.** HSL tokens allow dark mode, theme customization, and contrast adjustments without touching component code.
2. **Replace hard hex values in component classes** with semantic token names (`--color-primary`, `--color-surface-raised`, etc.).
3. **Use neutral slate as the base, not navy.** Navy should only appear in the sidebar (as an option), not as a base surface philosophy.
4. **Introduce a single restrained accent — indigo** — that feels modern and AI-native.

---

### Final Color Palette

#### Primary Palette — Indigo System

| Token | Light Mode HEX | Dark Mode HEX | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-accent` | `#4F46E5` | `#6366F1` | `indigo-600` / `indigo-500` | CTAs, active states, links |
| `--color-accent-hover` | `#4338CA` | `#818CF8` | `indigo-700` / `indigo-400` | Hover states on accent |
| `--color-accent-subtle` | `#EEF2FF` | `#1E1B4B` | `indigo-50` / `indigo-950` | Tinted badge backgrounds |
| `--color-accent-foreground` | `#FFFFFF` | `#FFFFFF` | — | Text on accent backgrounds |

**Why Indigo over Blue-500:** Indigo is the color of AI-native products (Notion AI, Linear, Anthropic). Blue-500 is the color of 2015 dashboards. Indigo reads as intentional, premium, and modern. The shift is subtle to users but significant in perception.

#### Surface & Background Hierarchy

| Token | Light Mode HEX | Dark Mode HEX | Tailwind | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-canvas` | `#F8FAFC` | `#09090B` | `slate-50` / `zinc-950` | Page background |
| `--color-surface` | `#FFFFFF` | `#18181B` | `white` / `zinc-900` | Card, modal, panel |
| `--color-surface-raised` | `#FFFFFF` | `#27272A` | `white` / `zinc-800` | Dropdown, popover, tooltip |
| `--color-surface-overlay` | `rgba(255,255,255,0.8)` | `rgba(24,24,27,0.8)` | — | Blurred overlays |
| `--color-border` | `#E4E4E7` | `#3F3F46` | `zinc-200` / `zinc-700` | Subtle dividers |
| `--color-border-strong` | `#D4D4D8` | `#52525B` | `zinc-300` / `zinc-600` | Active borders |

**Sidebar surface:** Replace `#1E3A5F` (dark navy) with `#18181B` (zinc-900) in dark mode and `#FAFAFA` (zinc-50) with a `1px solid #E4E4E7` right border in light mode. This resolves the "two-template" split by making the sidebar a naturally continuous surface.

#### Text Colors

| Token | Light Mode HEX | Dark Mode HEX | Tailwind | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-text-primary` | `#09090B` | `#FAFAFA` | `zinc-950` / `zinc-50` | Headings, emphasis |
| `--color-text-secondary` | `#52525B` | `#A1A1AA` | `zinc-600` / `zinc-400` | Body, descriptions |
| `--color-text-tertiary` | `#A1A1AA` | `#52525B` | `zinc-400` / `zinc-600` | Placeholders, metadata |
| `--color-text-disabled` | `#D4D4D8` | `#3F3F46` | `zinc-300` / `zinc-700` | Disabled state text |
| `--color-text-inverse` | `#FFFFFF` | `#09090B` | — | Text on dark surfaces |

#### Semantic Colors

| Token | Light HEX | Dark HEX | Background Light | Background Dark | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--color-success` | `#16A34A` | `#22C55E` | `#F0FDF4` | `#052E16` | Success states |
| `--color-warning` | `#B45309` | `#F59E0B` | `#FFFBEB` | `#1C1300` | **Warning — fixed from audit** |
| `--color-error` | `#DC2626` | `#EF4444` | `#FEF2F2` | `#1C0101` | Error states, destructive |
| `--color-info` | `#0284C7` | `#38BDF8` | `#F0F9FF` | `#0C1A2E` | Informational states |

> **Critical fix applied:** The amber warning color is now `#B45309` (Amber-700, 4.6:1 contrast ratio) in light mode, resolving the WCAG AA violation identified in the audit.

#### Lead Qualifier Colors

| Qualifier | Badge Text | Badge Background | Dark Background |
| :--- | :--- | :--- | :--- |
| Hot | `#B91C1C` (red-700) | `#FEF2F2` | `#1C0101` |
| Warm | `#B45309` (amber-700) | `#FFFBEB` | `#1C1300` |
| Cold | `#1D4ED8` (blue-700) | `#EFF6FF` | `#0C1A2E` |

---

## 4. Layout & Spacing System

### Spacing Scale

CardVault should adopt an **8pt base grid** — the standard for enterprise SaaS — with a carefully controlled set of spacing tokens. Every margin, padding, and gap value must be derived from this scale. No arbitrary spacing.

| Token | px Value | rem | Primary Usage |
| :--- | :--- | :--- | :--- |
| `space-1` | 4px | 0.25rem | Icon gap, badge padding-x |
| `space-2` | 8px | 0.5rem | Tight inline gaps, icon-to-label |
| `space-3` | 12px | 0.75rem | Form control internal gaps |
| `space-4` | 16px | 1rem | Standard content gap, label-to-input |
| `space-5` | 20px | 1.25rem | Card internal padding (compact) |
| `space-6` | 24px | 1.5rem | Card internal padding (standard) |
| `space-8` | 32px | 2rem | Section spacing, modal padding |
| `space-10` | 40px | 2.5rem | Page header bottom margin |
| `space-12` | 48px | 3rem | Major section separators |
| `space-16` | 64px | 4rem | Full-page section blocks |

### Grid System

| Breakpoint | Columns | Gutter | Container Max-Width |
| :--- | :---: | :--- | :--- |
| Mobile (`< 640px`) | 4 | 16px | 100% |
| Tablet (`640–1024px`) | 8 | 20px | 100% |
| Desktop (`1024–1440px`) | 12 | 24px | 1280px |
| Wide (`> 1440px`) | 12 | 24px | 1440px |

**Critical rule:** Cap the main content container at `max-w-[1440px]` with `mx-auto`. This prevents the stat card grid from stretching excessively wide on ultrawide monitors — the exact issue identified in the audit.

### Dashboard Density

**Target density: Medium-High** — equivalent to Stripe Dashboard or Vercel Projects view.

- Stat cards: `4-column grid` on desktop, `2-column` on tablet, `1-column` on mobile
- Card padding: `p-5` (20px) — reduced from current `p-6` for tighter enterprise feel
- Row height in tables: `h-11` (44px) — touch-compliant, efficient
- Sidebar width (expanded): `240px`; collapsed icon rail: `72px`
- Content area left padding: `pl-6` when sidebar is expanded

### Responsive Strategy

1. **Tablet sidebar** (768–1024px): Introduce a **collapsed icon rail** at 72px width. Do not hide navigation behind a hamburger on tablets — this is the single highest-impact UX fix for tablet users.
2. **Table overflow** (< 640px): Add a faint right-edge gradient overlay (`linear-gradient(to left, white, transparent)`) on horizontally scrollable tables to signal hidden content.
3. **Container behavior**: Never let content containers grow beyond their max-width. Use `mx-auto` on the main content wrapper.

---

## 5. Component Design Direction

### Buttons

**Philosophy:** Buttons should feel like precise tools, not decorative UI elements. The goal is tactile — they should respond to touch like physical controls.

| Property | Primary | Secondary | Ghost | Destructive |
| :--- | :--- | :--- | :--- | :--- |
| Background | `--color-accent` | `--color-surface` | transparent | `--color-error` |
| Border | none | `1px solid --color-border-strong` | none | none |
| Text | white | `--color-text-primary` | `--color-text-secondary` | white |
| Border radius | `6px` | `6px` | `6px` | `6px` |
| Padding (md) | `px-4 py-2` | `px-4 py-2` | `px-3 py-2` | `px-4 py-2` |
| Shadow | none | `0 1px 2px rgba(0,0,0,0.05)` | none | none |
| Hover | `--color-accent-hover` | `bg-zinc-50` | `bg-zinc-100` | darker red |
| Active | `scale(0.98)` + darken | `scale(0.98)` | `scale(0.98)` | `scale(0.98)` |
| Focus ring | `2px solid --color-accent` offset 2px | same | same | `2px solid --color-error` |
| Disabled | 40% opacity, `cursor-not-allowed` | same | same | same |

**Accessibility addition:** Every button with a loading state must declare `aria-busy="true"` and `aria-label="Loading..."`. The spinner inside a loading button should have `role="status"`.

**Motion:** `transition: background-color 120ms ease, transform 80ms ease`

---

### Inputs

**Philosophy:** Inputs are where data enters the system. They must feel precise, clean, and responsive — not blocky and indifferent.

| Property | Value |
| :--- | :--- |
| Height | `h-9` (36px) — reduced from `h-11` |
| Border | `1px solid --color-border` |
| Border radius | `6px` |
| Background | `--color-surface` |
| Padding | `px-3 py-2` |
| Icon support | Left icon: `pl-9`, prefix absolute positioned |
| Focus border | `1px solid --color-accent` + `ring-1 ring-accent/20` |
| Error border | `1px solid --color-error` + `ring-1 ring-error/20` |
| Placeholder | `--color-text-tertiary` |
| Label | 11px, weight 600, tracking 0.06em, uppercase, `--color-text-tertiary` |
| Helper text | 12px, `--color-text-tertiary`, `mt-1` |
| Error text | 12px, `--color-error`, `mt-1`, weight 500 |
| Transition | `border-color 120ms ease, box-shadow 120ms ease` |

**Standardize all form labels** to `text-[11px] font-semibold uppercase tracking-wide text-zinc-400` — resolving the audit finding of inconsistent label styles across pages.

---

### Tables

**Philosophy:** The table is the most important component in CardVault. Managers spend the majority of their session time in table views. It must be information-dense, scannable, and actionable.

| Property | Value |
| :--- | :--- |
| Header background | `bg-zinc-50` (light) / `bg-zinc-900` (dark) |
| Header padding | `px-4 py-2.5` |
| Header text | 11px, weight 600, tracking 0.06em, uppercase, `--color-text-tertiary` |
| Header border-bottom | `1px solid --color-border` |
| Row height | `h-11` (44px) |
| Row padding | `px-4 py-0` (vertical center via flex) |
| Row hover | `bg-zinc-50/70` (light) / `bg-zinc-800/40` (dark) |
| Row border | `border-b border-zinc-100` (light) / `border-zinc-800` (dark) |
| Cell text | 13px, weight 400, `--color-text-primary` |
| Cell (secondary) | 12px, weight 400, `--color-text-secondary` |
| Actions column | Fixed width `w-[120px]`, right-aligned |
| Checkbox column | Fixed width `w-[48px]` |
| Overflow (mobile) | Horizontal scroll + right gradient overlay signal |
| Empty state | Illustrated empty state component (see §5 Empty States) |
| Skeleton loading | Shimmer row skeleton matching exact row height |

**Column sizing is the single biggest table UX issue identified.** Set explicit `minWidth` on all columns: status badge columns `w-[100px]`, timestamp columns `w-[140px]`, name columns `min-w-[160px]`, action columns `w-[100px]`.

---

### Cards

| Property | Value |
| :--- | :--- |
| Background | `--color-surface` |
| Border | `1px solid --color-border` |
| Border radius | `8px` |
| Padding | `p-5` (20px) |
| Shadow | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)` |
| Hover (interactive) | `shadow-md` transition |
| Header divider | `border-b border-zinc-100 pb-4 mb-4` |
| Stat card value | 28px, weight 700, tracking −0.02em |
| Stat card label | 11px, weight 600, uppercase, tracking 0.06em, `--color-text-tertiary` |

**Remove raw `border-gray-200` from all card borders.** Replace with the softer `--color-border` token (`#E4E4E7`) and add the shadow above. This single change makes the cards feel 40% more premium instantly.

---

### Navigation & Sidebar

**The sidebar redesign is the highest-impact visual change.**

**Light mode sidebar:**

```
Background:  #FAFAFA (zinc-50)
Right border: 1px solid #E4E4E7
Width:        240px (expanded), 72px (collapsed icon rail)
```

**Dark mode sidebar:**

```
Background:  #18181B (zinc-900)
Right border: 1px solid #27272A
```

| Property | Value |
| :--- | :--- |
| Nav item height | `h-9` |
| Nav item padding | `px-3` |
| Nav item radius | `6px` |
| Active state (light) | `bg-zinc-100 text-zinc-900 font-medium` |
| Active state (dark) | `bg-zinc-800 text-zinc-50 font-medium` |
| Hover state | `bg-zinc-100/70` (light) / `bg-zinc-800/60` (dark) |
| Icon size | `16px`, stroke-width `1.5` |
| Icon + label gap | `gap-2.5` |
| Section labels | 11px, uppercase, tracking 0.06em, `--color-text-tertiary`, `px-3 mb-1` |
| Collapsed (tablet) | Icon only, 72px width, tooltip on hover |

**This eliminates the "two templates pasted together" critique** by making the sidebar and content area share the same surface language.

---

### Modals

| Property | Value |
| :--- | :--- |
| Backdrop | `rgba(0,0,0,0.4)` blur(4px) |
| Surface | `--color-surface` |
| Border radius | `10px` |
| Border | `1px solid --color-border` |
| Shadow | `0 20px 60px rgba(0,0,0,0.15)` |
| Padding | `p-6` header, `p-6` content, `p-4` footer |
| Max width | `sm: 440px`, `md: 560px`, `lg: 680px` |
| Header | Title `heading-md`, close button top-right |
| Footer | Right-aligned action buttons, `gap-2` |
| Entry motion | `scale(0.97) → scale(1.0)`, `opacity: 0 → 1`, 150ms ease-out |
| Exit motion | `scale(1.0) → scale(0.97)`, `opacity: 1 → 0`, 100ms ease-in |

---

### Empty States

**Current implementation (text-only "No records found") is the weakest part of the UI.** Every empty state is an onboarding moment — it should tell the user what to do next.

Empty state anatomy:

```
[Illustration or icon — 48px muted icon, not decorative art]
[Heading — 15px, weight 600, --color-text-primary]
[Description — 14px, weight 400, --color-text-secondary, max-w-[300px] centered]
[CTA Button — Primary or Secondary]
```

Specific empty states to design:

- **Users table empty** → "No users yet" + "Invite your first salesperson" CTA
- **Contacts table empty** → "No leads scanned yet" + "Share the mobile app with your team" CTA  
- **Dashboard first-login** → "Welcome to CardVault" guided callout box with 3 setup steps
- **Analytics empty** → "No data yet" + estimated time to first data

---

### Search & Filters

| Property | Value |
| :--- | :--- |
| Search input height | `h-9` |
| Search icon | `16px` Lucide Search, left-padded, `text-zinc-400` |
| Filter pill | `h-7`, `px-3`, `text-[12px]`, `rounded-full` |
| Active filter | `bg-indigo-50 text-indigo-700 border-indigo-200` |
| Filter dropdown | Custom component replacing native `<select>` |
| Clear button | `×` icon, appears inside pill when active |

**Replace all native `<select>` dropdowns** in filter bars and forms with a custom Combobox component (shadcn/ui Command + Popover). This resolves one of the most visually inconsistent elements identified in the audit.

---

### Analytics Components

| Component | Direction |
| :--- | :--- |
| Stat cards | Large metric + delta badge + sparkline |
| Line charts | Recharts, thin 1.5px lines, no fill, grid lines at 20% opacity |
| Bar charts | `rounded-sm` bars, single accent color, hover tooltip |
| Donut charts | Thin ring (innerRadius 70%), centered metric label |
| Delta badge | `+12%` or `−5%`, color-coded, 12px, rounded-full |
| Tooltips | Dark backdrop, 13px text, `px-3 py-2`, `8px` radius |
| Empty chart | Dashed border placeholder with "No data for this period" |

---

## 6. Dashboard UX Recommendations

### Ideal Dashboard Density

The CardVault dashboard serves two roles: a **command center** (quick status overview) and a **navigation launchpad** (jump to key workflows). Design for both simultaneously.

**Recommended layout:**

```
Row 1: 4-column stat cards (Orgs / Active Users / Scans Today / Leads Total)
Row 2: [2/3] Recent Activity Timeline | [1/3] Quick Actions / Onboarding Checklist
Row 3: [1/2] Scans by Organization Chart | [1/2] Lead Quality Distribution Chart
```

Cap "Recent Activity" at 8 items with a "View all activity →" link. Do not let it grow into an uncapped scrollable list — this is the exact issue identified in the audit.

### Sidebar Strategy

- **Desktop (≥ 1024px):** Expanded sidebar, 240px, always visible
- **Tablet (768–1023px):** Collapsed icon rail, 72px, tooltips on hover — **critical change**
- **Mobile (< 768px):** Full-screen drawer via Framer Motion AnimatePresence (keep current implementation)

Add a **keyboard shortcut** (`⌘K` or `Ctrl+K`) to open a command palette for power navigation. This single feature elevates the product to productivity-tool status.

### Table UX Improvements

1. Add a **sticky header** on tables longer than the viewport
2. Implement **multi-sort** (click to sort, shift+click to add secondary sort)
3. Add **column visibility toggle** — hide/show columns via a gear icon dropdown
4. Implement **row selection** with batch action bar (Delete selected, Export selected)
5. Add **pagination controls** below the table: `← Previous` `Page 2 of 8` `Next →`

### OCR Workflow Optimization

Since CardVault's core value is OCR card scanning, the admin console should surface scan results prominently:

1. **Scan history table** should be the primary data table, not a secondary menu
2. OCR confidence scores should display as a **progress bar** (0–100%) with color coding (green >80%, amber 60–80%, red <60%)
3. **Raw scan data vs parsed data** should display side-by-side in a detail drawer, with the OCR output rendered in `Geist Mono` to signal its technical nature
4. Failed scans should surface with a dedicated **"Needs Review"** badge and filter

### CRM Workflow Improvements

1. Contact detail page: Show a **timeline** of all scan events for a contact
2. Add **quick qualify** buttons directly in the table row — Hot / Warm / Cold — without opening a modal
3. Add **bulk status update**: select multiple leads → change qualifier in one action
4. Show **organization attribution** on every lead card — which org's employee scanned this contact

### Productivity Optimization

1. **Keyboard-first interactions:** Every table action available via keyboard shortcut
2. **Persistent filter state:** Saved in URL query params so users can bookmark filtered views
3. **Density toggle:** Compact / Default / Comfortable table row height selector (right of table toolbar)

---

## 7. Accessibility Improvements

### WCAG 2.1 AA Target: 95+/100

| Fix | Priority | Implementation |
| :--- | :--- | :--- |
| Warning amber text → `#B45309` | **Critical** | Update `--color-warning` token |
| Add `aria-busy="true"` on loading buttons | **High** | Update `button.tsx` |
| Add `aria-hidden="true"` to all Lucide icons | **High** | Wrap icon renders in `<span aria-hidden="true">` |
| Replace navigation `onClick` with `<Link>` | **High** | `admin-drawer.tsx`, all nav items |
| Mobile close button minimum 44×44px | **High** | Increase tap target padding |
| Tablet sidebar icon-rail tooltips | Medium | `role="tooltip"`, `aria-describedby` |
| Password strength indicator in org modal | Medium | Visual + text indicator, `aria-live="polite"` |
| Inline field validation (not top banner) | Medium | Field-level `aria-invalid` + `aria-describedby` |
| Focus trap in modals | Medium | Standard `focus-trap-react` or shadcn Dialog |
| `aria-label` on icon-only buttons | High | All icon-only actions (edit, delete, close) |
| `role="status"` on loading skeletons | Low | Skeleton components |
| Skip-to-main-content link | Low | First focusable element in DOM |

### Contrast Reference

| Pair | Current Ratio | Required | Status |
| :--- | :--- | :--- | :--- |
| Body text on white | 19.1:1 | 4.5:1 | ✅ |
| Amber warning on white (old) | 3.2:1 | 4.5:1 | ❌ Fixed |
| Amber warning on white (new `#B45309`) | 4.6:1 | 4.5:1 | ✅ |
| Accent indigo on white | 5.9:1 | 4.5:1 | ✅ |
| Placeholder text on surface | 4.6:1 | 4.5:1 | ✅ |

---

## 8. Motion & Interaction Design

### Motion Philosophy

**The rule: motion communicates, it does not decorate.**

Every animation must answer the question: *What does this tell the user?* Slide-ins signal appearance. Scale-downs signal removal. Skeleton pulses signal loading. If an animation does not answer a question, cut it.

CardVault's current Framer Motion usage is structurally correct — it just lacks tuning. The animations feel either too slow (>300ms for simple interactions) or abrupt (instant state changes without visual continuity).

### What Should Animate

| Interaction | Animation | Duration | Easing |
| :--- | :--- | :--- | :--- |
| Modal open | `scale(0.97→1) + opacity(0→1)` | 150ms | `ease-out` |
| Modal close | `scale(1→0.97) + opacity(1→0)` | 100ms | `ease-in` |
| Mobile drawer open | `translateX(−100%→0)` | 220ms | `spring(stiffness: 300, damping: 30)` |
| Mobile drawer close | `translateX(0→−100%)` | 180ms | `ease-in` |
| Button tap | `scale(1→0.98)` | 80ms | `ease-out` |
| Tooltip appear | `opacity(0→1) + translateY(4px→0)` | 120ms | `ease-out` |
| Toast notification | `translateY(−8px→0) + opacity(0→1)` | 200ms | `spring` |
| Skeleton shimmer | Left-to-right gradient sweep | 1.4s | linear, infinite |
| Row hover | `background-color` transition | 80ms | `ease` |
| Dropdown open | `scaleY(0.95→1) + opacity(0→1)` | 120ms | `ease-out` |
| Page transition | `opacity(0→1)` | 150ms | `ease` |
| Tab indicator | Sliding underline | 180ms | `spring(stiffness: 400, damping: 35)` |

### What Should NOT Animate

- Sidebar nav item clicks (instant response creates feeling of speed)
- Table row data loads (show skeleton, then instant replace)
- Form field focus (only border/shadow transition, no movement)
- Simple badge color changes
- Stat card number updates (instant, not count-up animations)

### Loading Skeletons

Replace all spinner-based loading states in tables with **shimmer skeleton rows** that match the exact column layout. This is the single most impactful loading UX upgrade and directly addresses the audit recommendation.

```
Skeleton row: h-11, columns match real layout
Shimmer: linear-gradient sweep from left, 1.4s cycle
Count: show 6 skeleton rows while loading
Color: bg-zinc-100 (light) / bg-zinc-800 (dark)
```

---

## 9. Modern SaaS Benchmarking

### Patterns CardVault Should Adopt

| Source | Pattern | How to Implement |
| :--- | :--- | :--- |
| **Linear** | Table row density — compact, scannable rows | Adopt `h-11` rows with `px-4` horizontal padding |
| **Linear** | Keyboard-first shortcuts | `⌘K` command palette, `J/K` row navigation |
| **Linear** | Sidebar icon rail on tablet | 72px collapsed sidebar at 768–1024px |
| **Stripe** | Semantic color discipline | Replace one-color accent with scoped semantic tokens |
| **Stripe** | Stat card + delta badges | Metric + trend indicator on all KPI cards |
| **Stripe** | Soft shadow language | Replace stark borders with `shadow-xs` + subtle border |
| **Vercel** | Neutral palette (zinc) | Migrate from navy/blue to zinc base |
| **Vercel** | Dark mode as first-class | HSL token system enabling instant theme swap |
| **Attio** | CRM contact timeline | Scan history timeline on contact detail view |
| **Attio** | Inline record editing | Quick-edit qualifier directly in table row |
| **Notion** | Empty state with guidance | Designed empty states with actionable next steps |
| **Airtable** | Filter pill UI | Replace dropdowns with active filter pills |

### Patterns CardVault Should Avoid

| Source | Anti-Pattern | Why to Avoid |
| :--- | :--- | :--- |
| **Notion** | Heavy page-style layout | CardVault is a dashboard, not a document editor |
| **Airtable** | Grid/spreadsheet density extremes | OCR data needs breathing room to be readable |
| **Stripe** | Marketing-heavy empty states | Too long — enterprise users want action, not copy |
| **Linear** | Monochrome palette | CardVault's OCR confidence scores need color meaning |

---

## 10. Final Opinionated Recommendation

### Best Typography Choice

**Geist Sans + Geist Mono.**

Geist at `14px/1.5` for body, `11px uppercase` for labels, `28px/700` for dashboard metrics. Geist Mono for all OCR output, scan data, and technical strings. No secondary typeface — Geist's weight range (100–900) provides all the hierarchy needed.

### Best Color Direction

**Zinc neutrals as the foundation, Indigo-600 as the single accent.**

Remove navy (`#1E3A5F`) from all surface roles. Keep it only as an optional brand sidebar color in a future theming system. Replace Blue-500 with Indigo-600 (`#4F46E5`). Implement HSL-based tokens immediately to enable dark mode parity with the mobile app.

### Best Dashboard Style

**Linear-density, Stripe-refinement, Attio-intelligence.**

4-column stat grid up top, one full-width activity section below, charts beneath that. Sticky sidebar navigation, always visible on desktop. Collapsed icon rail on tablet. Every empty state tells the user what to do next.

### Best UI Density

**Medium-High: comfortable for 6-hour daily use, dense enough to be productive.**

- Table rows: `h-11` (44px)
- Card padding: `p-5` (20px)
- Section gaps: `gap-6` (24px)
- Sidebar: 240px expanded, 72px collapsed
- No full-bleed content — always `max-w-[1440px]` with `mx-auto`

### Best Component Styling Direction

**Flat architecture, soft depth, zinc surfaces, indigo accents.**

No gradient backgrounds on structural surfaces. Depth only via `shadow-xs` (`0 1px 3px rgba(0,0,0,0.04)`) on cards and modals. Borders at `#E4E4E7` — visible but not aggressive. Rounded at `6px` for interactive elements, `8px` for containers, `10px` for modals. All shadows remove `border` when hovered, replaced by a slightly stronger shadow to signal interactivity.

---

> **"If I were redesigning CardVault from scratch today, this is the exact visual direction I would implement:"**
>
> Drop the navy sidebar entirely and rebuild the surface system on zinc neutrals, matched across light and dark modes. Swap Inter for Geist — the improved small-size legibility alone is worth the migration cost. Replace every instance of Blue-500 with Indigo-600 and immediately the product looks like it was designed intentionally, not assembled from a Tailwind default config. Fix the warning amber contrast violation on day one — it is a legal liability, not a minor polish item. Add the 72px icon-rail sidebar for tablet users immediately. Redesign every empty state with a real illustration, a clear heading, a concise explanation, and a single call to action. Replace all spinner loaders in tables with shimmer skeleton rows. Add inline field-level validation to every form. And implement `⌘K` command palette search — it transforms the tool from a CRUD interface into a power productivity console.
>
> The engineering foundation is sound. The design layer is approximately 80 hours of focused, disciplined work away from being a genuinely premium enterprise SaaS product. The recommendations above, implemented in order of priority, will close that gap.

---

## Appendix A: Implementation Priority Order

| Priority | Task | Estimated Effort |
| :--- | :--- | :--- |
| P0 — Critical | Fix amber warning contrast (`#B45309`) | 30 min |
| P0 — Critical | Add `aria-busy` to loading buttons | 1 hr |
| P0 — Critical | Add `aria-hidden` to all Lucide icons | 2 hr |
| P1 — High | Migrate to HSL color token system | 1 day |
| P1 — High | Replace Inter with Geist | 4 hr |
| P1 — High | Implement dark mode (web console) | 2 days |
| P1 — High | Resolve sidebar/content visual split | 4 hr |
| P1 — High | Tablet icon-rail sidebar | 1 day |
| P2 — Medium | Table skeleton loaders | 4 hr |
| P2 — Medium | Replace native `<select>` with Combobox | 1 day |
| P2 — Medium | Designed empty states (per table) | 1 day |
| P2 — Medium | Inline form validation | 1 day |
| P2 — Medium | Standardize all form label styles | 2 hr |
| P3 — Polish | Command palette (`⌘K`) | 2 days |
| P3 — Polish | Table column visibility toggle | 4 hr |
| P3 — Polish | Motion system tuning (Framer) | 4 hr |
| P3 — Polish | OCR confidence score visual display | 4 hr |

---

## Appendix B: Tailwind Config Token Reference

```typescript
// tailwind.config.ts — Design token additions
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#4F46E5',  // indigo-600
          hover:   '#4338CA',  // indigo-700
          subtle:  '#EEF2FF',  // indigo-50
        },
      },
      boxShadow: {
        'xs':   '0 1px 2px rgba(0,0,0,0.05)',
        'sm':   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'md':   '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'modal':'0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        DEFAULT: '6px',
        'md':    '6px',
        'lg':    '8px',
        'xl':    '10px',
        '2xl':   '12px',
      },
    },
  },
}
```

---

*CardVault Design System Recommendations v1.0 — Prepared May 25, 2026*  
*This document is a living reference. Update version numbers when tokens, scales, or component specs change.*
