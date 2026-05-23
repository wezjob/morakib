import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getGovernanceDocById,
  setGovernanceDocWorkflow,
  GovernanceWorkflowStatus,
} from "@/lib/governance-store";

function isAllowedRole(role?: string) {
  return role === "ADMIN" || role === "LEAD";
}

function parseStatus(value: string): GovernanceWorkflowStatus | null {
  if (
    value === "DRAFT" ||
    value === "IN_REVIEW_LEAD" ||
    value === "IN_REVIEW_ADMIN" ||
    value === "APPROVED"
  ) {
    return value;
  }
  return null;
}

export async function POST(
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
    const status = parseStatus(String(body.status || ""));

    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "IN_REVIEW_ADMIN" && userRole !== "LEAD") {
      return NextResponse.json({ error: "Only LEAD can perform lead approval" }, { status: 403 });
    }

    if (status === "APPROVED" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only ADMIN/RSSI can perform final approval" }, { status: 403 });
    }

    if (status === "DRAFT" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Only ADMIN/RSSI can unlock approved workflow" }, { status: 403 });
    }

    const existing = await getGovernanceDocById(id);
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (status === "IN_REVIEW_LEAD" && existing.workflowStatus !== "DRAFT") {
      return NextResponse.json({ error: "Lead review can start only from DRAFT" }, { status: 409 });
    }

    if (status === "IN_REVIEW_ADMIN" && existing.workflowStatus !== "IN_REVIEW_LEAD") {
      return NextResponse.json({ error: "Admin review requires lead validation first" }, { status: 409 });
    }

    if (status === "APPROVED" && existing.workflowStatus !== "IN_REVIEW_ADMIN") {
      return NextResponse.json({ error: "Final approval requires admin review stage" }, { status: 409 });
    }

    const updated = await setGovernanceDocWorkflow(
      id,
      status,
      {
        id: (session.user as any).id,
        name: session.user.name || session.user.email || "Utilisateur",
        role: userRole,
      },
      typeof body.signatureLabel === "string" ? body.signatureLabel : undefined
    );

    if (!updated) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error changing governance workflow:", error);
    return NextResponse.json({ error: "Failed to change governance workflow" }, { status: 500 });
  }
}
