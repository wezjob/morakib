import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sop-instances/[id]/history - Get full version history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Check if instance exists
    const instance = await prisma.sOPInstance.findUnique({
      where: { id },
      select: { id: true, title: true, reference: true },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "SOP Instance not found" },
        { status: 404 }
      );
    }

    const [history, total] = await Promise.all([
      prisma.sOPInstanceHistory.findMany({
        where: { instanceId: id },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sOPInstanceHistory.count({
        where: { instanceId: id },
      }),
    ]);

    return NextResponse.json({
      instance,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching SOP instance history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
