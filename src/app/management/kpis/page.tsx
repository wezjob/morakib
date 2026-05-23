"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  AlertTriangle,
  FileText,
  Clock,
  Target,
  TrendingUp,
  Download,
  Activity,
  CheckCircle,
  BarChart3,
  RefreshCw,
  BookOpen,
  Timer,
  UserCheck,
  Award,
  Filter,
  Calendar,
  ChevronDown,
  User,
  Building2,
} from "lucide-react";

// ============ TYPES ============
interface KPISummary {
  sopsCompleted: number;
  sopsInProgress: number;
  sopsTotal: number;
  sopCompletionRate: number;
  avgSopCompletionTime: number;
  tpsCompleted: number;
  tpsInProgress: number;
  tpsTotal: number;
  tpSuccessRate: number;
  avgTPScore: number;
  avgTPTime: number;
  alertsTotal: number;
  alertsResolved: number;
  alertsPending: number;
  alertsEscalated: number;
  alertClosureRate: number;
  mttr: number;
  totalAlertsProcessed: number;
  accuracyRate: number;
  avgResponseTime: number;
  totalPersonnel?: number;
  totalTeams?: number;
}

interface UserKPI {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  teamId: string | null;
  kpis: {
    sopsCompleted: number;
    sopsTotal: number;
    sopCompletionRate: number;
    tpsCompleted: number;
    tpsTotal: number;
    tpSuccessRate: number;
    avgTPScore: number;
    alertsAssigned: number;
    alertsResolved: number;
    alertClosureRate: number;
    mttr: number;
    accuracyRate: number;
    productivity: number;
  };
}

interface TeamKPI {
  id: string;
  name: string;
  memberCount: number;
  kpis: {
    sopsCompleted: number;
    sopsTotal: number;
    tpsCompleted: number;
    tpsTotal: number;
    alertsResolved: number;
    alertsTotal: number;
  };
}

interface KPIData {
  role: string;
  period: string;
  startDate: string;
  summary: KPISummary;
  sopsByType: { slug: string; count: number }[];
  alertsBySeverity: { severity: string; count: number }[];
  dailyTrends: { date: string; sops: number; tps: number; alerts: number }[];
  users?: UserKPI[];
  teams?: TeamKPI[];
  team?: TeamKPI;
  personal?: UserKPI;
}

type Period = "day" | "week" | "month" | "quarter" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
  year: "Cette année",
  all: "Tout",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  INFO: "bg-slate-500",
};

