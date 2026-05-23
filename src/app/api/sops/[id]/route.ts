import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to find SOP by id or slug
async function findSOP(identifier: string) {
  // First try by id
  let sop = await db.sOP.findUnique({
    where: { id: identifier },
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
  
  // If not found by id, try by slug
  if (!sop) {
    sop = await db.sOP.findUnique({
      where: { slug: identifier },
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
  }
  
  return sop;
}

// GET /api/sops/[id] - Get single SOP (supports id or slug)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sop = await findSOP(id);
    
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

// PUT /api/sops/[id] - Update SOP (supports id or slug)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Find the SOP first to get its actual ID (in case slug was passed)
    const existingSOP = await findSOP(id);
    if (!existingSOP) {
      return NextResponse.json(
        { error: "SOP not found" },
        { status: 404 }
      );
    }
    
    const sop = await db.sOP.update({
      where: { id: existingSOP.id },
      data: {
        title: body.title,
        slug: body.slug,
        contentMarkdown: body.contentMarkdown || body.description,
        category: body.category,
        alertTypes: body.alertTypes || [],
        checklist: body.checklist || [],
        examples: body.examples,
        status: body.status,
        // MITRE ATT&CK fields
        mitreTactics: body.mitreTactics || [],
        mitreTechniques: body.mitreTechniques || [],
        elkQueries: body.elkQueries || [],
        procedures: body.procedures || [],
        detection: body.detection || [],
        mitigation: body.mitigation || [],
        dataSources: body.dataSources || [],
        severity: body.severity || "MEDIUM",
        estimatedTime: body.estimatedTime || null,
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

// DELETE /api/sops/[id] - Delete SOP (supports id or slug)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find the SOP first to get its actual ID
    const existingSOP = await findSOP(id);
    if (!existingSOP) {
      return NextResponse.json(
        { error: "SOP not found" },
        { status: 404 }
      );
    }
    
    await db.sOP.delete({ where: { id: existingSOP.id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting SOP:", error);
    return NextResponse.json(
      { error: "Failed to delete SOP" },
      { status: 500 }
    );
  }
}
