"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  alerts: {
    total: number;
    new: number;
    inProgress: number;
    escalated: number;
    closed: number;
    critical: number;
    high: number;
    today: number;
    yesterday: number;
    trend: number;
  };
  investigations: {
    thisWeek: number;
  };
  recentAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
    assignedTo?: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  leaderboard: Array<{
    analyst: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
    alertsProcessed: number;
    truePositives: number;
    falsePositives: number;
  }>;
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
