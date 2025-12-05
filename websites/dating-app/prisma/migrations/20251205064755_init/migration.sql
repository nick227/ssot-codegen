-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `oauthProvider` VARCHAR(191) NULL,
    `oauthId` VARCHAR(191) NULL,
    `accountStatus` ENUM('ACTIVE', 'SUSPENDED', 'DELETED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`(191)),
    INDEX `User_accountStatus_idx`(`accountStatus`),
    INDEX `User_lastLoginAt_idx`(`lastLoginAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY') NOT NULL,
    `bio` TEXT NULL,
    `location` JSON NOT NULL,
    `ethnicity` VARCHAR(191) NULL,
    `height` INTEGER NULL,
    `bodyType` ENUM('SLIM', 'AVERAGE', 'ATHLETIC', 'CURVY', 'MUSCULAR', 'PREFER_NOT_TO_SAY') NULL,
    `eyeColor` VARCHAR(191) NULL,
    `hairColor` VARCHAR(191) NULL,
    `education` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    INDEX `Profile_userId_idx`(`userId`(191)),
    INDEX `Profile_age_idx`(`age`),
    INDEX `Profile_gender_idx`(`gender`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Photo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Photo_userId_idx`(`userId`(191)),
    INDEX `Photo_userId_order_idx`(`userId`(191), `order`),
    INDEX `Photo_moderationStatus_idx`(`moderationStatus`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Swipe` (
    `id` VARCHAR(191) NOT NULL,
    `swiperId` VARCHAR(191) NOT NULL,
    `swipedId` VARCHAR(191) NOT NULL,
    `type` ENUM('LIKE', 'DISLIKE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Swipe_swiperId_createdAt_idx`(`swiperId`(191), `createdAt`),
    INDEX `Swipe_swipedId_idx`(`swipedId`(191)),
    INDEX `Swipe_type_idx`(`type`),
    UNIQUE INDEX `Swipe_swiperId_swipedId_key`(`swiperId`(125), `swipedId`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` VARCHAR(191) NOT NULL,
    `user1Id` VARCHAR(191) NOT NULL,
    `user2Id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unmatchedAt` DATETIME(3) NULL,

    INDEX `Match_user1Id_createdAt_idx`(`user1Id`(191), `createdAt`),
    INDEX `Match_user2Id_createdAt_idx`(`user2Id`(191), `createdAt`),
    INDEX `Match_unmatchedAt_idx`(`unmatchedAt`),
    UNIQUE INDEX `Match_user1Id_user2Id_key`(`user1Id`(125), `user2Id`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_matchId_createdAt_idx`(`matchId`(191), `createdAt`),
    INDEX `Message_senderId_idx`(`senderId`(191)),
    INDEX `Message_receiverId_idx`(`receiverId`(191)),
    INDEX `Message_readAt_idx`(`readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `estimatedTime` INTEGER NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Quiz_category_idx`(`category`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `type` ENUM('multiple_choice', 'multiple_select', 'likert', 'slider', 'ranking', 'text_input', 'matrix') NOT NULL,
    `order` INTEGER NOT NULL,
    `configJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuizQuestion_quizId_order_idx`(`quizId`(191), `order`),
    INDEX `QuizQuestion_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `answerJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuizAnswer_quizId_userId_idx`(`quizId`(125), `userId`(125)),
    INDEX `QuizAnswer_questionId_idx`(`questionId`(191)),
    INDEX `QuizAnswer_userId_idx`(`userId`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizResult` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NULL,
    `resultJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QuizResult_quizId_userId_idx`(`quizId`(125), `userId`(125)),
    INDEX `QuizResult_userId_idx`(`userId`(191)),
    INDEX `QuizResult_score_idx`(`score`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BehaviorEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('profile_view', 'profile_like', 'profile_dislike', 'quiz_open', 'quiz_take', 'quiz_like', 'quiz_dislike', 'message_sent', 'match_view', 'match_ghost', 'match_streak') NOT NULL,
    `targetType` ENUM('profile', 'quiz', 'match') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `meta` JSON NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `ruleVersion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BehaviorEvent_userId_processedAt_idx`(`userId`(191), `processedAt`),
    INDEX `BehaviorEvent_userId_eventType_createdAt_idx`(`userId`(191), `eventType`, `createdAt`),
    INDEX `BehaviorEvent_targetType_targetId_idx`(`targetType`, `targetId`(191)),
    INDEX `BehaviorEvent_ruleVersion_processedAt_idx`(`ruleVersion`(191), `processedAt`),
    INDEX `BehaviorEvent_processedAt_idx`(`processedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BehaviorEventArchive` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('profile_view', 'profile_like', 'profile_dislike', 'quiz_open', 'quiz_take', 'quiz_like', 'quiz_dislike', 'message_sent', 'match_view', 'match_ghost', 'match_streak') NOT NULL,
    `targetType` ENUM('profile', 'quiz', 'match') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `meta` JSON NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `ruleVersion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BehaviorEventArchive_userId_createdAt_idx`(`userId`(191), `createdAt`),
    INDEX `BehaviorEventArchive_eventType_idx`(`eventType`),
    INDEX `BehaviorEventArchive_archivedAt_idx`(`archivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonalityDimension` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('profile', 'quiz', 'behavior', 'system', 'mixed') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `normalizationConfig` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonalityDimension_category_idx`(`category`),
    INDEX `PersonalityDimension_isActive_idx`(`isActive`),
    INDEX `PersonalityDimension_category_isActive_idx`(`category`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDimensionScore` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dimensionId` VARCHAR(191) NOT NULL,
    `normalizedScore` DOUBLE NOT NULL DEFAULT 0,
    `rawScore` DOUBLE NULL,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastNormalizedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserDimensionScore_dimensionId_normalizedScore_idx`(`dimensionId`(191), `normalizedScore`),
    INDEX `UserDimensionScore_userId_lastUpdated_idx`(`userId`(191), `lastUpdated`),
    INDEX `UserDimensionScore_lastNormalizedAt_idx`(`lastNormalizedAt`),
    UNIQUE INDEX `UserDimensionScore_userId_dimensionId_key`(`userId`(125), `dimensionId`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompatibilityScore` (
    `id` VARCHAR(191) NOT NULL,
    `user1Id` VARCHAR(191) NOT NULL,
    `user2Id` VARCHAR(191) NOT NULL,
    `overallScore` DOUBLE NOT NULL,
    `dimensionBreakdown` JSON NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cacheVersion` VARCHAR(191) NULL,

    INDEX `CompatibilityScore_user1Id_calculatedAt_idx`(`user1Id`(191), `calculatedAt`),
    INDEX `CompatibilityScore_user2Id_calculatedAt_idx`(`user2Id`(191), `calculatedAt`),
    INDEX `CompatibilityScore_calculatedAt_idx`(`calculatedAt`),
    UNIQUE INDEX `CompatibilityScore_user1Id_user2Id_key`(`user1Id`(125), `user2Id`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDimensionPriority` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dimensionId` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserDimensionPriority_userId_idx`(`userId`(191)),
    INDEX `UserDimensionPriority_dimensionId_idx`(`dimensionId`(191)),
    UNIQUE INDEX `UserDimensionPriority_userId_dimensionId_key`(`userId`(125), `dimensionId`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DimensionMappingRule` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `targetType` ENUM('profile', 'quiz', 'match') NOT NULL,
    `metaKey` VARCHAR(191) NOT NULL,
    `metaValue` VARCHAR(191) NULL,
    `dimensionId` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `version` VARCHAR(191) NOT NULL DEFAULT 'v1.0',
    `matchType` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DimensionMappingRule_eventType_targetType_isActive_idx`(`eventType`(191), `targetType`, `isActive`),
    INDEX `DimensionMappingRule_dimensionId_isActive_idx`(`dimensionId`(191), `isActive`),
    INDEX `DimensionMappingRule_isActive_idx`(`isActive`),
    INDEX `DimensionMappingRule_version_idx`(`version`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventWeightConfig` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` ENUM('profile_view', 'profile_like', 'profile_dislike', 'quiz_open', 'quiz_take', 'quiz_like', 'quiz_dislike', 'message_sent', 'match_view', 'match_ghost', 'match_streak') NOT NULL,
    `baseWeight` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventWeightConfig_eventType_key`(`eventType`),
    INDEX `EventWeightConfig_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Block` (
    `id` VARCHAR(191) NOT NULL,
    `blockerId` VARCHAR(191) NOT NULL,
    `blockedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Block_blockerId_idx`(`blockerId`(191)),
    INDEX `Block_blockedId_idx`(`blockedId`(191)),
    UNIQUE INDEX `Block_blockerId_blockedId_key`(`blockerId`(125), `blockedId`(125)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Swipe` ADD CONSTRAINT `Swipe_swiperId_fkey` FOREIGN KEY (`swiperId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Swipe` ADD CONSTRAINT `Swipe_swipedId_fkey` FOREIGN KEY (`swipedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizQuestion` ADD CONSTRAINT `QuizQuestion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QuizQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizResult` ADD CONSTRAINT `QuizResult_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuizResult` ADD CONSTRAINT `QuizResult_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BehaviorEvent` ADD CONSTRAINT `BehaviorEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDimensionScore` ADD CONSTRAINT `UserDimensionScore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDimensionScore` ADD CONSTRAINT `UserDimensionScore_dimensionId_fkey` FOREIGN KEY (`dimensionId`) REFERENCES `PersonalityDimension`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompatibilityScore` ADD CONSTRAINT `CompatibilityScore_user1Id_fkey` FOREIGN KEY (`user1Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompatibilityScore` ADD CONSTRAINT `CompatibilityScore_user2Id_fkey` FOREIGN KEY (`user2Id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDimensionPriority` ADD CONSTRAINT `UserDimensionPriority_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDimensionPriority` ADD CONSTRAINT `UserDimensionPriority_dimensionId_fkey` FOREIGN KEY (`dimensionId`) REFERENCES `PersonalityDimension`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DimensionMappingRule` ADD CONSTRAINT `DimensionMappingRule_dimensionId_fkey` FOREIGN KEY (`dimensionId`) REFERENCES `PersonalityDimension`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
