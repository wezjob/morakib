"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Alert, AlertStatus, AlertSeverity } from "@/types";

const API_BASE = "/api/alerts";

interface AlertsFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  source?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

interface AlertsResponse {
  data: Alert[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Fetch alerts with filters
async function fetchAlerts(filters: AlertsFilters = {}): Promise<AlertsResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

// Fetch single alert
async function fetchAlert(id: string): Promise<Alert> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch alert");
  return res.json();
}

// Create alert
async function createAlert(data: Partial<Alert>): Promise<Alert> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create alert");
  return res.json();
}

// Update alert
async function updateAlert({ id, ...data }: Partial<Alert> & { id: string }): Promise<Alert> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update alert");
  return res.json();
}

// Delete alert
async function deleteAlert(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete alert");
}

// Submit investigation
interface InvestigationData {
  alertId: string;
  analystId: string;
  sopId?: string;
  findings: string;
  actions?: string[];
  conclusion: "TRUE_POSITIVE" | "FALSE_POSITIVE" | "NEEDS_ESCALATION" | "INCONCLUSIVE";
  checklistCompleted?: Record<string, boolean>;
  timeSpentMinutes?: number;
}

async function submitInvestigation(data: InvestigationData): Promise<unknown> {
  const res = await fetch(`${API_BASE}/${data.alertId}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit investigation");
  return res.json();
}

// Export to IRIS
interface IRISExportResult {
  success: boolean;
  mock?: boolean;
  message: string;
  case: {
    case_id: number;
    case_name: string;
    case_soc_id: string;
  };
  iocs_added?: number;
}

async function exportToIRIS(alertId: string): Promise<IRISExportResult> {
  const res = await fetch(`${API_BASE}/${alertId}/export-iris`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to export to IRIS");
  return res.json();
}

// Hooks
export function useAlerts(filters: AlertsFilters = {}) {
  return useQuery({
    queryKey: ["alerts", filters],
    queryFn: () => fetchAlerts(filters),
  });
}

export function useAlert(id: string | undefined) {
  return useQuery({
    queryKey: ["alert", id],
    queryFn: () => fetchAlert(id!),
    enabled: !!id,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAlert,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.setQueryData(["alert", data.id], data);
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useSubmitInvestigation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitInvestigation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert", variables.alertId] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useExportToIRIS() {
  return useMutation({
    mutationFn: exportToIRIS,
  });
}
