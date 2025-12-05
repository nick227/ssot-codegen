# Quiz Page

**Route**: `/quiz/:quizId`  
**Function**: Take quizzes, view results, track completion

---

## Components

### Primary
- `Input` (variant: quiz) - Question input with type registry
- `Card` (variant: result) - Quiz result card
- `ProgressBar` - Quiz progress indicator
- `Button` (variant: nav/submit) - Previous, Next, Submit buttons

### Special
- `CompatibilityBreakdown` (variant: results) - Dimension changes display

---

## Layout

### Question View
```
┌─────────────────────────────┐
│ Header: Quiz Name           │
│ Progress: [====----] 60%   │
├─────────────────────────────┤
│                             │
│ Question 3 of 5             │
│                             │
│ How do you prefer to spend │
│ your free time?             │
│                             │
│ ┌─────────────────────────┐ │
│ │ ○ Reading               │ │
│ │ ○ Sports                │ │
│ │ ○ Socializing           │ │
│ │ ○ Creative activities   │ │
│ └─────────────────────────┘ │
│                             │
│ [Previous] [Next]           │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

### Results View
```
┌─────────────────────────────┐
│ Header: Quiz Results        │
├─────────────────────────────┤
│                             │
│ Your Score: 85%             │
│                             │
│ Dimensions Affected         │
│ ┌─────────────────────────┐ │
│ │ [Dimension] +10 points  │ │
│ │ [Dimension] +5 points    │ │
│ └─────────────────────────┘ │
│                             │
│ How This Changes Matches    │
│ "Your compatibility scores  │
│ may improve with users who  │
│ value creativity."          │
│                             │
│ [Like Result] [Dislike]    │
│                             │
│ [Retake Quiz]               │
│                             │
├─────────────────────────────┤
│ Bottom Navigation           │
└─────────────────────────────┘
```

---

## Visual Behavior

### Question Display
- **Progress Indicator**: Top of page, visual bar, percentage
- **Question Number**: "Question X of Y" text
- **Question Text**: Large, readable font
- **Answer Options**: Type-specific (multiple choice, Likert, slider, ranking, text, matrix)

### Question Types
- **Multiple Choice**: Radio buttons or selectable cards
- **Likert Scale**: Horizontal slider with labels (1-5)
- **Slider**: Visual slider with min/max labels
- **Ranking**: Drag-and-drop list
- **Text Input**: Text area with character count
- **Matrix**: Grid with rows (questions) and columns (options)

### Navigation
- **Previous Button**: Left, disabled on first question
- **Next Button**: Right, primary color, disabled if required answer missing
- **Submit Button**: Replaces Next on last question

### Results Visual
- **Score Display**: Large number, color-coded, centered
- **Dimension Changes**: List with +/- indicators, color-coded
- **Impact Message**: Text explanation, friendly tone
- **Actions**: Like/Dislike buttons, Retake option

---

## Data Flow

- **Hook**: `useQuiz(quizId)`, quiz submission hook
- **Event Tracking**: `useEmitBehaviorEvent()` - quiz_open, quiz_take, quiz_like, quiz_dislike
- **Server Processing**: Server processes events, updates dimensions, recomputes compatibility
- **Cache Invalidation**: Invalidate compatibility queries after completion

---

## User Interactions

1. **Answer Question** → Update answer state, enable Next button
2. **Tap Next** → Navigate to next question, update progress
3. **Tap Previous** → Navigate to previous question
4. **Tap Submit** → Submit quiz, show results, emit `quiz_take` event
5. **Tap Like Result** → Emit `quiz_like` event
6. **Tap Dislike Result** → Emit `quiz_dislike` event
7. **Tap Retake** → Restart quiz

---

**See COMPONENTS.md for component specifications.**

