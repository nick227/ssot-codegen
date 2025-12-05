# Matches Page

**Route**: `/matches`  
**Function**: View matches sorted by compatibility, see last messages

---

## Components

### Primary
- `ListView` - Scrollable list of matches
- `Card` (variant: match) - Match card with photo, compatibility, message preview

### Special
- `CompatibilityBadge` (medium) - Top-right of card
- `TextPreview` - Last message preview text
- `Badge` (unread) - Unread message count badge

---

## Layout

```
┌─────────────────────────────┐
│ Header: "Your Matches"      │
│ [Sort: Compatibility ▼]     │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [Photo] Name, Age       │ │
│ │ [Compatibility] 85%     │ │
│ │ Last message preview... │ │
│ │ [Unread: 2]             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [Photo] Name, Age       │ │
│ │ [Compatibility] 72%     │ │
│ │ Last message preview... │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

---

## Visual Behavior

### Match List
- **Card Layout**: Photo left (circular avatar), info right, full-width cards
- **Compatibility Badge**: Top-right of card, medium size, color-coded
- **Last Message**: Preview text, truncated, gray color
- **Unread Badge**: Red dot or number badge, top-right
- **Tap Action**: Opens message thread

### Sort Options
- **Dropdown**: Header button, options: Compatibility, Recent, Name
- **Visual Indicator**: Current sort shown with arrow icon
- **Default**: Compatibility (server-sorted)

### Empty State
- **Message**: "No matches yet. Keep swiping!"
- **Visual**: Illustration or icon, centered
- **Action**: Button to go to Discovery

---

## Data Flow

- **Hook**: `useMatches(userId)` - Server-sorted matches
- **Real-time**: Optional WebSocket subscription for new matches
- **Cache**: React Query with 5-minute stale time

---

## User Interactions

1. **Tap Match Card** → Navigate to Messages Page (open thread)
2. **Tap Sort** → Change sort order, refetch matches
3. **Swipe Card** → Quick actions (optional, not primary interaction)

---

**See COMPONENTS.md for component specifications.**

