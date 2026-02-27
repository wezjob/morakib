import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/sops/[id] - Get single SOP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const sop = await db.sOP.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        investigations: {
          select: {
            id: true,
            conclusion: true,
            createdAt: true,
            analyst: {
              select: { id: true, name: true },
            },
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { investigations: true },
        },
      },
    });
    
    if (!sop) {
      return NextResponse.json(
        { error: "SOP not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(sop);
  } catch (error) {
    console.error("Error fetching SOP:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOP" },
      { status: 500 }
    );
  }
}

// PUT /api/sops/[id] - Update SOP
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const sop = await db.sOP.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        contentMarkdown: body.contentMarkdown || body.description,
        category: body.category,
        alertTypes: body.alertTypes,
        checklist: body.checklist,
        examples: body.examples,
        status: body.status,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json(sop);
  } catch (error) {
    console.error("Error updating SOP:", error);
    return NextResponse.json(
      { error: "Failed to update SOP" },
      { status: 500 }
    );
  }
}

// DELETE /api/sops/[id] - Delete SOP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.sOP.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting SOP:", error);
    return NextResponse.json(
      { error: "Failed to delete SOP" },
      { status: 500 }
    );
  }
}
