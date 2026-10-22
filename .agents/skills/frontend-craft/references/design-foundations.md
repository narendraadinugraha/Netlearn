# Design Foundations

How to make the positive decisions: the visual principles that make a layout read as organized, and how to build the type, color, space, and motion systems that carry a direction. Sources: Nielsen Norman Group's principles of visual design, Anthropic's frontend-aesthetics guidance, and the process guidance behind the impeccable.style tooling.

Why this matters beyond looks: well-structured layouts measurably improve task success; attractive designs benefit from the aesthetic-usability effect (users perceive them as easier to use and forgive small flaws); and a consistent visual system builds brand trust. Visual design is a usability tool, not decoration.

## The five principles

**Scale.** Relative size signals importance. Use no more than 3 distinct sizes in a composition, and make the single most important element the biggest. Random size variation reads as noise; stepped, deliberate variation reads as rank.

**Visual hierarchy.** Guide the eye through elements in order of importance by combining variables: size, weight, value, color, spacing, and placement together, not size alone. Use 2-3 typeface sizes for content hierarchy. Bright or saturated color goes to the most important items, muted color to secondary ones. If a user cannot tell primary from secondary content at a glance, the hierarchy failed.

**Balance.** Visual weight (not element count) distributes evenly across an imaginary axis through the composition. Diagnostic: draw the axis and compare the sides. Pick the balance type on purpose: symmetrical reads stable and calm, asymmetrical reads dynamic and energetic, radial pulls the eye to a center. Asymmetry is not imbalance; it is unequal placement with compensating weight.

**Contrast.** Juxtapose dissimilar elements to signal that they are different in kind: different category, function, or behavior (red for destructive actions). Two cautions: validate contrast choices against every real variant and state, not just the best case, and never deemphasize content by dropping text contrast below readable. Deemphasis comes from size and weight.

**Gestalt grouping.** People perceive the whole before the parts. The sub-principles are the mechanics of layout:

- Proximity: close means related. Labels sit visibly closer to their own field than to the neighbor's. Spacing is the primary grouping tool.
- Similarity: shared visual treatment means shared function. All primary buttons look alike; anything that looks alike had better behave alike.
- Common region: a shared container binds a group. This is the legitimate job of a card; it is also why cards inside cards collapse meaning.
- Continuation: aligned edges create a path the eye follows. Alignment decides reading flow.
- Closure: the mind completes implied shapes, which is why minimal iconography works.
- Figure/ground: the focal element must separate cleanly from its background through contrast, elevation, or framing.
- Symmetry and order: orderly arrangement makes a set read as one unit.

## Setting direction

Models converge on generic output because, without explicit context, the statistically safe choice wins. Break that by fixing the context before generating.

Establish, in writing, before the first component:

- **Register.** Brand surface (the impression is the product: landing, portfolio, campaign) or product surface (design serves the task: app, dashboard, admin). This fork controls how much flourish is appropriate.
- **Users and what they came to do.** The audience picks the aesthetic.
- **Voice.** Two or three adjectives you will actually enforce ("dry, precise, quietly confident").
- **References and anti-references.** Name real inspirations: an IDE theme, a transit map, a specific magazine era, a cultural aesthetic, a physical object from the product's world. Name what to avoid just as concretely ("purple gradients, glassmorphism, hype"). Naming the anti-pattern is part of what breaks the default.

Then state the design read in one or two sentences and build toward it. A concrete visual reference beats a long abstract brief for blank-slate work.

Two session-level habits:

- **Theme lock.** When a project must stay coherent across many generations, write the committed attributes down (palette, shape language, texture motifs, mood, type style) and treat them as fixed constraints, not suggestions.
- **Vary across projects.** Distinctive choices reconverge: a model that discovers one "interesting" font will pick it every time. If the last design used a given face, palette, or mood, deliberately go elsewhere this time.

## The type system

Typography signals quality faster than any other choice, and it is the loudest signal of who made this.

