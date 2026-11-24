import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders, files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: folderId } = await params;
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { name, parentId } = body;

    const folder = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const updates: Partial<typeof folders.$inferInsert> = {};
    if (typeof name === "string" && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (parentId !== undefined) {
      updates.parentId = parentId || null;
    }

    await db.update(folders).set(updates).where(eq(folders.id, folderId));

    return NextResponse.json({ success: true, message: "Folder updated" });
  } catch (err) {
    console.error("[Folder PATCH Error]", err);
    return NextResponse.json({ error: "Could not update folder" }, { status: 500 });
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

  const { id: folderId } = await params;
  const userId = session.user.id;

  try {
    const folder = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1);

    if (folder.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Soft delete folder and all files inside it
    const now = new Date();
    await db.update(folders).set({ deletedAt: now }).where(eq(folders.id, folderId));
    await db.update(files).set({ deletedAt: now }).where(eq(files.folderId, folderId));

    return NextResponse.json({ success: true, message: "Folder deleted" });
  } catch (err) {
    console.error("[Folder DELETE Error]", err);
    return NextResponse.json({ error: "Could not delete folder" }, { status: 500 });
  }
}
