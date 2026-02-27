import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SOPStatus } from "@/generated/prisma";

// GET /api/sops - List all SOPs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const category = searchParams.get("category");
    const status = searchParams.get("status") as SOPStatus | null;
    const search = searchParams.get("search");
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }
    
    const sops = await db.sOP.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { investigations: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" },
      ],
    });
    
    return NextResponse.json(sops);
  } catch (error) {
    console.error("Error fetching SOPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOPs" },
      { status: 500 }
    );
  }
}

// POST /api/sops - Create a new SOP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const sop = await db.sOP.create({
      data: {
        title: body.title,
        slug,
        contentMarkdown: body.contentMarkdown || body.description || '',
        category: body.category,
        alertTypes: body.alertTypes || [],
        checklist: body.checklist || [],
        examples: body.examples || [],
        status: body.status || "DRAFT",
        createdById: body.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json(sop, { status: 201 });
  } catch (error) {
    console.error("Error creating SOP:", error);
    return NextResponse.json(
      { error: "Failed to create SOP" },
      { status: 500 }
    );
  }
}
