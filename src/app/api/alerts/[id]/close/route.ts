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

    const resolutionSummary = String(body?.resolutionSummary || "").trim();
    if (!resolutionSummary) {
      return NextResponse.json(
        { error: "resolutionSummary is required" },
        { status: 400 }
      );
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
      action: "INCIDENT_CLOSED",
      details: `Incident clôturé: ${resolutionSummary}`,
      createdAt: new Date().toISOString(),
    };

    const closedAt = new Date();
    const enrichmentData = {
      ...currentEnrichment,
      closure: {
        summary: resolutionSummary,
        closedAt: closedAt.toISOString(),
      },
      actionHistory: [...currentHistory, historyItem],
    };

    const alert = await db.alert.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: closedAt,
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
    console.error("Error closing alert:", error);
    return NextResponse.json({ error: "Failed to close alert" }, { status: 500 });
  }
}
