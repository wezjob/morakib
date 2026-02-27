"use client";

import Link from "next/link";
import { cn, formatRelativeTime, severityColor, statusColor } from "@/lib/utils";
import { Eye, UserPlus, MoreHorizontal } from "lucide-react";

// Demo data
const alerts = [
  {
    id: "1",
    title: "SSH Brute Force Attempt",
    severity: "HIGH",
    status: "NEW",
    source: "SURICATA",
    sourceIp: "192.168.1.100",
    destIp: "10.0.0.50",
    destPort: 22,
    ruleName: "LABSOC SSH Brute Force",
    detectedAt: new Date(Date.now() - 5 * 60 * 1000),
    assignedTo: null,
  },
  {
    id: "2",
    title: "Possible DNS Tunneling - Long Query",
    severity: "MEDIUM",
    status: "ASSIGNED",
    source: "SURICATA",
    sourceIp: "192.168.1.45",
    destIp: "8.8.8.8",
    destPort: 53,
    ruleName: "LABSOC DNS Tunneling",
    detectedAt: new Date(Date.now() - 15 * 60 * 1000),
    assignedTo: { name: "Marie L.", initials: "ML" },
  },
  {
    id: "3",
    title: "Connection to Suspicious Port 4444",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    source: "SURICATA",
    sourceIp: "192.168.1.78",
    destIp: "185.234.72.34",
    destPort: 4444,
    ruleName: "LABSOC Suspicious Port",
    detectedAt: new Date(Date.now() - 25 * 60 * 1000),
    assignedTo: { name: "Ahmed K.", initials: "AK" },
  },
  {
    id: "4",
    title: "Large Outbound Data Transfer",
    severity: "HIGH",
    status: "NEW",
    source: "SURICATA",
    sourceIp: "192.168.1.22",
    destIp: "104.16.0.0",
    destPort: 443,
    ruleName: "LABSOC Data Exfil",
    detectedAt: new Date(Date.now() - 45 * 60 * 1000),
    assignedTo: null,
  },
  {
    id: "5",
    title: "Possible TOR Traffic Detected",
    severity: "HIGH",
    status: "ESCALATED",
    source: "SURICATA",
    sourceIp: "192.168.1.99",
    destIp: "185.220.101.1",
    destPort: 9001,
    ruleName: "LABSOC TOR Detection",
    detectedAt: new Date(Date.now() - 60 * 60 * 1000),
    assignedTo: { name: "Jean D.", initials: "JD" },
  },
  {
    id: "6",
    title: "Possible Crypto Mining - Stratum Protocol",
    severity: "MEDIUM",
    status: "RESOLVED",
    source: "ZEEK",
    sourceIp: "192.168.1.88",
    destIp: "stratum.pool.io",
    destPort: 3333,
    ruleName: "LABSOC Crypto Mining",
    detectedAt: new Date(Date.now() - 120 * 60 * 1000),
    assignedTo: { name: "Sophie M.", initials: "SM" },
  },
];

export function AlertsTable() {
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
            {alerts.map((alert) => (
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
                      {alert.source} • {alert.ruleName}
                    </p>
                  </div>
                </td>

                {/* Source → Dest */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-slate-300">
                    {alert.sourceIp}
                  </div>
                  <div className="text-xs text-slate-500">
                    → {alert.destIp}:{alert.destPort}
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
                        {alert.assignedTo.initials}
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
                  {formatRelativeTime(alert.detectedAt)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
        <p className="text-sm text-slate-400">
          Affichage de <span className="font-medium text-white">1</span> à{" "}
          <span className="font-medium text-white">6</span> sur{" "}
          <span className="font-medium text-white">24</span> alertes
        </p>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50">
            Précédent
          </button>
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-white">
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
