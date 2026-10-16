# Motion Accessibility and Polish

**Severity:** Medium  
**Category:** Accessibility / interaction feedback / performance  
**Scope:** `src/pages/JourneyExperience.tsx`, `src/pages/JourneyExperience.css`, Journey Playwright coverage  
**Depends on:** plans 001 and 002

## Problem

The Journey stylesheet mixes several unrelated easing curves and includes broad
transitions:

- `JourneyExperience.css:76` — `transition: all 0.2s ease`
- `JourneyExperience.css:248` and `:271` — button `transition: all`
- `JourneyExperience.css:535` — core-card `transition: all`
- `JourneyExperience.css:716` — achievement-card `transition: all`
- `JourneyExperience.css:854` — leader-card `transition: all`

Hover transforms run without checking whether the device supports hover. The
project's global reduced-motion rule collapses durations, but it does not define
a readable Journey-specific final state for the new reveal system.

## Intended result

Motion should feel consistent and deliberate:

- controls respond in `160–180ms`;
- content reveals use the chapter motion tokens;
- hover lift occurs only on a fine pointer;
- keyboard focus is at least as clear as hover;
- reduced-motion users receive instant spatial layout with short color/opacity
  feedback, never hidden content.

## Implementation

### 1. Replace every `transition: all`

Use exact property lists:

```css
.journey-back-btn {
  transition:
    color 160ms var(--journey-ease-out),
    border-color 160ms var(--journey-ease-out),
    transform 160ms var(--journey-ease-out);
}

.journey-btn-primary,
.journey-btn-outline {
  transition:
    color 180ms var(--journey-ease-out),
    background-color 180ms var(--journey-ease-out),
    border-color 180ms var(--journey-ease-out),
    box-shadow 180ms var(--journey-ease-out),
    transform 180ms var(--journey-ease-out);
}

.journey-core-card,
.journey-achieve-card,
.journey-leader-card {
  transition:
    border-color 220ms var(--journey-ease-out),
    background-color 220ms var(--journey-ease-out),
    box-shadow 220ms var(--journey-ease-out),
    transform 220ms var(--journey-ease-out);
}
```

Keep image zoom at `360ms var(--journey-ease-out)` and reduce scale from `1.05`
to `1.025` so real imagery remains inspectable.

### 2. Gate hover-only movement

Wrap all lift and zoom selectors in:

```css
@media (hover: hover) and (pointer: fine) {
  .journey-btn-primary:hover { transform: translateY(-2px); }
  .journey-timeline-content:hover,
  .journey-achieve-card:hover,
  .journey-leader-card:hover { transform: translateY(-3px); }
  .gallery-mosaic-item:hover img { transform: scale(1.025); }
}
```

Do not use hover to reveal information. Touch users must see identical content.

### 3. Add pressed and focus-visible feedback

Interactive controls receive `transform: scale(0.98)` for `120ms` while active.
Use a shared focus ring:

```css
.journey-sheet :where(a, button):focus-visible {
  outline: 3px solid rgba(212, 175, 55, 0.72);
  outline-offset: 3px;
}
```

The chapter rail's active state may change color and node fill, but must not
shift label position or width.

### 4. Add a Journey-specific reduced-motion contract

Place this after all Journey motion rules so its final states are deterministic:

```css
@media (prefers-reduced-motion: reduce) {
  .journey-sheet,
  .fptu-hero-brand-lockup {
    animation: none !important;
  }

  .journey-sheet [data-journey-reveal] {
    opacity: 1 !important;
    transform: none !important;
    transition: opacity 160ms linear !important;
    transition-delay: 0ms !important;
  }

  .journey-sheet .journey-timeline-progress,
  .journey-sheet .journey-timeline-node,
  .journey-sheet .gallery-mosaic-item img {
    transform: none !important;
    transition: none !important;
  }

  .journey-sheet :where(a, button) {
    transition:
      color 120ms linear,
      background-color 120ms linear,
      border-color 120ms linear !important;
  }
}
```

In the reveal effect, reduced motion must mark every target visible before
returning. In hash navigation, use `behavior: 'auto'`. Do not disable focus
feedback or active color feedback.

### 5. Prevent motion-induced layout changes

- Give gallery cells their existing fixed height before images load.
- Preserve card dimensions when borders change by keeping border width constant.
- Use `will-change: transform, opacity` only while an element is waiting to
  reveal; remove it in `.is-visible` with `will-change: auto`.
- Do not add `will-change` globally to cards or images.
- Keep the chapter strip height fixed at `48px` on mobile so active states do not
  move content.

### 6. Check reader flow and announcements

- Decorative progress lines and icons use `aria-hidden="true"`.
- The active chapter uses `aria-current="location"`; do not announce every
  timeline intersection through a live region.
- Motion never changes DOM order, tab order, focus, or route.
- Escape and close behavior of the Journey sheet remains unchanged.

## Verification

1. Search Journey CSS for `transition: all`; expected result: zero matches.
2. Test mouse, keyboard, and touch emulation; hover lifts must not run on touch.
3. In Playwright, emulate `reducedMotion: 'reduce'` and assert every chapter is
   visible after load and after hash navigation.
4. Verify `Tab` focus on back, chapter links, CTA actions, and QR action.
5. Record a performance trace while scrolling the full page; expect no layout
   thrashing and no continuous React render loop.
6. Confirm no content flashes hidden on refresh and no section moves after image
   load at `390x844`.

## Non-goals

- No autoplay media, background video, custom cursor, scroll snap, or looping
  decorative animation.
- No changes to unrelated pages or global design tokens.
- No new animation dependency.

