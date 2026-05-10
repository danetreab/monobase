import {
  bigint,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./schema";

// Kept in its own file (alongside items.ts) so `bunx better-auth generate` —
// which overwrites schema.ts — doesn't clobber it.

export const fileStatus = pgEnum("file_status", [
  "pending",
  "completed",
  "failed",
]);

export const file = pgTable(
  "file",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Object key inside the MinIO bucket. Globally unique so a presigned PUT
    // can't be re-bound to a different DB row.
    key: text("key").notNull().unique(),
    bucket: text("bucket").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    etag: text("etag"),
    status: fileStatus("status").default("pending").notNull(),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("file_uploaded_by_idx").on(table.uploadedBy),
    index("file_status_idx").on(table.status),
  ],
);
