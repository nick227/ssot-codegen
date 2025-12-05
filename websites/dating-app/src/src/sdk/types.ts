// @generated
// Type exports - Import just the types you need

/**
 * All DTOs in one place for easy importing
 * 
 * @example
 * ```typescript
 * import type { Post, Comment, Author } from './gen/sdk/types'
 * 
 * const post: Post = await api.post.get(1)
 * ```
 */

export type {
  UserReadDTO as User,
  UserCreateDTO as UserCreate,
  UserUpdateDTO as UserUpdate,
  UserQueryDTO as UserQuery
} from '@/contracts/user'

export type {
  ProfileReadDTO as Profile,
  ProfileCreateDTO as ProfileCreate,
  ProfileUpdateDTO as ProfileUpdate,
  ProfileQueryDTO as ProfileQuery
} from '@/contracts/profile'

export type {
  PhotoReadDTO as Photo,
  PhotoCreateDTO as PhotoCreate,
  PhotoUpdateDTO as PhotoUpdate,
  PhotoQueryDTO as PhotoQuery
} from '@/contracts/photo'

export type {
  MessageReadDTO as Message,
  MessageCreateDTO as MessageCreate,
  MessageUpdateDTO as MessageUpdate,
  MessageQueryDTO as MessageQuery
} from '@/contracts/message'

export type {
  QuizReadDTO as Quiz,
  QuizCreateDTO as QuizCreate,
  QuizUpdateDTO as QuizUpdate,
  QuizQueryDTO as QuizQuery
} from '@/contracts/quiz'

export type {
  QuizQuestionReadDTO as QuizQuestion,
  QuizQuestionCreateDTO as QuizQuestionCreate,
  QuizQuestionUpdateDTO as QuizQuestionUpdate,
  QuizQuestionQueryDTO as QuizQuestionQuery
} from '@/contracts/quizquestion'

export type {
  QuizAnswerReadDTO as QuizAnswer,
  QuizAnswerCreateDTO as QuizAnswerCreate,
  QuizAnswerUpdateDTO as QuizAnswerUpdate,
  QuizAnswerQueryDTO as QuizAnswerQuery
} from '@/contracts/quizanswer'

export type {
  QuizResultReadDTO as QuizResult,
  QuizResultCreateDTO as QuizResultCreate,
  QuizResultUpdateDTO as QuizResultUpdate,
  QuizResultQueryDTO as QuizResultQuery
} from '@/contracts/quizresult'

export type {
  BehaviorEventReadDTO as BehaviorEvent,
  BehaviorEventCreateDTO as BehaviorEventCreate,
  BehaviorEventUpdateDTO as BehaviorEventUpdate,
  BehaviorEventQueryDTO as BehaviorEventQuery
} from '@/contracts/behaviorevent'

export type {
  BehaviorEventArchiveReadDTO as BehaviorEventArchive,
  BehaviorEventArchiveCreateDTO as BehaviorEventArchiveCreate,
  BehaviorEventArchiveUpdateDTO as BehaviorEventArchiveUpdate,
  BehaviorEventArchiveQueryDTO as BehaviorEventArchiveQuery
} from '@/contracts/behavioreventarchive'

export type {
  PersonalityDimensionReadDTO as PersonalityDimension,
  PersonalityDimensionCreateDTO as PersonalityDimensionCreate,
  PersonalityDimensionUpdateDTO as PersonalityDimensionUpdate,
  PersonalityDimensionQueryDTO as PersonalityDimensionQuery
} from '@/contracts/personalitydimension'

export type {
  UserDimensionScoreReadDTO as UserDimensionScore,
  UserDimensionScoreCreateDTO as UserDimensionScoreCreate,
  UserDimensionScoreUpdateDTO as UserDimensionScoreUpdate,
  UserDimensionScoreQueryDTO as UserDimensionScoreQuery
} from '@/contracts/userdimensionscore'

export type {
  CompatibilityScoreReadDTO as CompatibilityScore,
  CompatibilityScoreCreateDTO as CompatibilityScoreCreate,
  CompatibilityScoreUpdateDTO as CompatibilityScoreUpdate,
  CompatibilityScoreQueryDTO as CompatibilityScoreQuery
} from '@/contracts/compatibilityscore'

export type {
  DimensionMappingRuleReadDTO as DimensionMappingRule,
  DimensionMappingRuleCreateDTO as DimensionMappingRuleCreate,
  DimensionMappingRuleUpdateDTO as DimensionMappingRuleUpdate,
  DimensionMappingRuleQueryDTO as DimensionMappingRuleQuery
} from '@/contracts/dimensionmappingrule'

export type {
  EventWeightConfigReadDTO as EventWeightConfig,
  EventWeightConfigCreateDTO as EventWeightConfigCreate,
  EventWeightConfigUpdateDTO as EventWeightConfigUpdate,
  EventWeightConfigQueryDTO as EventWeightConfigQuery
} from '@/contracts/eventweightconfig'

// Common types
export type { ListResponse } from '@ssot-codegen/sdk-runtime'
export type { APIException } from '@ssot-codegen/sdk-runtime'
export type { QueryOptions } from '@ssot-codegen/sdk-runtime'
