# AI Slop Tells

The merged catalog of patterns that mark a frontend as AI-generated. Sources: killaislop.com (33 tells), impeccable.style/slop (46 patterns), design-slop-cop (14 deterministic detectors), and a scan of 1,590 Show HN landing pages that produced the frequency percentages cited below.

How to use this file: sweep it as a pre-delivery audit, or when asked to de-slop an existing design. For each hit, ask whether the choice can be explained in terms of this product and audience. A justified hit stays. An unexamined default goes.

Two rules frame the whole list:

- **Density over presence.** Detectors treat 1-2 tells as a pass, 3-4 as templated, 5+ as heavy slop. Great human-made sites trip individual tells too; the aesthetic is near-universal, which is the point. Judge the pile, not the item.
- **The list rots.** These are the current tells. The 2022 set (purple, glass, neon-on-black) gave way to the 2026 set (cream, editorial serif, restraint). When a "fix" below names a specific color or font, the durable part is the reasoning, not the value.

## Color and surface

**The default purple accent ("VibeCode purple", 7%).** Indigo-to-violet on CTAs and links: `from-indigo-500 to-purple-500`, `#6366f1` to `#a855f7`, any saturated fill in the 250-300 hue range. It is the factory setting of Tailwind demos and AI scaffolds; nobody chose it. Fix: pick one accent you can justify from the product's world. If you use a gradient, give it direction and a reason.

**Gradient-clipped headline text.** `bg-clip-text text-transparent` over a gradient trades legibility for an effect; decoration eats the message and kills scannability. Fix: text is always a solid color. Build hierarchy with size, weight, and space, not by painting the letters.

**Gradients as atmosphere (30%, the most common tell).** A near-black page with a radial top glow, four or more gradient-filled surfaces, or cards washed in a tint of their own accent color. Every surface becomes mood, none is a flat color. Fix: pick one flat background and hold it. Build depth with a hairline border and one restrained shadow. If a glow exists, aim it at something.

**Permanent dark mode with grey body text (30%).** Dark-by-default with muted mid-grey copy is a template look, not a decision, and usually ships barely-passing contrast. Fix: dark themes must be earned by the context (media, code, dashboards used at night). If dark, keep body text near 7:1 contrast. Otherwise pick light deliberately.

**Colored glow shadows (7%).** Saturated `box-shadow` glows (blur 15px+) behind buttons and cards, the "premium dark mode" reflex. Fix: shadows encode elevation, so keep them neutral and quiet. One deliberate colored glow can be an accent; two or more is decoration.

**The warm "cozy" default.** Amber/stone/orange on beige (`bg-[#fdf6ec] text-amber-900`), or the 2026 evolution: cream `#faf6ef` with a Fraunces-style serif. This is the model's laziest translation of "warm and friendly" and the current "tasteful" reflex. Fix: warmth comes from words and content. Use a neutral base with one restrained warm accent you chose.

**The stock semantic rainbow.** Info blue, tip amber, success green, error red, all at Tailwind `-50` background and `-600` text, or status boxes built as `border-{c} text-{c} bg-{c}/10` in one hue at three opacities. Nobody picked these; they arrive with the framework. Fix: grow semantic colors out of your own palette. Carry state in words and weight first (a bold "Error" reads before any color), and remember most notes need no color at all.

**Grey text on tinted surfaces.** Default grey copy sitting on a colored background looks washed out because the grey was never toned to the surface. Fix: use a darker shade of the background hue, or go near-white.

## Typography

**Inter everywhere.** Inter, Roboto, Arial, Open Sans, Lato, or a raw system stack as the whole identity (DM Sans, Plus Jakarta Sans, and Manrope are the same reflex one shelf over). A typeface is the loudest single signal of who made this; defaulting to the training-data average dodges the identity decision. Fix: choose a face the way you would choose a logo. Set your own copy in a few candidates and be able to say why the winner won. Landing on Inter after that is a choice; starting there is not.

**The trend-font rotation (12%).** Space Grotesk, Instrument Serif, Fraunces, Bricolage Grotesque, Sora, Syne, Geist, Young Serif as the page default. These are good typefaces that became tells because every generator reaches for them; even Anthropic's own guidance names Space Grotesk as a convergence trap. Fix: the problem is the reflex, not the font. Choose for this product's voice, keep trend faces in minor roles if at all, and vary your choices across projects.

**The hero font mix (22%).** One word in the headline swapped to a serif italic, a second family, or an accent color or gradient ("Stop being a *fraud*"). Two voices fight in one sentence. Fix: one family, one style, one solid color per headline. Emphasize with weight, size, or a line break; if you truly need italic, use the same family's italic.

**Serif as a premium costume.** A display serif (Playfair, Lora, Cormorant) dressing a dev tool or SaaS product, especially as an oversized italic hero. The model equates serif with premium; the result is a tuxedo on a terminal. Fix: reach for a serif only when the editorial voice is real, and use a text serif for reading, not a display face everywhere.

