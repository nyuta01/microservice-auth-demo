import { Hono } from "hono";
import { db } from "../db";
import { user } from "../db/schema";
import { verifyInternalSecret } from "../middleware/internal-auth";

const admin = new Hono();

// Apply internal API authentication middleware
admin.use("/*", verifyInternalSecret);

// API to retrieve user list (for admin dashboard)
admin.get("/users", async (c) => {
  const users = await db.select().from(user);

  // Exclude sensitive information such as passwords
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return c.json({ users: safeUsers });
});

export { admin };
