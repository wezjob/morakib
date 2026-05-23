import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Personal KPI API - Returns KPIs for the current user only
 * 
 * Query params:
 * - period: "day" | "week" | "month" | "quarter" | "year" | "all"
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    // Fetch user's data only
    const [
      user,
      sopInstances,
      guideProgress,
      alerts,
      analystMetrics,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          team: { select: { id: true, name: true } },
        }
      }),
      prisma.sOPInstance.findMany({
        where: {
          createdById: userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          sopSlug: true,
          status: true,
          completionPercent: true,
          createdAt: true,
          completedAt: true,
          startedAt: true,
        }
      }),
      prisma.guideProgress.findMany({
        where: {
          userId: userId,
          startedAt: { gte: startDate }
        },
        select: {
          id: true,
          guideId: true,
          completionPercentage: true,
          completed: true,
          score: true,
          totalTimeSeconds: true,
          startedAt: true,
          completedAt: true,
        }
      }),
      prisma.alert.findMany({
        where: {
          assignedToId: userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          severity: true,
          createdAt: true,
          resolvedAt: true,
        }
      }),
      prisma.analystMetric.findMany({
        where: {
          analystId: userId,
          date: { gte: startDate }
        },
        select: {
          id: true,
          alertsProcessed: true,
          truePositives: true,
          falsePositives: true,
          escalations: true,
          avgResolutionTimeMin: true,
          date: true,
        }
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate personal KPIs
    const sopsCompleted = sopInstances.filter(s => s.status === "COMPLETED").length;
    const sopsTotal = sopInstances.length;
    const sopCompletionRate = sopsTotal > 0 ? Math.round((sopsCompleted / sopsTotal) * 100) : 0;

    const tpsCompleted = guideProgress.filter(g => g.completed).length;
    const tpsTotal = guideProgress.length;
    const tpSuccessRate = tpsTotal > 0 ? Math.round((tpsCompleted / tpsTotal) * 100) : 0;
    
    const completedTPs = guideProgress.filter(g => g.completed && g.score !== null);
    const avgTPScore = completedTPs.length > 0
      ? Math.round(completedTPs.reduce((acc, g) => acc + (g.score || 0), 0) / completedTPs.length)
      : 0;

    const alertsAssigned = alerts.length;
    const alertsResolved = alerts.filter(a => a.status === "RESOLVED").length;
    const alertClosureRate = alertsAssigned > 0 ? Math.round((alertsResolved / alertsAssigned) * 100) : 0;

    const resolvedAlerts = alerts.filter(a => a.resolvedAt && a.createdAt);
    const mttr = resolvedAlerts.length > 0
      ? Math.round(resolvedAlerts.reduce((acc, a) => {
          return acc + (new Date(a.resolvedAt!).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60);
        }, 0) / resolvedAlerts.length)
      : 0;

    const totalProcessed = analystMetrics.reduce((acc, m) => acc + m.alertsProcessed, 0);
    const truePos = analystMetrics.reduce((acc, m) => acc + m.truePositives, 0);
    const falsePos = analystMetrics.reduce((acc, m) => acc + m.falsePositives, 0);
    const accuracyRate = (truePos + falsePos) > 0
      ? Math.round((truePos / (truePos + falsePos)) * 100)
      : 0;

    // Daily trends (last 14 days)
    const dailyTrends: { date: string; sops: number; tps: number; alerts: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySops = sopInstances.filter(s => {
        const d = new Date(s.createdAt);
        return d >= date && d < nextDate;
      }).length;
      
      const dayTPs = guideProgress.filter(g => {
        const d = new Date(g.startedAt);
        return d >= date && d < nextDate;
      }).length;
      
      const dayAlerts = alerts.filter(a => {
        const d = new Date(a.createdAt);
        return d >= date && d < nextDate;
      }).length;
      
      dailyTrends.push({ date: dateStr, sops: daySops, tps: dayTPs, alerts: dayAlerts });
    }

    return NextResponse.json({
      role: userRole,
      period,
      startDate: startDate.toISOString(),
      summary: {
        sopsCompleted,
        sopsTotal,
        sopCompletionRate,
        tpsCompleted,
        tpsTotal,
        tpSuccessRate,
        avgTPScore,
        alertsAssigned,
        alertsResolved,
        alertClosureRate,
        mttr,
        accuracyRate,
        productivity: totalProcessed,
      },
      dailyTrends,
      personal: {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
        team: user.team?.name || null,
        kpis: {
          sopsCompleted,
          sopsTotal,
          sopCompletionRate,
          tpsCompleted,
          tpsTotal,
          tpSuccessRate,
          avgTPScore,
          alertsAssigned,
          alertsResolved,
          alertClosureRate,
          mttr,
          accuracyRate,
          productivity: totalProcessed,
        }
      }
    });
  } catch (error) {
    console.error("Error fetching personal KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs", details: String(error) },
      { status: 500 }
    );
  }
}
