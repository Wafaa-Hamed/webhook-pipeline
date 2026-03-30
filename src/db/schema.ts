import { pgTable, text, uuid, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  webhookPath: text("webhook_path").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull(),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  status: text("status").default("pending"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull(),
  subscriberUrl: text("subscriber_url").notNull(),
  status: text("status").default("pending"), 
  attempt: integer("attempt").default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
});