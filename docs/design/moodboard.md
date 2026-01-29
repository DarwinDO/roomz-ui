# Visual Identity & Moodboard: "Trustworthy & Cozy"

## Design Philosophy
Move away from "Cold Tech" to "Warm Habitat". The interface should feel like walking into a well-lit living room.

## 1. Color Palette

### Primary (Trust & Stability)
- **Name**: `Deep Harbor`
- **Hex**: `#0F4C75` (Navy Blue) or `#1B4965`
- **Usage**: Primary buttons, Headers, Active States.
- **Why**: Navy evokes authority and stability without the aggression of bright blue.

### Secondary (Cozy & Warm)
- **Name**: `Warm Sand` or `Clay`
- **Hex**: `#D8A48F` (Soft Terracotta) or `#F4EBD0` (Beige/Cream) for backgrounds.
- **Accent**: `#EBB02D` (Goldenrod) for "Highlights" or "Superhost" status.
- **Why**: Earth tones create the "cozy" feeling.

### Neutral
- **Background**: `#FAFAF9` (Warm Gray/Stone) instead of pure `#FFFFFF`.
- **Text**: `#2D3748` (Soft Black) instead of `#000000`.

## 2. Typography
- **Headings**: `Merriweather` or `Lora` (Serif) -> Adds character, warmth, and "editorial" trust.
- **Body**: `Inter` or `Nunito` (Rounded Sans) -> High readability, friendly.
- **Alternative**: Stick to `Poppins` but use lighter weights for a cleaner look, paired with a Serif for titles.

## 3. Shape & Space
- **Border Radius**: `1rem` (16px) for cards, `0.75rem` (12px) for buttons. Soft, friendly curves.
- **Shadows**: Large, diffuse shadows (`box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08)`) rather than sharp, dark shadows.
- **Spacing**: Generous padding (whitespace = luxury/calm).

## 4. Components Strategy
- **Buttons**: Pill-shaped or soft-rounded.
- **Inputs**: Light gray backgrounds (`#F3F4F6`) with bottom border focus, or soft ring.
- **Cards**: "Elevated" style. Image takes up 60% of card height.

## 5. UI Kit Update Plan
We need to update `tailwind.config.js` and `index.css` to reflect these tokens.

### Proposed CSS Variables
```css
:root {
  --primary: 205 70% 30%; /* Deep Harbor */
  --secondary: 25 50% 70%; /* Warm Sand */
  --background: 40 10% 98%; /* Warm Off-white */
  --radius: 1rem;
}
```
