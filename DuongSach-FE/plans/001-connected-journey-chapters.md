# Connected Journey Chapters

**Severity:** Medium  
**Category:** Cohesion / visual hierarchy / missed opportunity  
**Scope:** `src/pages/JourneyExperience.tsx`, `src/pages/JourneyExperience.css`  
**Prepared against:** `1a092be` plus the current uncommitted Journey page

## Problem

The opening hero is visually strong, but the page below it reads as a sequence
of independent sections. The current markup jumps directly from the hero at
`JourneyExperience.tsx:168` to a conventional section header at line 183, then
repeats the same section rhythm for history, achievements, leadership, and the
CTA. There is no shared chapter marker, reading progress, or visual bridge.

Current structure:

```tsx
<section className="journey-hero fptu-style-hero">...</section>
<section id="brand-story" className="journey-section journey-brand-story-section">...</section>
<section id="history" className="journey-section">...</section>
```

The result is polished but episodic: the user sees one hero and several content
blocks instead of one continuous journey.

## Intended experience

Treat the page as five chapters in one book:

1. Opening image and title
2. Origin and brand story
3. Ten-year timeline
4. Impact and achievements
5. People and invitation to continue

The hero hands off to a shared vertical reading spine. Each chapter has a small
number marker aligned to that spine. Background changes feel like turning a
page, not like entering a new mini-site. The dark achievements band is the
single dramatic contrast chapter.

## Implementation

### 1. Add explicit chapter metadata and semantic anchors

In `JourneyExperience.tsx`, define a local constant above the component:

```tsx
const journeyChapters = [
  { id: 'brand-story', vi: 'Khởi nguồn', en: 'Origin' },
  { id: 'history', vi: 'Dấu mốc', en: 'Milestones' },
  { id: 'thanh-tuu', vi: 'Dấu ấn', en: 'Impact' },
  { id: 'ban-lanh-dao', vi: 'Con người', en: 'People' },
  { id: 'ket-noi', vi: 'Tiếp nối', en: 'Continue' },
] as const;
```

Give the CTA section the stable id `ket-noi`. Add `data-journey-chapter` to each
major section. Keep all existing ids so current hash links continue to work.

### 2. Add the hero handoff

Inside `.fptu-hero-brand-lockup`, after the title, add a compact chapter summary
and a real anchor button to `#brand-story`:

```tsx
<p className="journey-hero-summary">
  {vi ? '10 năm · 5 chương · Một không gian tri thức' : '10 years · 5 chapters · One cultural landmark'}
</p>
<a className="journey-scroll-cue" href="#brand-story">
  <span>{vi ? 'Bắt đầu hành trình' : 'Begin the journey'}</span>
  <ArrowDown size={18} aria-hidden="true" />
</a>
```

The cue is a command, not decoration. It must retain a visible focus ring and
must not bounce continuously.

### 3. Add one shared chapter rail

Place a single `<nav className="journey-chapter-rail">` immediately after the
hero and before `#brand-story`. Render its links from `journeyChapters`.

- Desktop (`min-width: 1100px`): sticky at `top: 96px`, aligned to the right edge
  of the `1200px` content container. Use a `2px` spine and `10px` nodes.
- Tablet and mobile: convert it to a sticky horizontal progress strip directly
  below the Journey top bar; labels may scroll horizontally with the scrollbar
  hidden but keyboard scrolling preserved.
- Active label uses `#B27B22`; inactive labels use `#6E8276`.
- Do not place the rail in a card or add a floating pill background.

Use `aria-label={vi ? 'Các chương hành trình' : 'Journey chapters'}` and
`aria-current="location"` on the active link. Active-state behavior is supplied
by plan 002; all anchors must still work before that plan is implemented.

### 4. Give every section a shared chapter shell

Replace inline background/color styles around `JourneyExperience.tsx:319` and
`:366` with modifiers:

```tsx
<section className="journey-section journey-chapter journey-chapter--dark" ...>
<section className="journey-section journey-chapter journey-chapter--sage" ...>
```

Use these CSS values:

```css
.journey-sheet {
  --journey-ink: #182924;
  --journey-canopy: #162e23;
  --journey-brass: #b27b22;
  --journey-gold: #d4af37;
  --journey-paper: #f7f5ed;
  --journey-rule: #e5eadf;
  --journey-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --journey-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

.journey-chapter {
  position: relative;
  isolation: isolate;
  border-top: 1px solid var(--journey-rule);
}

.journey-chapter--paper { background: #ffffff; }
.journey-chapter--sage { background: #f8faf6; }
.journey-chapter--dark { background: var(--journey-canopy); color: #ffffff; }
```

Each `.journey-section-header` receives a visible chapter number via a small
`.journey-chapter-number` element. Use `01` through `05`, `0.78rem`, `700`, and
the existing brass color. Keep the current title size; do not turn every section
into another oversized hero.

### 5. Create the visual bridge without decorative clutter

Align a thin chapter rule with the rail and section numbers. On desktop it runs
from the hero cue through the final CTA; on mobile it becomes a short horizontal
rule above each chapter heading. Use CSS pseudo-elements only; do not add orbs,
floating gradients, page curls, or decorative SVGs.

The hero bottom fade at `JourneyExperience.css:145` should end in the exact
background of the first chapter (`#FFFFFF`) so the photo hands off cleanly.

### 6. Responsive rules

- `>= 1100px`: vertical rail and two-column story remain.
- `768px–1099px`: horizontal chapter strip; preserve the existing story collapse.
- `< 768px`: hero minimum height `440px`; chapter strip uses `44px` minimum touch
  targets; section padding becomes `3.5rem 0`; number and heading stack.
- At every width, the hero must show a hint of the first chapter below it. Cap
  hero height at `min(660px, calc(100svh - 88px))` rather than filling the screen.

## Verification

1. Open `/hanh-trinh` at `1440x900`, `1024x768`, and `390x844`.
2. Confirm the hero, rail, and five chapter markers form one readable sequence.
3. Activate every chapter link by keyboard; focus must remain visible.
4. Confirm existing hash links still reach the same content.
5. Confirm the landing header remains absent and there is no horizontal overflow.
6. Confirm the page is fully readable before implementing plan 002.

## Out of scope

- Rewriting Vietnamese/English content
- Replacing existing Book Street photography
- Adding a carousel, scroll snap, or third-party motion dependency

