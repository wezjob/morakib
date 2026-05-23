import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function buildFallbackInstances(page: number, limit: number) {
  return {
    instances: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    degraded: true,
  };
}

// GET /api/sop-instances - List all SOP instances with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sopSlug = searchParams.get("sopSlug") || "";
    const mentorId = searchParams.get("mentorId") || "";
    const section = searchParams.get("section") || "";

    const andFilters: Record<string, unknown>[] = [];

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { subjectName: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status && status !== "all") {
      andFilters.push({ status });
    }

    if (sopSlug) {
      andFilters.push({ sopSlug });
    }

    if (mentorId) {
      andFilters.push({ mentorId });
    }

    if (section === "playbooks") {
      andFilters.push({
        OR: [
          { sopSlug: { startsWith: "nist-playbook" } },
          { sopTitle: { contains: "NIST Playbook", mode: "insensitive" } },
        ],
      });
    }

    if (section === "sops") {
      andFilters.push({
        NOT: {
          OR: [
            { sopSlug: { startsWith: "nist-playbook" } },
            { sopTitle: { contains: "NIST Playbook", mode: "insensitive" } },
          ],
        },
      });
    }

    const where = andFilters.length ? { AND: andFilters } : {};

    const [instances, total] = await Promise.all([
      prisma.sOPInstance.findMany({
        where,
        include: {
          mentor: {
            select: { id: true, name: true, email: true, role: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          validatedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { history: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sOPInstance.count({ where }),
    ]);

    return NextResponse.json({
      instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching SOP instances:", error);
    return NextResponse.json(buildFallbackInstances(page, limit), { status: 200 });
  }
}

// POST /api/sop-instances - Create a new SOP instance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Creating SOP instance with data:", JSON.stringify(body, null, 2));
    
    let {
      sopSlug,
      sopTitle,
      sopVersion,
      title,
      subjectName,
      subjectEmail,
      subjectRole,
      subjectInfo,
      mentorId,
      createdById,
      totalSteps,
      dueDate,
      notes,
    } = body;

    // Validate required fields
    if (!sopSlug || !sopTitle || !subjectName) {
      return NextResponse.json(
        { error: "sopSlug, sopTitle and subjectName are required" },
        { status: 400 }
      );
    }

    // If no createdById provided, find or create a demo user
    if (!createdById || createdById === "demo-user-id") {
      let demoUser = await prisma.user.findFirst({
        where: { email: "demo@morakib.local" },
      });
      
      if (!demoUser) {
        console.log("Creating demo user...");
        demoUser = await prisma.user.create({
          data: {
            email: "demo@morakib.local",
            name: "Utilisateur Demo",
            role: "ANALYST_JUNIOR",
          },
        });
        console.log("Demo user created:", demoUser.id);
      } else {
        console.log("Demo user found:", demoUser.id);
      }
      createdById = demoUser.id;
    }
    
    console.log("Using createdById:", createdById);

    // Generate unique reference
    const year = new Date().getFullYear();
    const count = await prisma.sOPInstance.count({
      where: {
        sopSlug,
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });
    const slugPrefix = sopSlug.substring(0, 3).toUpperCase();
    const instancePrefix = sopSlug.startsWith("nist-playbook") ? "PBK" : "SOP";
    const reference = `${instancePrefix}-${slugPrefix}-${year}-${String(count + 1).padStart(3, "0")}`;

    // Create the instance
    const instance = await prisma.sOPInstance.create({
      data: {
        sopSlug,
        sopTitle,
        sopVersion: sopVersion || "1.0",
        title: title || `${sopTitle} - ${subjectName}`,
        reference,
        subjectName,
        subjectEmail: subjectEmail || null,
        subjectRole: subjectRole || null,
        subjectInfo: subjectInfo || {},
        mentorId: mentorId || null, // Ensure empty string becomes null
        createdById,
        totalSteps: totalSteps || 1,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        status: "DRAFT",
      },
      include: {
        mentor: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create initial history entry
    await prisma.sOPInstanceHistory.create({
      data: {
        instanceId: instance.id,
        version: 1,
        action: "created",
        description: `Instance créée pour ${subjectName}`,
        userId: createdById,
        statusAfter: "DRAFT",
      },
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error("Error creating SOP instance:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create SOP instance", details: errorMessage },
      { status: 500 }
    );
  }
}
