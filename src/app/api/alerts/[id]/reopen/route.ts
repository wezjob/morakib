import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type ActionHistoryItem = {
  id: string;
  action: "EVIDENCE_ADDED" | "INCIDENT_CLOSED" | "INCIDENT_REOPENED";
  details: string;
  createdAt: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const reason = String(body?.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    const existing = await db.alert.findUnique({
      where: { id },
      select: { enrichmentData: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const currentEnrichment =
      existing.enrichmentData && typeof existing.enrichmentData === "object"
        ? (existing.enrichmentData as Record<string, unknown>)
        : {};

    const currentHistory = Array.isArray(currentEnrichment.actionHistory)
      ? (currentEnrichment.actionHistory as ActionHistoryItem[])
      : [];

    const historyItem: ActionHistoryItem = {
      id: crypto.randomUUID(),
      action: "INCIDENT_REOPENED",
      details: `Incident réouvert: ${reason}`,
      createdAt: new Date().toISOString(),
    };

    const enrichmentData = {
      ...currentEnrichment,
      actionHistory: [...currentHistory, historyItem],
      reopening: {
        reason,
        reopenedAt: new Date().toISOString(),
      },
    };

    const alert = await db.alert.update({
      where: { id },
      data: {
        status: "INVESTIGATING",
        resolvedAt: null,
        enrichmentData,
      },
      select: {
        id: true,
        status: true,
        resolvedAt: true,
        enrichmentData: true,
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error("Error reopening alert:", error);
    return NextResponse.json({ error: "Failed to reopen alert" }, { status: 500 });
  }
}
