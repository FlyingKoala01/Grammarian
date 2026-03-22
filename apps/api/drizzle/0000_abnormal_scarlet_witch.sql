CREATE TABLE "exercise_attempts" (
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exercise_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_correct" boolean NOT NULL,
	"kind" text NOT NULL,
	"normalized_answer" text NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_schedules" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"next_review_at" timestamp with time zone NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text NOT NULL,
	"display_name_normalized" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preferred_language" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "words" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pinyin_canonical" text NOT NULL,
	"simplified" text NOT NULL,
	"translation" text NOT NULL,
	"translation_language" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_attempts_user_created_at_idx" ON "exercise_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "exercise_attempts_word_created_at_idx" ON "exercise_attempts" USING btree ("word_id","created_at");--> statement-breakpoint
CREATE INDEX "review_schedules_user_next_review_at_idx" ON "review_schedules" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_schedules_user_word_idx" ON "review_schedules" USING btree ("user_id","word_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_display_name_normalized_idx" ON "users" USING btree ("display_name_normalized");--> statement-breakpoint
CREATE INDEX "words_user_created_at_idx" ON "words" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "words_user_simplified_idx" ON "words" USING btree ("user_id","simplified");