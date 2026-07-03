---
name: ConvoMate
colors:
  surface: '#fbf8fd'
  surface-dim: '#dbd9de'
  surface-bright: '#fbf8fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f7'
  surface-container: '#efedf2'
  surface-container-high: '#eae7ec'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1f'
  on-surface-variant: '#45464f'
  inverse-surface: '#303034'
  inverse-on-surface: '#f2f0f5'
  outline: '#767680'
  outline-variant: '#c6c5d0'
  surface-tint: '#505c8e'
  primary: '#061445'
  on-primary: '#ffffff'
  primary-container: '#1e2a5a'
  on-primary-container: '#8792c9'
  inverse-primary: '#b8c4fe'
  secondary: '#44617e'
  on-secondary: '#ffffff'
  secondary-container: '#c0ddff'
  on-secondary-container: '#45617f'
  tertiary: '#6f5d17'
  on-tertiary: '#ffffff'
  tertiary-container: '#c0aa5c'
  on-tertiary-container: '#4c3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4fe'
  on-primary-fixed: '#091747'
  on-primary-fixed-variant: '#384475'
  secondary-fixed: '#d0e4ff'
  secondary-fixed-dim: '#acc9eb'
  on-secondary-fixed: '#001d34'
  on-secondary-fixed-variant: '#2c4965'
  tertiary-fixed: '#fae18e'
  tertiary-fixed-dim: '#ddc575'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#fbf8fd'
  on-background: '#1b1b1f'
  surface-variant: '#e4e1e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The brand personality is anchored in **Friendly Educational Modernism**. It balances the rigor of academic excellence with the warmth of a supportive mentor. The visual language is designed to feel approachable yet authoritative, ensuring users feel both welcome and confident in their learning journey.

The style leverages high-contrast color pairings and expansive whitespace to reduce cognitive load. It draws inspiration from modern minimalist principles but softens them with organic, oversized radii and a playful, sun-drenched palette. The result is a UI that feels "light," professional, and deeply human.

## Colors
The palette is built on a foundation of **Dark Navy (#1E2A5A)**, providing the necessary weight for typography and structural elements. This is complemented by **Pale Blue (#A9C6E8)** for supportive backgrounds and **Butter Yellow (#F7DE8B)** for high-energy highlights and interactive triggers.

The interface is strictly light-mode, utilizing **Pure White (#FFFFFF)** as the primary canvas to maintain a "clean-slate" educational feel. Neutral tones are derived from the primary navy to ensure harmonic consistency across text and borders, avoiding flat blacks or greys.

## Typography
Plus Jakarta Sans is the sole typeface for this design system, chosen for its contemporary geometric construction and high legibility. The type hierarchy emphasizes clarity; large, bold headlines in Dark Navy provide immediate orientation, while generous line heights in body text ensure comfortable reading during long-form educational content.

Uppercase labels with slight letter spacing are used for metadata and categorization to provide visual distinction without adding unnecessary weight. Mobile typography shifts to more compact sizes while maintaining the same weight ratios to preserve the brand’s "bold" personality on smaller screens.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is strictly based on an 8px scale to maintain mathematical harmony.

To achieve the "Friendly Modern" feel, margins are intentionally oversized, creating a protective "frame" around content. Layouts should prioritize vertical flow with significant padding (minimum 64px) between major sections to prevent the interface from feeling cluttered or overwhelming. Components should utilize internal padding of 24px to 32px to complement the large corner radii.

## Elevation & Depth
Depth is achieved through **Ambient Shadows** rather than traditional stacks. Surfaces use very soft, high-blur shadows with a subtle tint of Dark Navy (e.g., #1E2A5A at 8% opacity) to feel integrated with the environment.

*   **Level 0:** Base white surface.
*   **Level 1 (Cards/Inputs):** Subtle 1px border (#A9C6E8 at 30%) or a very faint 4px blur shadow.
*   **Level 2 (Modals/Hover):** 24px blur, 12px Y-offset shadow to simulate significant lift.
*   **Level 3 (Floating Actions):** 40px blur, 20px Y-offset for elements that sit above the primary navigation.

Avoid using grey borders; instead, use Pale Blue tints to define boundaries, maintaining the "clean" aesthetic.

## Shapes
The shape language is defined by **hyper-rounded corners (32px / 2rem)**. This "rounded-3xl" approach is applied consistently to cards, primary buttons, and input fields to evoke a sense of playfulness and safety.

Buttons and small chips often use a full pill-shape (9999px) to contrast with the large radii of container elements. For secondary decorative elements, circles and soft blobs are encouraged to echo the organic shapes found in the logo.

## Components

### Buttons
Primary buttons are styled in **Dark Navy** with White text for maximum contrast, or **Butter Yellow** with Dark Navy text for primary calls-to-action (CTAs). They feature a minimum height of 56px and a 32px corner radius. Secondary buttons use a Pale Blue background with Dark Navy text.

### Cards
Cards are the primary content vessel. They must be Pure White with a 32px radius and a Level 1 shadow. Headers within cards should be separated by whitespace rather than lines to maintain a "breathable" feel.

### Input Fields
Fields use a 16px radius and a light Pale Blue fill (#A9C6E8 at 10%) when inactive. On focus, the border transitions to a 2px solid Dark Navy. Labels always sit above the field in Label-MD styling.

### Chips & Badges
Small, pill-shaped indicators used for categories. They should use Pale Blue backgrounds with Dark Navy text, or Butter Yellow backgrounds to signify "New" or "Active" states.

### Navigation
The navigation bar should be clear, using whitespace to separate items. Active links are indicated by a Butter Yellow underline or a small circle below the text, echoing the "dot" in the conversation bubble of the logo.