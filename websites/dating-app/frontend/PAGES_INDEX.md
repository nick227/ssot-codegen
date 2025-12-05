# Pages Index - Dating App

**Overview**: Complete list of all pages in the dating app with their primary function and key components.

---

## 📱 Page List

### 1. Discovery Page
**Route**: `/discovery`  
**Function**: Swipe through profiles, view compatibility, adjust priorities  
**Key Components**: CardStack, Card (discovery variant), CompatibilityBadge, BadgeGroup, InfoPanel, FilterPanel  
**Details**: `PAGES_DISCOVERY.md`

---

### 2. Matches Page
**Route**: `/matches`  
**Function**: View matches sorted by compatibility, see last messages  
**Key Components**: ListView, Card (match variant), CompatibilityBadge, TextPreview  
**Details**: `PAGES_MATCHES.md`

---

### 3. Messages Page
**Route**: `/messages`  
**Function**: View conversations, send messages, track behavior  
**Key Components**: ListView, Card (thread variant), MessageThread, Bubble, Input (message variant), Button (send variant)  
**Details**: `PAGES_MESSAGES.md`

---

### 4. Profile Page (Self)
**Route**: `/profile`  
**Function**: Edit profile, view dimensions, adjust priorities, complete quizzes  
**Key Components**: MediaLoader, Card (dimension variant), Slider (priority variant), ButtonGroup (tabs), InfoCard  
**Details**: `PAGES_PROFILE_SELF.md`

---

### 5. Profile Page (Other User)
**Route**: `/profile/:userId`  
**Function**: View profile, see compatibility breakdown, like/dislike  
**Key Components**: MediaLoader, CompatibilityBadge (large), InfoPanel, CompatibilityBreakdown, Button (like/dislike)  
**Details**: `PAGES_PROFILE_OTHER.md`

---

### 6. Quiz Page
**Route**: `/quiz/:quizId`  
**Function**: Take quizzes, view results, track completion  
**Key Components**: Input (quiz variant), Card (result variant), ProgressBar, Button (nav/submit variants)  
**Details**: `PAGES_QUIZ.md`

---

## 🔄 Page Relationships

```
Discovery Page
  └─→ Profile Page (Other User) [on card tap]
      └─→ Messages Page [on like/match]

Matches Page
  └─→ Messages Page [on match card tap]

Messages Page
  └─→ Profile Page (Other User) [on profile tap]

Profile Page (Self)
  └─→ Quiz Page [on quiz nudge]

Quiz Page
  └─→ Profile Page (Self) [on completion]
```

---

## 📊 Page Component Usage Summary

| Page | Primary Components | Special Components |
|------|-------------------|-------------------|
| **Discovery** | CardStack, Card, FilterPanel | CompatibilityBadge, BadgeGroup, InfoPanel |
| **Matches** | ListView, Card | CompatibilityBadge, TextPreview |
| **Messages** | ListView, Card, MessageThread | Bubble, Input (message), Button (send) |
| **Profile (Self)** | MediaLoader, Card, Slider | ButtonGroup (tabs), InfoCard |
| **Profile (Other)** | MediaLoader, CompatibilityBadge | InfoPanel, CompatibilityBreakdown |
| **Quiz** | Input (quiz), Card (result) | ProgressBar, Button (nav/submit) |

---

## 🎯 Common Patterns

### Navigation Pattern
- **Bottom Navigation**: Present on all pages (Discovery, Matches, Messages, Profile)
- **Back Button**: Present on Profile (Other) and Quiz pages
- **Header Actions**: Filters (Discovery), Sort (Matches), Search (Messages), Edit (Profile Self)

### Data Loading Pattern
- **Skeleton Loaders**: All list pages (Discovery, Matches, Messages)
- **Progressive Loading**: CardStack (Discovery), MessageThread (Messages)
- **Optimistic Updates**: Swipe actions (Discovery), Message send (Messages)

### Interaction Pattern
- **Swipe Gestures**: Discovery (card stack), Messages (thread list)
- **Tap Actions**: All pages (card taps, button taps)
- **Modal Overlays**: InfoPanel (Discovery, Profile Other), FilterPanel (Discovery)

---

**See individual page documents for detailed component specifications and visual layouts.**

