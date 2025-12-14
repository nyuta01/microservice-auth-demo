import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // 'todo', 'in_progress', 'done'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  assigneeId: text("assignee_id"), // user_id
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
});
