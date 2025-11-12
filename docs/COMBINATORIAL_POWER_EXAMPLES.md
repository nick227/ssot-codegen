# Combinatorial Power - Real-World Examples

**Showcasing the massive functionality options from pipeline artifact combinations.**

---

## 🎯 Example 1: Blog Platform

### Models
- Post
- Category
- Tag
- Comment
- Author

### Generated Artifacts (Per Model)
- 5 DTOs (Create, Update, Read, Query, Bulk)
- 3 Validators (Create, Update, Query)
- 1 Service
- 1 Controller
- 1 Route file
- 1 SDK client
- 5 React hooks (get, list, create, update, delete)
- 1 Hook adapter
- 3 Lightweight components (list, detail, form)

**Total per Model:** ~20 artifacts

### Combinations Available

#### Basic CRUD (5 models × 10 operations)
```typescript
// 50 basic operations
usePostModel({ take: 20 })
useCategoryModel({ take: 20 })
useTagModel({ take: 20 })
useCommentModel({ take: 20 })
useAuthorModel({ take: 20 })
// ... × 10 operations each
```

#### Relationship Queries (5 models × 5 relationships)
```typescript
// 25 relationship operations
usePostModel({ include: { author: true, comments: true } })
useCommentModel({ include: { post: true, author: true } })
// ... × 5 relationships each
```

#### Composed Queries (5 models × 5 models)
```typescript
// 25 composed operations
function usePostWithAuthor(postId: string) {
  const { data: post } = usePostModel({ id: postId })
  const { data: author } = useAuthorModel({ id: post?.authorId })
  return { post, author }
}
// ... × 5 models each
```

#### Real-time (if @@realtime)
```typescript
// 5 real-time streams
useRealtimePosts()
useRealtimeComments()
// ... × 5 models
```

**Total Functionality:** 105+ operations from 5 models

---

## 🎯 Example 2: E-commerce Platform

### Models
- Product
- Category
- Order
- Customer
- Payment
- Shipping
- Review
- Inventory

### Plugins
- StripePlugin (payments)
- S3Plugin (product images)
- EmailPlugin (notifications)

### Combinations

#### Product Catalog (8 models × 10 operations)
```typescript
// 80 basic operations
useProductModel({ where: { categoryId }, orderBy: { price: 'asc' } })
useOrderModel({ where: { customerId }, include: { items: true } })
// ... × 8 models × 10 operations
```

#### E-commerce Workflows (Custom combinations)
```typescript
// Add to cart workflow
function useAddToCart() {
  const { mutate: createOrderItem } = useOrderItemModel()
  const { mutate: updateInventory } = useInventoryModel()
  
  return async (productId: string, quantity: number) => {
    await createOrderItem({ productId, quantity })
    await updateInventory({ productId, change: -quantity })
  }
}

// Checkout workflow
function useCheckout() {
  const { mutate: createOrder } = useOrderModel()
  const { processPayment } = useStripePlugin()
  const { sendEmail } = useEmailPlugin()
  
  return async (orderData: any) => {
    const order = await createOrder(orderData)
    await processPayment({ orderId: order.id, amount: order.total })
    await sendEmail({ to: order.customerEmail, template: 'order-confirmation' })
  }
}
```

#### Plugin Integrations (8 models × 3 plugins)
```typescript
// 24 plugin integrations
useProductModel({ id }) + useS3Plugin().upload(image)
useOrderModel({ id }) + useStripePlugin().processPayment()
useOrderModel({ id }) + useEmailPlugin().sendNotification()
// ... × 8 models × 3 plugins
```

**Total Functionality:** 200+ operations from 8 models + 3 plugins

---

## 🎯 Example 3: AI Chat Application

### Models
- Conversation
- Message
- User

### Plugins
- OpenAIPlugin
- ChatPlugin

### Real-time
- WebSocket (from @@realtime)

### Combinations

#### Chat Operations (3 models × 10 operations)
```typescript
// 30 basic operations
useConversationModel({ take: 20 })
useMessageModel({ conversationId, orderBy: { createdAt: 'asc' } })
useUserModel({ id })
```

#### AI Integration (ChatPlugin combinations)
```typescript
// AI-powered chat
function useAIChat(conversationId: string) {
  const { messages, sendMessage } = useChat(conversationId)
  const { generateResponse } = useOpenAIPlugin()
  
  return {
    messages,
    sendMessage: async (content: string) => {
      await sendMessage({ content, role: 'USER' })
      const aiResponse = await generateResponse({ messages })
      await sendMessage({ content: aiResponse, role: 'ASSISTANT' })
    }
  }
}
```

#### Real-time Chat (WebSocket combinations)
```typescript
// Real-time synchronized chat
function useRealtimeChat(conversationId: string) {
  const { data: messages } = useMessageModel({ conversationId })
  useChatWebSocket(conversationId)  // Auto-updates
  
  return { messages }  // Always in sync
}
```

