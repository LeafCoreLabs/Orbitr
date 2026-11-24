import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessionsDevices, activityLog } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const activeSessions = await db
      .select()
      .from(sessionsDevices)
      .where(and(eq(sessionsDevices.userId, userId), isNull(sessionsDevices.revokedAt)))
      .orderBy(desc(sessionsDevices.lastSeenAt));

    return NextResponse.json({ sessions: activeSessions });
  } catch (err) {
    console.error("[Get Sessions Error]", err);
    return NextResponse.json({ error: "Could not retrieve sessions" }, { status: 500 });
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
    const { action, sessionId } = body;

    if (action === "revoke_all") {
      // Sign out everywhere
      await db
        .update(sessionsDevices)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessionsDevices.userId, userId), isNull(sessionsDevices.revokedAt)));

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId,
        action: "revoke_all_sessions",
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "All active sessions have been terminated.",
      });
    }

    if (action === "revoke" && sessionId) {
      await db
        .update(sessionsDevices)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessionsDevices.id, sessionId), eq(sessionsDevices.userId, userId)));

      return NextResponse.json({
        success: true,
        message: "Session terminated.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[Manage Sessions Error]", err);
    return NextResponse.json({ error: "Could not update session state" }, { status: 500 });
  }
}
