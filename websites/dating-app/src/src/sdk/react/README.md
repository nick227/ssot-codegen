# React Hooks

React Query hooks for type-safe data fetching.

## ⚡ Quick Start

### 1. Install React Query

```bash
npm install @tanstack/react-query
```

### 2. Wrap Your App

```typescript
import { SDKProvider } from './gen/sdk/react'

function App() {
  return (
    <SDKProvider>
      <YourApp />
    </SDKProvider>
  )
}
```

### 3. Use Hooks

```typescript
import { usePosts } from './gen/sdk/react'

function PostList() {
  const { data, isPending } = usePosts({ take: 20 })
  
  if (isPending) return <div>Loading...</div>
  
  return data?.data.map(post => (
    <div key={post.id}>{post.title}</div>
  ))
}
```

---

## 📚 Available Hooks

- `useUser(id)` - Get one user
- `useUsers(query?)` - List users
- `useCreateUser()` - Create user
- `useUpdateUser()` - Update user
- `useDeleteUser()` - Delete user
- `useInfiniteUsers()` - Infinite scroll
- `useProfile(id)` - Get one profile
- `useProfiles(query?)` - List profiles
- `useCreateProfile()` - Create profile
- `useUpdateProfile()` - Update profile
- `useDeleteProfile()` - Delete profile
- `useInfiniteProfiles()` - Infinite scroll
- `usePhoto(id)` - Get one photo
- `usePhotos(query?)` - List photos
- `useCreatePhoto()` - Create photo
- `useUpdatePhoto()` - Update photo
- `useDeletePhoto()` - Delete photo
- `useInfinitePhotos()` - Infinite scroll
- `useMessage(id)` - Get one message
- `useMessages(query?)` - List messages
- `useCreateMessage()` - Create message
- `useUpdateMessage()` - Update message
- `useDeleteMessage()` - Delete message
- `useInfiniteMessages()` - Infinite scroll
- `useQuiz(id)` - Get one quiz
- `useQuizs(query?)` - List quizs
- `useCreateQuiz()` - Create quiz
- `useUpdateQuiz()` - Update quiz
- `useDeleteQuiz()` - Delete quiz
- `useInfiniteQuizs()` - Infinite scroll
- `useQuizQuestion(id)` - Get one quizquestion
- `useQuizQuestions(query?)` - List quizquestions
- `useCreateQuizQuestion()` - Create quizquestion
- `useUpdateQuizQuestion()` - Update quizquestion
- `useDeleteQuizQuestion()` - Delete quizquestion
- `useInfiniteQuizQuestions()` - Infinite scroll
- `useQuizAnswer(id)` - Get one quizanswer
- `useQuizAnswers(query?)` - List quizanswers
- `useCreateQuizAnswer()` - Create quizanswer
- `useUpdateQuizAnswer()` - Update quizanswer
- `useDeleteQuizAnswer()` - Delete quizanswer
- `useInfiniteQuizAnswers()` - Infinite scroll
- `useQuizResult(id)` - Get one quizresult
- `useQuizResults(query?)` - List quizresults
- `useCreateQuizResult()` - Create quizresult
- `useUpdateQuizResult()` - Update quizresult
- `useDeleteQuizResult()` - Delete quizresult
- `useInfiniteQuizResults()` - Infinite scroll
- `useBehaviorEvent(id)` - Get one behaviorevent
- `useBehaviorEvents(query?)` - List behaviorevents
- `useCreateBehaviorEvent()` - Create behaviorevent
- `useUpdateBehaviorEvent()` - Update behaviorevent
- `useDeleteBehaviorEvent()` - Delete behaviorevent
- `useInfiniteBehaviorEvents()` - Infinite scroll
- `useBehaviorEventArchive(id)` - Get one behavioreventarchive
- `useBehaviorEventArchives(query?)` - List behavioreventarchives
- `useCreateBehaviorEventArchive()` - Create behavioreventarchive
- `useUpdateBehaviorEventArchive()` - Update behavioreventarchive
- `useDeleteBehaviorEventArchive()` - Delete behavioreventarchive
- `useInfiniteBehaviorEventArchives()` - Infinite scroll
- `usePersonalityDimension(id)` - Get one personalitydimension
- `usePersonalityDimensions(query?)` - List personalitydimensions
- `useCreatePersonalityDimension()` - Create personalitydimension
- `useUpdatePersonalityDimension()` - Update personalitydimension
- `useDeletePersonalityDimension()` - Delete personalitydimension
- `useInfinitePersonalityDimensions()` - Infinite scroll
- `useUserDimensionScore(id)` - Get one userdimensionscore
- `useUserDimensionScores(query?)` - List userdimensionscores
- `useCreateUserDimensionScore()` - Create userdimensionscore
- `useUpdateUserDimensionScore()` - Update userdimensionscore
- `useDeleteUserDimensionScore()` - Delete userdimensionscore
- `useInfiniteUserDimensionScores()` - Infinite scroll
- `useCompatibilityScore(id)` - Get one compatibilityscore
- `useCompatibilityScores(query?)` - List compatibilityscores
- `useCreateCompatibilityScore()` - Create compatibilityscore
- `useUpdateCompatibilityScore()` - Update compatibilityscore
- `useDeleteCompatibilityScore()` - Delete compatibilityscore
- `useInfiniteCompatibilityScores()` - Infinite scroll
- `useDimensionMappingRule(id)` - Get one dimensionmappingrule
- `useDimensionMappingRules(query?)` - List dimensionmappingrules
- `useCreateDimensionMappingRule()` - Create dimensionmappingrule
- `useUpdateDimensionMappingRule()` - Update dimensionmappingrule
- `useDeleteDimensionMappingRule()` - Delete dimensionmappingrule
- `useInfiniteDimensionMappingRules()` - Infinite scroll
- `useEventWeightConfig(id)` - Get one eventweightconfig
- `useEventWeightConfigs(query?)` - List eventweightconfigs
- `useCreateEventWeightConfig()` - Create eventweightconfig
- `useUpdateEventWeightConfig()` - Update eventweightconfig
- `useDeleteEventWeightConfig()` - Delete eventweightconfig
- `useInfiniteEventWeightConfigs()` - Infinite scroll

