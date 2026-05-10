---
name: FocusGuard
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0f12'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323539'
  on-surface: '#e0e2e8'
  on-surface-variant: '#baccb0'
  inverse-surface: '#e0e2e8'
  inverse-on-surface: '#2d3135'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#c3c6cf'
  on-secondary: '#2d3137'
  secondary-container: '#454950'
  on-secondary-container: '#b5b8c1'
  tertiary: '#f9f9ff'
  on-tertiary: '#2d3038'
  tertiary-container: '#dadde7'
  on-tertiary-container: '#5d616a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#dfe2eb'
  secondary-fixed-dim: '#c3c6cf'
  on-secondary-fixed: '#181c22'
  on-secondary-fixed-variant: '#43474e'
  tertiary-fixed: '#dfe2ec'
  tertiary-fixed-dim: '#c3c6d0'
  on-tertiary-fixed: '#181c23'
  on-tertiary-fixed-variant: '#43474f'
  background: '#101417'
  on-background: '#e0e2e8'
  surface-variant: '#323539'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  status-accent:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max-width: 1280px
---

## Brand & Style
The design system is engineered to evoke the feeling of a high-performance command center. It targets professional power users who view productivity as a precision discipline. The brand personality is "Technical Zen"—a fusion of calm, focused minimalism with the high-octane energy of cutting-edge technology.

The UI style leverages **Glassmorphism** and **Cinematic High-Tech** aesthetics. It utilizes deep, layered dark tones to reduce eye strain, punctuated by high-vibrancy neon accents that guide the user's attention to active states and critical data. Every interaction should feel like a deliberate action within a sophisticated digital environment, utilizing subtle glows and razor-thin lines to create a sense of futuristic depth.

## Colors
The palette is rooted in a "Deep Space" hierarchy. The primary background is a rich **Deep Navy (#0A0E14)**, while secondary surfaces like cards and sidebars use **Charcoal (#12161D)** to create subtle contrast without breaking the dark-mode immersion.

The **Neon Green (#39FF14)** is used exclusively for functional elements: active indicators, primary call-to-actions, and data highlights. This color should be accompanied by a soft outer glow to simulate a light-emissive display. Neutral tones are kept cool and desaturated to ensure the neon accents remain the focal point of the visual hierarchy.

## Typography
This design system utilizes a trio of typefaces to establish its high-tech narrative. **Space Grotesk** is used for headlines, providing a geometric and slightly futuristic edge. **Inter** handles the bulk of the UI for maximum readability and a clean, modern feel. **JetBrains Mono** is introduced for labels and status indicators to reinforce the technical, data-driven nature of the tool.

Large display type should be used sparingly to maintain the minimalist aesthetic. Functional labels in JetBrains Mono should always be in uppercase with increased letter spacing to mimic serial numbers or technical readouts.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to maintain a controlled, cinematic composition. A 12-column system is used with generous gutters (24px) to allow the glassmorphic elements "room to breathe." 

On mobile, the layout reflows to a single column with a 20px safety margin. Spacing follows a strict 4px base unit (4, 8, 16, 24, 32, 48, 64) to ensure mathematical harmony across all components. High-priority focus modes should utilize centered, symmetrical layouts to minimize peripheral distraction.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional shadows. Surfaces use a layered approach:
1. **Base Layer:** Deep Navy (#0A0E14).
2. **Surface Layer:** Semi-transparent Charcoal with a `backdrop-filter: blur(12px)`.
3. **Detail Layer:** 1px borders using `rgba(255, 255, 255, 0.08)` to define edges without adding visual weight.

Avoid heavy drop shadows. Instead, use "Glow Elevation" for active elements: a subtle outer drop shadow using the Neon Green color with a high blur radius and low opacity (15-30%) to simulate light being cast onto the background surface.

## Shapes
The shape language is "Soft-Industrial." By using a **Soft (0.25rem)** base roundedness, this design system balances the harshness of a technical tool with the approachability of a modern SaaS. 

- **Standard Buttons/Inputs:** 4px (0.25rem) radius for a precision look.
- **Large Cards/Containers:** 8px (0.5rem) radius to define major content areas.
- **Contextual Tags:** 2px or 4px radius, keeping them sharp and data-like.
Avoid fully rounded or pill-shaped elements as they feel too "playful" for the professional, cinematic intent of this system.

## Components
- **Buttons:** Primary buttons feature a solid Neon Green background with black text for maximum contrast. Secondary buttons use a transparent background with a 1px Neon Green border and a subtle hover glow.
- **Inputs:** Dark charcoal backgrounds with a 1px border. On focus, the border transitions to Neon Green with a soft inner glow.
- **Cards:** Utilize the glassmorphic style—semi-transparent charcoal with a background blur. Borders should be "hairline" width (1px or 0.5px) and slightly reflective.
- **Chips/Status:** Use JetBrains Mono for the text. Active states feature a small glowing dot (4px circle) next to the label.
- **The "Focus Pulse":** A custom component for active timers or trackers. It consists of a thin Neon Green ring with a rhythmic, low-opacity expansion animation to signal "System Active" status.
- **Checkboxes:** Square-cornered with a 1px stroke. When checked, the entire box glows neon green with a minimal checkmark icon.