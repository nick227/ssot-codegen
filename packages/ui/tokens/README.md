# @ssot-ui/tokens

> Design tokens for SSOT UI - Single source of truth for all platforms

[![Version](https://img.shields.io/npm/v/@ssot-ui/tokens.svg)](https://www.npmjs.com/package/@ssot-ui/tokens)
[![License](https://img.shields.io/npm/l/@ssot-ui/tokens.svg)](https://github.com/yourusername/ssot-codegen/blob/main/LICENSE)

## 🎯 Purpose

Provides a **single source of truth** for design tokens that compiles to:
- **Tailwind CSS** configuration (web)
- **React Native** tokens (mobile)

**Identical token names** across all platforms ensure consistent theming.

---

## 📦 Installation

```bash
npm install @ssot-ui/tokens
# or
pnpm add @ssot-ui/tokens
# or
yarn add @ssot-ui/tokens
```

---

## 🚀 Usage

### Web (Tailwind CSS)

```javascript
// tailwind.config.js
const ssoTokens = require('@ssot-ui/tokens/tailwind')

module.exports = {
  ...ssoTokens,
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // Add your customizations
  theme: {
    extend: {
      ...ssoTokens.theme.extend,
      colors: {
        ...ssoTokens.theme.extend.colors,
        // Add custom colors
        brand: '#FF6B6B'
      }
    }
  }
}
```

**Use in components**:
```tsx
<div className="bg-primary text-white p-4 rounded-md shadow-md">
  Uses SSOT tokens
</div>
```

---

### React Native

```typescript
import { tokens } from '@ssot-ui/tokens/react-native'

export function MyComponent() {
  return (
    <View style={{
      backgroundColor: tokens.colors.primary.DEFAULT,
      padding: tokens.spacing[4],
      borderRadius: tokens.borderRadius.md
    }}>
      <Text style={{
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium
      }}>
        Uses SSOT tokens
      </Text>
    </View>
  )
}
```

---

### TypeScript (Type-safe access)

```typescript
import { tokens } from '@ssot-ui/tokens'
import type { TokenSet } from '@ssot-ui/tokens'

// Full type safety
const primaryColor: string = tokens.colors.primary.DEFAULT
const spacing: number = tokens.spacing[4]
```

---

## 🎨 Available Tokens

### Colors
- **Semantic**: `primary`, `secondary`, `success`, `warning`, `error`
- **Neutral**: `neutral` (50-950 scale)
- **System**: `background`, `foreground`, `border`, `ring`
- **Each has**: Scales (50-950), DEFAULT, hover, active

### Spacing
- Scale: `0`, `px`, `0.5` through `96`
- Web: Converted to rem (16px base)
- Mobile: Pixel values

### Typography
- **Font families**: `sans`, `mono`
- **Sizes**: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`
- **Weights**: `normal`, `medium`, `semibold`, `bold`, `extrabold`
- **Line heights**: `none`, `tight`, `snug`, `normal`, `relaxed`, `loose`

### Border Radius
- Values: `none`, `sm`, `md` (DEFAULT), `lg`, `xl`, `2xl`, `3xl`, `full`

### Shadows
- Values: `sm`, `DEFAULT`, `md`, `lg`, `xl`, `2xl`, `inner`, `none`

### Z-Index
- Layers: `base`, `dropdown`, `sticky`, `modal`, `popover`, `tooltip`, `toast`, `max`

### Opacity
- Scale: `0`, `5`, `10`, `20`, `25`, `30`, `40`, `50`, `60`, `70`, `75`, `80`, `90`, `95`, `100`

### Breakpoints
- Sizes: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)

### Transitions
- Durations: `fast`, `base`, `slow`, `slower`

---

## 🔧 Customization

### Extend tokens in your project

```javascript
// tailwind.config.js
const ssoTokens = require('@ssot-ui/tokens/tailwind')

module.exports = {
  theme: {
    extend: {
      ...ssoTokens.theme.extend,
      // Add your custom tokens
      colors: {
        ...ssoTokens.theme.extend.colors,
        brand: {
          DEFAULT: '#FF6B6B',
          hover: '#FF5252'
        }
      },
      spacing: {
        ...ssoTokens.theme.extend.spacing,
        '128': '32rem'
      }
    }
  }
}
```

---

## ✅ Token Consistency

This package ensures **identical token names** across platforms:

```typescript
// Tailwind (web)
<div className="p-4 bg-primary">

// React Native (mobile)
<View style={{
  padding: tokens.spacing[4],        // Same name!
  backgroundColor: tokens.colors.primary.DEFAULT
}}>
```

**Consistency is validated** during build to prevent drift.

---

## 🏗️ Development

```bash
# Build tokens
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## 📖 API Reference

### `tokens`
The raw token object from `tokens.json`

### `compileTailwindConfig(tokens: TokenSet): TailwindConfig`
Compile tokens to Tailwind configuration

### `compileReactNativeTokens(tokens: TokenSet): ReactNativeTokens`
Compile tokens to React Native format

### `validateTokenConsistency(tokens: TokenSet): ValidationResult`
Validate token consistency across platforms

---

## 🔒 Version: 1.0.0 (Locked)

This is a **locked contract**. Breaking changes require major version bump.

Token names are API surface - treat as public contract.

---

## 📜 License

MIT © SSOT CodeGen

Generated code using these tokens belongs to the user with no restrictions.

