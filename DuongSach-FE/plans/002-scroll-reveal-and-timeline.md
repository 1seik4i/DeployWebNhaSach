# Scroll Reveal and Timeline Motion

**Severity:** High  
**Category:** Scroll behavior / storytelling / feedback  
**Scope:** `src/pages/JourneyExperience.tsx`, `src/pages/JourneyExperience.css`, Journey Playwright coverage  
**Depends on:** plan 001

## Problem

The only entrance animation on the page is the hero lockup at
`JourneyExperience.css:181`:

```css
animation: fptuHeroReveal 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
```

Everything below appears immediately. The timeline at
`JourneyExperience.tsx:288` has a static line and static nodes, so the most
important narrative device does not respond to the user's progress. Adding an
animation to every card would create noise; the page needs one signature motion
and a small reveal vocabulary.

## Motion model

- **Hero:** one entrance on load, `700ms`.
- **Section heading:** fade plus `translateY(20px)`, `560ms`.
- **Story copy/media:** fade plus `translateX(32px)`, `680ms`.
- **Related cards:** fade plus `translateY(18px)`, `480ms`, stagger `60ms`.
- **Timeline:** the gold progress line grows as milestones become active; each
  node resolves once when its card enters.
- **Playback:** once only. Scrolling back must not replay whole sections.
- **Properties:** only `transform` and `opacity` for entrance motion.

Use the shared easing from plan 001:
`cubic-bezier(0.23, 1, 0.32, 1)` for entrances and
`cubic-bezier(0.77, 0, 0.175, 1)` for the timeline line.

## Implementation

### 1. Add scoped state and observers

In `JourneyExperience.tsx`, add:

```tsx
const [activeChapter, setActiveChapter] = useState('brand-story');
const [activeMilestone, setActiveMilestone] = useState(-1);
```

Create one `useEffect` for one-time reveals using the Journey scroll panel as
the root. Do not attach a continuous global scroll listener.

```tsx
const root = panelRef.current;
const targets = root?.querySelectorAll<HTMLElement>('[data-journey-reveal]');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },
  { root, threshold: 0.14, rootMargin: '0px 0px -14% 0px' },
);
```

Always disconnect in cleanup. When
`window.matchMedia('(prefers-reduced-motion: reduce)').matches`, add
`.is-visible` immediately and skip observer creation.

Create a second `IntersectionObserver` for chapter activation:

- Root: `panelRef.current`
- Thresholds: `[0.2, 0.45, 0.7]`
- Root margin: `-22% 0px -58% 0px`
- Choose the intersecting chapter closest to the root's top edge.
- Update state only when the id actually changes.

This state drives `aria-current` and `.is-active` on the chapter rail.

### 2. Apply a small reveal vocabulary

Add attributes deliberately:

- `.journey-section-header`: `data-journey-reveal="up"`
- Story text column: `data-journey-reveal="left"`
- Gallery mosaic: `data-journey-reveal="right"`
- Each timeline item: `data-journey-reveal="timeline"`
- Achievement and leader cards: `data-journey-reveal="up"`
- CTA inner content: `data-journey-reveal="up"`

Set stagger order with a CSS custom property, not delayed timers:

```tsx
style={{ '--reveal-order': idx } as React.CSSProperties}
```

Base CSS:

```css
[data-journey-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 420ms var(--journey-ease-out),
    transform 560ms var(--journey-ease-out);
  transition-delay: calc(var(--reveal-order, 0) * 60ms);
}

[data-journey-reveal='left'] { transform: translateX(-32px); }
[data-journey-reveal='right'] { transform: translateX(32px); }
[data-journey-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

Do not reveal paragraph lines individually. Headings, media groups, timeline
items, and card groups are the maximum granularity.

### 3. Turn the timeline into the signature scroll interaction

Replace the single static line at `JourneyExperience.tsx:289` with a track and
progress element:

```tsx
<div className="journey-timeline-line" aria-hidden="true">
  <span
    className="journey-timeline-progress"
    style={{ '--timeline-progress': `${Math.max(0, (activeMilestone + 1) / timelineMilestones.length)}` } as React.CSSProperties}
  />
</div>
```

Observe `.journey-timeline-item` with threshold `0.45` and set the greatest
visible milestone index. The progress element uses:

```css
.journey-timeline-progress {
  position: absolute;
  inset: 0;
  background: var(--journey-gold);
  transform: scaleY(var(--timeline-progress, 0));
  transform-origin: top;
  transition: transform 720ms var(--journey-ease-in-out);
}
```

An active node changes from `opacity: 0.55; transform: translate(-50%, -50%)
scale(0.86)` to full opacity and scale `1` over `360ms`. The card itself follows
the normal reveal. On mobile, progress grows horizontally only if the existing
timeline becomes horizontal; otherwise retain the vertical line and left-aligned
cards.

### 4. Refine the hero entrance and handoff

Update `fptuHeroReveal` from `translateX(-24px)` to `translateY(18px)` so the
motion aligns with the chapter flow. Use `700ms var(--journey-ease-out)`. Reveal
the summary and cue with delays of `90ms` and `150ms`; no delay exceeds `150ms`.

Do not add a looping bounce. The cue may move down `2px` only on hover-capable
devices.

### 5. Preserve deterministic hash navigation

The existing smooth hash behavior must use:

```tsx
const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? 'auto'
  : 'smooth';
target.scrollIntoView({ behavior, block: 'start' });
```

Do not automatically navigate when a section becomes active. Observers update
presentation only; they never call `navigate`, change the hash, or steal focus.

## Playwright verification

Add Journey-focused scenarios to the existing E2E suite:

1. Open `/hanh-trinh`; assert the hero is visible and the landing header is not.
2. Assert the first unreached chapter begins hidden only when motion is enabled.
3. Wheel to `#brand-story`; assert it receives `.is-visible` and remains visible
   after scrolling away and back.
4. Scroll through the timeline; assert progress monotonically increases and the
   active node count matches the reached milestone.
5. Activate chapter links and verify the expected section enters the viewport;
   verify the URL does not jump to an event detail route.
6. Emulate reduced motion; assert all content is immediately available, hash
   navigation uses no animated scroll, and no transformed hidden content remains.
7. Capture screenshots at `1440x900`, `1024x768`, and `390x844`; compare for
   overlap, clipping, and unexpected layout shifts.

## Performance acceptance

- No third-party animation package.
- No per-frame React state updates.
- No animation of width, height, margin, top, left, filter, or box-shadow during
  scroll reveals.
- Observer cleanup leaves no callbacks after the Journey sheet closes.

