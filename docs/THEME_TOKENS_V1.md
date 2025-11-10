# Theme Token System - ssot-tokens@1

## 🎯 Single Source of Truth

**Package**: `@ssot-ui/tokens@1.0.0`  
**Format**: JSON source → Compiles to Tailwind config (web) + JS tokens (RN)  
**Requirement**: Identical token names across all platforms

---

## 📦 Token Categories

### Colors (Semantic + Palette)

```json
{
  "colors": {
    "primary": {
      "50": "#EFF6FF",
      "100": "#DBEAFE",
      "200": "#BFDBFE",
      "300": "#93C5FD",
      "400": "#60A5FA",
      "500": "#3B82F6",
      "600": "#2563EB",
      "700": "#1D4ED8",
      "800": "#1E40AF",
      "900": "#1E3A8A",
      "950": "#172554",
      "DEFAULT": "#3B82F6",
      "hover": "#2563EB",
      "active": "#1D4ED8"
    },
    "secondary": {
      "50": "#F8FAFC",
      "500": "#64748B",
      "900": "#0F172A",
      "DEFAULT": "#64748B",
      "hover": "#475569"
    },
    "success": {
      "DEFAULT": "#10B981",
      "hover": "#059669",
      "light": "#D1FAE5",
      "dark": "#065F46"
    },
    "warning": {
      "DEFAULT": "#F59E0B",
      "hover": "#D97706",
      "light": "#FEF3C7",
      "dark": "#92400E"
    },
    "error": {
      "DEFAULT": "#EF4444",
      "hover": "#DC2626",
      "light": "#FEE2E2",
      "dark": "#991B1B"
    },
    "neutral": {
      "50": "#F9FAFB",
      "100": "#F3F4F6",
      "200": "#E5E7EB",
      "300": "#D1D5DB",
      "400": "#9CA3AF",
      "500": "#6B7280",
      "600": "#4B5563",
      "700": "#374151",
      "800": "#1F2937",
      "900": "#111827",
      "950": "#030712"
    },
    "background": {
      "DEFAULT": "#FFFFFF",
      "muted": "#F9FAFB",
      "dark": "#111827"
    },
    "foreground": {
      "DEFAULT": "#111827",
      "muted": "#6B7280",
      "light": "#FFFFFF"
    },
    "border": {
      "DEFAULT": "#E5E7EB",
      "hover": "#D1D5DB",
      "focus": "#3B82F6"
    }
  }
}
```

---

### Spacing Scale

```json
{
  "spacing": {
    "0": 0,
    "px": 1,
    "0.5": 2,
    "1": 4,
    "1.5": 6,
    "2": 8,
    "2.5": 10,
    "3": 12,
    "3.5": 14,
    "4": 16,
    "5": 20,
    "6": 24,
    "7": 28,
    "8": 32,
    "9": 36,
    "10": 40,
    "11": 44,
    "12": 48,
    "14": 56,
    "16": 64,
    "20": 80,
    "24": 96,
    "28": 112,
    "32": 128,
    "36": 144,
    "40": 160,
    "44": 176,
    "48": 192,
    "52": 208,
    "56": 224,
    "60": 240,
    "64": 256,
    "72": 288,
    "80": 320,
    "96": 384
  }
}
```

---

### Typography

```json
{
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "system-ui", "sans-serif"],
      "mono": ["Fira Code", "monospace"]
    },
    "fontSize": {
      "xs": { "size": "12px", "lineHeight": "16px" },
      "sm": { "size": "14px", "lineHeight": "20px" },
      "base": { "size": "16px", "lineHeight": "24px" },
      "lg": { "size": "18px", "lineHeight": "28px" },
      "xl": { "size": "20px", "lineHeight": "28px" },
      "2xl": { "size": "24px", "lineHeight": "32px" },
      "3xl": { "size": "30px", "lineHeight": "36px" },
      "4xl": { "size": "36px", "lineHeight": "40px" }
    },
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  }
}
```

---

### Border Radius

```json
{
  "borderRadius": {
    "none": "0",
    "sm": "4px",
    "DEFAULT": "8px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "24px",
    "full": "9999px"
  }
}
```

---

### Shadows

```json
{
  "boxShadow": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "none": "none"
  }
}
```

---

### Z-Index Layers

```json
{
  "zIndex": {
    "base": 0,
    "dropdown": 1000,
    "sticky": 1100,
    "modal": 1200,
    "popover": 1300,
    "tooltip": 1400,
    "toast": 1500
  }
}
```

---

## 🌐 Platform Compilation

### Web (Tailwind Config)

```javascript
// tailwind.config.js (generated from tokens.json)
const tokens = require('@ssot-ui/tokens')

module.exports = {
  theme: {
    extend: {
      colors: tokens.colors,
      spacing: tokens.spacing,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      zIndex: tokens.zIndex
    }
  }
}

// Usage in components:
<div className="bg-primary text-white p-4 rounded-md shadow-md">
  {/* Uses token names */}
</div>
```

---

### React Native (JS Tokens)

```typescript
// tokens.ts (generated from tokens.json)
export const tokens = {
  colors: {
    primary: {
      50: '#EFF6FF',
      500: '#3B82F6',
      DEFAULT: '#3B82F6',
      hover: '#2563EB'
      // ... all colors
    }
  },
  spacing: {
    0: 0,
    px: 1,
    1: 4,
    2: 8,
    // ... all spacing (pixel values)
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      // ... all sizes (pixel values)
    },
    fontWeight: {
      normal: '400',
      bold: '700'
    }
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    // ... all radii (pixel values)
  }
}

// Usage in React Native:
import { tokens } from '@ssot-ui/tokens'

<View style={{
  backgroundColor: tokens.colors.primary.DEFAULT,
  padding: tokens.spacing[4],
  borderRadius: tokens.borderRadius.md
}}>
  {/* Uses same token names! */}
</View>
```

---

## 📋 Usage Guidelines

### Naming Rules
- Use semantic names: `primary`, `success`, `error` (not `blue`, `green`, `red`)
- Use scales for grays: `neutral.50` to `neutral.950`
- Use `DEFAULT` for base color, `hover`/`active` for states
- Spacing uses t-shirt sizes AND numeric (both valid)

### Adding Custom Tokens

Users can extend in their project:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ...tokens.colors,
        // Add custom brand color
        brand: {
          DEFAULT: '#FF6B6B',
          hover: '#FF5252'
        }
      }
    }
  }
}
```

### Dark Mode Support

```json
{
  "colors": {
    "background": {
      "light": "#FFFFFF",
      "dark": "#111827"
    },
    "foreground": {
      "light": "#111827",
      "dark": "#F9FAFB"
    }
  }
}
```

Compiled to CSS variables with dark mode variants.

---

## 🔒 Version: 1.0.0 (LOCKED)

Breaking changes require major version bump and migration guide.

Token names are API surface - treat as public contract.