// ============ UTILITY COMPONENTS ============
function MetricCard({
  icon,
  label,
  value,
  subtext,
  color = "blue",
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
  trend?: "up" | "down";
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtext && <div className="text-xs opacity-60 mt-1">{subtext}</div>}
        </div>
        {trend && (
          <TrendingUp
            className={`h-4 w-4 ${trend === "up" ? "text-emerald-400" : "text-red-400 rotate-180"}`}
          />
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "emerald" }: { value: number; max: number; color?: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">{percent}%</span>
    </div>
  );
}

function SimpleBarChart({ data, dataKey, labelKey, color = "emerald" }: { 
  data: { [key: string]: any }[];
  dataKey: string;
  labelKey: string;
  color?: string;
}) {
  const maxValue = Math.max(...data.map(d => d[dataKey]), 1);
  
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-20 truncate">{item[labelKey]}</span>
          <div className="flex-1 h-4 bg-slate-700/50 rounded overflow-hidden">
            <div
              className={`h-full bg-${color}-500/70 rounded`}
              style={{ width: `${(item[dataKey] / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white font-medium w-8 text-right">{item[dataKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function KPIDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterTeamId, setFilterTeamId] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "ADMIN";
  const isLead = userRole === "LEAD";
  const isAnalyst = userRole === "ANALYST_JUNIOR" || userRole === "ANALYST_SENIOR";

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ period });
      if (filterUserId) params.set("userId", filterUserId);
      if (filterTeamId) params.set("teamId", filterTeamId);

      const res = await fetch(`/api/admin/kpis?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur de chargement");
      }

      const data = await res.json();
      setKpiData(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, filterUserId, filterTeamId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchKPIs();
    }
  }, [status, fetchKPIs, router]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchKPIs, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchKPIs]);

  // Export functions
  const exportCSV = () => {
    if (!kpiData) return;
    
    let csv = "Catégorie,Métrique,Valeur\n";
    csv += `SOPs,Complétés,${kpiData.summary.sopsCompleted}\n`;
    csv += `SOPs,En cours,${kpiData.summary.sopsInProgress}\n`;
    csv += `SOPs,Total,${kpiData.summary.sopsTotal}\n`;
    csv += `SOPs,Taux complétion,${kpiData.summary.sopCompletionRate}%\n`;
    csv += `SOPs,Délai moyen (h),${kpiData.summary.avgSopCompletionTime}\n`;
    csv += `TP,Complétés,${kpiData.summary.tpsCompleted}\n`;
    csv += `TP,En cours,${kpiData.summary.tpsInProgress}\n`;
    csv += `TP,Total,${kpiData.summary.tpsTotal}\n`;
    csv += `TP,Taux réussite,${kpiData.summary.tpSuccessRate}%\n`;
    csv += `TP,Score moyen,${kpiData.summary.avgTPScore}\n`;
    csv += `TP,Temps moyen (min),${kpiData.summary.avgTPTime}\n`;
    csv += `Alertes,Total,${kpiData.summary.alertsTotal}\n`;
    csv += `Alertes,Résolues,${kpiData.summary.alertsResolved}\n`;
    csv += `Alertes,En attente,${kpiData.summary.alertsPending}\n`;
    csv += `Alertes,Escaladées,${kpiData.summary.alertsEscalated}\n`;
    csv += `Alertes,Taux clôture,${kpiData.summary.alertClosureRate}%\n`;
    csv += `Alertes,MTTR (min),${kpiData.summary.mttr}\n`;
    csv += `Performance,Précision,${kpiData.summary.accuracyRate}%\n`;
    csv += `Performance,Temps réponse (min),${kpiData.summary.avgResponseTime}\n`;

    // Users data for Admin/Lead
    if (kpiData.users) {
      csv += "\n\nKPIs par Analyste\n";
      csv += "Nom,Email,Équipe,SOPs,TP,Alertes Résolues,MTTR,Précision\n";
      kpiData.users.forEach(u => {
        csv += `${u.name},${u.email},${u.team || "N/A"},${u.kpis.sopsCompleted},${u.kpis.tpsCompleted},${u.kpis.alertsResolved},${u.kpis.mttr},${u.kpis.accuracyRate}%\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kpis_${period}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Loading state
  if (status === "loading" || (loading && !kpiData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement des KPIs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !kpiData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchKPIs}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!kpiData) return null;

  const { summary  } = kpiData;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                KPIs Équipe
              </h1>
              <p className="text-sm text-slate-400">
                {lastUpdate && `Dernière MAJ: ${lastUpdate.toLocaleTimeString("fr-FR")}`}
                {summary.totalPersonnel !== undefined && ` • ${summary.totalPersonnel} analystes`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              autoRefresh
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
            Auto
          </button>

          {/* Period selector */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {(["day", "week", "month", "quarter"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-sm transition-colors ${
                  period === p
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {p === "day" ? "Jour" : p === "week" ? "Sem" : p === "month" ? "Mois" : "Trim"}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>

          {/* Refresh */}
          <button
            onClick={fetchKPIs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Admin Filters */}
      {isAdmin && kpiData.users && kpiData.teams && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={filterTeamId}
            onChange={(e) => {
              setFilterTeamId(e.target.value);
              setFilterUserId("");
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Toutes les équipes</option>
            {kpiData.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.memberCount} membres)
              </option>
            ))}
          </select>
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tous les analystes</option>
            {kpiData.users
              .filter((u) => !filterTeamId || u.teamId === filterTeamId)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
          </select>
          {(filterUserId || filterTeamId) && (
            <button
              onClick={() => {
                setFilterUserId("");
                setFilterTeamId("");
              }}
              className="text-sm text-emerald-400 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={<FileText className="h-5 w-5" />}
          label="SOPs Complétés"
          value={summary.sopsCompleted}
          subtext={`${summary.sopCompletionRate}% taux`}
          color={summary.sopCompletionRate >= 80 ? "green" : summary.sopCompletionRate >= 50 ? "yellow" : "red"}
        />
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label="TP Réussis"
          value={summary.tpsCompleted}
          subtext={`Score: ${summary.avgTPScore}/100`}
          color={summary.tpSuccessRate >= 80 ? "green" : summary.tpSuccessRate >= 50 ? "yellow" : "red"}
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Alertes Résolues"
          value={summary.alertsResolved}
          subtext={`${summary.alertClosureRate}% clôture`}
          color={summary.alertClosureRate >= 80 ? "green" : summary.alertClosureRate >= 50 ? "yellow" : "red"}
        />
        <MetricCard
          icon={<Timer className="h-5 w-5" />}
          label="MTTR"
          value={`${summary.mttr}m`}
          subtext="Temps résolution"
          color={summary.mttr <= 30 ? "green" : summary.mttr <= 60 ? "yellow" : "red"}
          trend={summary.mttr <= 30 ? "up" : "down"}
        />
        <MetricCard
          icon={<Target className="h-5 w-5" />}
          label="Précision"
          value={`${summary.accuracyRate}%`}
          subtext="Taux détection"
          color={summary.accuracyRate >= 80 ? "green" : summary.accuracyRate >= 60 ? "yellow" : "red"}
        />
        <MetricCard
          icon={<Activity className="h-5 w-5" />}
          label="Traités"
          value={summary.totalAlertsProcessed}
          subtext="Alertes analysées"
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Tendance 14 jours
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-emerald-500" /> SOPs
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500" /> TPs
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500" /> Alertes
                </span>
              </div>
              {kpiData.dailyTrends.map((day) => {
                const maxVal = Math.max(day.sops, day.tps, day.alerts, 1);
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">
                      {new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex-1 flex items-center gap-1 h-6">
                      <div
                        className="h-full bg-emerald-500/70 rounded-l"
                        style={{ width: `${(day.sops / maxVal) * 30}%` }}
                        title={`SOPs: ${day.sops}`}
                      />
                      <div
                        className="h-full bg-blue-500/70"
                        style={{ width: `${(day.tps / maxVal) * 30}%` }}
                        title={`TPs: ${day.tps}`}
                      />
                      <div
                        className="h-full bg-orange-500/70 rounded-r"
                        style={{ width: `${(day.alerts / maxVal) * 30}%` }}
                        title={`Alertes: ${day.alerts}`}
                      />
                    </div>
                    <div className="text-xs text-slate-400 w-24 text-right">
                      {day.sops}/{day.tps}/{day.alerts}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysts Table (Admin/Lead only) */}
          {(isAdmin || isLead) && kpiData.users && kpiData.users.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                KPIs par Analyste
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="text-left py-3 px-2">Analyste</th>
                      <th className="text-left py-3 px-2">Équipe</th>
                      <th className="text-center py-3 px-2">SOPs</th>
                      <th className="text-center py-3 px-2">TPs</th>
                      <th className="text-center py-3 px-2">Alertes</th>
                      <th className="text-center py-3 px-2">MTTR</th>
                      <th className="text-center py-3 px-2">Précision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-xs text-slate-500">{user.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{user.team || "-"}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-white font-medium">{user.kpis.sopsCompleted}</span>
                          <span className="text-slate-500">/{user.kpis.sopsTotal}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-white font-medium">{user.kpis.tpsCompleted}</span>
                          <span className="text-slate-500">/{user.kpis.tpsTotal}</span>
                          {user.kpis.avgTPScore > 0 && (
                            <span className="text-xs text-emerald-400 ml-1">({user.kpis.avgTPScore}%)</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-white font-medium">{user.kpis.alertsResolved}</span>
                          <span className="text-slate-500">/{user.kpis.alertsAssigned}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`font-medium ${
                              user.kpis.mttr <= 30
                                ? "text-emerald-400"
                                : user.kpis.mttr <= 60
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {user.kpis.mttr}m
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`font-medium ${
                              user.kpis.accuracyRate >= 80
                                ? "text-emerald-400"
                                : user.kpis.accuracyRate >= 60
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {user.kpis.accuracyRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Breakdowns */}
        <div className="space-y-6">
          {/* SOPs by Type */}
          {kpiData.sopsByType.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                SOPs par Type
              </h3>
              <SimpleBarChart data={kpiData.sopsByType} dataKey="count" labelKey="slug" color="purple" />
            </div>
          )}

          {/* Alerts by Severity */}
          {kpiData.alertsBySeverity.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Alertes par Sévérité
              </h3>
              <div className="space-y-3">
                {kpiData.alertsBySeverity.map((item) => (
                  <div key={item.severity} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded ${SEVERITY_COLORS[item.severity] || "bg-slate-500"}`} />
                    <span className="text-sm text-slate-400 flex-1">{item.severity}</span>
                    <span className="text-sm text-white font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams Summary (Admin only) */}
          {isAdmin && kpiData.teams && kpiData.teams.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                Équipes
              </h3>
              <div className="space-y-4">
                {kpiData.teams.map((team) => (
                  <div key={team.id} className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{team.name}</span>
                      <span className="text-xs text-slate-400">{team.memberCount} membres</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-emerald-400 font-medium">{team.kpis.sopsCompleted}</div>
                        <div className="text-slate-500">SOPs</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-medium">{team.kpis.tpsCompleted}</div>
                        <div className="text-slate-500">TPs</div>
                      </div>
                      <div>
                        <div className="text-orange-400 font-medium">{team.kpis.alertsResolved}</div>
                        <div className="text-slate-500">Alertes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Stats (Analyst view) */}
          {isAnalyst && kpiData.personal && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                Mes Performances
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">SOPs</span>
                    <span className="text-white">
                      {kpiData.personal.kpis.sopsCompleted}/{kpiData.personal.kpis.sopsTotal}
                    </span>
                  </div>
                  <ProgressBar value={kpiData.personal.kpis.sopsCompleted} max={kpiData.personal.kpis.sopsTotal} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">TPs</span>
                    <span className="text-white">
                      {kpiData.personal.kpis.tpsCompleted}/{kpiData.personal.kpis.tpsTotal}
                    </span>
                  </div>
                  <ProgressBar value={kpiData.personal.kpis.tpsCompleted} max={kpiData.personal.kpis.tpsTotal} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Alertes</span>
                    <span className="text-white">
                      {kpiData.personal.kpis.alertsResolved}/{kpiData.personal.kpis.alertsAssigned}
                    </span>
                  </div>
                  <ProgressBar value={kpiData.personal.kpis.alertsResolved} max={kpiData.personal.kpis.alertsAssigned} />
                </div>
                <div className="pt-4 border-t border-slate-700 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{kpiData.personal.kpis.avgTPScore}%</div>
                    <div className="text-xs text-slate-400">Score TP moyen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{kpiData.personal.kpis.mttr}m</div>
                    <div className="text-xs text-slate-400">MTTR</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOP Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Détails SOPs
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-400">{summary.sopsCompleted}</div>
                <div className="text-xs text-slate-400">Complétés</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <div className="text-2xl font-bold text-yellow-400">{summary.sopsInProgress}</div>
                <div className="text-xs text-slate-400">En cours</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <div className="text-2xl font-bold text-blue-400">{summary.sopCompletionRate}%</div>
                <div className="text-xs text-slate-400">Taux complétion</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <div className="text-2xl font-bold text-purple-400">{summary.avgSopCompletionTime}h</div>
                <div className="text-xs text-slate-400">Délai moyen</div>
              </div>
            </div>
          </div>

          {/* Training Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Détails Formation
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-400">{summary.tpsCompleted}</div>
                <div className="text-xs text-slate-400">Complétés</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <div className="text-2xl font-bold text-yellow-400">{summary.tpsInProgress}</div>
                <div className="text-xs text-slate-400">En cours</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <div className="text-2xl font-bold text-blue-400">{summary.avgTPScore}</div>
                <div className="text-xs text-slate-400">Score moyen</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <div className="text-2xl font-bold text-purple-400">{summary.avgTPTime}m</div>
                <div className="text-xs text-slate-400">Temps moyen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
