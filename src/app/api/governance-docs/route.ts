import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createGovernanceDoc,
  listGovernanceDocs,
} from "@/lib/governance-store";
import { GovernanceSectionKey } from "@/data/governance-docs";

function isAllowedRole(role?: string) {
  return role === "ADMIN" || role === "LEAD";
}

function parseSection(section?: string | null): GovernanceSectionKey | undefined {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = parseSection(searchParams.get("section"));
    const search = searchParams.get("search") ?? undefined;

    const docs = await listGovernanceDocs({ section, search });
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error("Error listing governance docs:", error);
    return NextResponse.json({ error: "Failed to load governance docs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!session?.user || !isAllowedRole(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const section = parseSection(body.section);

    if (!body.code || !body.title || !body.objective || !body.alignment || !section) {
      return NextResponse.json(
        { error: "code, title, objective, alignment and valid section are required" },
        { status: 400 }
      );
    }

    const details = Array.isArray(body.details)
      ? body.details.map((item: unknown) => String(item)).filter(Boolean)
      : [];

    const created = await createGovernanceDoc({
      code: String(body.code),
      section,
      title: String(body.title),
      objective: String(body.objective),
      alignment: String(body.alignment),
      details,
      sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : undefined,
    }, {
      id: (session.user as any).id,
      name: session.user.name || session.user.email || "Utilisateur",
      role: userRole,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating governance doc:", error);
    return NextResponse.json({ error: "Failed to create governance doc" }, { status: 500 });
  }
}
