import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { createFolderSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const list = await db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, userId), isNull(folders.deletedAt)))
      .orderBy(asc(folders.name));

    return NextResponse.json({ folders: list });
  } catch (err) {
    console.error("[Get Folders Error]", err);
    return NextResponse.json({ error: "Could not retrieve folders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid folder name" },
        { status: 400 }
      );
    }

    const { name, parentId, isVault } = parsed.data;

    const folderId = crypto.randomUUID();
    await db.insert(folders).values({
      id: folderId,
      userId,
      name,
      parentId: parentId || null,
      isVault: Boolean(isVault),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name,
        parentId: parentId || null,
        isVault: Boolean(isVault),
      },
    });
  } catch (err) {
    console.error("[Create Folder Error]", err);
    return NextResponse.json({ error: "Could not create folder" }, { status: 500 });
  }
}
