import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users/[id] - Get single user with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await db.user.findUnique({
      where: { id },
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
        badges: {
          include: {
            badge: true,
          },
          orderBy: { earnedAt: "desc" },
        },
        metrics: {
          orderBy: { date: "desc" },
          take: 30,
        },
        _count: {
          select: {
            assignedAlerts: true,
            investigations: true,
            createdSOPs: true,
            tasks: true,
          },
        },
        createdAt: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const user = await db.user.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        avatarUrl: body.avatarUrl,
        teamId: body.teamId,
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
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.user.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
