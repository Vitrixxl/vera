import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    mode: "date",
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Types for survey questions
type Q1Channel = "whatsapp" | "instagram" | "phone" | "website";
type Q2QuestionsCount = "1" | "2-3" | "4-5" | "5+";
type Q3Clarity = "clear" | "technical" | "difficult" | "no_response";
type Q4Reliability = "yes_totally" | "yes_rather" | "not_really" | "no" | "need_verify";
type Q6Liked = "speed" | "sources" | "free" | "simple" | "accessible" | "neutral";
type Q7Improvement = "faster" | "design" | "clarity" | "explanations" | "followup" | "notifications" | "nothing";
type Q8Reuse = "yes_always" | "yes_sometimes" | "maybe" | "probably_not" | "certainly_not";
type Q9Recommend = "yes_certainly" | "yes_probably" | "maybe" | "probably_not" | "certainly_not";
type Q10BehaviorChange = "yes_systematic" | "more_careful" | "not_really" | "too_early";
type Q11BadgeFeature = "love_it" | "cool" | "meh" | "useless";
type Q12Discovery = "questionnaire" | "landing" | "instagram" | "friend";

export const survey = pgTable("survey", {
  id: uuid().primaryKey().defaultRandom(),

  // Q1: Canal de contact (multi-select)
  q1Channels: text("q1_channels").array().$type<Q1Channel[]>().notNull(),

  // Q2: Nombre de questions posées
  q2QuestionsCount: varchar("q2_questions_count").$type<Q2QuestionsCount>().notNull(),

  // Q3: Clarté de la réponse
  q3Clarity: varchar("q3_clarity").$type<Q3Clarity>().notNull(),

  // Q4: Fiabilité
  q4Reliability: varchar("q4_reliability").$type<Q4Reliability>().notNull(),

  // Q5: Note expérience 1-5
  q5ExperienceRating: integer("q5_experience_rating").$type<1 | 2 | 3 | 4 | 5>().notNull(),

  // Q6: Ce qui a plu (multi-select)
  q6Liked: text("q6_liked").array().$type<Q6Liked[]>().notNull(),

  // Q7: À améliorer (multi-select)
  q7Improvements: text("q7_improvements").array().$type<Q7Improvement[]>().notNull(),

  // Q8: Réutilisation
  q8Reuse: varchar("q8_reuse").$type<Q8Reuse>().notNull(),

  // Q9: Recommandation
  q9Recommend: varchar("q9_recommend").$type<Q9Recommend>().notNull(),

  // Q10: Changement de comportement
  q10BehaviorChange: varchar("q10_behavior_change").$type<Q10BehaviorChange>().notNull(),

  // Q11: Feature badge/stats
  q11BadgeFeature: varchar("q11_badge_feature").$type<Q11BadgeFeature>().notNull(),

  // Q12: Découverte VERA
  q12Discovery: varchar("q12_discovery").$type<Q12Discovery>().notNull(),

  // Q13: Commentaire libre (facultatif)
  q13Comment: text("q13_comment"),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
