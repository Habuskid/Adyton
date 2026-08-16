---
name: Adyton Architectural Treasury
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d4c4b7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9c8e83'
  outline-variant: '#50453b'
  surface-tint: '#eebd8e'
  primary: '#eebd8e'
  on-primary: '#472a06'
  primary-container: '#b4885d'
  on-primary-container: '#3f2302'
  inverse-primary: '#7c5730'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b6b5b4'
  tertiary: '#c6c6c6'
  on-tertiary: '#2f3131'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbd'
  primary-fixed-dim: '#eebd8e'
  on-primary-fixed: '#2c1600'
  on-primary-fixed-variant: '#61401b'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.02em
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin: 48px
  container-max: 1280px
---

## Brand & Style

The design system is rooted in the concept of the *adyton*—the innermost sanctuary of an ancient temple. It serves as a serious financial infrastructure layer for Starknet, prioritizing institutional custody and cryptographic proof over visual flair.

The style is **Architectural Minimalism**. It eschews decorative elements in favor of structural integrity, utilizing thin rules, precise alignments, and a constrained color palette to evoke a sense of security and permanent record. The emotional response is one of "calm authority"—a digital vault that feels as heavy and immutable as stone, yet as precise as a Swiss timepiece. 

Key principles include:
- **Restraint:** If an element doesn't serve a functional or structural purpose, it is removed.
- **Precision:** Cryptographic data is treated as the primary citizen of the UI.
- **Solidity:** Layouts use a "chambered" approach, where information is nested within clear, bordered zones.

## Colors

The palette is strictly functional, designed for high legibility in low-light environments typical of financial terminals.

- **Base Surface:** `#121212` (Charcoal) serves as the primary canvas.
- **Elevated Surface:** `#1A1A1A` (Graphite) is used for "chambers" or content containers.
- **Accents:** `#A67C52` (Muted Bronze) is reserved exclusively for the "Verified" state, primary actions, and cryptographic proofs. It should never be used for decorative strokes.
- **Typography:** `#E0E0E0` (Off-white) for primary content; `#888888` (Steel) for secondary metadata and inactive labels.
- **Status:** Success/Proven uses the Primary Bronze; Errors use a desaturated cinnabar (#B24C4C).

## Typography

This design system employs a dual-typeface strategy to distinguish between narrative UI and technical data.

1. **Inter (Humanist Sans):** Used for all structural navigation, instructional text, and headings. It provides a modern, legible interface that feels approachable but professional.
2. **JetBrains Mono (Technical Mono):** Used for all variable data, including wallet addresses, transaction hashes, balances, and timestamps. The monospaced nature signals "machine-verified" precision.

**Hierarchy Rules:**
- Use `label-caps` for section headers and table column titles to create an "institutional report" aesthetic.
- Large numerical balances should always use `data-lg` to emphasize their role as financial data.

## Layout & Spacing

The layout is governed by a **Fixed Grid** system that mirrors architectural blueprints. 

- **The Chamber Model:** Content is organized into distinct vertical or horizontal zones separated by 1px rules (`#2A2A2A`).
- **Margins:** Generous outer margins (48px+) ensure the UI feels expansive and uncluttered, emphasizing the "vault" atmosphere.
- **Rhythm:** An 8px linear scale is used for all internal component spacing, while 24px (3x) is the default gutter for structural separation.
- **Responsiveness:** On mobile, the 12-column desktop grid collapses to a single column, but the 1px architectural dividers remain to maintain the structural identity.

## Elevation & Depth

In keeping with the architectural theme, this design system avoids traditional drop shadows and blurs.

- **Flat Layering:** Depth is conveyed through tonal shifts rather than shadows. The base is `#121212`, while active "chambers" or modals sit on `#1A1A1A`.
- **Architectural Lines:** 1px solid borders in `#2A2A2A` define the edges of surfaces.
- **The "Proven" Glow:** Only the primary bronze color (`#A67C52`) may use a very subtle, tight outer glow (4px blur, 10% opacity) to indicate a verified cryptographic state, simulating a backlit status indicator on a physical vault.

## Shapes

To reinforce the sense of "architectural permanence" and "institutional restraint," the design system utilizes **Sharp (0px)** corners for all primary UI elements.

- **Buttons & Inputs:** Hard 90-degree angles only.
- **Cards & Modals:** Sharp edges to mimic stone slabs or terminal screens.
- **Exceptions:** Very small indicators, such as status dots or radio inner-marks, may be circular to provide a clear visual distinction from structural elements.

## Components

### The "Proven" State Motif
Every verified transaction, address, or proof is accompanied by a `ProvenBadge`. This is a small square (monospaced 'P' or a check icon) in `#A67C52` with a 1px border of the same color. It is the most high-contrast element in the UI.

### Buttons
- **Primary:** Solid `#A67C52` background with `#121212` text. Sharp corners.
- **Secondary:** 1px border in `#E0E0E0` with transparent background.
- **Ghost:** No border, `#888888` text, shifting to `#E0E0E0` on hover.

### Input Fields
Inputs are styled as "slots." A 1px bottom border in `#2A2A2A` that expands to `#A67C52` on focus. Labels sit inside the slot in `label-caps` style.

### Data Tables
Tables are the core of the treasury. Use 1px horizontal rules only. No zebra striping. Row hover states should use a subtle `#1A1A1A` background fill.

### Vault Chambers (Cards)
Instead of standard cards, use "Chambers." These are sections defined by a `label-caps` header followed by a 1px horizontal rule that spans the full width of the container. Information within is grouped by vertical 1px rules.