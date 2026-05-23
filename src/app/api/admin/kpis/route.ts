import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * KPI Dashboard API - Comprehensive SOC Metrics
 * 
 * Returns KPIs based on user role:
 * - ADMIN: All personnel KPIs with filtering options
 * - LEAD: Team KPIs only
 * - ANALYST: Personal KPIs only
 * 
 * Query params:
 * - userId: Filter for specific user (Admin only)
 * - teamId: Filter for specific team (Admin only)
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
    const filterUserId = searchParams.get("userId");
    const filterTeamId = searchParams.get("teamId");

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
        startDate = new Date(0); // All time
    }

    // Get user's team if LEAD
    let userTeamId: string | null = null;
    if (userRole === "LEAD") {
      const userWithTeam = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true }
      });
      userTeamId = userWithTeam?.teamId || null;
    }

    // Determine data scope based on role
    let userFilter: any = {};
    
    if (userRole === "ADMIN") {
      if (filterUserId) {
        userFilter = { id: filterUserId };
      } else if (filterTeamId) {
        userFilter = { teamId: filterTeamId };
      }
    } else if (userRole === "LEAD" && userTeamId) {
      userFilter = { teamId: userTeamId };
    } else {
      // Analyst or no team - only their own data
      userFilter = { id: userId };
    }

    // Fetch all required data in parallel
    const [
      users,
      teams,
      sopInstances,
      guideProgress,
      alerts,
      analystMetrics,
    ] = await Promise.all([
      // Users within scope
      prisma.user.findMany({
        where: userFilter,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true,
          team: { select: { id: true, name: true } },
          createdAt: true,
        }
      }),
      // Teams
      prisma.team.findMany({
        select: { id: true, name: true, _count: { select: { members: true } } }
      }),
      // SOP Instances
      prisma.sOPInstance.findMany({
        where: {
          createdById: userFilter.id ? userFilter.id : undefined,
          createdBy: userFilter.teamId ? { teamId: userFilter.teamId } : undefined,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          sopSlug: true,
          status: true,
          completionPercent: true,
          createdById: true,
          createdAt: true,
          completedAt: true,
          startedAt: true,
        }
      }),
      // Training Progress (TP)
      prisma.guideProgress.findMany({
        where: {
          userId: userFilter.id ? userFilter.id : undefined,
          user: userFilter.teamId ? { teamId: userFilter.teamId } : undefined,
          startedAt: { gte: startDate }
        },
        select: {
          id: true,
          guideId: true,
          userId: true,
          completionPercentage: true,
          completed: true,
          score: true,
          totalTimeSeconds: true,
          startedAt: true,
          completedAt: true,
        }
      }),
      // Alerts
      prisma.alert.findMany({
        where: {
          assignedToId: userFilter.id ? userFilter.id : undefined,
          assignedTo: userFilter.teamId ? { teamId: userFilter.teamId } : undefined,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          severity: true,
          assignedToId: true,
          createdAt: true,
          resolvedAt: true,
          assignedAt: true,
        }
      }),
      // Analyst Metrics
      prisma.analystMetric.findMany({
        where: {
          analystId: userFilter.id ? userFilter.id : undefined,
          analyst: userFilter.teamId ? { teamId: userFilter.teamId } : undefined,
          date: { gte: startDate }
        },
        select: {
          id: true,
          analystId: true,
          alertsProcessed: true,
          truePositives: true,
          falsePositives: true,
          escalations: true,
          avgResolutionTimeMin: true,
          date: true,
        }
      }),
    ]);

    // ============ CALCULATE KPIs ============

    // 1. SOPs KPIs
    const sopsCompleted = sopInstances.filter(s => s.status === "COMPLETED").length;
    const sopsInProgress = sopInstances.filter(s => s.status === "IN_PROGRESS").length;
    const sopsTotal = sopInstances.length;
    const sopCompletionRate = sopsTotal > 0 ? Math.round((sopsCompleted / sopsTotal) * 100) : 0;
    
    // Average SOP completion time (in hours)
    const completedSopsWithTime = sopInstances.filter(s => s.completedAt && s.startedAt);
    const avgSopCompletionTime = completedSopsWithTime.length > 0
      ? Math.round(completedSopsWithTime.reduce((acc, s) => {
          const time = (new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime()) / (1000 * 60 * 60);
          return acc + time;
        }, 0) / completedSopsWithTime.length * 10) / 10
      : 0;

    // SOPs by type
    const sopsByType: Record<string, number> = {};
    sopInstances.forEach(s => {
      sopsByType[s.sopSlug] = (sopsByType[s.sopSlug] || 0) + 1;
    });

    // 2. Training/TP KPIs
    const tpsCompleted = guideProgress.filter(g => g.completed).length;
    const tpsInProgress = guideProgress.filter(g => !g.completed && g.completionPercentage > 0).length;
    const tpsTotal = guideProgress.length;
    const tpSuccessRate = tpsTotal > 0 ? Math.round((tpsCompleted / tpsTotal) * 100) : 0;
    
    // Average score
    const completedTPs = guideProgress.filter(g => g.completed && g.score !== null);
    const avgTPScore = completedTPs.length > 0
      ? Math.round(completedTPs.reduce((acc, g) => acc + (g.score || 0), 0) / completedTPs.length)
      : 0;
    
    // Average TP time (in minutes)
    const avgTPTime = completedTPs.length > 0
      ? Math.round(completedTPs.reduce((acc, g) => acc + (g.totalTimeSeconds || 0), 0) / completedTPs.length / 60)
      : 0;

    // 3. Alerts KPIs
    const alertsTotal = alerts.length;
    const alertsResolved = alerts.filter(a => a.status === "RESOLVED").length;
    const alertsPending = alerts.filter(a => a.status === "NEW" || a.status === "ASSIGNED").length;
    const alertsEscalated = alerts.filter(a => a.status === "ESCALATED").length;
    const alertClosureRate = alertsTotal > 0 ? Math.round((alertsResolved / alertsTotal) * 100) : 0;
    
    // MTTR (Mean Time To Resolve) in minutes
    const resolvedAlerts = alerts.filter(a => a.resolvedAt && a.createdAt);
    const mttr = resolvedAlerts.length > 0
      ? Math.round(resolvedAlerts.reduce((acc, a) => {
          const time = (new Date(a.resolvedAt!).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60);
          return acc + time;
        }, 0) / resolvedAlerts.length)
      : 0;

    // Alerts by severity
    const alertsBySeverity: Record<string, number> = {};
    alerts.forEach(a => {
      alertsBySeverity[a.severity] = (alertsBySeverity[a.severity] || 0) + 1;
    });

    // 4. Productivity KPIs from AnalystMetrics
    const totalAlertsProcessed = analystMetrics.reduce((acc, m) => acc + m.alertsProcessed, 0);
    const totalTruePositives = analystMetrics.reduce((acc, m) => acc + m.truePositives, 0);
    const totalFalsePositives = analystMetrics.reduce((acc, m) => acc + m.falsePositives, 0);
    const totalEscalations = analystMetrics.reduce((acc, m) => acc + m.escalations, 0);
    
    const accuracyRate = (totalTruePositives + totalFalsePositives) > 0
      ? Math.round((totalTruePositives / (totalTruePositives + totalFalsePositives)) * 100)
      : 0;

    // Average response time
    const metricsWithResponseTime = analystMetrics.filter(m => m.avgResolutionTimeMin !== null);
    const avgResponseTime = metricsWithResponseTime.length > 0
      ? Math.round(metricsWithResponseTime.reduce((acc, m) => acc + (m.avgResolutionTimeMin || 0), 0) / metricsWithResponseTime.length)
      : 0;

    // 5. Per-user KPIs for tables
    const userKPIs = users.map(user => {
      const userSops = sopInstances.filter(s => s.createdById === user.id);
      const userTPs = guideProgress.filter(g => g.userId === user.id);
      const userAlerts = alerts.filter(a => a.assignedToId === user.id);
      const userMetrics = analystMetrics.filter(m => m.analystId === user.id);
      
      const userSopsCompleted = userSops.filter(s => s.status === "COMPLETED").length;
      const userTPsCompleted = userTPs.filter(t => t.completed).length;
      const userAlertsResolved = userAlerts.filter(a => a.status === "RESOLVED").length;
      
      const userTPScores = userTPs.filter(t => t.completed && t.score !== null);
      const userAvgScore = userTPScores.length > 0
        ? Math.round(userTPScores.reduce((acc, t) => acc + (t.score || 0), 0) / userTPScores.length)
        : 0;
      
      const userResolvedAlerts = userAlerts.filter(a => a.resolvedAt && a.createdAt);
      const userMTTR = userResolvedAlerts.length > 0
        ? Math.round(userResolvedAlerts.reduce((acc, a) => {
            return acc + (new Date(a.resolvedAt!).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60);
          }, 0) / userResolvedAlerts.length)
        : 0;

      const userTotalProcessed = userMetrics.reduce((acc, m) => acc + m.alertsProcessed, 0);
      const userTruePos = userMetrics.reduce((acc, m) => acc + m.truePositives, 0);
      const userFalsePos = userMetrics.reduce((acc, m) => acc + m.falsePositives, 0);
      const userAccuracy = (userTruePos + userFalsePos) > 0
        ? Math.round((userTruePos / (userTruePos + userFalsePos)) * 100)
        : 0;

      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role,
        team: user.team?.name || null,
        teamId: user.teamId,
        kpis: {
          sopsCompleted: userSopsCompleted,
          sopsTotal: userSops.length,
          sopCompletionRate: userSops.length > 0 ? Math.round((userSopsCompleted / userSops.length) * 100) : 0,
          tpsCompleted: userTPsCompleted,
          tpsTotal: userTPs.length,
          tpSuccessRate: userTPs.length > 0 ? Math.round((userTPsCompleted / userTPs.length) * 100) : 0,
          avgTPScore: userAvgScore,
          alertsAssigned: userAlerts.length,
          alertsResolved: userAlertsResolved,
          alertClosureRate: userAlerts.length > 0 ? Math.round((userAlertsResolved / userAlerts.length) * 100) : 0,
          mttr: userMTTR,
          accuracyRate: userAccuracy,
          productivity: userTotalProcessed,
        }
      };
    });

    // 6. Team KPIs (for Admin/Lead)
    const teamKPIs = teams.map(team => {
      const teamUsers = users.filter(u => u.teamId === team.id);
      const teamUserIds = teamUsers.map(u => u.id);
      
      const teamSops = sopInstances.filter(s => teamUserIds.includes(s.createdById));
      const teamTPs = guideProgress.filter(g => teamUserIds.includes(g.userId));
      const teamAlerts = alerts.filter(a => a.assignedToId && teamUserIds.includes(a.assignedToId));
      
      const teamSopsCompleted = teamSops.filter(s => s.status === "COMPLETED").length;
      const teamTPsCompleted = teamTPs.filter(t => t.completed).length;
      const teamAlertsResolved = teamAlerts.filter(a => a.status === "RESOLVED").length;

      return {
        id: team.id,
        name: team.name,
        memberCount: team._count.members,
        kpis: {
          sopsCompleted: teamSopsCompleted,
          sopsTotal: teamSops.length,
          tpsCompleted: teamTPsCompleted,
          tpsTotal: teamTPs.length,
          alertsResolved: teamAlertsResolved,
          alertsTotal: teamAlerts.length,
        }
      };
    });

    // 7. Daily trends (last 14 days)
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

    // Build response based on role
    const response = {
      role: userRole,
      period,
      startDate: startDate.toISOString(),
      
      // Summary KPIs
      summary: {
        // SOPs
        sopsCompleted,
        sopsInProgress,
        sopsTotal,
        sopCompletionRate,
        avgSopCompletionTime,
        
        // Training/TP
        tpsCompleted,
        tpsInProgress,
        tpsTotal,
        tpSuccessRate,
        avgTPScore,
        avgTPTime,
        
        // Alerts
        alertsTotal,
        alertsResolved,
        alertsPending,
        alertsEscalated,
        alertClosureRate,
        mttr,
        
        // Productivity
        totalAlertsProcessed,
        accuracyRate,
        avgResponseTime,
        
        // Personnel (Admin/Lead only)
        ...(userRole !== "ANALYST_JUNIOR" && userRole !== "ANALYST_SENIOR" ? {
          totalPersonnel: users.length,
          totalTeams: teams.length,
        } : {})
      },
      
      // Breakdowns
      sopsByType: Object.entries(sopsByType).map(([slug, count]) => ({ slug, count })),
      alertsBySeverity: Object.entries(alertsBySeverity).map(([severity, count]) => ({ severity, count })),
      
      // Trends
      dailyTrends,
      
      // Detailed data (role-based)
      ...(userRole === "ADMIN" ? {
        users: userKPIs,
        teams: teamKPIs,
      } : userRole === "LEAD" ? {
        users: userKPIs,
        team: teamKPIs.find(t => t.id === userTeamId) || null,
      } : {
        // Analyst - only their own data
        personal: userKPIs.find(u => u.id === userId) || null,
      })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs", details: String(error) },
      { status: 500 }
    );
  }
}
