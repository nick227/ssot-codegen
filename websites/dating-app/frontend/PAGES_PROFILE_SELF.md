# Profile Page (Self)

**Route**: `/profile`  
**Function**: Edit profile, view dimensions, adjust priorities, complete quizzes

---

## Components

### Primary
- `MediaLoader` (variant: carousel) - Photo carousel
- `Card` (variant: dimension) - Dimension cards in grid
- `Slider` (variant: priority) - Priority weight sliders
- `ButtonGroup` (variant: tabs) - Tab navigation
- `Input` (variant: form) - Profile form inputs
- `Button` (variant: action) - Edit, save actions

### Special
- `InfoCard` (variant: quiz nudge) - Quiz suggestion card
- `CompatibilityBreakdown` - Your compatibility overview (optional)

---

## Layout

```
┌─────────────────────────────┐
│ Header: "Your Profile"      │
│ [Edit]                      │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Photo Carousel          │ │
│ │ Name, Age, Location     │ │
│ └─────────────────────────┘ │
│                             │
│ Your Dimensions             │
│ ┌─────────────────────────┐ │
│ │ [Dimension] Score       │ │
│ │ [Dimension] Score        │ │
│ └─────────────────────────┘ │
│                             │
│ Dimension Priorities        │
│ ┌─────────────────────────┐ │
│ │ [Slider] Dimension Name │ │
│ │ [Slider] Dimension Name │ │
│ └─────────────────────────┘ │
│                             │
│ [About] [Photos] [Quizzes] │
│                             │
│ About Section               │
│ Bio text...                 │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

---

## Visual Behavior

### Profile Header
- **Photo Carousel**: Full-width, swipeable, dots indicator
- **Basic Info**: Overlay on photo or below, name large, age/location smaller
- **Edit Button**: Top-right, icon button

### Your Dimensions Panel
- **Always Visible**: Sticky section below header
- **Layout**: Grid of dimension cards (2 columns)
- **Card**: Dimension name, score (0-100), progress bar, category badge
- **Visual**: Color-coded by score (green/yellow/red)

### Dimension Priority Editor
- **Layout**: Vertical list of sliders
- **Slider**: Dimension name left, slider right, value display
- **Range**: 0.0 to 10.0, default 1.0
- **Visual Feedback**: Real-time value update, "Saving..." indicator
- **Note**: "Changes affect your discovery feed"

### Tab Navigation
- **Tabs**: About, Photos, Quizzes, Dimensions
- **Layout**: Button group, horizontal scroll if needed
- **Active Tab**: Underlined or filled background

### Quiz Nudge
- **Placement**: Below dimensions panel or in Quizzes tab
- **Visual**: Card with icon, message, CTA button
- **Message**: "Improve matches by answering 3 more questions"
- **Action**: Navigate to Quiz Page

---

## Data Flow

- **Hook**: `useProfileSummary(userId)`, `useUserDimensions(userId)`, `useDimensionPriorities(userId)`
- **Update Hook**: `useUpdateDimensionPriority(dimensionId, weight)` - Invalidates discovery/compatibility queries
- **Event Tracking**: Priority changes trigger server recomputation
- **Optimistic Updates**: Update priority on server, invalidate queries, UI displays new results

---

## User Interactions

1. **Tap Edit** → Enter edit mode, show form inputs
2. **Adjust Priority Slider** → Update priority, trigger server recomputation
3. **Tap Tab** → Switch between About, Photos, Quizzes, Dimensions
4. **Tap Quiz Nudge** → Navigate to Quiz Page
5. **Swipe Photo Carousel** → Navigate through photos
6. **Tap Dimension Card** → View dimension details (optional)

---

**See COMPONENTS.md for component specifications.**

