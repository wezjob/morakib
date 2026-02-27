"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { cn, formatRelativeTime, severityColor } from "@/lib/utils";

// Mock data - will be replaced with real API calls
const alerts = [
  {
    id: "1",
    title: "SSH Brute Force Attempt",
    severity: "HIGH",
    source: "SURICATA",
    sourceIp: "192.168.1.100",
    destIp: "10.0.0.50",
    status: "NEW",
    detectedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "2",
    title: "Possible DNS Tunneling",
    severity: "MEDIUM",
    source: "ZEEK",
    sourceIp: "10.0.0.25",
    destIp: "8.8.8.8",
    status: "ASSIGNED",
    detectedAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "3",
    title: "Connection to Suspicious Port",
    severity: "CRITICAL",
    source: "SURICATA",
    sourceIp: "10.0.0.42",
    destIp: "185.234.72.10",
    status: "NEW",
    detectedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "4",
    title: "Large Outbound Data Transfer",
    severity: "HIGH",
    source: "SURICATA",
    sourceIp: "10.0.0.15",
    destIp: "104.21.32.15",
    status: "INVESTIGATING",
    detectedAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "5",
    title: "Possible Crypto Mining Activity",
    severity: "MEDIUM",
    source: "ZEEK",
    sourceIp: "10.0.0.88",
    destIp: "stratum.pool.com",
    status: "NEW",
    detectedAt: new Date(Date.now() - 8 * 60 * 1000),
  },
];

export function RecentAlerts() {
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
        {alerts.map((alert) => (
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
                {alert.sourceIp} → {alert.destIp} • {alert.source}
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
              </span>
              <p className="mt-1 text-xs text-slate-500">
                {formatRelativeTime(alert.detectedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
