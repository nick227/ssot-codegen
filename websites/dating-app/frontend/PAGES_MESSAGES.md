# Messages Page

**Route**: `/messages`  
**Function**: View conversations, send messages, track behavior

---

## Components

### Primary
- `ListView` - Thread list (message thread cards)
- `Card` (variant: thread) - Thread card with avatar, name, preview
- `MessageThread` - Conversation view with message bubbles
- `Input` (variant: message) - Message composer
- `Button` (variant: send) - Send button

### Special
- `Bubble` (variant: sent/received) - Individual message bubbles
- `Badge` (unread) - Unread count badge

---

## Layout

### Thread List View
```
┌─────────────────────────────┐
│ Header: "Messages"          │
│ [Back] [Search]             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [Avatar] Name           │ │
│ │ Last message preview... │ │
│ │ [Unread: 3] [Time]      │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

### Conversation Thread View
```
┌─────────────────────────────┐
│ Header: [Back] Name [Info]  │
├─────────────────────────────┤
│                             │
│   [Sent Message]            │
│   [Received Message]         │
│   [Sent Message]            │
│                             │
├─────────────────────────────┤
│ [Input Field] [Send]        │
└─────────────────────────────┘
```

---

## Visual Behavior

### Thread List
- **Card Layout**: Avatar left, name + preview right, full-width
- **Unread Indicator**: Bold name, unread badge, highlighted background
- **Time Stamp**: Right-aligned, gray, small text
- **Tap Action**: Opens conversation thread

### Message Bubbles
- **Sent**: Right-aligned, primary color background, white text
- **Received**: Left-aligned, gray background, dark text
- **Timestamp**: Below bubble, small, gray
- **Read Receipt**: Checkmark icon (single=sent, double=read), right side

### Input Area
- **Layout**: Fixed bottom, above safe area
- **Input Field**: Rounded, expands on focus
- **Send Button**: Right side, disabled when empty
- **Visual Feedback**: "Sending..." state, then "Sent" confirmation

---

## Data Flow

- **Hook**: `useMessageThread(matchId)` - HTTP + WebSocket
- **Initial Fetch**: HTTP via `api.message.list({ where: { matchId } })`
- **Real-time**: WebSocket subscription via `api.message.onUpdate(matchId, callback)`
- **Event Tracking**: `useEmitBehaviorEvent()` - message_sent, match_view
- **Optimistic Updates**: Show message as "sending", replace with real message on success

---

## User Interactions

1. **Tap Thread Card** → Open conversation thread, emit `match_view` event
2. **Send Message** → Emit `message_sent` event, optimistic update
3. **Scroll Thread** → Load more messages (pagination)
4. **Tap Avatar** → Navigate to Profile Page (Other User)

---

**See COMPONENTS.md for component specifications.**

