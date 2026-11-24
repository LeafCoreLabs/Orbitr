import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authenticators, activityLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false, hasPasskey: false, count: 0, authenticators: [] });
    }

    const userId = session.user.id;
    const authList = await db
      .select({
        id: authenticators.id,
        credentialDeviceType: authenticators.credentialDeviceType,
        credentialBackedUp: authenticators.credentialBackedUp,
        transports: authenticators.transports,
        createdAt: authenticators.createdAt,
      })
      .from(authenticators)
      .where(eq(authenticators.userId, userId))
      .orderBy(desc(authenticators.createdAt));

    return NextResponse.json({
      authenticated: true,
      hasPasskey: authList.length > 0,
      count: authList.length,
      authenticators: authList,
    });
  } catch (err) {
    console.error("[Passkey Status Error]", err);
    return NextResponse.json(
      { error: "Failed to query passkey status" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Passkey ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    await db
      .delete(authenticators)
      .where(and(eq(authenticators.id, id), eq(authenticators.userId, userId)));

    // Audit log
    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      action: "passkey_removed",
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "Unknown IP",
      userAgent: req.headers.get("user-agent") || "Web Browser",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, message: "Passkey removed successfully" });
  } catch (err) {
    console.error("[Passkey Delete Error]", err);
    return NextResponse.json(
      { error: "Failed to remove passkey" },
      { status: 500 }
    );
  }
}
