CREATE TABLE "survey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note" integer NOT NULL,
	"commentary" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