---

## 💡 Common Patterns

### Get Single Record
```typescript
const { data: post, isPending, isError, error } = usePost(123)
```

### List with Filtering
```typescript
const { data } = usePosts({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 20
})
```

### Create Mutation
```typescript
const { mutate, isPending } = useCreatePost({
  onSuccess: (post) => toast.success('Created!'),
  onError: (error) => toast.error(error.message)
})

mutate({ title: 'Hello', slug: 'hello', content: '...', authorId: 1 })
```

### Update Mutation
```typescript
const { mutate } = useUpdatePost({
  onSuccess: () => toast.success('Updated!')
})

mutate({ id: 123, data: { title: 'New Title' } })
```

### Infinite Scroll
```typescript
const { 
  data, 
  fetchNextPage, 
  hasNextPage, 
  isFetchingNextPage 
} = useInfinitePosts({ pageSize: 20 })

return (
  <>
    {data?.pages.flatMap(page => page.data).map(post => 
      <PostCard key={post.id} post={post} />
    )}
    {hasNextPage && (
      <button 
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
      >
        Load More
      </button>
    )}
  </>
)
```

---

## 🔧 Advanced Patterns

### Dependent Queries
```typescript
const { data: post } = usePost(postId)
const { data: author } = useAuthor(post?.authorId ?? 0, {
  enabled: !!post  // Only fetch when post is loaded
})
```

### Manual Refetch
```typescript
const { data, refetch } = usePosts()

return <button onClick={() => refetch()}>Refresh</button>
```

### Cache Invalidation
```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const { mutate } = useCreatePost({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
})
```

---

## 🎨 Extend with Custom Hooks

All hooks are just React Query wrappers - compose them!

```typescript
function usePublishedPostsByAuthor(authorId: number) {
  return usePosts({
    where: { published: true, authorId },
    orderBy: { createdAt: 'desc' }
  })
}

function usePostEditor(postId: number) {
  const { data: post } = usePost(postId)
  const { mutate: update } = useUpdatePost()
  const { mutate: publish } = usePublishPost()
  
  return { post, update, publish }
}
```

---

## 📖 Full React Query Documentation

All React Query features are available:
https://tanstack.com/query/latest/docs/framework/react/overview

Our hooks are thin wrappers - everything works!
