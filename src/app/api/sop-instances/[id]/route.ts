import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sop-instances/[id] - Get single instance
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const instance = await prisma.sOPInstance.findUnique({
      where: { id },
      include: {
        mentor: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        validatedBy: {
          select: { id: true, name: true, email: true },
        },
        history: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "SOP Instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error fetching SOP instance:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOP instance" },
      { status: 500 }
    );
  }
}

// PUT /api/sop-instances/[id] - Update instance
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      currentStep,
      completionPercent,
      formData,
      checklistState,
      notes,
      status,
      mentorId,
      userId, // Who is making this update
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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

    // Build update data
    const updateData: Record<string, unknown> = {
      version: existing.version + 1,
    };

    if (currentStep !== undefined) updateData.currentStep = currentStep;
    if (completionPercent !== undefined) updateData.completionPercent = completionPercent;
    if (formData !== undefined) updateData.formData = formData;
    if (checklistState !== undefined) updateData.checklistState = checklistState;
    if (notes !== undefined) updateData.notes = notes;
    if (mentorId !== undefined) updateData.mentorId = mentorId;

    // Handle status change
    if (status !== undefined && status !== existing.status) {
      updateData.status = status;
      
      if (status === "IN_PROGRESS" && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (status === "COMPLETED") {
        updateData.completedAt = new Date();
        updateData.completionPercent = 100;
      }
    }

    // Update instance
    const updated = await prisma.sOPInstance.update({
      where: { id },
      data: updateData,
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    
    if (currentStep !== undefined && currentStep !== existing.currentStep) {
      changes.currentStep = { old: existing.currentStep, new: currentStep };
    }
    if (completionPercent !== undefined && completionPercent !== existing.completionPercent) {
      changes.completionPercent = { old: existing.completionPercent, new: completionPercent };
    }
    if (status !== undefined && status !== existing.status) {
      changes.status = { old: existing.status, new: status };
    }

    let action = "updated";
    let description = "Mise à jour de l'instance";
    
    if (status === "COMPLETED") {
      action = "completed";
      description = "Instance complétée";
    } else if (currentStep !== undefined && currentStep !== existing.currentStep) {
      action = "step_completed";
      description = `Étape ${currentStep} atteinte`;
    }

    await prisma.sOPInstanceHistory.create({
      data: {
        instanceId: id,
        version: updated.version,
        action,
        description,
        userId,
        formDataSnapshot: formData,
        checklistSnapshot: checklistState,
        statusBefore: existing.status,
        statusAfter: status || existing.status,
        changes: JSON.parse(JSON.stringify(changes)),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating SOP instance:", error);
    return NextResponse.json(
      { error: "Failed to update SOP instance" },
      { status: 500 }
    );
  }
}

// DELETE /api/sop-instances/[id] - Delete instance
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if exists
    const existing = await prisma.sOPInstance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SOP Instance not found" },
        { status: 404 }
      );
    }

    // Delete (history will cascade)
    await prisma.sOPInstance.delete({
      where: { id },
    });

    return NextResponse.json({ message: "SOP Instance deleted successfully" });
  } catch (error) {
    console.error("Error deleting SOP instance:", error);
    return NextResponse.json(
      { error: "Failed to delete SOP instance" },
      { status: 500 }
    );
  }
}
