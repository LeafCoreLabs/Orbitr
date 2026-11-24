import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { uploadUrlSchema } from "@/lib/validators";
import { buildObjectKey, getPresignedUploadUrl } from "@/lib/r2";
import { apiUploadLimiter } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit
  const limitRes = await apiUploadLimiter.limit(`upload:${userId}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Upload rate limit reached. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = uploadUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid upload parameters" },
        { status: 400 }
      );
    }

    const {
      name,
      sizeBytes,
      mimeType,
      folderId,
      sha256,
      isEncrypted,
      encMeta,
      expiresAt,
    } = parsed.data;

    // Check user quota
    const userRes = await db
      .select({
        quotaBytes: users.quotaBytes,
        usedBytes: users.usedBytes,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRes.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { quotaBytes, usedBytes } = userRes[0];
    if (usedBytes + sizeBytes > quotaBytes) {
      return NextResponse.json(
        {
          error: `Storage quota exceeded. Available: ${Math.max(
            0,
            quotaBytes - usedBytes
          )} bytes.`,
        },
        { status: 413 }
      );
    }

    // Feature F: Smart Storage Client-Side SHA-256 Deduplication
    // Check if user already has an active identical file
    const existingFile = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          eq(files.sha256, sha256),
          eq(files.status, "ready"),
          isNull(files.deletedAt)
        )
      )
      .limit(1);

    const fileId = crypto.randomUUID();

    if (existingFile.length > 0) {
      // Instant deduplicated upload! Reuse existing R2 objectKey without upload
      const duplicate = existingFile[0];
      await db.insert(files).values({
        id: fileId,
        userId,
        folderId: folderId || null,
        name,
        sizeBytes,
        mimeType,
        objectKey: duplicate.objectKey, // Reuse object
        sha256,
        isEncrypted,
        encMeta: encMeta || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "ready", // Instantly ready!
        createdAt: new Date(),
      });

      // Update used bytes
      await db
        .update(users)
        .set({ usedBytes: usedBytes + sizeBytes })
        .where(eq(users.id, userId));

      return NextResponse.json({
        fileId,
        isDuplicate: true,
        message: "Duplicate file detected. Instant upload completed.",
      });
    }

    // Regular Upload: Generate unique objectKey and presigned PUT URL
    const objectKey = buildObjectKey(userId, fileId);
    const uploadUrl = await getPresignedUploadUrl({
      objectKey,
      contentType: mimeType,
      contentLength: sizeBytes,
      expiresIn: 900, // 15 mins
    });

    // Create pending file record in DB
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
      uploadUrl,
      objectKey,
      isDuplicate: false,
    });
  } catch (err) {
    console.error("[Upload URL Error]", err);
    return NextResponse.json(
      { error: "Could not generate upload URL." },
      { status: 500 }
    );
  }
}
