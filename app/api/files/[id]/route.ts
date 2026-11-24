import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users, activityLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteR2Object } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;

  const file = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);

  if (file.length === 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ file: file[0] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { name, folderId, expiresAt } = body;

    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (file.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updates: Partial<typeof files.$inferInsert> = {};
    if (typeof name === "string" && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (folderId !== undefined) {
      updates.folderId = folderId || null;
    }
    if (expiresAt !== undefined) {
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await db.update(files).set(updates).where(eq(files.id, fileId));

    return NextResponse.json({ success: true, message: "File updated" });
  } catch (err) {
    console.error("[File PATCH Error]", err);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  try {
    const fileRes = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileRes[0];

    // Ownership check
    if (file.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (permanent) {
      // 1. Delete from R2 Storage
      await deleteR2Object(file.objectKey);

      // 2. Decrement user quota
      const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRes.length > 0) {
        const nextUsed = Math.max(0, userRes[0].usedBytes - file.sizeBytes);
        await db.update(users).set({ usedBytes: nextUsed }).where(eq(users.id, userId));
      }

      // 3. Delete from DB
      await db.delete(files).where(eq(files.id, fileId));

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId,
        fileId: null,
        action: "permanent_delete",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: "File permanently deleted" });
    }

    // Soft delete to Trash
    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(eq(files.id, fileId));

    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      fileId: file.id,
      action: "trash",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "File moved to trash" });
  } catch (err) {
    console.error("[File DELETE Error]", err);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}

// Restore endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;

  try {
    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (file.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await db
      .update(files)
      .set({ deletedAt: null })
      .where(eq(files.id, fileId));

    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      fileId,
      action: "restore",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "File restored" });
  } catch (err) {
    console.error("[Restore Error]", err);
    return NextResponse.json({ error: "Failed to restore file" }, { status: 500 });
  }
}
