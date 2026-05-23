"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export type SOPInstanceStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "VALIDATED" | "ARCHIVED";

export interface SOPInstance {
  id: string;
  sopSlug: string;
  sopTitle: string;
  sopVersion: string;
  title: string;
  reference: string;
  subjectName: string;
  subjectEmail: string | null;
  subjectRole: string | null;
  subjectInfo: Record<string, unknown> | null;
  mentorId: string | null;
  mentor: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  validatedById: string | null;
  validatedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  status: SOPInstanceStatus;
  currentStep: number;
  totalSteps: number;
  completionPercent: number;
  formData: Record<string, unknown>;
  checklistState: Record<string, boolean>;
  notes: string | null;
  validatedAt: string | null;
  validationNotes: string | null;
  version: number;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    history: number;
  };
  history?: SOPInstanceHistoryEntry[];
}

export interface SOPInstanceHistoryEntry {
  id: string;
  instanceId: string;
  version: number;
  action: string;
  description: string | null;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
    avatarUrl?: string | null;
  };
  formDataSnapshot: Record<string, unknown> | null;
  checklistSnapshot: Record<string, boolean> | null;
  statusBefore: string | null;
  statusAfter: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  createdAt: string;
}

interface SOPInstancesResponse {
  instances: SOPInstance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SOPInstanceHistoryResponse {
  instance: {
    id: string;
    title: string;
    reference: string;
  };
  history: SOPInstanceHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateSOPInstanceData {
  sopSlug: string;
  sopTitle: string;
  sopVersion?: string;
  title?: string;
  subjectName: string;
  subjectEmail?: string;
  subjectRole?: string;
  subjectInfo?: Record<string, unknown>;
  mentorId?: string;
  createdById: string;
  totalSteps?: number;
  dueDate?: string;
  notes?: string;
}

interface UpdateSOPInstanceData {
  currentStep?: number;
  completionPercent?: number;
  formData?: Record<string, unknown>;
  checklistState?: Record<string, boolean>;
  notes?: string;
  status?: SOPInstanceStatus;
  mentorId?: string;
  userId: string;
}

// Fetch SOP instances
async function fetchSOPInstances(params: {
  search?: string;
  status?: string;
  sopSlug?: string;
  mentorId?: string;
  section?: "sops" | "playbooks";
  page?: number;
  limit?: number;
}): Promise<SOPInstancesResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.sopSlug) searchParams.set("sopSlug", params.sopSlug);
  if (params.mentorId) searchParams.set("mentorId", params.mentorId);
  if (params.section) searchParams.set("section", params.section);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  
  const res = await fetch(`/api/sop-instances?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch SOP instances");
  return res.json();
}

// Fetch single SOP instance
async function fetchSOPInstance(id: string): Promise<SOPInstance> {
  const res = await fetch(`/api/sop-instances/${id}`);
  if (!res.ok) throw new Error("Failed to fetch SOP instance");
  return res.json();
}

// Fetch SOP instance history
async function fetchSOPInstanceHistory(
  id: string,
  page: number = 1
): Promise<SOPInstanceHistoryResponse> {
  const res = await fetch(`/api/sop-instances/${id}/history?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

// Create SOP instance
async function createSOPInstance(data: CreateSOPInstanceData): Promise<SOPInstance> {
  const res = await fetch("/api/sop-instances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create SOP instance");
  }
  return res.json();
}

// Update SOP instance
async function updateSOPInstance(
  id: string,
  data: UpdateSOPInstanceData
): Promise<SOPInstance> {
  const res = await fetch(`/api/sop-instances/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update SOP instance");
  }
  return res.json();
}

// Validate SOP instance
async function validateSOPInstance(
  id: string,
  data: { validatedById: string; validationNotes?: string }
): Promise<SOPInstance> {
  const res = await fetch(`/api/sop-instances/${id}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to validate SOP instance");
  }
  return res.json();
}

// Delete SOP instance
async function deleteSOPInstance(id: string): Promise<void> {
  const res = await fetch(`/api/sop-instances/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete SOP instance");
  }
}

// Hooks
export function useSOPInstances(params: {
  search?: string;
  status?: string;
  sopSlug?: string;
  mentorId?: string;
  section?: "sops" | "playbooks";
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["sop-instances", params],
    queryFn: () => fetchSOPInstances(params),
    staleTime: 30000,
  });
}

export function useSOPInstance(id: string | null) {
  return useQuery({
    queryKey: ["sop-instance", id],
    queryFn: () => fetchSOPInstance(id!),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useSOPInstanceHistory(id: string | null, page: number = 1) {
  return useQuery({
    queryKey: ["sop-instance-history", id, page],
    queryFn: () => fetchSOPInstanceHistory(id!, page),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateSOPInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSOPInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-instances"] });
    },
  });
}

export function useUpdateSOPInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSOPInstanceData }) =>
      updateSOPInstance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sop-instances"] });
      queryClient.invalidateQueries({ queryKey: ["sop-instance", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["sop-instance-history", variables.id] });
    },
  });
}

export function useValidateSOPInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { validatedById: string; validationNotes?: string };
    }) => validateSOPInstance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sop-instances"] });
      queryClient.invalidateQueries({ queryKey: ["sop-instance", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["sop-instance-history", variables.id] });
    },
  });
}

export function useDeleteSOPInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSOPInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sop-instances"] });
    },
  });
}
