CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`actor_user_id` text,
	`entity_kind` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`before` text,
	`after` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_events_trip_created_idx` ON `activity_events` (`trip_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`source` text NOT NULL,
	`r2_object_key` text,
	`external_url` text,
	`mime_type` text NOT NULL,
	`byte_size` integer,
	`width` integer,
	`height` integer,
	`photographer_name` text,
	`photographer_url` text,
	`license_name` text,
	`attribution_text` text,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "assets_source" CHECK("assets"."source" in ('upload', 'unsplash', 'wikimedia')),
	CONSTRAINT "assets_location" CHECK(("assets"."source" = 'upload' and "assets"."r2_object_key" is not null and "assets"."external_url" is null) or ("assets"."source" != 'upload' and "assets"."external_url" is not null and "assets"."r2_object_key" is null))
);
--> statement-breakpoint
CREATE INDEX `assets_trip_idx` ON `assets` (`trip_id`);--> statement-breakpoint
CREATE TABLE `cities` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`country_code` text(2),
	`timezone` text NOT NULL,
	`lat` real,
	`lon` real,
	`hero_asset_id` text,
	`source_provider` text NOT NULL,
	`source_place_id` text,
	`source_attribution` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hero_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "cities_source" CHECK("cities"."source_provider" in ('manual', 'geoapify'))
);
--> statement-breakpoint
CREATE INDEX `cities_trip_idx` ON `cities` (`trip_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cities_active_position_idx` ON `cities` (`trip_id`,`position`) WHERE "cities"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `deletion_tombstones` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`target_kind` text NOT NULL,
	`target_id` text NOT NULL,
	`deleted_by` text NOT NULL,
	`deleted_at` integer NOT NULL,
	`purge_after` integer NOT NULL,
	`undone_at` integer,
	`purged_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deletion_tombstones_active_target_idx` ON `deletion_tombstones` (`target_kind`,`target_id`) WHERE "deletion_tombstones"."undone_at" is null and "deletion_tombstones"."purged_at" is null;--> statement-breakpoint
CREATE INDEX `deletion_tombstones_purge_idx` ON `deletion_tombstones` (`purge_after`);--> statement-breakpoint
CREATE TABLE `dismissed_warnings` (
	`user_id` text NOT NULL,
	`trip_id` text NOT NULL,
	`warning_key` text NOT NULL,
	`warning_code` text NOT NULL,
	`subject_id` text NOT NULL,
	`input_signature` text NOT NULL,
	`dismissed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `trip_id`, `warning_key`, `input_signature`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invitation_links` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_links_token_hash_unique` ON `invitation_links` (`token_hash`);--> statement-breakpoint
CREATE INDEX `invitation_links_trip_idx` ON `invitation_links` (`trip_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_links_active_trip_idx` ON `invitation_links` (`trip_id`) WHERE "invitation_links"."revoked_at" is null;--> statement-breakpoint
CREATE TABLE `invitation_redemptions` (
	`invitation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`accepted_at` integer NOT NULL,
	PRIMARY KEY(`invitation_id`, `user_id`),
	FOREIGN KEY (`invitation_id`) REFERENCES `invitation_links`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `itinerary_items` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`day_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`saved_idea_id` text,
	`placeholder_type` text,
	`schedule_mode` text NOT NULL,
	`period` text,
	`start_minute` integer,
	`duration_minutes` integer NOT NULL,
	`notes` text,
	`reservation_status` text DEFAULT 'none' NOT NULL,
	`links` text NOT NULL,
	`cost_amount_minor` integer,
	`cost_currency` text(3),
	`needs_decision` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`day_id`) REFERENCES `trip_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`saved_idea_id`) REFERENCES `saved_ideas`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "itinerary_items_kind" CHECK("itinerary_items"."kind" in ('activity', 'placeholder')),
	CONSTRAINT "itinerary_items_shape" CHECK(("itinerary_items"."kind" = 'activity' and "itinerary_items"."saved_idea_id" is not null and "itinerary_items"."placeholder_type" is null) or ("itinerary_items"."kind" = 'placeholder' and "itinerary_items"."saved_idea_id" is null and "itinerary_items"."placeholder_type" is not null)),
	CONSTRAINT "itinerary_items_schedule" CHECK(("itinerary_items"."schedule_mode" = 'exact' and "itinerary_items"."start_minute" is not null and "itinerary_items"."period" is null) or ("itinerary_items"."schedule_mode" = 'period' and "itinerary_items"."period" is not null and "itinerary_items"."start_minute" is null)),
	CONSTRAINT "itinerary_items_duration" CHECK("itinerary_items"."duration_minutes" > 0),
	CONSTRAINT "itinerary_items_cost" CHECK(("itinerary_items"."cost_amount_minor" is null and "itinerary_items"."cost_currency" is null) or ("itinerary_items"."cost_amount_minor" >= 0 and length("itinerary_items"."cost_currency") = 3))
);
--> statement-breakpoint
CREATE INDEX `itinerary_items_trip_idx` ON `itinerary_items` (`trip_id`);--> statement-breakpoint
CREATE INDEX `itinerary_items_day_idx` ON `itinerary_items` (`day_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_items_idea_idx` ON `itinerary_items` (`saved_idea_id`) WHERE "itinerary_items"."saved_idea_id" is not null and "itinerary_items"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_items_active_position_idx` ON `itinerary_items` (`day_id`,`position`) WHERE "itinerary_items"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `provider_usage_daily` (
	`provider` text NOT NULL,
	`operation` text NOT NULL,
	`utc_date` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`last_request_at` integer,
	PRIMARY KEY(`provider`, `operation`, `utc_date`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`saved_idea_id` text,
	`itinerary_item_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`saved_idea_id`) REFERENCES `saved_ideas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itinerary_item_id`) REFERENCES `itinerary_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reactions_target" CHECK(("reactions"."saved_idea_id" is not null and "reactions"."itinerary_item_id" is null) or ("reactions"."saved_idea_id" is null and "reactions"."itinerary_item_id" is not null)),
	CONSTRAINT "reactions_kind" CHECK("reactions"."kind" in ('heart', 'sparkles', 'thumbs_up', 'eyes'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reactions_idea_unique_idx` ON `reactions` (`user_id`,`kind`,`saved_idea_id`) WHERE "reactions"."saved_idea_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `reactions_item_unique_idx` ON `reactions` (`user_id`,`kind`,`itinerary_item_id`) WHERE "reactions"."itinerary_item_id" is not null;--> statement-breakpoint
