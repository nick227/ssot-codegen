# 🌐 Social Network Example

**Demonstrates:** Complex Relationships, Social Features, Activity Feeds

---

## 🎯 What You'll Learn

Build a **social network** with complex relationships:

- ✅ **User profiles** - Bio, avatar, settings
- ✅ **Following system** - Follow/unfollow users
- ✅ **Posts & feeds** - Create posts, see followers' posts
- ✅ **Likes & comments** - Social interactions
- ✅ **Hashtags & mentions** - Content discovery
- ✅ **Activity streams** - Real-time notifications
- ✅ **Friend requests** - Connection management

**Perfect for:** Social platforms, community sites, collaborative apps

---

## 📊 Relationship Graph

```
User
  ├─ follows → User (many-to-many self-relation)
  ├─ has many → Post
  ├─ has many → Comment
  ├─ has many → Like
  └─ receives → Notification

Post
  ├─ belongs to → User (author)
  ├─ has many → Comment
  ├─ has many → Like
  └─ has many → Hashtag (many-to-many)
```

---

## 🤝 Following System

### Self-Referential Relationship
```prisma
model User {
  // Following (users I follow)
  following Follow[] @relation("UserFollowing")
  
  // Followers (users who follow me)
  followers Follow[] @relation("UserFollowers")
}

model Follow {
  followerId  Int
  followingId Int
  createdAt   DateTime @default(now())
  
  follower  User @relation("UserFollowing", fields: [followerId], references: [id])
  following User @relation("UserFollowers", fields: [followingId], references: [id])
  
  @@id([followerId, followingId])
}
```

### API Endpoints
```
POST   /api/users/:id/follow       # Follow user
DELETE /api/users/:id/unfollow     # Unfollow user
GET    /api/users/:id/followers    # Get followers
GET    /api/users/:id/following    # Get following
GET    /api/users/:id/feed          # Get personalized feed
```

---

## 📝 Posts & Interactions

### Post Model
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  content   String
  mediaUrls String[]
  likes     Int      @default(0)
  
  // Relationships
  author    User      @relation(...)
  comments  Comment[]
  likedBy   Like[]
  hashtags  PostHashtag[]
}
```

### Interactions
```bash
# Create post
POST /api/posts
{ "content": "Hello world! #coding #typescript" }

# Like post
POST /api/posts/:id/like

# Unlike post
DELETE /api/posts/:id/like

# Comment on post
POST /api/posts/:id/comments
{ "content": "Great post!" }

# Get post with interactions
GET /api/posts/:id?include=comments,likes,author
```

---

## 🔖 Hashtags & Discovery

### Auto-Extraction
```typescript
post: {
  hooks: {
    afterCreate: async (post, context) => {
      // Extract hashtags from content
      const hashtags = extractHashtags(post.content)
      
      // Create or link hashtags
      for (const tag of hashtags) {
        await linkHashtag(post.id, tag)
      }
    }
  }
}
```

### Discovery
```bash
# Find posts by hashtag
GET /api/hashtags/coding/posts

# Trending hashtags
GET /api/hashtags/trending

# Search posts
GET /api/posts?search=typescript&hashtag=coding
```

---

## 📰 Activity Feed

### Feed Algorithm
```typescript
// Get posts from followed users
feed: {
  customMethods: {
    getUserFeed: {
      handler: async (userId) => {
        // 1. Get users I follow
        const following = await getFollowing(userId)
        
        // 2. Get their posts
        const posts = await getPosts({
          authorId: { in: following.map(f => f.id) },
          orderBy: { createdAt: 'desc' }
        })
        
        // 3. Include interactions
        return posts.map(post => ({
          ...post,
          liked: await hasLiked(userId, post.id),
          comments: await getComments(post.id, { limit: 3 })
        }))
      }
    }
  }
}
```

### Usage
```bash
# Personal feed (posts from followed users)
GET /api/feed

# Explore feed (trending posts)
GET /api/explore

# User's posts
GET /api/users/:id/posts
```

---

## 🔔 Notifications

### Event-Driven
```typescript
post: {
  events: {
    onCreate: ['post.created'],
    onLike: ['post.liked'],
    onComment: ['post.commented']
  }
}

