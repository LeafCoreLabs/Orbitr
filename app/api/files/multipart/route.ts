import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { multipartInitSchema, multipartCompleteSchema } from "@/lib/validators";
import {
  buildObjectKey,
  initiateMultipart,
  getPresignedPartUrl,
  completeMultipart,
  abortMultipart,
} from "@/lib/r2";

// POST: Initiate multipart or Complete multipart based on action
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "init") {
      const body = await req.json();
      const parsed = multipartInitSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid input" },
          { status: 400 }
        );
      }

      const {
        name,
        sizeBytes,
        mimeType,
        partCount,
        folderId,
        sha256,
        isEncrypted,
        encMeta,
        expiresAt,
      } = parsed.data;

      // Check quota
      const userRes = await db
        .select({ quotaBytes: users.quotaBytes, usedBytes: users.usedBytes })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userRes.length === 0 || userRes[0].usedBytes + sizeBytes > userRes[0].quotaBytes) {
        return NextResponse.json({ error: "Storage quota exceeded" }, { status: 413 });
      }

      const fileId = crypto.randomUUID();
      const objectKey = buildObjectKey(userId, fileId);

      // Start R2 multipart
      const uploadId = await initiateMultipart({
        objectKey,
        contentType: mimeType,
      });

      if (!uploadId) {
        return NextResponse.json(
          { error: "Could not initiate multipart upload." },
          { status: 500 }
        );
      }

      // Generate presigned URLs for all parts
      const partUrls: { partNumber: number; url: string }[] = [];
      for (let i = 1; i <= partCount; i++) {
        const url = await getPresignedPartUrl({
          objectKey,
          uploadId,
          partNumber: i,
        });
        partUrls.push({ partNumber: i, url });
      }

      // Record pending file
      await db.insert(files).values({
        id: fileId,
        userId,
        folderId: folderId || null,
        name,
        sizeBytes,
        mimeType,
        objectKey,
        sha256,
        isEncrypted,
        encMeta: encMeta || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "pending",
        createdAt: new Date(),
      });

      return NextResponse.json({
        fileId,
        uploadId,
        objectKey,
        partUrls,
      });
    }

    if (action === "complete") {
      const body = await req.json();
      const parsed = multipartCompleteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid multipart complete data" }, { status: 400 });
      }

      const { fileId, uploadId, parts } = parsed.data;

      const fileRes = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (fileRes.length === 0 || fileRes[0].userId !== userId) {
        return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
      }

      const file = fileRes[0];

      const completed = await completeMultipart({
        objectKey: file.objectKey,
        uploadId,
        parts: parts.map((p) => ({
          PartNumber: p.partNumber,
          ETag: p.eTag,
        })),
      });

      if (!completed) {
        return NextResponse.json({ error: "Failed to assemble parts on storage." }, { status: 500 });
      }

      // Mark ready and update used bytes
      await db
        .update(files)
        .set({ status: "ready" })
        .where(eq(files.id, fileId));

      const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRes[0]) {
        await db
          .update(users)
          .set({ usedBytes: userRes[0].usedBytes + file.sizeBytes })
          .where(eq(users.id, userId));
      }

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId,
        fileId: file.id,
        action: "upload_multipart",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, fileId });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Multipart API Error]", err);
    return NextResponse.json({ error: "Multipart upload operation failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const uploadId = searchParams.get("uploadId");

  if (!fileId || !uploadId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const file = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (file[0] && file[0].userId === session.user.id) {
    await abortMultipart({ objectKey: file[0].objectKey, uploadId });
    await db.delete(files).where(eq(files.id, fileId));
  }

  return NextResponse.json({ success: true });
}
