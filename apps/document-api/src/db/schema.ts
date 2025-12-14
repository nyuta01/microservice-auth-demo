import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category"), // Category (e.g., 'report', 'memo', 'proposal')
  tags: text("tags"), // Comma-separated tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
});
