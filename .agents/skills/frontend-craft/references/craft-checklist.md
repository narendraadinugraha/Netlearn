# Craft Checklist

Implementation rules that separate polished interfaces from careless ones. Merged from the Vercel Web Interface Guidelines, digital.gov's accessibility guidance for visual designers, and the quality half of the impeccable.style catalog. Interfaces succeed because of hundreds of small choices; this is the working list of those choices with exact values.

Use it while building, and as a checklist when auditing an existing product surface for an unslop pass. For a product surface (app, dashboard, form-heavy UI) treat every section as the bar. For a static page, the typography, color, layout, content, and performance sections still fully apply.

## Interactions

- Everything works with the keyboard alone: Tab reaches every interactive element, Space/Enter/arrows activate it, flows follow WAI-ARIA patterns. No keyboard traps, and a skip-to-content link when nav precedes content.
- Every focusable element shows a visible focus ring. Use `:focus-visible` rather than `:focus` so pointer users are not distracted; use `:focus-within` for grouped controls. Manage focus on open/close: trap it in dialogs, return it on dismiss.
- Hit targets: at least 24px on desktop, 44px on mobile. If the visual is smaller, expand the hit area with padding. Touch targets on mobile: 48px with at least 8px separation between adjacent targets (an adult finger pad is about 10mm). Primary mobile actions sit within thumb reach.
- Set `<input>` font-size to at least 16px on mobile or iOS Safari zooms on focus. Never disable browser zoom. Set `touch-action: manipulation` to prevent double-tap zoom, and style `-webkit-tap-highlight-color` deliberately.
- Never block paste in inputs or textareas.
- Loading states: buttons keep their label and gain a spinner. Delay showing spinners/skeletons by 150-300ms and keep them visible at least 300-500ms so fast responses do not flicker. Skeletons mirror the final content exactly to avoid layout shift.
- State lives in the URL: filters, tabs, pagination, expanded panels, anything in `useState` that a user would want to share, refresh, or Back-button through.
- Optimistic updates when success is likely; on failure show an error and roll back or offer Undo. Destructive actions require confirmation or a safe undo window.
- Menu items that open a follow-up end with an ellipsis ("Rename…"), as do in-progress states ("Saving…"). Use the ellipsis character `…`, not three periods.
- Links are `<a>` (or the framework `<Link>`), never a div or button, so cmd-click, middle-click, and right-click all work. If part of a control looks interactive, it is interactive: no dead zones.
- Announce async results (toasts, inline validation) with polite `aria-live`.
- Autofocus the single primary input on desktop; rarely on mobile, where the keyboard opening shifts layout.
- Tooltips: delay the first in a group, none on its siblings. Set `overscroll-behavior: contain` on modals and drawers. Back/Forward restores scroll position. During drag, disable text selection and mark the dragged element `inert`.

## Forms

- Every control has a visible `<label>`, associated so clicking it focuses the control. Never use placeholder text as the label: it disappears on input. Persistent hints go outside the field; placeholders show example values ("+1 (123) 456-7890") and end with an ellipsis.
- Single-column layout. Exception: short, logically grouped fields (city, state, ZIP) may share a row.
- Fields have visible boundaries so the click target is obvious.
- Enter submits when a text input is focused. In a textarea, cmd/ctrl+Enter submits and Enter inserts a newline.
- Keep submit enabled until the request starts, then disable it, show a spinner, and send an idempotency key. Do not pre-disable submit on incomplete forms; let submission surface the validation.
- Never block keystrokes. If a field accepts only numbers, accept anything and validate with feedback; silently swallowed input is confusing.
- Errors appear next to their fields with multiple simultaneous cues (color plus icon plus bold weight plus border plus explanatory text), never color alone. On submit, focus the first error. Warn before navigation that would lose unsaved changes.
- Set correct `type`, `inputmode`, `autocomplete`, and meaningful `name` values so autofill and the right mobile keyboard work. Disable spellcheck on emails, codes, and usernames. Keep password managers working, allow pasting one-time codes, and use `autocomplete="one-time-code"` for OTP fields (and avoid reserved names on non-auth fields like search). Trim trailing whitespace from text-expansion input before validating.
- Set explicit `background-color` and `color` on native `<select>` to avoid unreadable dark-mode menus on Windows.

## Typography and readability

- Body text at least 16px effective size (never below 14px anywhere). Line length 45-75 characters, with about 66 as the comfortable target; enforce with `max-width: 65ch` to `75ch`.
- Line height scales with size: body 1.4-1.65, headings 1.0-1.3, captions about 1.3. Below 1.3 the eye loses the return path at line breaks.
- Pick faces with a large x-height, consistent metrics, and distinguishable glyphs: capital I, lowercase l, and 1 must differ, as must 0 and O (this matters doubly for code and IDs).
- Headings differ from body via size, weight, face, or color, but stay internally consistent as a system. Never skip heading levels in the document outline.
- All-caps only for short labels, never body passages. Letter-spacing on body text stays at or below 0.05em. Left-align body text on screen; justified text without hyphenation creates rivers of white.
- Use curly quotes, the ellipsis character, and `tabular-nums` (or a mono face) for columns of numbers users compare. Tidy widows and orphans in headings. Glue units and shortcut keys with non-breaking spaces ("10&nbsp;MB").

