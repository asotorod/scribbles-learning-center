# Scribbles Learning Center - Design System

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Fern** | `#768E78` | rgb(118, 142, 120) | Primary buttons, headers, nav links |
| **Pistachio** | `#C6C09C` | rgb(198, 192, 156) | Secondary accents, borders |
| **Fennel** | `#EBDEC0` | rgb(235, 222, 192) | Card backgrounds, sections |

### Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Peony** | `#E79897` | rgb(231, 152, 151) | Highlights, infant program |
| **Peach** | `#FCAC83` | rgb(252, 172, 131) | CTA buttons, notifications |
| **Honey** | `#FCC88A` | rgb(252, 200, 138) | Alerts, preschool program |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Cream White** | `#FAF8F5` | rgb(250, 248, 245) | Page background |
| **Soft Beige** | `#E8E0D0` | rgb(232, 224, 208) | Alternate sections |
| **Warm Brown** | `#B8906C` | rgb(184, 144, 108) | Footer, text accents |
| **Charcoal** | `#3D3D3D` | rgb(61, 61, 61) | Body text |

---

## CSS Variables

```css
:root {
  /* Primary */
  --color-fern: #768E78;
  --color-pistachio: #C6C09C;
  --color-fennel: #EBDEC0;
  
  /* Accents */
  --color-peony: #E79897;
  --color-peach: #FCAC83;
  --color-honey: #FCC88A;
  
  /* Neutrals */
  --color-cream: #FAF8F5;
  --color-beige: #E8E0D0;
  --color-brown: #B8906C;
  --color-charcoal: #3D3D3D;
  
  /* Semantic */
  --color-primary: var(--color-fern);
  --color-secondary: var(--color-pistachio);
  --color-background: var(--color-cream);
  --color-text: var(--color-charcoal);
  --color-text-light: #6B6B6B;
  --color-cta: var(--color-peach);
  --color-success: #768E78;
  --color-warning: var(--color-honey);
  --color-error: #D9534F;
}
```

---

## Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        fern: '#768E78',
        pistachio: '#C6C09C',
        fennel: '#EBDEC0',
        peony: '#E79897',
        peach: '#FCAC83',
        honey: '#FCC88A',
        cream: '#FAF8F5',
        beige: '#E8E0D0',
        brown: '#B8906C',
        charcoal: '#3D3D3D',
      }
    }
  }
}
```

---

## Program Colors

Each program has an assigned color for visual distinction:

| Program | Color | Hex |
|---------|-------|-----|
| Infant Care | Peony (pink) | `#E79897` |
| Toddler | Pistachio (light green) | `#C6C09C` |
| Preschool | Honey (yellow) | `#FCC88A` |
| Summer Camp | Fern (green) | `#768E78` |

---

## Component Examples

### Buttons

```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-fern);
  color: white;
}
.btn-primary:hover {
  background-color: #658067; /* darker fern */
}

/* CTA Button */
.btn-cta {
  background-color: var(--color-peach);
  color: var(--color-charcoal);
}

/* Secondary Button */
.btn-secondary {
  background-color: transparent;
  border: 2px solid var(--color-fern);
  color: var(--color-fern);
}
```

### Cards

```css
.card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-featured {
  background-color: var(--color-fennel);
}
```

---

## Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| H1 | Poppins | 48px | 700 | Charcoal |
| H2 | Poppins | 36px | 600 | Charcoal |
| H3 | Poppins | 24px | 600 | Charcoal |
| Body | Open Sans | 16px | 400 | Charcoal |
| Small | Open Sans | 14px | 400 | #6B6B6B |

---

## Spacing

Use 8px base unit:
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px

---

## Border Radius

- `sm`: 4px
- `md`: 8px
- `lg`: 12px
- `xl`: 16px
- `full`: 9999px (pills, avatars)

---

**Last Updated:** January 21, 2026
