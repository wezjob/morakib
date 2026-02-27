import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/alerts/[id] - Get single alert
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const alert = await db.alert.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        investigations: {
          include: {
            analyst: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            sop: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    
    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert" },
      { status: 500 }
    );
  }
}

// PUT /api/alerts/[id] - Update alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const alert = await db.alert.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity,
        status: body.status,
        assignedToId: body.assignedToId,
        enrichmentData: body.enrichmentData,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/[id] - Delete alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.alert.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
