DROP INDEX `purchases_session_idx` ON `purchases`;--> statement-breakpoint
ALTER TABLE `purchases` ADD `stripeCheckoutSessionId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `purchases` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_stripeCheckoutSessionId_unique` UNIQUE(`stripeCheckoutSessionId`);--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `provider`;--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `providerSessionId`;--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `currency`;--> statement-breakpoint
ALTER TABLE `purchases` DROP COLUMN `updatedAt`;