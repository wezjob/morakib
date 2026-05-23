import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/sop-instances/[id]/validate - Validate a completed SOP instance
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { validatedById, validationNotes } = body;

    if (!validatedById) {
      return NextResponse.json(
        { error: "validatedById is required" },
        { status: 400 }
      );
    }

    // Get current instance
    const existing = await prisma.sOPInstance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SOP Instance not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed instances can be validated" },
        { status: 400 }
      );
    }

    // Update instance
    const updated = await prisma.sOPInstance.update({
      where: { id },
      data: {
        status: "VALIDATED",
        validatedById,
        validatedAt: new Date(),
        validationNotes,
        version: existing.version + 1,
      },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        validatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await prisma.sOPInstanceHistory.create({
      data: {
        instanceId: id,
        version: updated.version,
        action: "validated",
        description: `Instance validée${validationNotes ? `: ${validationNotes}` : ""}`,
        userId: validatedById,
        statusBefore: existing.status,
        statusAfter: "VALIDATED",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error validating SOP instance:", error);
    return NextResponse.json(
      { error: "Failed to validate SOP instance" },
      { status: 500 }
    );
  }
}
