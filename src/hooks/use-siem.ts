"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

class APIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs: number = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new APIError("SIEM request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

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
  degraded?: boolean;
  message?: string;
  cacheAgeMs?: number;
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
  degraded?: boolean;
  message?: string;
  cacheAgeMs?: number;
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

  const res = await fetchWithTimeout(`/api/siem/alerts?${params}`);
  if (!res.ok) {
    let message = "Failed to fetch SIEM alerts";
    try {
      const error = await res.json();
      message = error.error || message;
    } catch {
      // Ignore JSON parse errors and keep default message.
    }
    throw new APIError(message, res.status);
  }
  return res.json();
}

// Fetch SIEM stats
async function fetchSIEMStats(
  timeFrom: string = "now-24h",
  timeTo: string = "now"
): Promise<SIEMStatsResponse> {
  const params = new URLSearchParams({ timeFrom, timeTo });
  const res = await fetchWithTimeout(`/api/siem/stats?${params}`);
  if (!res.ok) {
    let message = "Failed to fetch SIEM stats";
    try {
      const error = await res.json();
      message = error.error || message;
    } catch {
      // Ignore JSON parse errors and keep default message.
    }
    throw new APIError(message, res.status);
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
    retry: (failureCount, error) => {
      if (error instanceof APIError && (error.status === 503 || error.status === 504)) {
        return false;
      }
      return failureCount < 1;
    },
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
    retry: (failureCount, error) => {
      if (error instanceof APIError && (error.status === 503 || error.status === 504)) {
        return false;
      }
      return failureCount < 1;
    },
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
