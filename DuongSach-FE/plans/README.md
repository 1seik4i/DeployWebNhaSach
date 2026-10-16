# Journey motion plans

These plans redesign `/hanh-trinh` as a connected editorial journey. They were
prepared against commit `1a092be` and the current uncommitted Journey page on
2026-10-02.

## Recommended order

1. `001-connected-journey-chapters.md`
2. `002-scroll-reveal-and-timeline.md`
3. `003-motion-accessibility-and-polish.md`
4. `004-news-organization-scroll-reveal.md`
5. `005-booths-events-experience-motion.md`

The sequence matters: the first plan establishes the visual chapter structure,
the second attaches scroll behavior to that structure, and the third removes
conflicting transitions and verifies reduced-motion behavior.

## Design direction

- **Concept:** a digital reading journey, where each section feels like the next
  chapter of the same book rather than a separate landing-page block.
- **Signature motion:** the history spine progresses as milestones enter the
  viewport. Other motion stays quieter so this remains memorable.
- **Palette:** canopy green `#162E23`, ink `#182924`, brass `#B27B22`, warm gold
  `#D4AF37`, paper `#F7F5ED`, white `#FFFFFF`, and sage rule `#E5EADF`.
- **Typography:** keep the current Playfair display face for chapter titles and
  the existing sans-serif body face. Do not introduce another font dependency.
- **Imagery:** keep the current real Book Street photographs. Motion may reveal
  or subtly scale imagery, but must not blur, darken, or obscure the subject.
- **Layout:** full-width chapter bands, one shared reading spine, restrained
  chapter markers, and no new nested-card composition.
- **Motion principles:** animate `transform` and `opacity`; reveal once; stagger
  related groups by `60ms`; keep controls under `220ms`; preserve immediate
  feedback for keyboard and reduced-motion users.

## Acceptance baseline

- The landing-page header remains absent on `/hanh-trinh`.
- Scrolling never traps, snaps, or moves the user unexpectedly.
- The visual narrative is clear with JavaScript disabled or motion reduced.
- No animation changes document flow or causes horizontal overflow.
- Desktop, tablet, and mobile use the same chapter order and content.

## Additional page motion

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| 004 | News and Organization scroll reveal | Low | DONE |
| 005 | Booths and Events experience motion | Low | DONE |

Plans 004 and 005 are independent of the Journey plans and can be executed separately.

