# 004 — Add restrained scroll reveals to News and Organization

- **Status**: DONE
- **Commit**: 6e6eed6
- **Severity**: LOW
- **Category**: Missed opportunities / accessibility
- **Estimated scope**: 4 files, small-to-medium change

## Problem

`src/pages/NewsExperience.tsx` and `src/pages/OrganizationExperience.tsx` already
apply scroll-linked parallax to their hero image and copy, but the long-form
content below the hero appears all at once. The transition from hero to article
collection, leadership cards, principles, and newsletter feels abrupt.

Both pages are fixed, independently scrolling sheets, so viewport reveal logic
must use each page's `.news-sheet` / `.org-sheet` element as the observer root.
The existing hero motion must remain intact.

## Target

- Reveal major section headers and cards once as they enter the sheet viewport.
- Use opacity plus `translate3d(0, 24px, 0)` only.
- Use `600ms cubic-bezier(0.23, 1, 0.32, 1)` for editorial entrances.
- Stagger related cards by `60ms`, capped so large collections do not create a
  long interaction delay.
- Elements remain fully visible before JavaScript marks the sheet as motion-ready.
- With `prefers-reduced-motion: reduce`, remove position movement and shorten the
  opacity transition to `200ms ease`.
- Do not animate filtered news results back to hidden state after they have been
  revealed.

## Repo conventions to follow

- Both page styles already define the same strong ease-out token:
  `--news-ease-out` / `--org-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- Both pages already use refs, layout effects, passive scroll handling, and
  requestAnimationFrame for hero motion. Add reveal observation alongside this
  pattern without replacing the existing parallax.
- Keep the existing `news-*` and `org-*` class namespaces.

## Steps

1. In each TSX file, add an `IntersectionObserver` effect active only while the
   sheet is open. Use the corresponding panel ref as `root`, with
   `threshold: 0.12` and `rootMargin: '0px 0px -8% 0px'`.
2. Observe explicit reveal targets: section headers, spotlight/news cards and
   newsletter content on News; section headers, leader cards, and principle
   cards on Organization. Mark them with one shared per-page reveal class and a
   numeric CSS custom property for stagger where needed.
3. Add a motion-ready class to the sheet before observation so content is never
   hidden when JS is unavailable. When an item intersects, add `is-visible` and
   unobserve it so the reveal runs once.
4. Add scoped CSS initial/visible states using only transform and opacity. Use
   the page ease-out token and `600ms` duration. Use `60ms` stagger increments,
   capped at five steps.
5. Add reduced-motion media rules that remove translation and use a `200ms ease`
   opacity transition. Do not disable focus, hover, or other interaction feedback.

## Boundaries

- Do NOT modify routes, text, filtering, navigation, API calls, or data.
- Do NOT add dependencies.
- Do NOT replace or intensify the existing hero parallax.
- Do NOT animate layout properties or introduce scroll snapping.
- Preserve all pre-existing uncommitted edits in the four target files.

## Verification

- **Mechanical**: run `npm run build` and `npm run lint` from `DuongSach-FE`;
  both must complete without new errors.
- **Feel check**: open `/tin-tuc` and `/bo-may-to-chuc`, scroll slowly, and confirm:
  - section headings lead each group and cards follow with a subtle stagger;
  - already revealed content stays visible when scrolling back;
  - scrolling and filtering remain responsive with no layout shift;
  - at 10% playback speed, motion starts 24px below and settles without bounce;
  - with reduced motion enabled, content fades without vertical travel.
- **Done when**: both pages reveal their below-hero content once, preserve the
  hero parallax, and pass build/lint with accessible reduced-motion behavior.
