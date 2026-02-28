"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/sops";

interface SOP {
  id: string;
  title: string;
  slug: string;
  category: string;
  alertTypes: string[];
  contentMarkdown: string;
  checklist?: string[];
  examples?: unknown[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SOPsFilters {
  category?: string;
  status?: string;
  alertType?: string;
  search?: string;
}

// Fetch SOPs with filters
async function fetchSOPs(filters: SOPsFilters = {}): Promise<SOP[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch SOPs");
  return res.json();
}

// Fetch single SOP
async function fetchSOP(id: string): Promise<SOP> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch SOP");
  return res.json();
}

// Create SOP
async function createSOP(data: Partial<SOP>): Promise<SOP> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create SOP");
  return res.json();
}

// Update SOP
async function updateSOP({ id, ...data }: Partial<SOP> & { id: string }): Promise<SOP> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update SOP");
  return res.json();
}

// Delete SOP
async function deleteSOP(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete SOP");
}

// Hooks
export function useSOPs(filters: SOPsFilters = {}) {
  return useQuery({
    queryKey: ["sops", filters],
    queryFn: () => fetchSOPs(filters),
  });
}

export function useSOP(id: string | undefined) {
  return useQuery({
    queryKey: ["sop", id],
    queryFn: () => fetchSOP(id!),
    enabled: !!id,
  });
}

export function useCreateSOP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSOP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sops"] });
    },
  });
}

export function useUpdateSOP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSOP,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sops"] });
      queryClient.setQueryData(["sop", data.id], data);
    },
  });
}

export function useDeleteSOP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSOP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sops"] });
    },
  });
}
