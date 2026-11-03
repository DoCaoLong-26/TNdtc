CREATE TABLE `exam_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`actor` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`record_id` text,
	`details` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_exam` ON `exam_audit` (`exam_id`);--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`scope` text NOT NULL,
	`title` text NOT NULL,
	`config` text NOT NULL,
	`roster` text NOT NULL,
	`keys` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`closed` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exam_members` (
	`exam_id` text NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`role` text NOT NULL,
	`assignment` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`exam_id`, `email`),
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`creator` text NOT NULL,
	`creator_name` text NOT NULL,
	`sbd` text NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`version` integer NOT NULL,
	`meta` text NOT NULL,
	`images` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `records_exam` ON `exam_records` (`exam_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_final_per_student` ON `exam_records` (`exam_id`,`sbd`) WHERE "exam_records"."status" = 'final';--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`updated` text NOT NULL
);
