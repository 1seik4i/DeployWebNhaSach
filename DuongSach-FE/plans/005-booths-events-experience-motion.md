# 005 — Animate Booths and Events experience pages

- **Status**: DONE
- **Commit**: 6e6eed6
- **Severity**: LOW
- **Category**: Missed opportunities / accessibility / cohesion
- **Estimated scope**: 5 files, medium change

## Problem

The full-directory pages opened by the homepage “view all” links at `/gian-hang`
and `/su-kien` already slide in through the shared `.heritage-sheet`, but the
hero, collection heading, filtered cards, and detail modal content appear
abruptly. These pages are rare editorial transitions and can use restrained
motion to explain hierarchy without slowing repeated controls.

Relevant current locations:

- `src/pages/BoothsExperience.tsx:87-337`
- `src/pages/EventsExperience.tsx:106-477`
- `src/pages/HeritageExperience.css:1-20` for the shared sheet transition
- `src/pages/BoothsExperience.css:56-76` for booth card hover motion
- `src/pages/EventsExperience.css:27-63` for event card hover motion

## Target

- Keep the shared sheet slide unchanged.
- Once the sheet opens, reveal the hero copy and featured card with opacity plus
  `translate3d(0, 24px, 0)` using `600ms cubic-bezier(0.23, 1, 0.32, 1)` and a
  `60ms` stagger.
- Reveal the collection header and visible booth/event cards once as they enter
  the sheet viewport using `IntersectionObserver`, `threshold: 0.12`, and
  `rootMargin: '0px 0px -8% 0px'`.
- Stagger grid cards by `60ms`, capped at five steps. Remember revealed item IDs
  across filter/search rerenders so already-seen cards never hide again.
- Give booth and event detail modals a spatial entrance: overlay opacity `200ms`
  ease-out and centered content from `translate3d(0, 24px, 0) scale(0.97)` to its
  resting state over `280ms cubic-bezier(0.23, 1, 0.32, 1)`. Never use scale(0).
- Preserve all existing hover transforms by adding visible-state hover selectors.
- Under `prefers-reduced-motion: reduce`, remove positional/scale movement and
  retain a `200ms ease` opacity fade.
- Content must stay visible until JavaScript adds a motion-ready class.

## Repo conventions to follow

- Follow the one-time reveal implementation in `NewsExperience.tsx` and
  `NewsExperience.css`: observer rooted to the independently scrolling sheet,
  `is-motion-ready`, `is-visible`, reveal IDs, and a `Set` ref.
- Use page-specific namespaces (`booths-reveal`, `events-reveal`) even though the
  pages share Heritage styles, preventing selectors from affecting other pages.
- Use only transform and opacity for entrance motion.

## Steps

1. Add a `panelRef` and revealed-item `Set` ref to both experience components,
   attach the panel ref to the outer `.heritage-sheet`, and add a page identity
   class (`booths-experience-sheet` / `events-experience-sheet`).
2. Add a layout effect per page that observes its reveal targets within the
   sheet, marks the sheet motion-ready, reveals/unobserves intersecting nodes,
   restores previously revealed item IDs after filters rerender, and cleans up.
3. Mark hero introduction, featured showcase, collection title, each result card,
   and footer with page-specific reveal classes. Apply stagger custom properties
   capped at five steps.
4. Add scoped reveal CSS to `BoothsExperience.css` and `EventsExperience.css`,
   including hover-transform preservation and reduced-motion rules.
5. Add page-specific classes to the portal overlay/content and scoped modal entry
   CSS. Do not alter modal state, navigation, registration, or map behavior.

## Boundaries

- Do NOT modify homepage sections, routing, data, filtering semantics, API calls,
  registration behavior, or map behavior.
- Do NOT add dependencies, scroll snapping, or layout-property animations.
- Do NOT change the shared `.heritage-sheet` transition for other experience pages.
- Preserve all existing uncommitted changes in target files.

## Verification

- **Mechanical**: run `npm run build` and `npm run lint` from `DuongSach-FE`.
- **Feel check**: open `/gian-hang` and `/su-kien` from their homepage view-all
  links and confirm:
  - the page sheet still slides in normally;
  - hero copy precedes the featured card, followed by collection content;
  - cards reveal once with a quiet stagger and remain visible after filtering;
  - opening a booth/event detail produces a subtle anchored modal entrance;
  - hover transforms still work after reveal;
  - reduced motion fades content without translation or scale.
- **Done when**: both full-directory experiences have coherent entrance, scroll,
  and detail motion without layout shift or behavior regressions.
