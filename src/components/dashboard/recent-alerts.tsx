"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { cn, formatRelativeTime, severityColor } from "@/lib/utils";
import { useStats } from "@/hooks/use-stats";

export function RecentAlerts() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Alertes Récentes</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Alertes Récentes</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-slate-400">
          Erreur lors du chargement
        </div>
      </div>
    );
  }

  const alerts = stats.recentAlerts || [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-white">Alertes Récentes</h2>
        </div>
        <Link
          href="/alerts"
          className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
        >
          Voir tout
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-slate-800">
        {alerts.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400">
            Aucune alerte récente
          </div>
        ) : (
          alerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/alerts/${alert.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors"
            >
              {/* Severity Badge */}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                  severityColor(alert.severity)
                )}
              >
                {alert.severity.charAt(0)}
              </span>

              {/* Alert Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {alert.title}
                </p>
                <p className="text-xs text-slate-400">
                  ID: {alert.id.slice(0, 8)}...
                </p>
              </div>

              {/* Status & Time */}
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                    alert.status === "NEW" && "bg-blue-500/20 text-blue-400",
                    alert.status === "ASSIGNED" && "bg-purple-500/20 text-purple-400",
                    alert.status === "INVESTIGATING" && "bg-yellow-500/20 text-yellow-400"
                  )}
                >
                  {alert.status === "NEW" && "Nouveau"}
                  {alert.status === "ASSIGNED" && "Assigné"}
                  {alert.status === "INVESTIGATING" && "En cours"}
                  {alert.status === "ESCALATED" && "Escaladé"}
                  {alert.status === "RESOLVED" && "Résolu"}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {formatRelativeTime(new Date(alert.createdAt))}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
