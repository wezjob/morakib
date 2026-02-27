import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma";

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const role = searchParams.get("role") as UserRole | null;
    const teamId = searchParams.get("teamId");
    const search = searchParams.get("search");
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (role) where.role = role;
    if (teamId) where.teamId = teamId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        teamId: true,
        team: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            assignedAlerts: true,
            investigations: true,
            badges: true,
          },
        },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role || "ANALYST_JUNIOR",
        avatarUrl: body.avatarUrl,
        teamId: body.teamId,
        keycloakId: body.keycloakId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        teamId: true,
      },
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
