import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listGovernanceNotifications,
  markGovernanceNotificationsAsRead,
} from "@/lib/governance-store";

function roleToRecipientRole(role?: string) {
  if (role === "ADMIN") return "ADMIN";
  if (role === "LEAD") return "LEAD";
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recipientRole = roleToRecipientRole(userRole);
    if (!recipientRole) {
      return NextResponse.json({ notifications: [] });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await listGovernanceNotifications({
      recipientRole,
      recipientUserId: userId,
      unreadOnly,
      limit: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error loading governance notifications:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map((id: unknown) => String(id)) : [];

    await markGovernanceNotificationsAsRead(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating governance notifications:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
