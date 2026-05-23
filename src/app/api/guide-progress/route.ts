import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

function buildDefaultGuideProgress() {
  return {
    currentStep: 1,
    completedSteps: [],
    checklistState: {},
    completed: false,
    completionPercentage: 0,
  };
}

// GET - Récupérer la progression des guides/labs d'un utilisateur
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guideId = searchParams.get("guideId");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // If guideId is provided, get specific progress
    if (guideId) {
      const progress = await db.guideProgress.findFirst({
        where: {
          userId: session.user.id,
          guideId
        }
      });
      return NextResponse.json(progress || buildDefaultGuideProgress());
    }

    // Otherwise return all guide progress for this user
    const allProgress = await db.guideProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(allProgress);

  } catch (error) {
    console.error("Error fetching guide progress:", error);
    // Keep labs/guides usable when DB is temporarily unavailable.
    if (guideId) {
      return NextResponse.json(buildDefaultGuideProgress(), { status: 200 });
    }
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Sauvegarder ou créer la progression d'un guide
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      guideId, 
      currentStep, 
      totalSteps,
      completedSteps, 
      checklistState, 
      quizResults,
      exerciseResults,
      completed,
      score,
      totalTimeSeconds
    } = body;

    if (!guideId) {
      return NextResponse.json({ error: "guideId requis" }, { status: 400 });
    }

    // Calculate completion percentage
    const completionPercentage = totalSteps > 0 
      ? Math.round((completedSteps?.length || 0) / totalSteps * 100) 
      : 0;

    const existingProgress = await db.guideProgress.findFirst({
      where: {
        userId: session.user.id,
        guideId
      }
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      progress = await db.guideProgress.update({
        where: { id: existingProgress.id },
        data: {
          currentStep: currentStep ?? existingProgress.currentStep,
          completedSteps: completedSteps ?? existingProgress.completedSteps,
          checklistState: checklistState ?? existingProgress.checklistState,
          quizResults: quizResults ?? existingProgress.quizResults,
          exerciseResults: exerciseResults ?? existingProgress.exerciseResults,
          completionPercentage,
          totalTimeSeconds: totalTimeSeconds ?? existingProgress.totalTimeSeconds,
          completed: completed ?? existingProgress.completed,
          score: score ?? existingProgress.score,
          completedAt: completed ? new Date() : existingProgress.completedAt,
        }
      });
    } else {
      // Create new progress
      progress = await db.guideProgress.create({
        data: {
          userId: session.user.id,
          guideId,
          currentStep: currentStep ?? 1,
          totalSteps: totalSteps ?? 1,
          completedSteps: completedSteps ?? [],
          checklistState: checklistState ?? {},
          quizResults: quizResults ?? null,
          exerciseResults: exerciseResults ?? null,
          completionPercentage,
          totalTimeSeconds: totalTimeSeconds ?? 0,
          completed: completed ?? false,
          score: score ?? null,
        }
      });
    }

    return NextResponse.json(progress);

  } catch (error) {
    console.error("Error saving guide progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Compléter une étape ou un exercice
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { guideId, stepId, exerciseId, answer, isCorrect, totalSteps } = body;

    if (!guideId) {
      return NextResponse.json({ error: "guideId requis" }, { status: 400 });
    }

    const existingProgress = await db.guideProgress.findFirst({
      where: {
        userId: session.user.id,
        guideId
      }
    });

    if (!existingProgress) {
      // Create new progress if it doesn't exist
      const newProgress = await db.guideProgress.create({
        data: {
          userId: session.user.id,
          guideId,
          currentStep: 1,
          totalSteps: totalSteps ?? 1,
          completedSteps: stepId ? [stepId] : [],
          checklistState: {},
          exerciseResults: exerciseId ? { [exerciseId]: { answer, isCorrect } } : {},
          completionPercentage: stepId && totalSteps ? Math.round(1 / totalSteps * 100) : 0,
        }
      });
      return NextResponse.json(newProgress);
    }

    // Update progress with completed step
    const currentCompletedSteps = existingProgress.completedSteps as number[] || [];
    const currentExerciseResults = (existingProgress.exerciseResults as Record<string, any>) || {};
    
    let updatedCompletedSteps = currentCompletedSteps;
    if (stepId && !currentCompletedSteps.includes(stepId)) {
      updatedCompletedSteps = [...currentCompletedSteps, stepId];
    }

    let updatedExerciseResults = currentExerciseResults;
    if (exerciseId) {
      updatedExerciseResults = {
        ...currentExerciseResults,
        [exerciseId]: { answer, isCorrect }
      };
    }

    const completionPercentage = totalSteps > 0 
      ? Math.round(updatedCompletedSteps.length / totalSteps * 100) 
      : 0;

    const progress = await db.guideProgress.update({
      where: { id: existingProgress.id },
      data: {
        completedSteps: updatedCompletedSteps,
        exerciseResults: updatedExerciseResults,
        completionPercentage,
        currentStep: stepId ? Math.max(stepId, existingProgress.currentStep) : existingProgress.currentStep,
        completed: completionPercentage >= 100,
        completedAt: completionPercentage >= 100 ? new Date() : null,
      }
    });

    return NextResponse.json(progress);

  } catch (error) {
    console.error("Error updating guide progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
