/**
 * Domain type definitions
 * Business entities such as Task, Document, etc.
 */

// Task type definition
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

// Tasks API Response type definition
export interface TasksResponse {
  tasks: Task[];
}

// Document type definition
export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Documents API Response type definition
export interface DocumentsResponse {
  documents: Document[];
}
