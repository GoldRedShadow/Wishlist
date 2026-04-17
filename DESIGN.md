```markdown
# Design System Strategy: The Curated Hearth

## 1. Overview & Creative North Star: The Digital Curator
This design system moves away from the sterile, "app-like" interfaces of the modern web and toward the tactile elegance of a high-end editorial lookbook. Our North Star is **The Digital Curator**: an experience that feels less like a database of items and more like a personal archive kept in a bespoke linen binder.

To achieve this, we reject the "standard" container-and-border layout. Instead, we embrace **Intentional Asymmetry** and **Tonal Depth**. By utilizing wide margins, varying text alignments, and overlapping surface layers, we create a sense of rhythm and breathing room that signals luxury and calm.

---

## 2. Colors: Tonal Envelopes
We utilize a spectrum of warmth to guide the eye. Our palette is built on `surface` (#fcf9f4) and `on-surface` (#1c1c19), creating a high-contrast "Ivory & Ink" foundation that is softened by mid-tone beiges.

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background shifts. To separate a category from a list, place the content on a `surface-container-low` (#f6f3ee) section against the main `surface` (#fcf9f4) background.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine paper. 
    *   *Level 0:* `surface` (The desk)
    *   *Level 1:* `surface-container` (The folder)
    *   *Level 2:* `surface-container-highest` (The note)
*   **The Glass & Gradient Rule:** For floating elements like navigation bars or quick-add buttons, use a semi-transparent `surface-bright` with a 12px backdrop-blur. This "frosted glass" effect prevents the UI from feeling "heavy" or "blocked in."
*   **Signature Textures:** Use subtle linear gradients for primary CTAs, transitioning from `primary` (#5f5e5b) to `primary-container` (#cac8c3) at a 45-degree angle. This provides a soft, metallic sheen reminiscent of graphite or silk.

---

## 3. Typography: Editorial Authority
Typography is our primary architectural tool. We lead with **Noto Serif** to establish a literary, authoritative voice, supported by **Work Sans** for utilitarian micro-copy.

*   **Display (Large/Medium):** Use `display-lg` (3.5rem) for hero moments. Encourage intentional "breaking" of the grid—let display text overlap image containers slightly to create depth.
*   **Headlines & Titles:** `headline-md` and `title-lg` should be set with tighter letter-spacing (-0.02em) to maintain a premium, "ink-heavy" feel.
*   **The Utility Duo:** All functional labels (prices, dates, tags) must use `label-md` or `label-sm` in **Work Sans**. This sans-serif juxtaposition ensures that while the brand feels "classic," the interface remains legible and modern.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too aggressive for this aesthetic. We achieve height through light and color.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f6f3ee) background. This "white-on-cream" effect creates a sophisticated, soft lift that feels natural.
*   **Ambient Shadows:** If a floating element requires a shadow (e.g., a modal), use a diffused 32px blur at 4% opacity, using the `on-surface` (#1c1c19) color. It should feel like a soft glow of "missing light" rather than a grey smudge.
*   **The "Ghost Border" Fallback:** For input fields or essential containment, use the `outline-variant` (#d0c4bb) at 20% opacity. It should be barely visible—a whisper of a boundary.

---

## 5. Components: Tactile Interactivity

*   **Buttons:**
    *   *Primary:* `primary` (#5f5e5b) fill with `on-primary` (#ffffff) text. Use `sm` (0.125rem) or `md` (0.375rem) corner radius. Avoid "full" pill shapes; sharp, subtle corners feel more bespoke.
    *   *Tertiary:* Underlined `title-sm` text. The underline should be 1px and offset by 4px.
*   **Cards & Wishlist Items:**
    *   **Strictly forbid divider lines.** Separate items using 24px or 32px of vertical white space. 
    *   Use `surface-container-low` for card backgrounds. On hover, shift the background to `surface-container-high`.
*   **Chips (Filters/Tags):** Use `secondary-container` (#f9dec7) with `on-secondary-container` (#75614f) text. These should be the "warmest" elements in the UI, acting as soft highlights.
*   **Input Fields:** Ghost borders only. Use `notoSerif` for the input text and `workSans` for the floating label to clearly distinguish between "System" and "User" content.
*   **Editorial Gallery (Contextual Component):** A specialized component for the wishlist. Use asymmetrical image sizes (e.g., a large vertical image next to two smaller square images) to mimic a magazine layout.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Negative Space:** Allow at least 48px of padding between major sections. Luxury is defined by the space you *don't* fill.
*   **Use Intentional Alignment:** Mix left-aligned headlines with right-aligned body copy for a "broken grid" editorial look.
*   **Prioritize Noto Serif:** Use the Serif font for anything that conveys emotion or value.

### Don’t:
*   **Don't use 100% Black:** Always use `on-surface` (#1c1c19) for text to maintain the "Ink" warmth.
*   **Don't use Heavy Shadows:** If the shadow is the first thing you see, it’s too dark.
*   **Don't use Round Buttons:** Avoid `full` (9999px) roundness for buttons; it feels too "tech" and "bubbly." Stick to `md` (0.375rem) for a tailored look.
*   **Don't use Dividers:** If you feel the need for a line, try a 16px gap and a subtle background color shift instead.```