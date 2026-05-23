import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SOPStatus } from "@/generated/prisma";

// GET /api/sops - List all SOPs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const category = searchParams.get("category");
    const excludeCategory = searchParams.get("excludeCategory");
    const status = searchParams.get("status") as SOPStatus | null;
    const search = searchParams.get("search");
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    } else if (excludeCategory) {
      where.NOT = { category: excludeCategory };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contentMarkdown: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
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

    if (!body?.title || !body?.category) {
      return NextResponse.json(
        { error: "title and category are required" },
        { status: 400 }
      );
    }
    
    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let createdById = body.createdById as string | undefined;

    // Demo sessions may use synthetic ids (e.g. demo-admin@morakib.local).
    if (!createdById || createdById.startsWith("demo-")) {
      let demoUser = await db.user.findFirst({
        where: { email: "demo@morakib.local" },
      });

      if (!demoUser) {
        demoUser = await db.user.create({
          data: {
            email: "demo@morakib.local",
            name: "Utilisateur Demo",
            role: "ANALYST_JUNIOR",
          },
        });
      }

      createdById = demoUser.id;
    }

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
        createdById,
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
