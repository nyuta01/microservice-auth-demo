import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { documents } from "../db/schema";

const app = new OpenAPIHono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// Schema definitions
const WorkspaceIdHeaderSchema = z.object({
  "X-Workspace-ID": z.uuid().openapi({
    param: {
      name: "X-Workspace-ID",
      in: "header",
    },
    description: "Workspace ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const DocumentIdParamSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: "id",
      in: "path",
    },
    description: "Document ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const DocumentSchema = z
  .object({
    id: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    workspaceId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    title: z.string().openapi({ example: "Document Title" }),
    content: z.string().nullable().openapi({ example: "Document content" }),
    category: z.string().nullable().openapi({ example: "Technical Documentation" }),
    tags: z.string().nullable().openapi({ example: "tag1,tag2" }),
    createdAt: z.iso.datetime().nullable().openapi({ example: "2024-01-01T00:00:00Z" }),
    updatedAt: z.iso.datetime().nullable().openapi({ example: "2024-01-01T00:00:00Z" }),
    createdBy: z.string().openapi({ example: "user123" }),
  })
  .openapi("Document");

// Helper function to convert Date objects to ISO strings
const transformDocument = (doc: {
  id: string;
  workspaceId: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
}) => {
  const transformed = {
    id: doc.id,
    workspaceId: doc.workspaceId,
    title: doc.title,
    content: doc.content,
    category: doc.category,
    tags: doc.tags,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    createdBy: doc.createdBy,
  };
  return DocumentSchema.parse(transformed);
};

const DocumentListResponseSchema = z
  .object({
    documents: z.array(DocumentSchema),
  })
  .openapi("DocumentListResponse");

const DocumentResponseSchema = z
  .object({
    document: DocumentSchema,
  })
  .openapi("DocumentResponse");

const CreateDocumentRequestSchema = z
  .object({
    title: z.string().min(1).openapi({ example: "New Document" }),
    content: z.string().nullable().optional().openapi({ example: "Document content" }),
    category: z.string().nullable().optional().openapi({ example: "Technical Documentation" }),
    tags: z.string().nullable().optional().openapi({ example: "tag1,tag2" }),
  })
  .openapi("CreateDocumentRequest");

const UpdateDocumentRequestSchema =
  CreateDocumentRequestSchema.partial().openapi("UpdateDocumentRequest");


// Get document list
const getDocumentsRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DocumentListResponseSchema,
        },
      },
      description: "Document list",
    },
  },
  tags: ["Documents"],
  summary: "Get document list",
  description: "Retrieve a list of documents in the workspace",
});

app.openapi(getDocumentsRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Authorization check: 'workspace:document:read'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:document:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:document:read permission");
  }

  // Fetch data
  const data = await db.select().from(documents).where(eq(documents.workspaceId, workspaceId));
  const transformedDocuments = data.map(transformDocument);
  return c.json({ documents: transformedDocuments } satisfies z.infer<typeof DocumentListResponseSchema>);
});

// Get document details
const getDocumentRoute = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: DocumentIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DocumentResponseSchema,
        },
      },
      description: "Document details",
    },
  },
  tags: ["Documents"],
  summary: "Get document details",
  description: "Retrieve details of the specified document",
});

app.openapi(getDocumentRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: documentId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:document:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Fetch data
  const document = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)))
    .limit(1);

  if (document.length === 0) {
    throw new Error("Document not found");
  }

  const doc = document[0];
  if (!doc) {
    throw new Error("Document not found");
  }

  return c.json({ document: transformDocument(doc) } satisfies z.infer<typeof DocumentResponseSchema>);
});

// Create document
const createDocumentRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateDocumentRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: DocumentResponseSchema,
        },
      },
      description: "Document created successfully",
    },
  },
  tags: ["Documents"],
  summary: "Create document",
  description: "Create a new document",
});

app.openapi(createDocumentRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Authorization check: 'workspace:document:write'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:document:write",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:document:write permission");
  }

  const body = c.req.valid("json");
  const { title, content, category, tags } = body;

  const [newDocument] = await db
    .insert(documents)
    .values({
      workspaceId,
      title,
      content: content || null,
      category: category || null,
      tags: tags || null,
      createdBy: user.sub,
    })
    .returning();

  if (!newDocument) {
    throw new Error("Failed to create document");
  }

  return c.json({ document: transformDocument(newDocument) } satisfies z.infer<typeof DocumentResponseSchema>, 201);
});

// Update document
const updateDocumentRoute = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: DocumentIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateDocumentRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DocumentResponseSchema,
        },
      },
      description: "Document updated successfully",
    },
  },
  tags: ["Documents"],
  summary: "Update document",
  description: "Update the specified document",
});

app.openapi(updateDocumentRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: documentId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check: 'workspace:document:write'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:document:write",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:document:write permission");
  }

  const body = c.req.valid("json");
  const updateData: {
    title?: string;
    content?: string | null;
    category?: string | null;
    tags?: string | null;
  } = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.tags !== undefined) updateData.tags = body.tags;

  const [updatedDocument] = await db
    .update(documents)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)))
    .returning();

  if (!updatedDocument) {
    throw new Error("Document not found");
  }

  return c.json({ document: transformDocument(updatedDocument) } satisfies z.infer<typeof DocumentResponseSchema>);
});

// Delete document
const deleteDocumentRoute = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: DocumentIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DocumentResponseSchema,
        },
      },
      description: "Document deleted successfully",
    },
  },
  tags: ["Documents"],
  summary: "Delete document",
  description: "Delete the specified document",
});

app.openapi(deleteDocumentRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: documentId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check: 'workspace:document:delete'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:document:delete",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:document:delete permission");
  }

  const [deletedDocument] = await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.workspaceId, workspaceId)))
    .returning();

  if (!deletedDocument) {
    throw new Error("Document not found");
  }

  return c.json({ document: transformDocument(deletedDocument) } satisfies z.infer<typeof DocumentResponseSchema>);
});

export default app;
