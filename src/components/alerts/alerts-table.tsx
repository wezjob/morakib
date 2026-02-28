"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, formatRelativeTime, severityColor, statusColor } from "@/lib/utils";
import { Eye, UserPlus, MoreHorizontal, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";

export function AlertsTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const { data, isLoading, error } = useAlerts({ page, limit });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-6 text-center">
        <p className="text-red-400">Erreur lors du chargement des alertes</p>
      </div>
    );
  }

  const { data: alerts, pagination } = data;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-950">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Sévérité
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Alerte
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Source → Dest
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Assigné
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Détecté
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Aucune alerte trouvée
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  {/* Severity */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center h-7 w-7 rounded text-xs font-bold",
                        severityColor(alert.severity)
                      )}
                    >
                      {alert.severity.charAt(0)}
                    </span>
                  </td>

                  {/* Alert Info */}
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/alerts/${alert.id}`}
                        className="text-sm font-medium text-white hover:text-emerald-400"
                      >
                        {alert.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {alert.source} • {alert.ruleName || "N/A"}
                      </p>
                    </div>
                  </td>

                  {/* Source → Dest */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-slate-300">
                      {alert.sourceIp || "N/A"}
                    </div>
                    <div className="text-xs text-slate-500">
                      → {alert.destIp || "N/A"}{alert.destPort ? `:${alert.destPort}` : ""}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColor(alert.status)
                      )}
                    >
                      {alert.status}
                    </span>
                  </td>

                  {/* Assigned */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                          {alert.assignedTo.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                        </div>
                        <span className="text-sm text-slate-300">
                          {alert.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-400">
                        <UserPlus className="h-4 w-4" />
                        Assigner
                      </button>
                    )}
                  </td>

                  {/* Detected */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatRelativeTime(new Date(alert.detectedAt || alert.createdAt))}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/alerts/${alert.id}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
        <p className="text-sm text-slate-400">
          Affichage de <span className="font-medium text-white">{(page - 1) * limit + 1}</span> à{" "}
          <span className="font-medium text-white">{Math.min(page * limit, pagination.total)}</span> sur{" "}
          <span className="font-medium text-white">{pagination.total}</span> alertes
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page >= pagination.totalPages}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
