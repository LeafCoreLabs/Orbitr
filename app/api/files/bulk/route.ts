import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users, activityLog } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { deleteR2Object } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { action, fileIds, targetFolderId } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 });
    }

    // Verify all files belong to user
    const userFiles = await db
      .select()
      .from(files)
      .where(and(inArray(files.id, fileIds), eq(files.userId, userId)));

    if (userFiles.length === 0) {
      return NextResponse.json({ error: "No matching files found" }, { status: 404 });
    }

    const matchedIds = userFiles.map((f) => f.id);

    if (action === "trash") {
      await db
        .update(files)
        .set({ deletedAt: new Date() })
        .where(inArray(files.id, matchedIds));

      return NextResponse.json({ success: true, count: matchedIds.length });
    }

    if (action === "restore") {
      await db
        .update(files)
        .set({ deletedAt: null })
        .where(inArray(files.id, matchedIds));

      return NextResponse.json({ success: true, count: matchedIds.length });
    }

    if (action === "move") {
      await db
        .update(files)
        .set({ folderId: targetFolderId || null })
        .where(inArray(files.id, matchedIds));

      return NextResponse.json({ success: true, count: matchedIds.length });
    }

    if (action === "permanent_delete") {
      let freedBytes = 0;
      for (const file of userFiles) {
        await deleteR2Object(file.objectKey);
        freedBytes += file.sizeBytes;
      }

      await db.delete(files).where(inArray(files.id, matchedIds));

      // Decrement quota
      const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRes.length > 0) {
        const nextUsed = Math.max(0, userRes[0].usedBytes - freedBytes);
        await db.update(users).set({ usedBytes: nextUsed }).where(eq(users.id, userId));
      }

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId,
        action: "bulk_permanent_delete",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, count: matchedIds.length, freedBytes });
    }

    return NextResponse.json({ error: "Unsupported bulk action" }, { status: 400 });
  } catch (err) {
    console.error("[Bulk API Error]", err);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}
