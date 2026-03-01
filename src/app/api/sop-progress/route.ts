import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET - Récupérer la progression d'un utilisateur pour une SOP
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sopSlug = searchParams.get("sopSlug");

    // If sopSlug is provided, get specific progress
    if (sopSlug) {
      const progress = await db.sOPProgress.findFirst({
        where: {
          userId: session.user.id,
          sopSlug
        }
      });
      return NextResponse.json(progress || { checklistState: {}, completed: false });
    }

    // Otherwise return all progress for this user
    const allProgress = await db.sOPProgress.findMany({
      where: { userId: session.user.id }
    });

    return NextResponse.json(allProgress);

  } catch (error) {
    console.error("Error fetching SOP progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Sauvegarder la progression
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { sopSlug, checklistState, activeStep, startTime, completed, elapsedSeconds } = body;

    if (!sopSlug) {
      return NextResponse.json({ error: "sopSlug requis" }, { status: 400 });
    }

    // Calculate completion percentage
    let completedTasks = 0;
    let totalTasks = 0;
    if (checklistState) {
      Object.values(checklistState).forEach((stepState: unknown) => {
        const state = stepState as Record<string, boolean>;
        Object.values(state).forEach((checked: boolean) => {
          totalTasks++;
          if (checked) completedTasks++;
        });
      });
    }
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Upsert progress
    const progress = await db.sOPProgress.upsert({
      where: {
        userId_sopSlug: {
          userId: session.user.id,
          sopSlug
        }
      },
      update: {
        checklistState: checklistState || {},
        activeStep: activeStep || 1,
        startedAt: startTime ? new Date(startTime) : undefined,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        elapsedSeconds: elapsedSeconds || 0,
        completionPercentage,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        sopSlug,
        checklistState: checklistState || {},
        activeStep: activeStep || 1,
        startedAt: startTime ? new Date(startTime) : new Date(),
        completed: completed || false,
        completedAt: completed ? new Date() : null,
        elapsedSeconds: elapsedSeconds || 0,
        completionPercentage
      }
    });

    return NextResponse.json(progress);

  } catch (error) {
    console.error("Error saving SOP progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Réinitialiser la progression
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sopSlug = searchParams.get("sopSlug");

    if (!sopSlug) {
      return NextResponse.json({ error: "sopSlug requis" }, { status: 400 });
    }

    await db.sOPProgress.deleteMany({
      where: {
        userId: session.user.id,
        sopSlug
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting SOP progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
