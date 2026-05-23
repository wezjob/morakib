"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Shield,
  Wifi,
  WifiOff,
  Clock,
  ChevronRight,
  ExternalLink,
  Import,
  Filter,
  TrendingUp,
  Eye,
} from "lucide-react";
import { useSIEMAlerts, useSIEMStats, useImportSIEMAlert, type SIEMAlert } from "@/hooks/use-siem";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  HIGH: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  MEDIUM: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  LOW: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
};

const sourceIcons: Record<string, string> = {
  suricata: "🦉",
  zeek: "🔍",
  filebeat: "📄",
  unknown: "❓",
};

const timeRanges = [
  { label: "15 min", value: "now-15m" },
  { label: "1h", value: "now-1h" },
  { label: "6h", value: "now-6h" },
  { label: "24h", value: "now-24h" },
  { label: "7d", value: "now-7d" },
];

export default function SIEMDashboardPage() {
  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [timeFrom, setTimeFrom] = useState("now-24h");
  const [page, setPage] = useState(1);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SIEMAlert | null>(null);

  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
    isFetching,
  } = useSIEMAlerts(
    {
      page,
      limit: 30,
      severity: selectedSeverity || undefined,
      source: selectedSource || undefined,
      search: search || undefined,
      timeFrom,
    },
    isAutoRefresh ? 15000 : 0 // Refresh every 15 seconds if auto-refresh is on
  );

  const { data: statsData, isLoading: statsLoading } = useSIEMStats(timeFrom, "now", isAutoRefresh ? 30000 : 0);

  const importAlert = useImportSIEMAlert();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedSeverity, selectedSource, timeFrom]);

  const isConnected = alertsData?.connected ?? false;
  const isDegraded = Boolean(alertsData?.degraded || statsData?.degraded);
  const degradedMessage = alertsData?.message || statsData?.message;
  const alerts = alertsData?.alerts ?? [];
  const pagination = alertsData?.pagination;
  const stats = statsData;

  // Calculate severity counts from stats (already normalized to CRITICAL/HIGH/MEDIUM/LOW)
  const severityCounts = {
    CRITICAL: stats?.bySeverity?.CRITICAL || 0,
    HIGH: stats?.bySeverity?.HIGH || 0,
    MEDIUM: stats?.bySeverity?.MEDIUM || 0,
    LOW: stats?.bySeverity?.LOW || 0,
  };

  const handleImport = async (alert: SIEMAlert) => {
    try {
      await importAlert.mutateAsync(alert);
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-white">SIEM - Alertes Temps Réel</h1>
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                isConnected
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Connecté à ELK
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Déconnecté
                </>
              )}
            </div>
          </div>
          <p className="text-slate-400 mt-1">
            Surveillance temps réel des alertes Suricata, Zeek et autres sources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isAutoRefresh
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching && isAutoRefresh ? "animate-spin" : ""}`} />
            Auto-refresh {isAutoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => refetchAlerts()}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {isDegraded && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-300" />
            <div>
              <p className="font-medium">Mode degrade SIEM actif</p>
              <p className="text-amber-100/90">
                {degradedMessage || "Elasticsearch est temporairement indisponible. Les donnees affichees peuvent etre en cache."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Total alertes</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {statsLoading ? "..." : stats?.total?.toLocaleString() || 0}
          </p>
        </div>
        {Object.entries(severityCounts).map(([severity, count]) => (
          <div
            key={severity}
            className={`rounded-xl border ${severityColors[severity].border} ${severityColors[severity].bg} p-4 cursor-pointer hover:opacity-80 ${
              selectedSeverity === severity ? "ring-2 ring-white/30" : ""
            }`}
            onClick={() => setSelectedSeverity(selectedSeverity === severity ? "" : severity)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{severity}</span>
              <AlertTriangle className={`h-4 w-4 ${severityColors[severity].text}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${severityColors[severity].text}`}>
              {count}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Sources</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-400">
            {Object.keys(stats?.bySource || {}).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (IP, règle, technique...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeFrom(range.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeFrom === range.value
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Toutes sources</option>
          <option value="suricata">🦉 Suricata</option>
          <option value="zeek">🔍 Zeek</option>
          <option value="filebeat">📄 Filebeat</option>
        </select>

        {/* Clear Filters */}
        {(selectedSeverity || selectedSource || search) && (
          <button
            onClick={() => {
              setSelectedSeverity("");
              setSelectedSource("");
              setSearch("");
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Effacer filtres
          </button>
        )}
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {alertsLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : alertsError ? (
          <div className="p-6 text-center">
            <WifiOff className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-4 text-red-400">
              Impossible de se connecter à Elasticsearch
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Vérifiez que le stack ELK est démarré sur localhost:9200
            </p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">Aucune alerte trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">Heure</th>
                  <th className="px-4 py-3 font-medium">Sévérité</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Alerte</th>
                  <th className="px-4 py-3 font-medium">IP Source</th>
                  <th className="px-4 py-3 font-medium">IP Destination</th>
                  <th className="px-4 py-3 font-medium">MITRE</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                  >
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          severityColors[alert.severity].bg
                        } ${severityColors[alert.severity].text}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-lg mr-1">
                        {sourceIcons[alert.source.toLowerCase()] || sourceIcons.unknown}
                      </span>
                      <span className="text-slate-300 capitalize">{alert.source}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-xs truncate">
                      {alert.title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">
                      {alert.sourceIP || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-orange-400">
                      {alert.destinationIP || "-"}
                      {alert.destinationPort && (
                        <span className="text-slate-500">:{alert.destinationPort}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {alert.mitreTechnique && (
                        <a
                          href={`https://attack.mitre.org/techniques/${alert.mitreTechnique.replace(".", "/")}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {alert.mitreTechnique}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImport(alert);
                          }}
                          disabled={importAlert.isPending}
                          className="rounded bg-emerald-500/20 p-1.5 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
                          title="Importer dans Morakib"
                        >
                          <Import className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                          }}
                          className="rounded bg-blue-500/20 p-1.5 text-blue-400 hover:bg-blue-500/30"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <span className="text-sm text-slate-400">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} alertes)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Detail Panel */}
      {selectedAlert && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Détails de l'alerte</h3>
            <button
              onClick={() => setSelectedAlert(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-500">ID</span>
              <p className="font-mono text-sm text-slate-300">{selectedAlert.id}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Index</span>
              <p className="font-mono text-sm text-slate-300">{selectedAlert.index}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-slate-500">Titre</span>
              <p className="text-white">{selectedAlert.title}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Timestamp</span>
              <p className="text-sm text-slate-300">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Protocole</span>
              <p className="text-sm text-slate-300">{selectedAlert.protocol || "-"}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500">Données brutes</span>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-400">
              {JSON.stringify(selectedAlert.rawData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
