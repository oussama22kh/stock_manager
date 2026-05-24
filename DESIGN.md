# Design System

## Overview

A product UI for a warehouse stock-management app. Mobile-first, touch-optimized, fast. Color strategy: **Committed** — the warm orange accent carries primary-action weight (~25% of interactive surface), supported by a deep navy for structural elements and a warm yellow for highlights and secondary emphasis.

## Theme

Light theme. Warehouses are bright, fluorescent-lit spaces. Agents use the app on handheld scanners and tablets in daylight. A light surface maximizes readability and reduces eye strain during long shifts. Dark mode is not a priority.

## Color Palette

Derived from the app logo (Odoo stock icon).

### Primary — Navy Blue
- `#002f5e` — Deep navy. Used for navbar, headings, primary text, structural borders.
- `#004a94` — Navy hover/active state.
- `#e6eef7` — Navy tint for backgrounds, selected states, subtle fills.

### Accent — Vibrant Orange
- `#f86126` — Primary action color. Buttons, active tabs, links, focus rings.
- `#d94d1a` — Orange pressed/darker state.
- `#fff0e6` — Orange tint for alerts, success backgrounds, callout fills.

### Highlight — Warm Yellow
- `#fbb945` — Secondary emphasis, badges, scan indicators, warnings.
- `#fef5e0` — Yellow tint for banners, highlights, subtle backgrounds.

### Neutrals (tinted toward navy hue)
- `#f7f8fa` — Page background. Not pure white; subtly cool.
- `#e8eaed` — Borders, dividers.
- `#9aa3af` — Secondary text, placeholders, disabled.
- `#5a6575` — Body text, labels.
- `#1a2332` — Headings, primary text. Not black.

### Semantic
- Success: `#16a34a` (green) on `#f0fdf4` background.
- Error: `#dc2626` (red) on `#fef2f2` background.
- Warning: `#f59e0b` (amber) on `#fffbeb` background.

## Typography

- **Font stack**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Scale**: base 16px
  - `xs`: 0.75rem (12px) — captions, badges
  - `sm`: 0.875rem (14px) — labels, secondary text
  - `base`: 1rem (16px) — body
  - `lg`: 1.125rem (18px) — card titles
  - `xl`: 1.5rem (24px) — page headings
  - `2xl`: 2rem (32px) — hero/landing only
- **Weight**: 400 (body), 500 (labels), 600 (headings, buttons), 700 (page titles)
- **Line height**: 1.5 (body), 1.25 (headings)

## Spacing

- Base unit: 4px
- Common tokens: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px)
- Rhythm: generous vertical spacing between sections (24–32px), tight internal padding within cards (12–16px).

## Components

### Buttons
- **Primary**: `bg-[#f86126] text-white rounded-lg font-medium px-4 py-2.5`. Hover: `bg-[#d94d1a]`.
- **Secondary**: `bg-white border border-[#e8eaed] text-[#1a2332] rounded-lg`. Hover: `bg-[#f7f8fa]`.
- **Ghost**: `text-[#f86126] bg-transparent`. Hover: `bg-[#fff0e6]`.
- Touch target: min 44×44px.

### Cards
- Avoid nesting. Use cards for emplacement selection only.
- Style: `bg-white rounded-xl border-2 border-[#e8eaed]`. Selected: `border-[#002f5e] bg-[#e6eef7]`.
- No drop shadow by default; use border for definition.

### Inputs
- `bg-white border border-[#e8eaed] rounded-lg px-3 py-2.5`
- Focus: `ring-2 ring-[#f86126] border-[#f86126]`
- Error: `border-[#dc2626] bg-[#fef2f2]`

### Tables
- Header: `bg-[#f7f8fa] border-b border-[#e8eaed]`
- Row hover: `bg-[#f7f8fa]`
- No vertical dividers. Horizontal only.

### Badges / Pills
- Unassigned count: `bg-[#fbb945] text-[#1a2332] rounded-full font-bold`
- Role badges: `bg-[#e6eef7] text-[#002f5e] rounded-full text-xs font-medium px-2 py-0.5`

### Modals
- Overlay: `bg-black/50`
- Panel: `bg-white rounded-xl shadow-xl max-w-md`
- Use sparingly; prefer inline forms where possible.

## Layout

- Max content width: 768px (mobile-optimized; centers on desktop).
- Navbar: `bg-white border-b border-[#e8eaed] h-14`
- Page padding: `px-4 py-6`
- Grid gaps: 12–16px

## Motion

- Easing: `ease-out` (exponential feel via CSS `transition-timing-function: cubic-bezier(0, 0, 0.2, 1)`)
- Durations: 150ms for micro-interactions (button press, focus), 200ms for state changes (tab switch, card select)
- No layout-animation (no animating width/height/margin).
- Reduced motion: respect `prefers-reduced-motion`.