**Kickers and eyebrows on everything.** A tiny uppercase tracked label (`text-xs uppercase tracking-widest`) above every heading, restating it: FEATURES above the features. Zero information, pure template rhythm. Fix: delete any kicker that restates its heading. Keep one only when it adds a real dimension (a category, a date, a genuine sequence).

**The full-sentence display headline.** Fourteen words at `text-6xl font-extrabold tracking-tight`, wrapping three or four lines. The model does not know which two words matter, so it sets the whole pitch huge, which reads as less sure, not more. Fix: compress the one thing into a few words and let those be big. Say the rest in a normal-size subline. Tighten tracking only as far as the typeface was designed to go.

**Flat type hierarchy.** Every size crammed between 14 and 18px, steps under 1.25x, hierarchy carried by shades of grey. The page reads as fog. Fix: fewer sizes with real contrast between steps, and make the most important thing unmistakably biggest.

**Decorative strikes and highlights.** Strikethrough on nothing deleted, `<mark>` or underline as emphasis, a highlighter swipe under the hero. Drawing on the words means not trusting them. Fix: weight, size, and sentence structure carry emphasis. Strikethrough marks real edits, underline marks links, highlight marks real annotation.

**All-caps and wide-tracked body text.** Long passages in uppercase flatten the word shapes readers rely on; letter-spacing above 0.05em on body copy slows reading. Fix: caps and wide tracking are for short labels only.

## Layout and structure

**The centered hero in a generic sans (19%).** A centered headline in Inter or system sans is what you get by changing nothing. Fix: left-aligned or asymmetric layouts, or center it in a face you actually chose.

**The identical icon-card grid.** Three or six equal cards, each a rounded icon tile above a heading above one line of copy. Every generator outputs this exact shape, and the icons (a gear, a bolt, a globe) rarely relate to the content. Fix: features are not equally important, so show hierarchy. Put the icon beside the heading or drop it. A clear label and one specific sentence beat a row of decorative glyphs.

**Numbered steps and ornamental ordinals (21%).** The 1-2-3 "how it works" badge row, or giant faint `01 / 02 / 03` numerals (`text-8xl text-gray-100`) beside unordered sections. Numbering is a claim that order matters; on marketing sections it is costume borrowed from editorial design. Fix: number only genuine sequences (install steps, a changelog). Distinguish sections with scale and space instead.

**The invented stat banner (6%).** "10K+ users, 99.9% uptime, 24/7 support" on a product that launched yesterday, often with count-up animations. Real numbers are odd and specific; round ones are set dressing, and one invented figure poisons every true one beside it. Fix: show a number only if you measured it, and say where it came from. No numbers yet? Say what the product does.

**The FAQ accordion (21%).** Three-plus collapsible generic Q&As parked at the bottom of the page regardless of whether anyone ever asked them. Template filler. Fix: include an FAQ only once real recurring questions exist, and write them specifically.

**Cards inside cards.** Bordered, rounded, shadowed boxes nested two or three deep. A card is a claim that its contents are one self-contained thing; nesting collapses the claim and stacks padding until content is a sliver. Fix: one surface per region. Group inside it with spacing, alignment, and hairline dividers. A child earns its own surface only as a genuinely separate object (a preview, an embed).

**One gap everywhere.** `gap-4 p-4 space-y-4` stamped across the page, headings equidistant from their own body and the previous section. Proximity stops carrying information. Fix: space by relationship. Pull related lines close, push unrelated groups apart, using a small scale with real jumps (4/8/16/32/64) applied unevenly on purpose.

**Badge and pill spam.** "New", "Beta", "Popular" pills scattered across the chrome to manufacture buzz. In bulk each one stops meaning anything. Fix: a badge marks real status (a version, stock, an actual release). Marketing mood does not need pills.

## Components and effects

**The accent stripe (6% frequency, top-tier reliability).** A 2-10px colored border or pseudo-element stripe down a card's left edge or across its top: `border-l-4 rounded-lg bg-*-50`. Multiple catalogs call this the single most recognizable tell, "almost as reliable a sign of AI-generated design as em dashes for text". It takes a real docs admonition and turns it into universal decoration, so every row looks important and none is. Fix: let lists be lists, carried by alignment and hierarchy. A genuine callout is scarce, one or two per page. If a card needs distinction, use whitespace, type, or a full tinted surface, not a stripe.

**Glassmorphism as decoration (12%).** `backdrop-blur bg-white/10 border-white/20` floating panels solving no layering problem, a frozen slice of 2021 Dribbble. Exception: a frosted sticky nav bar is common in well-made sites and is fine. Fix: blur only where content genuinely passes beneath. Otherwise use solid surfaces and space.

**The glowing status dot.** A saturated green dot in a pulsing halo (`animate-ping`) reading "Online" or "Ready", often glued into a hero pill with no live state behind it. The halo and pulse carry no information. Fix: a small flat dot plus a word. Color only when state actually changes; no dot at all if nothing is live.

