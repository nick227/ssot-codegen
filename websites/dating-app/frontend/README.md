# Dating App Frontend

Mobile-first React + Vite frontend for the dating app.

## 🎨 Mobile-First Design

This frontend is built with mobile design patterns:
- **Touch-friendly**: Minimum 44px tap targets
- **Safe areas**: Support for notched devices
- **Bottom navigation**: Easy thumb access
- **Smooth scrolling**: Optimized for mobile
- **Responsive**: Works on all screen sizes

## 🚀 Getting Started

### Install Dependencies
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```

Runs on `http://localhost:3001`

### Build
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

## 📱 Mobile Features

### Layout Components
- `MobileLayout` - Main app layout with header and bottom nav
- `MobileHeader` - Sticky header with safe area support
- `BottomNavigation` - Fixed bottom navigation bar

### Design Patterns
- **Card Stack**: Swipeable cards for discovery
- **Bottom Sheet**: Modal dialogs from bottom
- **Pull to Refresh**: Refresh content
- **Infinite Scroll**: Load more content

## 🔌 API Integration

The frontend uses the generated SDK from the backend:

```typescript
import { quickSDK } from '../src/sdk/quick-start'

const api = quickSDK('http://localhost:3000')
const users = await api.user.list()
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── index.html           # HTML template
```

## 🎯 Next Steps

1. Integrate SDK for API calls
2. Build discovery card stack component
3. Add swipe gestures
4. Implement match cards
5. Build chat interface
6. Add profile editing

