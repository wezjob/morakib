import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get alert counts by status
    const [
      totalAlerts,
      newAlerts,
      inProgressAlerts,
      escalatedAlerts,
      closedAlerts,
      criticalAlerts,
      highAlerts,
      alertsToday,
      alertsYesterday,
    ] = await Promise.all([
      db.alert.count(),
      db.alert.count({ where: { status: "NEW" } }),
      db.alert.count({ where: { status: "INVESTIGATING" } }),
      db.alert.count({ where: { status: "ESCALATED" } }),
      db.alert.count({ where: { status: "RESOLVED" } }),
      db.alert.count({ where: { severity: "CRITICAL" } }),
      db.alert.count({ where: { severity: "HIGH" } }),
      db.alert.count({ where: { createdAt: { gte: today } } }),
      db.alert.count({ 
        where: { 
          createdAt: { gte: yesterday, lt: today } 
        } 
      }),
    ]);
    
    // Get recent alerts
    const recentAlerts = await db.alert.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
    
    // Get investigation stats
    const investigationsThisWeek = await db.investigation.count({
      where: { createdAt: { gte: weekAgo } },
    });
    
    // Get team leaderboard
    const leaderboard = await db.analystMetric.groupBy({
      by: ["analystId"],
      where: { date: { gte: weekAgo } },
      _sum: {
        alertsProcessed: true,
        truePositives: true,
        falsePositives: true,
      },
      orderBy: {
        _sum: {
          alertsProcessed: "desc",
        },
      },
      take: 5,
    });
    
    // Get analyst details for leaderboard
    const analystIds = leaderboard.map((l) => l.analystId);
    const analysts = await db.user.findMany({
      where: { id: { in: analystIds } },
      select: { id: true, name: true, avatarUrl: true, role: true },
    });
    
    const leaderboardWithNames = leaderboard.map((entry) => {
      const analyst = analysts.find((a) => a.id === entry.analystId);
      return {
        analyst,
        alertsProcessed: entry._sum.alertsProcessed || 0,
        truePositives: entry._sum.truePositives || 0,
        falsePositives: entry._sum.falsePositives || 0,
      };
    });
    
    // Get SOP stats
    const [totalSOPs, publishedSOPs] = await Promise.all([
      db.sOP.count(),
      db.sOP.count({ where: { status: "PUBLISHED" } }),
    ]);
    
    // Calculate trends
    const alertTrend = alertsYesterday > 0 
      ? Math.round(((alertsToday - alertsYesterday) / alertsYesterday) * 100) 
      : 0;
    
    return NextResponse.json({
      alerts: {
        total: totalAlerts,
        new: newAlerts,
        inProgress: inProgressAlerts,
        escalated: escalatedAlerts,
        closed: closedAlerts,
        critical: criticalAlerts,
        high: highAlerts,
        today: alertsToday,
        trend: alertTrend,
      },
      investigations: {
        thisWeek: investigationsThisWeek,
      },
      sops: {
        total: totalSOPs,
        published: publishedSOPs,
      },
      recentAlerts,
      leaderboard: leaderboardWithNames,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