#### Composed Chat Features
```typescript
// Complete chat interface
function ChatInterface({ conversationId }: { conversationId: string }) {
  const { data: conversation } = useConversationModel({ id: conversationId })
  const { data: messages } = useMessageModel({ conversationId })
  const { data: user } = useUserModel({ id: conversation.userId })
  useChatWebSocket(conversationId)
  
  return (
    <div>
      <Header user={user} conversation={conversation} />
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

**Total Functionality:** 50+ operations from 3 models + 2 plugins + WebSocket

---

## 🎯 Example 4: Social Media Platform

### Models
- User
- Post
- Comment
- Like
- Follow
- Notification

### Plugins
- S3Plugin (images/videos)
- EmailPlugin (notifications)
- AnalyticsPlugin (engagement)

### Real-time
- WebSocket (notifications, likes, comments)

### Combinations

#### Social Feed (6 models × 10 operations)
```typescript
// 60 basic operations
usePostModel({ where: { authorId: { in: followingIds } } })
useCommentModel({ where: { postId } })
useLikeModel({ where: { postId } })
```

#### Social Interactions (Custom combinations)
```typescript
// Like workflow
function useLikePost() {
  const { mutate: createLike } = useLikeModel()
  const { mutate: updatePost } = usePostModel()
  const { sendNotification } = useNotificationModel()
  
  return async (postId: string, userId: string) => {
    await createLike({ postId, userId })
    await updatePost({ id: postId, likeCount: { increment: 1 } })
    await sendNotification({ 
      userId: post.authorId, 
      type: 'LIKE', 
      data: { postId, userId } 
    })
  }
}

// Follow workflow
function useFollowUser() {
  const { mutate: createFollow } = useFollowModel()
  const { mutate: updateUser } = useUserModel()
  
  return async (followerId: string, followingId: string) => {
    await createFollow({ followerId, followingId })
    await updateUser({ id: followerId, followingCount: { increment: 1 } })
    await updateUser({ id: followingId, followerCount: { increment: 1 } })
  }
}
```

#### Real-time Social Feed
```typescript
// Real-time feed updates
function useRealtimeFeed(userId: string) {
  const followingIds = useFollowingIds(userId)
  const { data: posts } = usePostModel({ where: { authorId: { in: followingIds } } })
  
  // Real-time updates for new posts, likes, comments
  useRealtimePosts()
  useRealtimeLikes()
  useRealtimeComments()
  
  return { posts }  // Always up-to-date
}
```

**Total Functionality:** 150+ operations from 6 models + 3 plugins + WebSocket

---

## 🔢 Mathematical Summary

### Single Model Power

**Base Operations:** 10  
**With Relationships:** 10 × R (R = relationships)  
**With Real-time:** +3  
**With File Ops:** +3  
**Total:** 10 × R + 6 operations per model

**Example:** Model with 5 relationships = 56 operations

---

### Multi-Model Power

**N Models:** N × (10 × R + 6) base operations  
**Cross-Model:** N × N combinations  
**Total:** N × (10 × R + 6) + N² operations

**Example:** 10 models with avg 5 relationships each:
- Base: 10 × 56 = 560 operations
- Cross-model: 10 × 10 = 100 operations
- **Total:** 660 operations

---

### With Plugins

**Base:** N × (10 × R + 6) + N²  
**Plugins:** P × O (P = plugins, O = operations per plugin)  
**Plugin-Model:** N × P combinations  
**Total:** N × (10 × R + 6) + N² + P × O + N × P

**Example:** 10 models + 5 plugins (10 ops each):
- Base: 660 operations
- Plugins: 5 × 10 = 50 operations
- Plugin-Model: 10 × 5 = 50 combinations
- **Total:** 760 operations

---

## 🎨 Component Combinations

### Smart Components × Hook Adapters

**DataTable:**
- Can use any model adapter
- **Combinations:** N models × M column configs

**Form:**
- Can use any model adapter
- **Combinations:** N models × 2 modes (create/update)

**Button:**
- Can use any model adapter
- **Combinations:** N models × M actions

**Total Component Combinations:** N × (M + 2 + M) = N × (2M + 2)

**Example:** 10 models × 5 configs = 50 component combinations

---

### Lightweight Components × Models

**List Components:** N models  
**Detail Components:** N models  
**Form Components:** N models × 2 modes

**Total:** 4N component types

**Example:** 10 models = 40 component types

---

## 🚀 Maximum Power Scenario

### Enterprise Application

**Models:** 20  
**Relationships per Model:** 10 (avg)  
**Plugins:** 10  
**Real-time Models:** 15  

### Calculations

**Base Operations:** 20 × (10 × 10 + 6) = 2,120 operations  
**Cross-Model:** 20 × 20 = 400 operations  
**Plugins:** 10 × 20 = 200 operations  
**Real-time:** 15 × 3 = 45 streams  

**Total Functionality:** **2,765 operations** from 20 models + 10 plugins

---

## ✅ Key Takeaways

1. **Exponential Growth:** Each model multiplies available operations
2. **Relationship Power:** Relationships create N×M combinations
3. **Plugin Multiplication:** Plugins add P×N combinations
4. **Real-time Addition:** Real-time adds 3×R streams
5. **Component Flexibility:** Components can use any combination

**The hook adapter strategy makes all these combinations easy to use!** 🚀

**Result:** From a simple schema, you get thousands of functionality options, all type-safe and easy to use.