- Choose the face for this product's voice and be able to say why. Category starting points: code and terminal moods (JetBrains Mono, Fira Code, IBM Plex Mono), editorial (Playfair Display, Crimson Pro, Newsreader), contemporary startup (Clash Display, Satoshi, Cabinet Grotesk), technical and neutral (IBM Plex family, Source Sans 3). Treat every named list, including this one, as perishable: fonts rotate into cliché (Space Grotesk, Instrument Serif, and Fraunces already have). The durable rule is choosing deliberately, not any specific name.
- Pair with contrast: display plus monospace, serif plus geometric sans, or one variable font spanning a wide weight range. Two similar sans faces read as indecision.
- Use extremes. Weight 100-200 against 800-900, not 400 against 600. Display sizes 3x body or more, not 1.5x. Between adjacent hierarchy steps keep at least a 1.25 ratio.
- Load the font properly (self-host or Google Fonts, preloaded and subset), state the choice before coding, and use it decisively.
- Keep the reading floor: body 16px+, line height 1.4-1.65, measure 45-75ch. Display type may break rules; body text may not.

## The color system

- Commit to one cohesive palette and encode it as CSS variables at the root. Every color in the page comes from a token; ad hoc hex values are how palettes drift into mush.
- Structure: a dominant base (usually near-neutral, tuned warm or cool to the direction), one saturated accent doing real work (primary actions, key highlights), and a small neutral ramp actually toned to the base rather than default grey. Dominant plus sharp accent outperforms an evenly distributed palette.
- Steal from committed palettes rather than inventing from nothing: IDE themes (Solarized, Nord, Gruvbox, Rose Pine), film grades, national rail liveries, botanical plates, whatever fits the product's world. These come pre-balanced and pre-distinctive.
- Derive semantic colors (success, error, warning, info) from the palette: shift the base hue, keep saturation consistent. Stock framework red/green/amber/blue next to a custom palette reads as unfinished.
- Choose light or dark from the context. Dark suits media, code, and dashboards in dark rooms; it is not a personality. A dark theme needs body text near 7:1 contrast and real surface hierarchy (elevation via lighter surfaces, not colored glows).

## Space, shape, and elevation

- Spacing scale with real jumps (4/8/16/32/64), applied unevenly on purpose: tight within a group, generous between groups. The jump sizes carry the grouping information.
- One radius scale, small and consistent. Cards around 12-16px maximum, controls smaller, full pills only for buttons and tags. Nested corners are concentric: inner radius = outer radius minus the gap.
- Elevation as a scale, not an effect: level 0 flat, level 1 hairline border, level 2 hairline plus tight contact shadow, level 3 layered ambient plus direct shadow (two layers minimum, colorless, blur proportionate to the element). Pick the level per surface and stay consistent.
- Borders and shadows cooperate: semi-transparent borders improve edge clarity on shadowed surfaces. On non-neutral backgrounds, tint borders, shadows, and text toward the background hue so the page holds together.

## Backgrounds and depth

A flat default-white or default-black void is a missed layer; equally, a gradient orb glow is the slop default. Build atmosphere that matches the committed direction:

- Layered subtle gradients (two or three stops of the base hue, barely apart) for gentle depth.
- Geometric or grid patterns at low contrast for technical moods.
- Noise or grain overlays for print and editorial moods.
- Large typographic or illustrative elements cropped at the edges for poster energy.

Whatever the technique, the background reinforces the theme, never competes with content, and never becomes a spotlight pointing at nothing.

## The motion system

- One well-orchestrated moment beats many scattered ones. The page-load entrance is the highest-value moment: stagger reveals with `animation-delay` so the hierarchy is choreographed (primary element first, support following), typically 300-500ms per element with 60-100ms stagger.
- Micro-interactions are quiet: 120-200ms, ease-out, surface-property changes (background, border, opacity). They confirm; they do not perform.
- Prefer CSS-only for plain HTML. In React, use the Motion library when a dependency is acceptable.
- Scroll-triggered reveals are fine used sparingly and once per element; parallax and continuous loops rarely earn their cost.
- Always ship the `prefers-reduced-motion` variant.

## The final check

Composition is judged on the render, not the source. Before delivering: view it (screenshot if you can), squint-test the hierarchy (does the most important thing read first?), draw the balance axis, verify group spacing beats within-group spacing, and confirm every decorative element still means something. Then run the slop audit in `slop-tells.md`.
