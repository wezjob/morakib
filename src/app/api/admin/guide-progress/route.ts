import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { allLabs } from "@/data/labs";

// GET - Récupérer la progression de tous les utilisateurs (Admin/Lead seulement)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est Admin ou Lead
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'LEAD'].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé - Admin ou Lead requis" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const guideId = searchParams.get("guideId");

    // Si userId spécifié, retourner la progression de cet utilisateur
    if (userId) {
      const userProgress = await db.guideProgress.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true
            }
          },
          validatedBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return NextResponse.json(userProgress);
    }

    // Si guideId spécifié, retourner tous les utilisateurs pour ce guide
    if (guideId) {
      const guideProgress = await db.guideProgress.findMany({
        where: { guideId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true
            }
          },
          validatedBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { completionPercentage: 'desc' }
      });

      return NextResponse.json(guideProgress);
    }

    // Sinon, retourner les statistiques globales
    const [
      allProgress,
      totalUsers,
      usersWithProgress
    ] = await Promise.all([
      db.guideProgress.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      db.user.count(),
      db.guideProgress.groupBy({
        by: ['userId'],
        _count: { id: true }
      })
    ]);

    // Calculer les statistiques par guide
    const guideStats = allLabs.map(lab => {
      const labProgress = allProgress.filter(p => p.guideId === lab.id);
      const completedCount = labProgress.filter(p => p.completed).length;
      const inProgressCount = labProgress.filter(p => !p.completed && p.completionPercentage > 0).length;
      const notStartedCount = totalUsers - labProgress.length;
      const avgCompletion = labProgress.length > 0
        ? Math.round(labProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / labProgress.length)
        : 0;

      return {
        guideId: lab.id,
        guideTitle: lab.title,
        category: lab.category,
        difficulty: lab.difficulty,
        completedCount,
        inProgressCount,
        notStartedCount,
        totalUsers,
        avgCompletion
      };
    });

    // Calculer les statistiques par utilisateur
    const userStats = await db.user.findMany({
      where: {
        role: {
          in: ['ANALYST_JUNIOR', 'ANALYST_SENIOR']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        guideProgress: {
          select: {
            guideId: true,
            completionPercentage: true,
            completed: true,
            score: true,
            totalTimeSeconds: true,
            validatedAt: true
          }
        }
      }
    });

    const userStatsFormatted = userStats.map(u => {
      const completedGuides = u.guideProgress.filter(p => p.completed).length;
      const totalGuides = allLabs.length;
      const avgScore = u.guideProgress.filter(p => p.score !== null).length > 0
        ? Math.round(
            u.guideProgress
              .filter(p => p.score !== null)
              .reduce((sum, p) => sum + (p.score || 0), 0) / 
            u.guideProgress.filter(p => p.score !== null).length
          )
        : null;
      const totalTime = u.guideProgress.reduce((sum, p) => sum + p.totalTimeSeconds, 0);
      const validatedCount = u.guideProgress.filter(p => p.validatedAt !== null).length;

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
        completedGuides,
        totalGuides,
        completionRate: Math.round((completedGuides / totalGuides) * 100),
        avgScore,
        totalTimeMinutes: Math.round(totalTime / 60),
        validatedCount,
        progress: u.guideProgress
      };
    });

    return NextResponse.json({
      guideStats,
      userStats: userStatsFormatted,
      summary: {
        totalUsers,
        usersWithProgress: usersWithProgress.length,
        totalGuides: allLabs.length,
        avgCompletionRate: guideStats.length > 0
          ? Math.round(guideStats.reduce((sum, g) => sum + g.avgCompletion, 0) / guideStats.length)
          : 0
      }
    });

  } catch (error) {
    console.error("Error fetching admin guide progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Valider la progression d'un utilisateur (Admin/Lead seulement)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est Admin ou Lead
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'LEAD'].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé - Admin ou Lead requis" }, { status: 403 });
    }

    const body = await req.json();
    const { progressId, validationNotes } = body;

    if (!progressId) {
      return NextResponse.json({ error: "progressId requis" }, { status: 400 });
    }

    // Valider la progression
    const progress = await db.guideProgress.update({
      where: { id: progressId },
      data: {
        validatedById: session.user.id,
        validatedAt: new Date(),
        validationNotes: validationNotes || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        validatedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(progress);

  } catch (error) {
    console.error("Error validating guide progress:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
