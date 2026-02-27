import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AlertStatus, AlertSeverity, AlertSource } from "@/generated/prisma";

// GET /api/alerts - List all alerts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get("status") as AlertStatus | null;
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const source = searchParams.get("source") as AlertSource | null;
    const assignedTo = searchParams.get("assignedTo");
    const search = searchParams.get("search");
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (assignedTo) where.assignedToId = assignedTo;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sourceIp: { contains: search } },
        { destIp: { contains: search } },
      ];
    }
    
    // Query
    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          investigations: {
            select: { id: true, conclusion: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.alert.count({ where }),
    ]);
    
    return NextResponse.json({
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const alert = await db.alert.create({
      data: {
        title: body.title,
        description: body.description,
        severity: body.severity || "MEDIUM",
        status: body.status || "NEW",
        source: body.source || "CUSTOM",
        sourceIp: body.sourceIp,
        destIp: body.destIp,
        sourcePort: body.sourcePort,
        destPort: body.destPort,
        protocol: body.protocol,
        ruleName: body.ruleName,
        ruleId: body.ruleId,
        rawLog: body.rawLog,
        enrichmentData: body.enrichmentData,
        elasticsearchId: body.elasticsearchId,
        assignedToId: body.assignedToId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
