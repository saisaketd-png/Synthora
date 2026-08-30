# KemKendra Design System

This document outlines the visual language, design patterns, and engineering conventions for the KemKendra frontend. It serves as the single source of truth for creating cohesive, premium, and buyer-first B2B pharmaceutical and specialty chemical procurement interfaces.

## 1. Brand Positioning & Visual Principles

**Core Identity:**
KemKendra is a premium, global B2B procurement platform. The interface must feel like a serious, high-trust sourcing platform used by procurement teams, QA managers, regulatory teams, and pharmaceutical manufacturers.

**Visual Principles:**
- **Scientific & Credible:** High information density, clinical cleanliness, and clear typography.
- **Enterprise Premium:** Editorial aesthetics, rigorous alignment, and curated, harmonious color palettes.
- **Buyer-First Sourcing:** Minimize marketing fluff; maximize discoverability, searchability, and data comparison.
- **Modern but Professional:** Incorporate modern interface patterns (large rounded corners on feature cards, subtle blurs) without resorting to consumer SaaS trends.

### Explicit Anti-Patterns (Do NOT use)
- ❌ AI-generated gradient blobs or abstract illustrations.
- ❌ Neon effects or overly saturated gaming aesthetics.
- ❌ Glassmorphism on interactive elements (subtle background blurred accents are acceptable).
- ❌ Floating tilted 3D cards.
- ❌ Generic, un-tailored colors (e.g., standard `#FF0000` red or `#0000FF` blue).
- ❌ SaaS dashboard dashboard-style sidebar navigation for public buyer pages.

---

## 2. Color Tokens & Tailwind Conventions

We use a highly curated Tailwind color palette optimized for trust and readability.

### Primary Palette
- **Deep Navy (Corporate/Trust):** `#0A192F` - Used for heavy headings, primary dark backgrounds, and footers.
- **Vibrant Blue (Action/Search):** `blue-600` (`#2563EB`) - Used for primary buttons, search emphasis, and active links.

### Accents & Status
- **Teal (Verification/Success):** `teal-500` / `teal-400` - Used for GMP verification badges, active steps, and "Live" indicators.
- **Amber/Orange (Alert/Live):** `orange-500` - Used for "Live RFQ" counts or low stock.
- **Indigo/Purple (Specialty):** `indigo-600` - Used for "Made to Order" or specialty highlights.

### Neutrals (Slate)
- **Backgrounds:** `bg-slate-50` (soft segregation), `bg-white` (primary).
- **Borders:** `border-slate-100` (subtle dividers), `border-slate-200` (card borders).
- **Text:** `text-slate-900` (primary data), `text-slate-500` (secondary labels), `text-slate-400` (tertiary/placeholders).

---

## 3. Typography Scale

Typography is highly structured to handle dense procurement data (CAS numbers, specs) while maintaining an editorial feel.

- **Primary Font:** Sans-serif (Inter, Roboto, or system sans).
- **Headings:**
  - Hero H1: `text-[3.5rem] leading-[1.1] font-extrabold tracking-tight text-[#0A192F]`
  - Section H2: `text-4xl sm:text-5xl font-bold tracking-tight text-[#0A192F]`
  - Card H3: `text-lg font-bold text-slate-900 leading-tight`
- **Body & Data:**
  - Standard Body: `text-[15px]` or `text-sm`, `text-slate-500` for readability.
  - Metadata Labels: `text-[13px] font-medium text-slate-500`.
  - Scientific Data (CAS, QTY): `font-mono text-[13px] font-bold text-slate-800` (always use monospace for numbers).
  - Micro-tags (Superheaders): `text-[10px] sm:text-[11px] font-bold uppercase tracking-widest`.

---

## 4. Spacing & Layout Grid

### Page Layout
- **Container:** Standard enterprise max-width container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Vertical Rhythm:** Strict vertical padding for distinct sections: `py-16` or `py-24`.
- **Grid System:** 12-column grid (`grid-cols-12`) is standard for asymmetric layouts (e.g., Hero 7-col / 5-col split).

### Component Layout
- **Gaps:** `gap-4`, `gap-6`, or `gap-8` for grid items.
- **Card Padding:** Premium cards use deep padding (`p-8`, `p-10`), while dense data cards use `p-4` or `p-5`.

---

## 5. Border, Radius & Shadow System

We use a mixed-radius system depending on the context of the component:

- **Structural / Enterprise Components (Search bars, tables, buttons):** Highly rounded pill shapes (`rounded-full`) for actions and search to feel approachable and modern.
- **Feature Cards / Highlight Panels:** Extra-large radii (`rounded-[2rem]`, `rounded-[2.5rem]`, or `rounded-3xl`) for large promotional or workflow blocks.
- **Dense Data / Technical Layouts:** Sharp or subtle rounding (`rounded-sm`, `rounded-md`) for complex tables, document lists, or technical spec sheets where extreme rounding wastes space.

**Shadows:**
- **Elevated Interactive Cards:** `shadow-xl shadow-slate-200/50`
- **Dark Sections/CTAs:** `shadow-2xl shadow-blue-900/20`
- **Subtle borders:** Favor `border border-slate-100` over heavy drop shadows for standard grids.

