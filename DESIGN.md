# Design notes

Why the page looks the way it does. Written down so the next change does not
undo a decision by accident.

## The one idea

Photophane - one of the projects listed on the page - computes a clear plate
that throws a photograph onto a wall in refracted light. The physics term for
that focused light is a **caustic**.

So the page is a dark room with a caustic in it. The light behind the name is
not a stock gradient or a blurred blob; it is ~82,000 rays refracted through an
animated surface and accumulated where they land, which is the same idea
Photophane implements in earnest. The hero is a demonstration of the work rather
than decoration next to it, and the Photophane caption says so explicitly.

Everything else follows from "dark room": near-black ground, one warm light,
type that behaves like paper under that light.

## Evidence, not adjectives

The rule the copy is held to: **every number on this page is checkable, and
nothing is described as impressive.**

- Claims and their sources are logged in `PRODUCT.md`.
- Where a project reports its own figures, the page says so ("The counters are
  the site's own, not mine") and the capture shows them.
- The benchmark names what it beats and by how much, with the bundle size that
  buys it, rather than saying "blazing fast".
- One figure was corrected during the build: ProlificTea's page views read
  90.5K, not 290.5K. The larger number came from misreading two adjacent DOM
  nodes as one string. A capture of the live page is now the check.

Consequence: weak numbers get omitted, never inflated. The Reddit tallies are
small (219, 48) and stated plainly, because a real small number is worth more
than a vague large one.

## The captures

Five screenshots of the deployed projects, framed as figures with a hairline
border, the same lit top edge the content plates carry, and a caption tagged
with the source domain.

Two are on light grounds and three on dark. That inconsistency is kept on
purpose - they are photographs of real artifacts, and normalising their colour
would be the first step toward making them look like mockups. The frame and the
caption do the work of making them belong.

They earn their bytes by proving things prose cannot: LayoutSans' own instrument
panel showing **204 DOM nodes** and **zero** `measureText()` calls in the hot
path is a stronger argument than any sentence about it.

## Type

One family, Archivo Variable, worked through `wdth` and `wght` axes instead of
loading more files. Display sizes run wide and heavy and tighten their tracking;
body text sits at normal width. Small instrument labels - the readouts, the
figure tags - run narrow, uppercase and letter-spaced, which is the visual idiom
LayoutSans and Photophane already use in their own UIs.

Numbers use `font-variant-numeric: tabular-nums` everywhere they are compared,
so digits line up in columns instead of shimmering.

## The light, and what it costs

`caustic.js` is ~200 lines, no dependencies, 2D canvas only.

It renders to a 180×102 accumulation buffer and upscales, because a caustic is
mostly smooth gradient with a few sharp folds - the folds survive the upscale,
and the buffer keeps the per-frame cost linear in rays rather than in screen
pixels. Three separate colour channels are refracted at slightly different
indices, which is where the prismatic fringing on the fold edges comes from; it
is real dispersion, not a hue filter.

Budget, measured rather than assumed:

- **24 fps.** The lamp drifts slowly. Above 24 there is nothing to see and a
  core to lose.
- **~19 ms per frame** at full rays on the development machine.
- **Adaptive rays.** If the smoothed frame cost passes 26 ms it halves the ray
  count; below 11 ms it restores it. The blur hides the difference, and a softer
  caustic beats a stuttering one.
- **Warm-up guard.** The first 15 frames are excluded from that decision. They
  run before the JIT settles and cost roughly double, and judging on them
  permanently halved quality on a machine that could manage full rays. This was
  a real bug, caught by measuring.
- **Stops when unwatched.** An IntersectionObserver pauses it off-screen and
  `visibilitychange` pauses it in a background tab.
- **`prefers-reduced-motion`** renders exactly one frame and never animates.

## Accessibility

Lighthouse: 100 accessibility, 100 best practices, 100 SEO, 35 audits passed.

- The canvas is `aria-hidden` - it is decoration, and its meaning is carried by
  the Photophane caption in text.
- Captures carry descriptive `alt` text stating what is visible, including the
  numbers, so the evidence survives without the image.
- Every image has `width`/`height`, so nothing shifts as they load.
- `prefers-contrast: more` lifts the mid greys. The dark ground is kept, because
  the room is the design; only contrast within it increases.
- The benchmark table becomes stacked labelled readouts under 40rem instead of a
  squeezed grid.

## Restraint

Things deliberately not done: no scroll-jacking, no reveal-on-scroll animations,
no cursor followers, no counters that tick up, no testimonials, no logo wall, no
"let's build something together". The page has one moving element, and it is the
one that is also a portfolio piece.
