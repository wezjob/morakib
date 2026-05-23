"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types for SIEM data
export interface SIEMAlert {
  id: string;
  index: string;
  timestamp: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: string;
  sourceIP: string | null;
  destinationIP: string | null;
  destinationPort: number | null;
  protocol: string | null;
  mitreTactic: string | null;
  mitreTechnique: string | null;
  category: string | null;
  rawData: Record<string, unknown>;
}

export interface SIEMAlertsResponse {
  alerts: SIEMAlert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timeRange: {
    from: string;
    to: string;
  };
  connected: boolean;
}

export interface SIEMStatsResponse {
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  byHour: { key: string; count: number }[];
  timeRange: {
    from: string;
    to: string;
  };
  connected: boolean;
}

export interface SIEMAlertsFilters {
  page?: number;
  limit?: number;
  severity?: string;
  source?: string;
  search?: string;
  timeFrom?: string;
  timeTo?: string;
}

// Fetch SIEM alerts
async function fetchSIEMAlerts(filters: SIEMAlertsFilters = {}): Promise<SIEMAlertsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.source) params.set("source", filters.source);
  if (filters.search) params.set("search", filters.search);
  if (filters.timeFrom) params.set("timeFrom", filters.timeFrom);
  if (filters.timeTo) params.set("timeTo", filters.timeTo);

  const res = await fetch(`/api/siem/alerts?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch SIEM alerts");
  }
  return res.json();
}

// Fetch SIEM stats
async function fetchSIEMStats(
  timeFrom: string = "now-24h",
  timeTo: string = "now"
): Promise<SIEMStatsResponse> {
  const params = new URLSearchParams({ timeFrom, timeTo });
  const res = await fetch(`/api/siem/stats?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch SIEM stats");
  }
  return res.json();
}

// Hook to fetch SIEM alerts with auto-refresh
export function useSIEMAlerts(filters: SIEMAlertsFilters = {}, refreshInterval: number = 30000) {
  return useQuery({
    queryKey: ["siem-alerts", filters],
    queryFn: () => fetchSIEMAlerts(filters),
    refetchInterval: refreshInterval, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2,
  });
}

// Hook to fetch SIEM stats with auto-refresh
export function useSIEMStats(
  timeFrom: string = "now-24h",
  timeTo: string = "now",
  refreshInterval: number = 60000
) {
  return useQuery({
    queryKey: ["siem-stats", timeFrom, timeTo],
    queryFn: () => fetchSIEMStats(timeFrom, timeTo),
    refetchInterval: refreshInterval, // Auto-refresh every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 2,
  });
}

// Import alert from SIEM to Morakib database
export function useImportSIEMAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: SIEMAlert) => {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: alert.title,
          source: alert.source.toUpperCase(),
          severity: alert.severity,
          sourceIP: alert.sourceIP,
          message: `[Imported from SIEM] ${alert.title}`,
          rawLog: JSON.stringify(alert.rawData),
          timestamp: alert.timestamp,
          status: "NEW",
        }),
      });
      if (!res.ok) throw new Error("Failed to import alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