## Color and contrast

- Text contrast at least 4.5:1 for body and 3:1 for large text against the actual background. Exceptions: logos, disabled controls, incidental decoration. Prefer APCA when available for more accurate perceptual contrast.
- Slightly temper pure black on pure white; stark maximum contrast causes blur and movement effects for some readers. Do not "deemphasize" content by dropping its contrast below readable; deemphasize with size and weight.
- Never convey meaning by color alone; pair it with text or an icon. Check the palette in a color-blindness simulator, and use color-blind-safe palettes in charts.
- Text over images needs a solid block or dark overlay behind it.
- Interactive states (`:hover`, `:active`, `:focus`) have more contrast than rest state, not less.
- Match browser chrome to the page: `<meta name="theme-color">`, and `color-scheme: dark` on `<html>` for dark themes so scrollbars and form controls render correctly.

## Layout

- Every element aligns with something intentionally: a grid, a baseline, an edge, an optical center. Nudge plus or minus 1px when perception beats geometry (optical alignment). When text and icons sit side by side, balance their visual weight.
- Reading order matches visual order; the DOM never contradicts the layout.
- Key information is discernible at a glance: place items by importance, with primary actions at natural reach points.
- Verify on mobile, laptop, and ultra-wide (zoom out to 50% to simulate). Respect safe-area insets on notched devices.
- Content never overflows its container or the viewport: wrap text, constrain widths, and keep at least 16px page-edge padding and 12-16px padding inside any bordered or filled container.
- Only useful scrollbars: fix overflow bugs rather than shipping stray scrollbars (test with scrollbars set to always-visible).
- Let CSS lay things out (flex, grid, intrinsic sizing) instead of measuring in JS.
- Design every state: empty, sparse, dense, error, loading. Layouts survive short, average, and very long user content.

## Motion

- Honor `prefers-reduced-motion` with a reduced variant.
- Prefer CSS, then the Web Animations API, then JS libraries. Animate only compositor-friendly properties (`transform`, `opacity`); never animate `width`, `height`, `top`, `left`, `padding`, or `margin`.
- Never `transition: all`; list the properties you mean. Animations are interruptible and input-driven, not autoplaying. Set `transform-origin` where the motion physically starts.
- Choose easing by what changes; default to ease-out for entrances and interactions. For SVG, animate a `<g>` wrapper with `transform-box: fill-box; transform-origin: center` to dodge Safari origin bugs.
- Scaling text can shimmer; animate a wrapper, or promote the layer with `will-change: transform` if artifacts persist.

## Content and copy

- Prefer inline explanations; tooltips are a last resort. Every screen offers a next step or recovery path: no dead ends.
- `<title>` reflects the current context. Headings are hierarchical. Anchored headings get `scroll-margin-top`.
- Icon-only buttons carry a descriptive `aria-label`. Icons that convey meaning get text labels; decorative ones get `aria-hidden`. Prefer native semantics (`button`, `a`, `label`, `table`) before reaching for ARIA.
- Links are descriptive out of context: "Read more about dinosaurs", never "Read more".
- Error copy states the fix, not just the failure: "Your API key is incorrect or expired. Generate a new key in your account settings", not "Invalid API key".
- Write in active voice with specific labels ("Save API key", not "Continue"). Use numerals for counts, a space between number and unit ("10 MB"), and consistent decimal places for currency.
- Format dates, times, numbers, and currencies for the user's locale. Detect language from `Accept-Language` and `navigator.languages`, never from IP or GPS. Wrap brand names, code tokens, and identifiers in `translate="no"`.
- Every image ships a real `src` and meaningful alt text (or empty alt if decorative); never placeholder or broken images. Graphics get plain-language captions; skip the graphic entirely when a sentence does the job.
- Charts: format follows the data, axes and series are labeled, series colors are distinguishable, and a short written description of the trend (or a data table) accompanies the visualization.

## Performance

- Mutations (`POST`, `PATCH`, `DELETE`) complete in under 500ms.
- No image-caused layout shift: explicit dimensions, reserved space. Preload only above-the-fold images and lazy-load the rest. Preload critical fonts, subset them with `unicode-range`, and preconnect to asset origins.
- Virtualize large lists (or `content-visibility: auto`).
- Prefer uncontrolled inputs; keep controlled loops cheap; minimize re-renders and batch DOM reads/writes. Move long tasks to Web Workers.
- Test iOS Low Power Mode, macOS Safari, and throttled CPU/network profiles.

## Screen reader pass

Before shipping a form or flow, verify with a real screen reader (VoiceOver: cmd+F5): controls are reachable, labels announce before their fields, headers announce before their content, and the announcement order matches the visual order.
