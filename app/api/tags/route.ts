import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags, fileTags, files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET: Fetch all tags for the user and their associated files
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId));

    const fileTagMappings = await db
      .select({
        fileId: fileTags.fileId,
        tagId: fileTags.tagId,
        name: tags.name,
      })
      .from(fileTags)
      .innerJoin(tags, eq(fileTags.tagId, tags.id))
      .where(eq(tags.userId, userId));

    return NextResponse.json({
      tags: userTags,
      fileTags: fileTagMappings,
    });
  } catch (err) {
    console.error("[Get Tags Error]", err);
    return NextResponse.json({ error: "Failed to retrieve tags" }, { status: 500 });
  }
}

// POST: Add tag to file (creates tag if it does not exist)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { fileId, tagName } = body;

    if (!fileId || !tagName || typeof tagName !== "string") {
      return NextResponse.json({ error: "File ID and tag name are required" }, { status: 400 });
    }

    const cleanTagName = tagName.trim().toLowerCase();
    if (cleanTagName.length === 0 || cleanTagName.length > 30) {
      return NextResponse.json({ error: "Tag name must be 1 to 30 characters" }, { status: 400 });
    }

    // Verify file ownership
    const fileRes = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    // Find or create tag
    let tagRecord = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, cleanTagName)))
      .limit(1);

    let tagId: string;
    if (tagRecord.length === 0) {
      tagId = crypto.randomUUID();
      await db.insert(tags).values({
        id: tagId,
        userId,
        name: cleanTagName,
      });
    } else {
      tagId = tagRecord[0].id;
    }

    // Associate tag with file
    try {
      await db.insert(fileTags).values({
        fileId,
        tagId,
      });
    } catch {
      // Ignore unique constraint violation if already tagged
    }

    return NextResponse.json({
      success: true,
      tag: { id: tagId, name: cleanTagName },
    });
  } catch (err) {
    console.error("[Create Tag Error]", err);
    return NextResponse.json({ error: "Failed to apply tag" }, { status: 500 });
  }
}

// DELETE: Remove tag from file
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const tagId = searchParams.get("tagId");

  if (!fileId || !tagId) {
    return NextResponse.json({ error: "File ID and Tag ID are required" }, { status: 400 });
  }

  try {
    // Verify tag ownership
    const tagRes = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .limit(1);

    if (tagRes.length === 0) {
      return NextResponse.json({ error: "Tag not found or unauthorized" }, { status: 404 });
    }

    await db
      .delete(fileTags)
      .where(and(eq(fileTags.fileId, fileId), eq(fileTags.tagId, tagId)));

    return NextResponse.json({ success: true, message: "Tag removed from file" });
  } catch (err) {
    console.error("[Delete Tag Error]", err);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