// Event handlers
registerEventHandler('post.liked', async (data) => {
  // Notify post author
  await createNotification({
    userId: data.post.authorId,
    type: 'POST_LIKED',
    actorId: data.likerId,
    postId: data.postId
  })
})
```

### Real-time Updates
```bash
# Get notifications
GET /api/notifications

# Mark as read
PUT /api/notifications/:id/read

# WebSocket for real-time
ws://localhost:3000/notifications
```

---

## 👥 Friend Requests

### Connection Flow
```prisma
model FriendRequest {
  id         Int              @id @default(autoincrement())
  status     RequestStatus    @default(PENDING)
  createdAt  DateTime         @default(now())
  
  senderId   Int
  sender     User @relation("SentRequests", ...)
  
  receiverId Int
  receiver   User @relation("ReceivedRequests", ...)
}
```

### API Flow
```bash
# 1. Send friend request
POST /api/friend-requests
{ "receiverId": 123 }

# 2. Receiver gets notification
GET /api/notifications
# → "John Doe sent you a friend request"

# 3. Accept request
PUT /api/friend-requests/:id/accept

# 4. Now friends! Can see each other's private posts
GET /api/feed
# → Includes friend's posts
```

---

## 🎯 API Endpoints

### Users
```
GET    /api/users/:id/profile
PUT    /api/users/:id/profile
GET    /api/users/:id/posts
GET    /api/users/:id/followers
GET    /api/users/:id/following
POST   /api/users/:id/follow
DELETE /api/users/:id/unfollow
```

### Posts
```
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
DELETE /api/posts/:id/like
GET    /api/posts/:id/likes
POST   /api/posts/:id/comments
GET    /api/posts/:id/comments
```

### Feed
```
GET    /api/feed              # Personal feed
GET    /api/explore           # Discover feed
GET    /api/hashtags/:tag/posts
GET    /api/search?q=query
```

### Notifications
```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
```

---

## 📊 Performance Optimizations

### Caching Strategy
```typescript
user: {
  caching: {
    // Cache profile for 10 minutes
    profile: { ttl: 600 },
    
    // Cache follower counts for 5 minutes
    followers: { ttl: 300 }
  }
}

post: {
  caching: {
    // Cache posts for 2 minutes
    get: { ttl: 120 },
    
    // Don't cache feed (real-time)
    feed: false
  }
}
```

### Database Indexes
```prisma
model Post {
  @@index([authorId, createdAt])  // Feed queries
  @@index([createdAt])            // Trending
  @@index([likes])                // Popular posts
}

model Follow {
  @@index([followerId])           // My following
  @@index([followingId])          // My followers
}
```

---

## 📚 Generated Structure

```
src/
├── registry/
│   ├── models.registry.ts      # Social features config
│   ├── social.factory.ts       # Follow/like/comment
│   └── feed.factory.ts         # Feed algorithms
├── services/
│   ├── feed.service.ts
│   ├── notification.service.ts
│   └── recommendation.service.ts
├── websockets/
│   ├── notification.handler.ts
│   └── activity.handler.ts
└── algorithms/
    ├── feed-ranking.ts
    ├── trending.ts
    └── recommendations.ts
```

---

## 🧪 Example Usage

### Complete Flow
```bash
# 1. User A creates account
POST /api/auth/signup
{ "email": "alice@example.com", "name": "Alice" }

# 2. User B creates account
POST /api/auth/signup
{ "email": "bob@example.com", "name": "Bob" }

# 3. Alice follows Bob
POST /api/users/bob-id/follow

# 4. Bob creates post
POST /api/posts
{ "content": "Hello world! #intro" }

# 5. Alice sees Bob's post in feed
GET /api/feed
# → Returns Bob's post

# 6. Alice likes post
POST /api/posts/post-id/like

# 7. Bob gets notification
GET /api/notifications
# → "Alice liked your post"
```

---

## 💡 Best Practices

1. **Index everything** - Optimize for feed queries
2. **Cache strategically** - Profile pages, follower counts
3. **Use events** - Decouple notifications from actions
4. **Paginate feeds** - Cursor-based pagination
5. **Rate limit** - Prevent spam/abuse

---

## 📖 Related Documentation

- [Social Features Guide](../../docs/SOCIAL_FEATURES_GUIDE.md)
- [Feed Algorithms](../../docs/FEED_ALGORITHMS.md)
- [Real-time Features](../../docs/REALTIME_GUIDE.md)

---

**Build the next Twitter/Instagram with this template! 🌐**

