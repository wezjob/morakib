import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/alerts/[id]/investigate - Submit investigation for alert
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await params;
    const body = await request.json();

    const investigation = await db.investigation.create({
      data: {
        alertId,
        analystId: body.analystId,
        sopId: body.sopId,
        findings: body.findings,
        conclusion: body.conclusion,
        actionsTaken: body.actions || [],
        checklistResults: body.checklistCompleted || {},
        timeSpentMinutes: body.timeSpentMinutes,
        completedAt: new Date(),
      },
      include: {
        analyst: {
          select: { id: true, name: true, email: true },
        },
        sop: {
          select: { id: true, title: true },
        },
      },
    });

    let newStatus: "INVESTIGATING" | "ESCALATED" | "RESOLVED" | "FALSE_POSITIVE" = "INVESTIGATING";
    if (body.conclusion === "TRUE_POSITIVE" || body.conclusion === "NEEDS_ESCALATION") {
      newStatus = "ESCALATED";
    } else if (body.conclusion === "FALSE_POSITIVE") {
      newStatus = "FALSE_POSITIVE";
    } else if (body.conclusion === "INCONCLUSIVE") {
      newStatus = "RESOLVED";
    }

    await db.alert.update({
      where: { id: alertId },
      data: {
        status: newStatus,
        resolvedAt: newStatus === "RESOLVED" || newStatus === "FALSE_POSITIVE" ? new Date() : undefined,
      },
    });

    // Get today's date for metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update analyst metrics for today
    await db.analystMetric.upsert({
      where: {
        analystId_date: {
          analystId: body.analystId,
          date: today,
        },
      },
      update: {
        alertsProcessed: { increment: 1 },
        truePositives: body.conclusion === "TRUE_POSITIVE" ? { increment: 1 } : undefined,
        falsePositives: body.conclusion === "FALSE_POSITIVE" ? { increment: 1 } : undefined,
        escalations: body.conclusion === "NEEDS_ESCALATION" ? { increment: 1 } : undefined,
      },
      create: {
        analystId: body.analystId,
        date: today,
        alertsProcessed: 1,
        avgResolutionTimeMin: body.timeSpentMinutes || 0,
        truePositives: body.conclusion === "TRUE_POSITIVE" ? 1 : 0,
        falsePositives: body.conclusion === "FALSE_POSITIVE" ? 1 : 0,
        escalations: body.conclusion === "NEEDS_ESCALATION" ? 1 : 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: investigation,
        message: "Investigation submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting investigation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit investigation",
      },
      { status: 500 }
    );
  }
}
