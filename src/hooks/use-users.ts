"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  name?: string;
  role: "ANALYST_JUNIOR" | "ANALYST_SENIOR" | "LEAD" | "ADMIN";
  avatarUrl?: string;
  teamId?: string;
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface UsersFilters {
  role?: string;
  teamId?: string;
  search?: string;
}

const API_BASE = "/api/users";

// Fetch users with filters
async function fetchUsers(filters: UsersFilters = {}): Promise<User[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  
  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

// Fetch single user
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

// Fetch current user
async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/me`);
  if (!res.ok) throw new Error("Failed to fetch current user");
  return res.json();
}

// Update user
async function updateUser({ id, ...data }: Partial<User> & { id: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

// Update current user
async function updateCurrentUser(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// Hooks
export function useUsers(filters: UsersFilters = {}) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => fetchUsers(filters),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id!),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(["user", data.id], data);
    },
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}
