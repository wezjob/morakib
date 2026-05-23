import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deleteGovernanceDoc,
  getGovernanceDocById,
  updateGovernanceDoc,
} from "@/lib/governance-store";
import { GovernanceSectionKey } from "@/data/governance-docs";

function isAllowedRole(role?: string) {
  return role === "ADMIN" || role === "LEAD";
}

function parseSection(section?: string): GovernanceSectionKey | undefined {
  if (!section) return undefined;
  if (
    section === "foundations" ||
    section === "organization" ||
    section === "processes" ||
    section === "metrics" ||
    section === "compliance" ||
    section === "roadmap"
  ) {
    return section;
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await getGovernanceDocById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching governance doc:", error);
    return NextResponse.json({ error: "Failed to fetch governance doc" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!session?.user || !isAllowedRole(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await getGovernanceDocById(id);
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (existing.workflowStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Document approved is locked. Reset workflow to DRAFT before editing." },
        { status: 409 }
      );
    }

    const updated = await updateGovernanceDoc(id, {
      code: typeof body.code === "string" ? body.code : undefined,
      section: parseSection(body.section),
      title: typeof body.title === "string" ? body.title : undefined,
      objective: typeof body.objective === "string" ? body.objective : undefined,
      alignment: typeof body.alignment === "string" ? body.alignment : undefined,
      details: Array.isArray(body.details)
        ? body.details.map((item: unknown) => String(item)).filter(Boolean)
        : undefined,
      sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : undefined,
    }, {
      id: (session.user as any).id,
      name: session.user.name || session.user.email || "Utilisateur",
      role: userRole,
    });

    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating governance doc:", error);
    return NextResponse.json({ error: "Failed to update governance doc" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!session?.user || !isAllowedRole(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getGovernanceDocById(id);

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (existing.workflowStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Document approved is locked. Reset workflow to DRAFT before deleting." },
        { status: 409 }
      );
    }

    await deleteGovernanceDoc(id, {
      id: (session.user as any).id,
      name: session.user.name || session.user.email || "Utilisateur",
      role: userRole,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting governance doc:", error);
    return NextResponse.json({ error: "Failed to delete governance doc" }, { status: 500 });
  }
}