CREATE TABLE `saved_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`city_id` text,
	`preferred_day_id` text,
	`name` text NOT NULL,
	`address` text,
	`lat` real,
	`lon` real,
	`categories` text NOT NULL,
	`priority` text NOT NULL,
	`notes` text,
	`image_asset_id` text,
	`source_provider` text NOT NULL,
	`source_place_id` text,
	`source_attribution` text,
	`source_payload` text,
	`created_by` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`preferred_day_id`) REFERENCES `trip_days`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`image_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "saved_ideas_priority" CHECK("saved_ideas"."priority" in ('must_do', 'would_like', 'if_time')),
	CONSTRAINT "saved_ideas_source" CHECK("saved_ideas"."source_provider" in ('manual', 'geoapify'))
);
--> statement-breakpoint
CREATE INDEX `saved_ideas_trip_idx` ON `saved_ideas` (`trip_id`);--> statement-breakpoint
CREATE INDEX `saved_ideas_city_idx` ON `saved_ideas` (`city_id`);--> statement-breakpoint
CREATE TABLE `trip_days` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`city_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`calendar_date` text,
	`label` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_days_ordinal_idx` ON `trip_days` (`trip_id`,`ordinal`);--> statement-breakpoint
CREATE INDEX `trip_days_city_idx` ON `trip_days` (`city_id`);--> statement-breakpoint
CREATE TABLE `trip_members` (
	`trip_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`trip_id`, `user_id`),
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "trip_members_role" CHECK("trip_members"."role" in ('owner', 'collaborator'))
);
--> statement-breakpoint
CREATE INDEX `trip_members_user_idx` ON `trip_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trip_members_one_owner_idx` ON `trip_members` (`trip_id`) WHERE "trip_members"."role" = 'owner';--> statement-breakpoint
CREATE TABLE `trip_nights` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`after_day_id` text NOT NULL,
	`kind` text NOT NULL,
	`stay_city_id` text,
	`from_city_id` text,
	`to_city_id` text,
	`calendar_date` text,
	`notes` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`after_day_id`) REFERENCES `trip_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stay_city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`from_city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "trip_nights_kind" CHECK("trip_nights"."kind" in ('stay', 'travel')),
	CONSTRAINT "trip_nights_shape" CHECK(("trip_nights"."kind" = 'stay' and "trip_nights"."stay_city_id" is not null and "trip_nights"."from_city_id" is null and "trip_nights"."to_city_id" is null) or ("trip_nights"."kind" = 'travel' and "trip_nights"."stay_city_id" is null and "trip_nights"."from_city_id" is not null and "trip_nights"."to_city_id" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_nights_day_idx` ON `trip_nights` (`trip_id`,`after_day_id`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`starting_location_text` text,
	`starting_lat` real,
	`starting_lon` real,
	`cover_asset_id` text,
	`default_currency` text(3) DEFAULT 'USD' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "trips_currency_length" CHECK(length("trips"."default_currency") = 3),
	CONSTRAINT "trips_date_order" CHECK("trips"."start_date" is null or "trips"."end_date" is null or "trips"."start_date" <= "trips"."end_date")
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`saved_idea_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`saved_idea_id`, `user_id`),
	FOREIGN KEY (`saved_idea_id`) REFERENCES `saved_ideas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
