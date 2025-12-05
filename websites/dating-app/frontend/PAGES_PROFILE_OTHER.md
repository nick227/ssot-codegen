# Profile Page (Other User)

**Route**: `/profile/:userId`  
**Function**: View profile, see compatibility breakdown, like/dislike

---

## Components

### Primary
- `MediaLoader` (variant: carousel) - Photo carousel
- `CompatibilityBadge` (variant: large) - Large badge overlay on photo
- `InfoPanel` (variant: panel) - "Why Match?" explanation panel
- `CompatibilityBreakdown` (variant: detailed) - Full compatibility breakdown
- `Button` (variant: like/dislike) - Action buttons

### Special
- `BadgeGroup` - Dimension badges
- `Card` - Profile info sections

---

## Layout

```
┌─────────────────────────────┐
│ Header: [Back] Name         │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Photo Carousel          │ │
│ │ Name, Age, Distance     │ │
│ │ [Compatibility] 85%     │ │
│ └─────────────────────────┘ │
│                             │
│ Why This Match?             │
│ ┌─────────────────────────┐ │
│ ┌─────────────────────────┐ │
│ │ Top 3 Dimensions        │ │
│ │ Distance: 5km            │ │
│ │ Shared Quizzes: 2        │ │
│ └─────────────────────────┘ │
│                             │
│ Compatibility Breakdown     │
│ ┌─────────────────────────┐ │
│ │ Overall: 85%            │ │
│ │ [Dimension] 90%         │ │
│ │ [Dimension] 80%         │ │
│ └─────────────────────────┘ │
│                             │
│ About                       │
│ Bio text...                 │
│                             │
│ [Like] [Dislike]           │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

---

## Visual Behavior

### Profile Header
- **Photo Carousel**: Full-width, swipeable
- **Compatibility Badge**: Large size, top-right overlay on photo
- **Basic Info**: Name large, age/distance smaller, below photo

### Why This Match Panel
- **Layout**: Card with icon, top 3 dimensions listed
- **Visual**: Dimension names with scores, color-coded
- **Additional Info**: Distance bucket, shared quiz count
- **Expandable**: Tap to see full breakdown

### Compatibility Breakdown
- **Layout**: Expandable section
- **Overall Score**: Large number, color-coded, centered
- **Dimension List**: Each dimension with score bar, weight indicator, explanation text
- **Visual**: Progress bars, color gradients, category icons

### Action Buttons
- **Layout**: Fixed bottom bar (above safe area)
- **Buttons**: Like (primary, left), Dislike (secondary, right)
- **Visual Feedback**: Button press animation, success state

---

## Data Flow

- **Hook**: `useProfileSummary(userId)`, `useCompatibility(userId, otherUserId)` - Server-computed
- **Event Tracking**: `useEmitBehaviorEvent()` - profile_view on mount
- **Actions**: Like/dislike emit `profile_like`/`profile_dislike` events

---

## User Interactions

1. **Tap Like** → Emit `profile_like` event, navigate to Messages if match
2. **Tap Dislike** → Emit `profile_dislike` event, navigate back
3. **Swipe Photo Carousel** → Navigate through photos
4. **Tap "Why Match?" Panel** → Expand to see full breakdown
5. **Tap Compatibility Breakdown** → Expand/collapse detailed view
6. **Tap Back** → Navigate back to previous page

---

**See COMPONENTS.md for component specifications.**

