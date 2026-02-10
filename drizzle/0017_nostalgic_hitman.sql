CREATE TABLE `tactical_boards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`homeFormation` varchar(20),
	`awayFormation` varchar(20),
	`homePlayers` text NOT NULL,
	`awayPlayers` text NOT NULL,
	`drawings` text NOT NULL,
	`teamId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tactical_boards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tactical_boards` ADD CONSTRAINT `tactical_boards_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tactical_boards` ADD CONSTRAINT `tactical_boards_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;