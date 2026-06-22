# CardVault Design Tokens

This package acts as the single source of truth for all visual primitives in the CardVault mobile app.

## Contents
- **Colors**: Light and dark mode scales (primary, neutral, accent, semantic).
- **Typography**: Complete type scale utilizing the Inter font family.
- **Spacing**: Margins, paddings, and border radii based on a 4pt grid.
- **Motion**: Standardized spring physics and transition durations.
- **Elevation**: Shadow constants and dark mode surface overlays.

## Consumption

Do not import and use hardcoded hex values, pixel amounts, or un-typed magic numbers in components. 
Instead, consume these tokens by wrapping them in a standard theme provider or hook context. A future hook implementation will handle dark/light mode switching and pass these values efficiently into `StyleSheet.create` or styled components.
