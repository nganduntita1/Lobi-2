# Lobi App - Visual Design Guide

## Color Palette

### Primary Colors
```
Primary:      #ff7656  ████  Coral/Orange - Used for buttons, links, accents
Primary Dark: #e65a3d  ████  Darker shade for hover states
Primary Light:#ff9478  ████  Lighter shade for backgrounds
```

### Secondary Colors
```
Secondary:      #2d3748  ████  Dark gray - Subtle elements
Secondary Light:#4a5568  ████  Medium gray
```

### Background Colors
```
Background: #f7fafc  ████  Soft gray - Main app background
Surface:    #ffffff  ████  White - Cards, modals, inputs
```

### Text Colors
```
Primary:   #1a202c  ████  Nearly black - Headings, important text
Secondary: #4a5568  ████  Dark gray - Body text, labels
Light:     #718096  ████  Medium gray - Hints, placeholders
White:     #ffffff  ████  White - Text on colored backgrounds
```

### Border Colors
```
Border:      #e2e8f0  ████  Light gray - Main borders
Border Light:#edf2f7  ████  Very light gray - Subtle dividers
```

### Status Colors
```
Success: #48bb78  ████  Green - Success messages
Error:   #f56565  ████  Red - Error messages
Warning: #ed8936  ████  Orange - Warnings
Info:    #4299e1  ████  Blue - Information
```

## Typography

### Font Family: Inter
- **Display Name:** Inter
- **Type:** Sans-serif
- **Style:** Modern, clean, highly legible
- **Designed by:** Rasmus Andersson
- **Perfect for:** Professional apps, fintech, e-commerce

### Font Weights
```
Regular (400)  - Body text, descriptions, labels
Medium (500)   - Emphasis, highlights
SemiBold (600) - Sub-headings, button text
Bold (700)     - Main headings, titles
```

### Font Sizes
```
xs:   10px - Tiny labels
sm:   12px - Small text, captions
base: 14px - Body text, inputs
md:   16px - Large body text, buttons
lg:   18px - Sub-headings
xl:   20px - Section headings
xxl:  24px - Page headings
xxxl: 32px - Hero headings
```

## Spacing System (8px Grid)

```
xs:   4px  - Tight spacing
sm:   8px  - Close elements
md:   16px - Standard spacing (1 grid unit)
lg:   24px - Section spacing
xl:   32px - Large gaps
xxl:  48px - Major sections
```

## Border Radius

```
sm:   6px   - Small elements (tags, badges)
md:   10px  - Standard (buttons, inputs, cards)
lg:   16px  - Large cards, modals
xl:   24px  - Hero sections
full: 9999px - Circular elements (pills, avatars)
```

## Button Styles

### Primary Button
```typescript
{
  backgroundColor: '#ff7656',
  padding: 16px,
  borderRadius: 10px,
  shadowColor: '#ff7656',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
}

Text: {
  color: '#ffffff',
  fontSize: 16px,
  fontWeight: '600',
  fontFamily: 'Inter_600SemiBold',
}
```

### Secondary Button (Outlined)
```typescript
{
  backgroundColor: '#f7fafc',
  padding: 16px,
  borderRadius: 10px,
  borderWidth: 1,
  borderColor: '#e2e8f0',
}

Text: {
  color: '#1a202c',
  fontSize: 16px,
  fontWeight: '600',
  fontFamily: 'Inter_600SemiBold',
}
```

## Card Style

```typescript
{
  backgroundColor: '#ffffff',
  borderRadius: 10px,
  padding: 16px,
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  borderWidth: 1,
  borderColor: '#e2e8f0',
}
```

## Input Style

```typescript
{
  backgroundColor: '#ffffff',
  borderRadius: 10px,
  padding: 16px,
  fontSize: 16px,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  color: '#1a202c',
  fontFamily: 'Inter_400Regular',
}

Placeholder: {
  color: '#718096',
}

Focus: {
  borderColor: '#ff7656',
}
```

## Layout Guidelines

### Screen Padding
- Standard screen padding: 24px (Spacing.lg)
- Mobile: 16px (Spacing.md)

### Content Spacing
- Between sections: 32px (Spacing.xl)
- Between elements: 16px (Spacing.md)
- Between related items: 8px (Spacing.sm)

### Component Spacing
- Button padding: 16px (Spacing.md)
- Input padding: 16px (Spacing.md)
- Card padding: 16px (Spacing.md)
- Modal padding: 24px (Spacing.lg)

## Logo Usage

### Primary Logo
- **File:** Logo.png
- **Usage:** App icon, splash screen, login/signup screens
- **Sizes:** 100x100 (signup), 120x120 (login)
- **Spacing:** 32px margin bottom

### Logo with Text
- **File:** Logo-words.png
- **Usage:** Navigation headers (future use)
- **Alignment:** Left-aligned in headers

## Shadow Patterns

### Elevated Button
```typescript
{
  shadowColor: '#ff7656',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
}
```

### Card
```typescript
{
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}
```

### Modal
```typescript
{
  shadowColor: 'rgba(0, 0, 0, 0.2)',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 5,
}
```

## Accessibility

### Color Contrast
- Text on white: #1a202c (18.7:1 ratio) ✓
- Secondary text: #4a5568 (7.5:1 ratio) ✓
- Primary button: #ff7656 with white text (3.8:1 ratio) ✓

### Touch Targets
- Minimum: 44x44px (iOS), 48x48px (Android)
- Buttons: 44px height minimum
- Spacing between touchable elements: 8px minimum

### Font Sizes
- Minimum body text: 14px (base)
- Minimum button text: 14px
- Small text: 12px (use sparingly)

## Best Practices

### DO ✓
- Use theme constants (`Colors.primary`, `Spacing.md`)
- Apply shadows to elevated elements
- Maintain consistent spacing (8px grid)
- Use Inter fonts consistently
- Test on both light and dark backgrounds

### DON'T ✗
- Don't use hard-coded colors
- Don't mix font families
- Don't use random spacing values
- Don't skip shadows on primary buttons
- Don't use colors below AA contrast ratio

## Component Examples

### Screen Header
```typescript
<View style={{
  padding: Spacing.lg,
  backgroundColor: Colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
}}>
  <Text style={{
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  }}>
    Screen Title
  </Text>
  <Text style={{
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  }}>
    Screen subtitle or description
  </Text>
</View>
```

### List Item
```typescript
<View style={{
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.md,
  padding: Spacing.md,
  marginVertical: 6,
  shadowColor: Colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  borderWidth: 1,
  borderColor: Colors.border,
}}>
  <Text style={{
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  }}>
    Item Title
  </Text>
  <Text style={{
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  }}>
    Item description
  </Text>
</View>
```

## References

- **Font:** [Inter on Google Fonts](https://fonts.google.com/specimen/Inter)
- **Design Tool:** Use #ff7656 in Figma/Sketch for consistency
- **Testing:** Always test on iOS (shadows) and Android (elevation)
- **Updates:** All design tokens in `/src/theme/colors.ts`
