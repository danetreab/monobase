import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DRIZZLE_DB, file, type Db } from "@repo/db";
import { and, eq } from "drizzle-orm";
import type { Client as MinioClient } from "minio";
import { extname } from "node:path";
import type { CreateUploadUrlInput } from "./dto/create-upload-url.input";
import { MINIO_BUCKET, MINIO_CLIENT } from "./minio.tokens";

const PRESIGN_EXPIRES_SECONDS = 60 * 15; // 15 minutes

@Injectable()
export class FilesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: Db,
    @Inject(MINIO_CLIENT) private readonly minio: MinioClient,
    @Inject(MINIO_BUCKET) private readonly bucket: string,
  ) {}

  // Phase 1 — generate a presigned PUT URL and insert a pending DB row.
  // The fileKey is server-generated so clients can't collide with each other
  // or overwrite an existing object by guessing keys.
  async createUploadUrl(input: CreateUploadUrlInput, userId: string) {
    const ext = extname(input.originalName);
    const fileKey = `uploads/${userId}/${crypto.randomUUID()}${ext}`;

    const uploadUrl = await this.minio.presignedPutObject(
      this.bucket,
      fileKey,
      PRESIGN_EXPIRES_SECONDS,
    );

    await this.db.insert(file).values({
      key: fileKey,
      bucket: this.bucket,
      originalName: input.originalName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes ?? null,
      status: "pending",
      uploadedBy: userId,
    });

    return {
      uploadUrl,
      fileKey,
      bucket: this.bucket,
      expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
    };
  }

  // Phase 2 — client confirms the PUT succeeded. We stat the object to
  // verify it really landed (and read the authoritative size + etag), then
  // flip the row to completed.
  async registerUpload(fileKey: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(file)
      .where(eq(file.key, fileKey))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`No pending upload for fileKey=${fileKey}`);
    }
    if (row.uploadedBy !== userId) {
      // Don't leak existence to other users.
      throw new ForbiddenException("Not allowed to register this upload");
    }

    const stat = await this.minio.statObject(this.bucket, fileKey);

    const [updated] = await this.db
      .update(file)
      .set({
        status: "completed",
        sizeBytes: stat.size,
        etag: stat.etag,
        completedAt: new Date(),
      })
      .where(and(eq(file.key, fileKey), eq(file.uploadedBy, userId)))
      .returning();

    return updated;
  }

  // Used by Query file(id). Owners see their own; admins see all.
  async findById(id: string, userId: string, isAdmin: boolean) {
    const [row] = await this.db
      .select()
      .from(file)
      .where(eq(file.id, id))
      .limit(1);
    if (!row) return null;
    if (!isAdmin && row.uploadedBy !== userId) return null;
    return row;
  }

  // Used by Query files. Listing is scoped to the caller unless they're admin.
  list(userId: string, isAdmin: boolean) {
    if (isAdmin) return this.db.select().from(file);
    return this.db.select().from(file).where(eq(file.uploadedBy, userId));
  }
}