---

## 6. Component Patterns

### Buttons & CTAs
- **Primary Action (Search/Submit):** `px-8 py-3.5 bg-blue-600 text-white font-bold rounded-full shadow-lg`.
- **Secondary Action (Browse/Filters):** `px-6 py-2.5 bg-white border border-slate-200 text-slate-800 font-bold rounded-full`.
- **Accent Action (RFQ/Buy):** `bg-teal-500 text-slate-900 font-bold rounded-full`.

### Search Patterns
- High-density integrated search pill.
- Combines a category dropdown (`border-r border-slate-200`), search input, and a primary button into one contiguous `rounded-full` container with `shadow-lg`.
- Always include popular search chips directly beneath the search bar.

### Premium Product Cards
*(Reference: Featured Catalog Preview)*
- **Container:** `rounded-[2rem] border-slate-100 hover:shadow-lg transition-all`.
- **Image Bounding Box:** A `bg-slate-50 rounded-3xl h-48` internal container.
- **Status Badge:** Absolute positioned inside the image box (`top-4 left-4 rounded-full text-[11px]`).
- **Data Rows:** Flex-between layout for attributes (`CAS`, `Purity`, `MOQ`), utilizing monospace for values.

### Enterprise Tables & Lists
- Used for supplier directories or detailed product specs.
- Striped rows or subtle `border-b border-slate-100`.
- Left-aligned text, right-aligned numeric data.
- Include sticky headers for long scrolling tables.

### Resources Cards
*(Reference: News & Market Insights)*
- **Container:** `rounded-[2rem] bg-white border border-slate-200`.
- **Image/Graphic:** Top half is an image or icon placeholder `h-48 bg-slate-50`.
- **Tags:** Floating colored badge (`bg-teal-100 text-teal-600`) overlapping the image area.

### Enterprise CTA (Final Push)
*(Reference: Bottom of Homepage)*
- Deep gradient backgrounds: `bg-gradient-to-br from-blue-600 to-[#0A192F]`.
- Large `rounded-[3rem]` container.
- Very subtle, large blurred circles in the background (`bg-white opacity-5 blur-3xl absolute`) to add depth without violating the anti-glassmorphism rule.
- High-contrast white typography.

---

## 7. State Management & Feedback

- **Empty States:** Never leave a section blank. Provide professional empty states with a muted icon (e.g., `FlaskConical` text-slate-200), a clear message ("No products found matching CAS 123-45"), and an action button ("Clear Filters").
- **Loading States:** Avoid full-page spinners. Use skeleton loaders that match the target component's dimensions (`animate-pulse bg-slate-100 rounded-md`).
- **Error States:** Use restrained error messages inline. Alert boxes should be `bg-red-50 text-red-700 border border-red-100 rounded-md p-4`, not aggressively red blocks.

---

## 8. Accessibility (a11y) Standards

- **Color Contrast:** Ensure all text passes WCAG AA contrast ratios (e.g., slate-500 on white).
- **Focus States:** Interactive elements must have visible focus rings (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
- **Semantic HTML:** Use `<section>`, `<nav>`, `<article>`, `<aside>`, and appropriate `<h1-h6>` hierarchy.
- **Labels:** Forms and search inputs must have explicit `<label>` tags or `aria-label` attributes.
- **Images:** All illustrations and product images require descriptive `alt` tags.

---

## 9. Reusable Tailwind Utilities

Maintain consistency by creating components rather than copying long class strings. However, when writing ad-hoc layouts, adhere to these standard class combinations:

- **Section Wrap:** `py-24 bg-white border-b border-slate-100`
- **Inner Wrap:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Superheader Tag:** `text-[11px] font-bold uppercase tracking-widest`
- **Flex Between (Data Row):** `flex justify-between items-center`
- **Standard Transition:** `transition-all duration-300`

---

## 10. Consistency Checklist

Before submitting a new page or component, verify it against this checklist:

- [ ] **Viewport Fit:** Can the primary action (Search/RFQ) be seen above the fold on a 1440x900 screen without scrolling?
- [ ] **Typography:** Are CAS numbers, weights, and dates using monospace or tabular lining? Are headings tracking tightly (`tracking-tight`)?
- [ ] **Color Discipline:** Are you avoiding generic colors? Are you using the defined slate palette for neutrals?
- [ ] **Radii Match:** Do structural elements use `rounded-full` / `rounded-[2rem]`, and dense data elements use `rounded-sm`/`md`?
- [ ] **Shadow Restraint:** Are shadows soft and large (`shadow-xl shadow-slate-200/50`) rather than harsh drop shadows?
- [ ] **Accessibility:** Can you navigate the new component using only the `Tab` key?
- [ ] **Responsiveness:** Do grids collapse cleanly to `grid-cols-1` on mobile screens (`sm:` and `md:` breakpoints handled)?
- [ ] **Anti-patterns:** Did you ensure no glassmorphism or consumer SaaS blobs snuck into the design?
