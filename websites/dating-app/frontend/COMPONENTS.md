# Components - Dating App

**Overview**: Complete component library with variants, states, and usage patterns.

---

## 🧩 Component List

### Foundation Components
- `Card` - Primary container component
- `Button` - Action buttons
- `Input` - Form inputs and question types
- `MediaLoader` - Image/media loading
- `Badge` - Small indicators
- `BadgeGroup` - Group of badges
- `Slider` - Range inputs
- `ProgressBar` - Progress indicators
- `ButtonGroup` - Group of buttons (tabs, actions)

### Layout Components
- `CardStack` - Swipeable card stack
- `ListView` - Scrollable list container
- `ViewToggle` - View mode switcher
- `FilterPanel` - Filter bottom sheet
- `MessageThread` - Conversation container
- `InfoPanel` - Information overlay/panel
- `InfoCard` - Information card

### Special Components
- `CompatibilityBadge` - Compatibility score badge
- `CompatibilityBreakdown` - Compatibility dimension breakdown
- `Bubble` - Message bubble

---

## 📦 Component Specifications

### Card

**Variants**: Discovery, Match, Thread, Dimension, Result

**Common Elements**:
- Photo/image area
- Title/text content
- Actions (buttons, badges)
- Metadata (time, location, etc.)

**States**: Default, Hover/Tap, Swipe Left (red overlay), Swipe Right (green overlay)

**Usage**: Primary container component, used across all pages

**Props**:
- `variant`: "discovery" | "match" | "thread" | "dimension" | "result"
- `onSwipe`: (direction: "left" | "right") => void
- `children`: ReactNode

---

### Button

**Variants**: Primary, Secondary, Send, Action, Nav

**States**: Default, Hover, Active, Disabled, Loading

**Sizes**: Small, Medium, Large

**Usage**: Actions, navigation, form submission

**Props**:
- `variant`: "primary" | "secondary" | "send" | "action" | "nav"
- `size`: "small" | "medium" | "large"
- `disabled`: boolean
- `loading`: boolean
- `onClick`: () => void

---

### Input

**Variants**: Filter, Message, Form, Quiz

**Question Types** (Quiz variant):
- Multiple choice
- Likert scale
- Slider
- Ranking
- Text input
- Matrix

**Features**: Validation, character count, placeholder, disabled states

**Usage**: Forms, filters, message input, quiz questions

**Props**:
- `variant`: "filter" | "message" | "form" | "quiz"
- `type`: "multiple-choice" | "likert" | "slider" | "ranking" | "text" | "matrix" (quiz only)
- `value`: string | number | array
- `onChange`: (value) => void
- `required`: boolean
- `disabled`: boolean

---

### MediaLoader

**Variants**: Carousel, Gallery, Single

**Features**: Lazy loading, preload next/prev, thumbnail support, loading states

**Usage**: Profile photos, photo galleries, image displays

**Props**:
- `variant`: "carousel" | "gallery" | "single"
- `images`: string[] (URLs)
- `currentIndex`: number
- `onIndexChange`: (index: number) => void
- `lazyLoad`: boolean

---

### Badge

**Variants**: Default, Unread, Category

**Sizes**: Small, Medium, Large

**Usage**: Indicators, counts, categories

**Props**:
- `variant`: "default" | "unread" | "category"
- `size`: "small" | "medium" | "large"
- `color`: string (category color)
- `children`: ReactNode

---

### BadgeGroup

**Variants**: Horizontal, Vertical

**Design**: Rounded pills, category colors (profile=blue, quiz=purple, behavior=orange, system=gray)

**Usage**: Display dimension badges, category indicators

**Props**:
- `variant`: "horizontal" | "vertical"
- `badges`: Array<{ id: string, label: string, color?: string }>
- `maxVisible`: number (horizontal only)

---

### Slider

**Variants**: Full, Quick, Quiz

**Design**: Horizontal, touch-friendly, value display, range 0.0-10.0 (priorities) or configurable (quiz)

**Usage**: Dimension priorities, quiz questions, filters

**Props**:
- `variant`: "full" | "quick" | "quiz"
- `min`: number
- `max`: number
- `value`: number
- `onChange`: (value: number) => void
- `label`: string
- `step`: number

---

### ProgressBar

**Variants**: Quiz progress, Upload progress, Action progress

**Visual**: Horizontal bar, percentage text

**Usage**: Quiz progress, loading states

**Props**:
- `variant`: "quiz" | "upload" | "action"
- `value`: number (0-100)
- `max`: number (default: 100)
- `showLabel`: boolean

---

### ButtonGroup

**Variants**: Tabs, Actions

**Visual**: Active state (underlined or filled background)

**Usage**: Tab navigation, action groups

**Props**:
- `variant`: "tabs" | "actions"
- `items`: Array<{ id: string, label: string, icon?: ReactNode }>
- `activeId`: string
- `onChange`: (id: string) => void

---

### CardStack

