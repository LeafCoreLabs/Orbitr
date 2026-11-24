import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { dropZones, folders, files, users, activityLog } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { buildObjectKey, getPresignedUploadUrl, verifyObjectExists } from "@/lib/r2";
import { apiUploadLimiter } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await db
      .select({
        dropZone: dropZones,
        folderName: folders.name,
      })
      .from(dropZones)
      .innerJoin(folders, eq(dropZones.folderId, folders.id))
      .where(or(eq(dropZones.tokenHash, tokenHash), eq(dropZones.tokenHash, token)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: "Drop zone not found or invalid" }, { status: 404 });
    }

    const { dropZone, folderName } = record[0];

    if (dropZone.revokedAt) {
      return NextResponse.json({ error: "This drop zone is closed." }, { status: 410 });
    }

    if (dropZone.expiresAt && new Date() > new Date(dropZone.expiresAt)) {
      return NextResponse.json({ error: "This drop zone has expired." }, { status: 410 });
    }

    // Return ONLY public metadata without exposing any existing files or contents!
    return NextResponse.json({
      folderName,
      maxFileSize: dropZone.maxFileSize,
      allowedTypes: dropZone.allowedTypes,
      expiresAt: dropZone.expiresAt,
    });
  } catch (err) {
    console.error("[Public Drop Zone Error]", err);
    return NextResponse.json({ error: "Could not access drop zone" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  // Rate limit
  const limitRes = await apiUploadLimiter.limit(`dropzone_upload:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json({ error: "Too many upload requests. Please wait." }, { status: 429 });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await db
      .select({
        dropZone: dropZones,
        ownerQuota: users.quotaBytes,
        ownerUsed: users.usedBytes,
      })
      .from(dropZones)
      .innerJoin(users, eq(dropZones.userId, users.id))
      .where(or(eq(dropZones.tokenHash, tokenHash), eq(dropZones.tokenHash, token)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: "Drop zone not found" }, { status: 404 });
    }

    const { dropZone, ownerQuota, ownerUsed } = record[0];

    if (dropZone.revokedAt || (dropZone.expiresAt && new Date() > new Date(dropZone.expiresAt))) {
      return NextResponse.json({ error: "Drop zone is closed or expired." }, { status: 410 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "complete") {
      const { fileId } = body;
      if (!fileId) {
        return NextResponse.json({ error: "File ID required" }, { status: 400 });
      }

      const fileRes = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (fileRes.length === 0 || fileRes[0].folderId !== dropZone.folderId) {
        return NextResponse.json({ error: "Invalid file for drop zone" }, { status: 404 });
      }

      const file = fileRes[0];

      // Verify on R2
      const verifyRes = await verifyObjectExists(file.objectKey);
      if (!verifyRes.exists) {
        return NextResponse.json({ error: "Storage verification failed" }, { status: 400 });
      }

      // Mark ready and update owner usedBytes
      await db.update(files).set({ status: "ready" }).where(eq(files.id, fileId));
      await db
        .update(users)
        .set({ usedBytes: ownerUsed + file.sizeBytes })
        .where(eq(users.id, dropZone.userId));

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId: dropZone.userId,
        fileId: file.id,
        action: "drop_zone_upload",
        ip,
        userAgent,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: "File successfully uploaded to drop zone." });
    }

    // Step 1: Request presigned upload URL
    const { name, sizeBytes, mimeType, sha256 } = body;

    if (!name || !sizeBytes || !mimeType || !sha256) {
      return NextResponse.json({ error: "Missing required file attributes" }, { status: 400 });
    }

    if (sizeBytes > dropZone.maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds drop zone limit of ${dropZone.maxFileSize} bytes.` },
        { status: 413 }
      );
    }

    // Check owner quota
    if (ownerUsed + sizeBytes > ownerQuota) {
      return NextResponse.json(
        { error: "Owner storage quota is full. File cannot be uploaded." },
        { status: 413 }
      );
    }

    const fileId = crypto.randomUUID();
    const objectKey = buildObjectKey(dropZone.userId, fileId);

    const uploadUrl = await getPresignedUploadUrl({
      objectKey,
      contentType: mimeType,
      contentLength: sizeBytes,
      expiresIn: 900,
    });

    await db.insert(files).values({
      id: fileId,
      userId: dropZone.userId,
      folderId: dropZone.folderId,
      name,
      sizeBytes,
      mimeType,
      objectKey,
      sha256,
      isEncrypted: false,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({
      fileId,
      uploadUrl,
    });
  } catch (err) {
    console.error("[Drop Zone Ingest Error]", err);
    return NextResponse.json({ error: "Drop zone upload failed" }, { status: 500 });
  }
}
