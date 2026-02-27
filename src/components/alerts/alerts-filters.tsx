"use client";

import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const severities = ["Toutes", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const statuses = ["Tous", "NEW", "ASSIGNED", "INVESTIGATING", "RESOLVED", "ESCALATED", "FALSE_POSITIVE"];
const sources = ["Toutes", "SURICATA", "ZEEK", "FILEBEAT", "ELASTIC"];

export function AlertsFilters() {
  const [severity, setSeverity] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const [source, setSource] = useState("Toutes");
  const [search, setSearch] = useState("");

  const hasFilters = severity !== "Toutes" || status !== "Tous" || source !== "Toutes" || search;

  const clearFilters = () => {
    setSeverity("Toutes");
    setStatus("Tous");
    setSource("Toutes");
    setSearch("");
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (IP, titre, règle...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Severity Filter */}
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          {severities.map((s) => (
            <option key={s} value={s}>
              {s === "Toutes" ? "Sévérité: Toutes" : s}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "Tous" ? "Statut: Tous" : s}
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s === "Toutes" ? "Source: Toutes" : s}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