**Visual**: 3-5 cards visible, 8px offset depth, swipe animation with rotation, 30% threshold

**Feedback**: Color overlay (green/red), action text, haptic feedback

**Usage**: Discovery swipe interface

**Props**:
- `cards`: Array<any>
- `onSwipe`: (cardId: string, direction: "left" | "right") => void
- `renderCard`: (card: any) => ReactNode

---

### ListView

**Features**: Virtualization for long lists, scrollable, empty states

**Usage**: Match lists, message threads, discovery list mode

**Props**:
- `items`: Array<any>
- `renderItem`: (item: any) => ReactNode
- `emptyState`: ReactNode
- `virtualized`: boolean (default: true for >50 items)

---

### ViewToggle

**Options**: Swipe/List modes

**Visual**: Toggle buttons, active state indicator

**Usage**: Discovery page view switching

**Props**:
- `value`: "swipe" | "list"
- `onChange`: (value: "swipe" | "list") => void

---

### FilterPanel

**Sections**: Age range, Distance, Gender, Quick Priority Tweaks

**Visual**: Bottom sheet modal (mobile), sliders with labels, active filters as badges

**Usage**: Discovery filters

**Props**:
- `open`: boolean
- `onClose`: () => void
- `filters`: FilterState
- `onChange`: (filters: FilterState) => void

---

### MessageThread

**Features**: Real-time updates, scroll to bottom, message grouping

**Usage**: Conversation view

**Props**:
- `matchId`: string
- `messages`: Array<Message>
- `onSend`: (content: string) => void

---

### InfoPanel

**Variants**: Micro-modal, Panel

**Content**: Top dimensions, distance, quiz overlap, expandable breakdown

**Usage**: "Why Match?" explanations, information overlays

**Props**:
- `variant`: "micro-modal" | "panel"
- `open`: boolean
- `onClose`: () => void
- `data`: CompatibilityInfo

---

### InfoCard

**Variants**: Quiz nudge, Empty state, Info message

**Visual**: Card with icon, message, CTA button

**Usage**: Quiz suggestions, empty states, informational messages

**Props**:
- `variant`: "quiz-nudge" | "empty-state" | "info"
- `icon`: ReactNode
- `message`: string
- `actionLabel`: string
- `onAction`: () => void

---

### CompatibilityBadge

**Variants**: Small (24px), Medium (32px), Large (48px)

**States**: High (80-100, green), Medium (50-79, yellow), Low (<50, red)

**Usage**: Top-right corner on cards, overlay on profile photos

**Note**: Special case - compatibility-specific component

**Props**:
- `variant`: "small" | "medium" | "large"
- `score`: number (0-100)
- `showIcon`: boolean

---

### CompatibilityBreakdown

**Variants**: Compact, Detailed, Explanatory

**Elements**: Overall score, dimension rows with score bars, weight indicators, explanations

**Usage**: Modals, profile views, quiz results

**Note**: Special case - compatibility-specific component

**Props**:
- `variant`: "compact" | "detailed" | "explanatory"
- `breakdown`: CompatibilityBreakdownData
- `expandable`: boolean

---

### Bubble

**Variants**: Sent, Received

**Elements**: Content, timestamp, read receipt

**Usage**: Message threads

**Props**:
- `variant`: "sent" | "received"
- `content`: string
- `timestamp`: Date
- `read`: boolean

---

## 🎨 Component Reuse Matrix

| Component | Discovery | Matches | Messages | Profile (Self) | Profile (Other) | Quiz |
|-----------|-----------|---------|----------|----------------|----------------|------|
| **Card** | ✅ Discovery | ✅ Match | ✅ Thread | ✅ Dimension | ❌ | ✅ Result |
| **Button** | ✅ Like/Dislike | ❌ | ✅ Send | ✅ Action | ✅ Like/Dislike | ✅ Nav/Submit |
| **Input** | ✅ Filter | ❌ | ✅ Message | ✅ Form | ❌ | ✅ Quiz |
| **MediaLoader** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Badge** | ✅ | ✅ Unread | ✅ Unread | ❌ | ❌ | ❌ |
| **BadgeGroup** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Slider** | ✅ Quick | ❌ | ❌ | ✅ Full | ❌ | ✅ Quiz |
| **ProgressBar** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **ButtonGroup** | ❌ | ❌ | ❌ | ✅ Tabs | ❌ | ❌ |
| **CardStack** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ListView** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ViewToggle** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FilterPanel** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MessageThread** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **InfoPanel** | ✅ Micro-modal | ❌ | ❌ | ❌ | ✅ Panel | ❌ |
| **InfoCard** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **CompatibilityBadge** | ✅ Small | ✅ Medium | ❌ | ❌ | ✅ Large | ❌ |
| **CompatibilityBreakdown** | ✅ Micro | ✅ Compact | ❌ | ❌ | ✅ Detailed | ✅ Results |
| **Bubble** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

**See individual page documents for component usage in context.**

