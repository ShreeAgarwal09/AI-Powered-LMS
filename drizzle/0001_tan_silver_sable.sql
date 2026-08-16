CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`certificateCode` varchar(64) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateCode_unique` UNIQUE(`certificateCode`),
	CONSTRAINT `certificates_enrollment_uq` UNIQUE(`enrollmentId`)
);
--> statement-breakpoint
CREATE TABLE `courseSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courseSections_id` PRIMARY KEY(`id`),
	CONSTRAINT `sections_course_order_uq` UNIQUE(`courseId`,`sortOrder`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(240) NOT NULL,
	`slug` varchar(280) NOT NULL,
	`shortDescription` varchar(360) NOT NULL,
	`description` text NOT NULL,
	`thumbnailUrl` text,
	`instructorId` int NOT NULL,
	`categoryId` int NOT NULL,
	`level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
	`priceCents` int NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`objectives` json NOT NULL,
	`requirements` json NOT NULL,
	`tags` json NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`paymentStatus` enum('free','pending','paid','refunded') NOT NULL DEFAULT 'free',
	`amountCents` int NOT NULL DEFAULT 0,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollments_user_course_uq` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`lessonId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`lastPositionSeconds` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_uq` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`sectionId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`videoUrl` text,
	`resources` json NOT NULL,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPreview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`providerSessionId` varchar(255),
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`courseId` int NOT NULL,
	`userId` int NOT NULL,
	`answers` json NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`percentage` int NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`correctOption` int NOT NULL,
	`explanation` text,
	`points` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`passingScore` int NOT NULL DEFAULT 70,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isRequired` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
UPDATE `users` SET `role` = 'student' WHERE `role` = 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('student','instructor','admin') NOT NULL DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `users` ADD `headline` varchar(180);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
CREATE INDEX `categories_name_idx` ON `categories` (`name`);--> statement-breakpoint
CREATE INDEX `certificates_user_idx` ON `certificates` (`userId`);--> statement-breakpoint
CREATE INDEX `sections_course_idx` ON `courseSections` (`courseId`);--> statement-breakpoint
CREATE INDEX `courses_instructor_idx` ON `courses` (`instructorId`);--> statement-breakpoint
CREATE INDEX `courses_category_idx` ON `courses` (`categoryId`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `courses_level_idx` ON `courses` (`level`);--> statement-breakpoint
CREATE INDEX `enrollments_course_idx` ON `enrollments` (`courseId`);--> statement-breakpoint
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`userId`);--> statement-breakpoint
CREATE INDEX `lesson_progress_course_idx` ON `lessonProgress` (`userId`,`courseId`);--> statement-breakpoint
CREATE INDEX `lessons_course_idx` ON `lessons` (`courseId`);--> statement-breakpoint
CREATE INDEX `lessons_section_idx` ON `lessons` (`sectionId`);--> statement-breakpoint
CREATE INDEX `purchases_user_idx` ON `purchases` (`userId`);--> statement-breakpoint
CREATE INDEX `purchases_course_idx` ON `purchases` (`courseId`);--> statement-breakpoint
CREATE INDEX `purchases_session_idx` ON `purchases` (`providerSessionId`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_quiz_idx` ON `quizAttempts` (`userId`,`quizId`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_course_idx` ON `quizAttempts` (`courseId`);--> statement-breakpoint
CREATE INDEX `quiz_questions_quiz_idx` ON `quizQuestions` (`quizId`);--> statement-breakpoint
CREATE INDEX `quizzes_course_idx` ON `quizzes` (`courseId`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);