**Icon tiles and self-tinted icons.** Every glyph wrapped in a rounded square (`rounded-xl bg-*-100`), or tinted with its own color (`bg-{color}-500/10` behind `text-{color}-500`). A one-line reflex that turns the page into a grid of soft colored squares. Fix: let an icon be an icon, inheriting text color, no container. A container is for real controls, with one deliberate opaque surface from your palette.

**Emoji as an icon system (3%).** Emoji prefixed to nav links, sidebar items, feature bullets, or buttons (rocket, sparkles, lightning, lock). Borrowed warmth standing in for tone the design should carry. Fix: a proper SVG icon set or plain text. Keep an emoji only where it carries real information.

**Max radius and mixed radii.** Pill-rounded cards, 24px+ radius on small panels, radii mixed across 4/12/24/9999px. Everything rounds into the same soft blob. Fix: one small radius scale held site-wide. Cards top out around 12-16px; full pills are for buttons and tags.

**Corners that do not nest.** The same radius token stamped on a box and the box inside it, so the arcs fight at every corner. Fix: inner radius = outer radius minus the gap between them, or leave the inner element square.

**The border that dies at the corner.** A `rounded-xl overflow-hidden` wrapper clipping a child that carries its own 1px border, erasing the stroke at all four arcs. Each line of code is locally right and the composition is wrong; the model never renders its own output, so it never sees the corner. Fix: border and border-radius live on the same element. If an outer layer must clip, move the border up onto it. True dividers stay straight, edge to edge.

**Oversized or tinted shadows.** A small element casting a huge low-opacity cloud (`0 40px 120px`), or a shadow bigger than the thing casting it, or a colored glow standing in for depth. Real light drops a tight contact shadow plus a soft ambient one. Fix: a small elevation scale with tight blur and low opacity, kept colorless. Often a hairline border alone is enough. If you layer, one 1px contact shadow under one restrained ambient shadow.

**Hairline border plus wide soft shadow.** Both at once on the same card commits to neither a crisp edge nor a soft elevation. Fix: pick one.

**AI-drawn SVG mascots.** A hand-generated blob with dot eyes shipped as the product mark, placeholder art that never got replaced. Fix: a real asset (commissioned or generated with a proper image model and refined), or nothing.

## Motion

**The springy hover.** `hover:scale-105`, `hover:-translate-y-1`, `transition-all`, overshoot cubic-beziers on every card and button. Motion is information, and scaling a card on hover says nothing; `transition: all` is the absence of deciding which property matters. Fix: transition only the properties that carry the state change (background, border, opacity) at 120-200ms with a standard ease-out. Hover feedback is a surface shift, not growth. Springs are for things that genuinely move through space.

**Motion without meaning.** Autoplaying loops, wiggling icons, floating badges, count-up numbers, animate-everything pages. Fix: the necessity check. Animate to clarify cause and effect or for one deliberate moment of delight, and prefer a single orchestrated page-load with staggered reveals over scattered micro-interactions.

## Copy

**The AI copywriting voice.** "It's not just X, it's Y." "Say goodbye to Z." Punchy triads. Dismissing things as "X theater". Forever symmetrical, one notch too excited, specifics-free. Fix: write the way one person explains to another, with real nouns, numbers, and consequences.

**The em-dash habit.** More than a couple of em dashes in a page of copy is a recognized AI cadence tell. Fix: commas, colons, periods, parentheses.

**Buzzwords.** Streamline, empower, supercharge, world-class, enterprise-grade, next-generation, blazing fast. Instant tells that say nothing. Fix: one specific verb and noun describing what the product literally does. "Cuts build time 38%" beats "blazing fast".

**Highlighted keywords mid-prose.** Colored spans, multiple `<mark>`s, bold sprinkled through paragraphs. Marking everything means knowing the point of nothing. Fix: sentence structure carries emphasis. At most one accent per paragraph, usually none.

**Emoji in product copy.** A glyph glued to every heading, button, and bullet makes the page louder, not clearer. Fix: cut decorative emoji and let words and layout set the tone.

**Redundant helper text.** Label, sublabel, helper, and hint all restating each other on one field. Fix: say it once, say it well.

## The audit method

1. Count the tells. 1-2 justified hits pass. 3-4 means look harder. 5+ means the page is a template wearing your content.
2. For each hit, apply the test: can I explain this choice in one sentence about this product and audience? Explainable stays, reflexive goes.
3. Subtract first. Slop is what piles up. Remove decoration until everything left has to be there, then check what remains against six principles: decide before you decorate; one accent, one voice; hierarchy from scale and space; subtract first; specific beats loud; decoration must mean something.
4. Look at the render, not just the code. Corner clipping, radius mismatches, and spacing monotony are invisible in source. If you can screenshot, screenshot.
