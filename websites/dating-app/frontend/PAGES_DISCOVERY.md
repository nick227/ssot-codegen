# Discovery Page

**Route**: `/discovery`  
**Function**: Swipe through profiles, view compatibility, adjust priorities

---

## Components

### Primary
- `CardStack` - Swipeable card stack (3-5 cards visible)
- `Card` (variant: discovery) - Profile card with photo, info, compatibility
- `FilterPanel` - Age, distance, gender, priority tweaks

### Special
- `CompatibilityBadge` (small) - Top-right corner on cards
- `BadgeGroup` - Dimension badges below photo (max 3 visible)
- `InfoPanel` (micro-modal) - "Why Match?" explanation on card tap
- `ViewToggle` - Switch between swipe/list modes
- `Button` (like/dislike) - Fixed bottom action buttons

---

## Layout

```
┌─────────────────────────────┐
│ Header: "Discovery"          │
│ [Filters] [View Toggle]     │
├─────────────────────────────┤
│                             │
│   ┌─────────────────┐      │
│   │  Card            │      │
│   │  [Photo]        │      │
│   │  Name, Age      │      │
│   │  [Compatibility]│      │
│   │  [Dimensions]   │      │
│   │  [Why Match?]   │      │
│   └─────────────────┘      │
│                             │
│   [Like] [Dislike]         │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

---

## Visual Behavior

### Swipe Mode (Default)
- **Card Stack**: 3-5 cards visible, top card fully interactive
- **Swipe Animation**: Card follows finger, color overlay (green=like, red=dislike)
- **Threshold**: 30% screen width triggers action
- **Feedback**: Overlay color, action text, haptic feedback

### List Mode (Alternative)
- **Card Grid**: Scrollable list, 1 card per row
- **Card Layout**: Photo left, info right, compatibility badge top-right
- **Quick Actions**: Swipe left (dislike) or right (like) on card

### Filters Panel
- **Trigger**: Button in header, opens bottom sheet modal
- **Layout**: Slide-up from bottom, covers 60% of screen
- **Sections**: Age range, Distance, Gender, Quick Priority Tweaks (3-4 sliders)
- **Visual**: Sliders with labels, active filters shown as badges

### Why Match Micro-Modal
- **Trigger**: Tap "Why Match?" button on card
- **Layout**: Small modal overlay (40% screen width, centered)
- **Content**: Top 3 contributing dimensions, distance bucket, quiz overlap count
- **Visual**: Dimension cards with scores, color-coded, dismissible

---

## Data Flow

- **Hook**: `useDiscoveryFeed(filters, priorities)` - Server-sorted queue
- **Event Tracking**: `useEmitBehaviorEvent()` - profile_view, profile_like, profile_dislike
- **Optimistic Updates**: Remove card from stack immediately, sync with server

---

## User Interactions

1. **Swipe Right** → Like action, emit `profile_like` event
2. **Swipe Left** → Dislike action, emit `profile_dislike` event
3. **Tap Card** → Navigate to Profile Page (Other User)
4. **Tap "Why Match?"** → Open InfoPanel micro-modal
5. **Tap Filters** → Open FilterPanel bottom sheet
6. **Adjust Priorities** → Invalidate discovery query, trigger server recomputation

---

**See COMPONENTS.md for component specifications.**

