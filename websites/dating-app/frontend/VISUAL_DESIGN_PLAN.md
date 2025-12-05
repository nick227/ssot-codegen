# Visual Design Plan - Dating App

**Focus**: Component Reuse, Page Functionality, Visual Hierarchy

---

## 🎯 Design Principles

- **Mobile-First**: Touch targets 44px+, safe areas, bottom navigation
- **Compatibility-First**: Scores prominent, dimensions visible, priorities discoverable
- **Data-Driven**: Color-coded scores, visual weight indicators, progress feedback

---

## 📱 Pages & Component Usage

### Discovery Page
**Function**: Swipe through profiles, view compatibility, adjust priorities

**Components**:
- `CardStack` → `Card` (variant: discovery, swipe mode)
- `ListView` → `Card` (variant: discovery, list mode)
- `ViewToggle` (swipe/list)
- `FilterPanel` (age, distance, gender, priority tweaks)
- `CompatibilityBadge` (on Card)
- `BadgeGroup` (on Card)
- `InfoPanel` (variant: micro-modal, on card tap)

**Visual**: Card stack (3-5 visible), compatibility badge top-right, badge group below photo, swipe gestures with button alternatives

---

### Matches Page
**Function**: View matches sorted by compatibility, see last messages

**Components**:
- `ListView` → `Card` (variant: match)
- `CompatibilityBadge` (on Card)
- `TextPreview` (last message text)

**Visual**: List of match cards, compatibility badge top-right, last message preview, unread badges

---

### Messages Page
**Function**: View conversations, send messages, track behavior

**Components**:
- `ListView` → `Card` (variant: thread)
- `MessageThread` → `Bubble` (variant: sent/received)
- `Input` (variant: message, with event tracking)
- `Button` (variant: send)

**Visual**: Thread list with avatars, conversation view with sent/received bubbles, fixed input at bottom

---

### Profile Page (Self)
**Function**: Edit profile, view dimensions, adjust priorities, complete quizzes

**Components**:
- `MediaLoader` (photo carousel)
- `Card` (variant: dimension, grid layout)
- `Slider` (variant: priority editor)
- `ButtonGroup` (tabs: About, Photos, Quizzes, Dimensions)
- `InfoCard` (variant: quiz nudge)

**Visual**: Photo carousel top, dimension cards grid (2 columns), priority sliders, quiz nudges

---

### Profile Page (Other User)
**Function**: View profile, see compatibility breakdown, like/dislike

**Components**:
- `MediaLoader` (photo carousel)
- `CompatibilityBadge` (variant: large, overlay on photo)
- `InfoPanel` (variant: match explanation, top 3 dimensions)
- `CompatibilityBreakdown` (variant: detailed, expandable)
- `Button` (variant: like/dislike)

**Visual**: Compatibility badge overlay on photo, "Why Match?" panel, full breakdown expandable, action buttons fixed bottom

---

### Quiz Page
**Function**: Take quizzes, view results, track completion

**Components**:
- `Input` (variant: quiz question, type registry: multiple choice, Likert, slider, ranking, text, matrix)
- `Card` (variant: quiz result)
- `ProgressBar`
- `Button` (variant: previous/next/submit)

**Visual**: Question with progress bar, answer options (type-specific), results with dimension breakdown

---

## 🎨 Component Visual Specs

### Card
**Variants**: Discovery (swipe stack), Match (matches list), Thread (message threads), Dimension (profile grid), Result (quiz results)
**Common Elements**: Photo/image area, title/text, actions, badges
**States**: Default, Hover/Tap, Swipe Left (red overlay), Swipe Right (green overlay)
**Usage**: Primary container component, used across all pages

### CompatibilityBadge
**Variants**: Small (24px), Medium (32px), Large (48px)
**States**: High (80-100, green), Medium (50-79, yellow), Low (<50, red)
**Usage**: Top-right corner on cards, overlay on profile photos
**Note**: Special case - compatibility-specific component

### CompatibilityBreakdown
**Variants**: Compact (horizontal scores), Detailed (vertical with bars), Explanatory (full with explanations)
**Elements**: Overall score, dimension rows with score bars, weight indicators, explanations
**Usage**: Modals, profile views, quiz results
**Note**: Special case - compatibility-specific component

### MediaLoader
**Variants**: Carousel (swipeable photos), Gallery (grid), Single (one image)
**Features**: Lazy loading, preload next/prev, thumbnail support, loading states
**Usage**: Profile photos, photo galleries, image displays

### Input
**Variants**: Filter (search/filter inputs), Message (message composer), Form (profile forms), Quiz (question types)
**Question Types**: Multiple choice, Likert scale, Slider, Ranking, Text input, Matrix
**Features**: Validation, character count, placeholder, disabled states
**Usage**: Forms, filters, message input, quiz questions

### Button
**Variants**: Primary (like actions), Secondary (dislike), Send (message send), Action (general actions), Nav (previous/next)
**States**: Default, Hover, Active, Disabled, Loading
**Sizes**: Small, Medium, Large
**Usage**: Actions, navigation, form submission

### BadgeGroup
**Variants**: Horizontal (max 3 visible, scrollable), Vertical (sidebars)
**Design**: Rounded pills, category colors (profile=blue, quiz=purple, behavior=orange, system=gray)
**Usage**: Display dimension badges, category indicators

### Slider
**Variants**: Full (vertical list, all dimensions), Quick (horizontal scroll, 3-4 key), Quiz (question type)
**Design**: Horizontal, touch-friendly, value display, range 0.0-10.0 (priorities) or configurable (quiz)
**Usage**: Dimension priorities, quiz questions, filters

### InfoPanel
**Variants**: Micro-modal (40% width, top 3 dimensions), Panel (full width, detailed breakdown)
**Content**: Top dimensions, distance, quiz overlap, expandable breakdown
**Usage**: "Why Match?" explanations, information overlays

### CardStack
**Visual**: 3-5 cards visible, 8px offset depth, swipe animation with rotation, 30% threshold
**Feedback**: Color overlay (green/red), action text, haptic feedback
**Usage**: Discovery swipe interface

### Bubble
**Variants**: Sent (right-aligned, primary color), Received (left-aligned, gray)
**Elements**: Content, timestamp, read receipt
**Usage**: Message threads

### ListView
**Features**: Virtualization for long lists, scrollable, empty states
**Usage**: Match lists, message threads, discovery list mode

### ViewToggle
**Options**: Swipe/List modes
**Visual**: Toggle buttons, active state indicator
**Usage**: Discovery page view switching

### FilterPanel
**Sections**: Age range, Distance, Gender, Quick Priority Tweaks
**Visual**: Bottom sheet modal (mobile), sliders with labels, active filters as badges
**Usage**: Discovery filters

### MessageThread
**Features**: Real-time updates, scroll to bottom, message grouping
**Usage**: Conversation view

### ProgressBar
**Variants**: Quiz progress, Upload progress, Action progress
**Visual**: Horizontal bar, percentage text
**Usage**: Quiz progress, loading states

### ButtonGroup
**Variants**: Tabs (horizontal, scrollable), Actions (button group)
**Visual**: Active state (underlined or filled background)
**Usage**: Tab navigation, action groups

### InfoCard
**Variants**: Quiz nudge, Empty state, Info message
**Visual**: Card with icon, message, CTA button
**Usage**: Quiz suggestions, empty states, informational messages

---
