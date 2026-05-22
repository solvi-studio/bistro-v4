# Figma Extract — Al Bistro Prototype

Source: `figma.com/design/SDeTQ6ctGasvZRpSVgG6GE` · node `2240-7` (full prototype page).
Extracted 2026-05-21. No local Figma variables defined — design uses raw hex values.

## Screens

| Screen | Node ID | Notes |
|--------|---------|-------|
| Main #1 - Visual | 2781:32 | Home / "Rita's Canvas" dashboard |
| Creative Spaces | 2781:85 | |
| Inspo Pool | 2987:453 | Upload screen (`solar:upload-linear`) |
| Summarise Idea | 2983:231 | AI sparkles (`famicons:sparkles-outline`) |
| Plan | 2983:303 | Has Calendar (2983:371), EventDetailCard frames |
| Main #1 - Visual (alt) | 3024:1675 | Duplicate variant |

## Colors

| Token | Value | Use |
|-------|-------|-----|
| bg/page | `#ffffff` | page background |
| bg/sidebar | `#fafafa` | left nav (259px wide) |
| bg/canvas-overlay | `rgba(217,217,217,0.5)` | main canvas tint |
| text/primary | `#020202` | headings |
| text/black | `#000000` | body / labels |
| bg/pill | `#ffffff` | Next button pill |

## Gradient cards (radius 70px)

```css
/* yellow card */
linear-gradient(169.48deg, #ffffff 9.82%, #fcf7ea 10.9%, #fdf1d1 64.66%, #f9e59f 95.46%)
/* pink/red card */
linear-gradient(177.62deg, #ffffff 0.82%, #ffdad8 37.69%, #febec0 76.1%, #ff9699 111.29%)
/* blue card */
linear-gradient(161.70deg, #ffffff 26.55%, #e6efff 23.35%, rgba(115,183,255,0.64) 81.01%, rgba(115,183,255,0.85) 146.76%)
```

## Typography

Font family: **Poppins**.

| Style | Size | Weight |
|-------|------|--------|
| Display | 88px | SemiBold |
| Heading | 48px | SemiBold |
| Body / label | 40px | Medium |

Note: sizes are 2x — prototype canvas drawn at large scale. Halve for real mobile (≈44/24/20px).

## Radii

- Cards: `70px`
- Pill button: `83px`

## Icon set (iconify packs)

`streamline-freehand-color:creativity-idea-bulb`, `marketeq:notification-bell`,
`streamline-freehand-color:notes-book`, `streamline-freehand-color:calendar-grid`,
`marketeq:chat-alt-3`, `qlementine-icons:home-24`, `solar:upload-linear`,
`famicons:sparkles-outline`, `streamline-freehand-color:design-process-draw-pen`,
`fluent-color:beach-16`, `noto:flexed-biceps-light-skin-tone`.

→ Install `@iconify/react` to use directly instead of exported PNGs.

## Libraries linked to file

Andrew Nguyen's Team Library · Material 3 Design Kit · Simple Design System · iOS 18 · iOS 26 · watchOS 26 · visionOS 26 · macOS 26.

## Asset URLs

Figma MCP asset URLs expire after 7 days. Re-run `get_design_context` per node to refresh, or `upload_assets` / download PNGs to `public/` for permanent use.
