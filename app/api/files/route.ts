import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, folders, users } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, ilike, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);

  const folderId = searchParams.get("folderId");
  const isVault = searchParams.get("vault") === "true";
  const isTrash = searchParams.get("trash") === "true";
  const query = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") || "date_desc"; // 'date_desc' | 'date_asc' | 'name_asc' | 'size_desc'
  const filterType = searchParams.get("type"); // 'image', 'video', 'document', 'audio', etc.

  try {
    // User quota info
    const user = await db
      .select({
        quotaBytes: users.quotaBytes,
        usedBytes: users.usedBytes,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const conditions = [
      eq(files.userId, userId),
      eq(files.status, "ready"),
    ];

    if (isTrash) {
      conditions.push(isNotNull(files.deletedAt));
    } else {
      conditions.push(isNull(files.deletedAt));

      if (isVault) {
        conditions.push(eq(files.isEncrypted, true));
      } else {
        conditions.push(eq(files.isEncrypted, false));
        if (folderId === "root" || !folderId) {
          conditions.push(isNull(files.folderId));
        } else {
          conditions.push(eq(files.folderId, folderId));
        }
      }
    }

    if (query) {
      conditions.push(ilike(files.name, `%${query}%`));
    }

    if (filterType) {
      conditions.push(ilike(files.mimeType, `${filterType}%`));
    }

    let orderByClause = desc(files.createdAt);
    if (sort === "date_asc") orderByClause = asc(files.createdAt);
    else if (sort === "name_asc") orderByClause = asc(files.name);
    else if (sort === "size_desc") orderByClause = desc(files.sizeBytes);

    const fileList = await db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(orderByClause);

    // If browsing regular folders (non-trash, non-vault), fetch folders in this scope
    let folderList: (typeof folders.$inferSelect)[] = [];
    if (!isTrash && !isVault) {
      const folderConditions = [
        eq(folders.userId, userId),
        isNull(folders.deletedAt),
        eq(folders.isVault, false),
      ];

      if (folderId === "root" || !folderId) {
        folderConditions.push(isNull(folders.parentId));
      } else {
        folderConditions.push(eq(folders.parentId, folderId));
      }

      folderList = await db
        .select()
        .from(folders)
        .where(and(...folderConditions))
        .orderBy(asc(folders.name));
    }

    return NextResponse.json({
      files: fileList,
      folders: folderList,
      storage: {
        quotaBytes: user[0]?.quotaBytes || 2147483648,
        usedBytes: user[0]?.usedBytes || 0,
      },
    });
  } catch (err) {
    console.error("[Get Files Error]", err);
    return NextResponse.json({ error: "Failed to load files." }, { status: 500 });
  }
}
