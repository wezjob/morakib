"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  Target,
  TrendingUp,
  Activity,
  CheckCircle,
  BarChart3,
  RefreshCw,
  BookOpen,
  Timer,
  Award,
  Calendar,
  Clock,
  Star,
} from "lucide-react";

interface PersonalKPIs {
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
}

interface KPIData {
  role: string;
  period: string;
  summary: any;
  dailyTrends: { date: string; sops: number; tps: number; alerts: number }[];
  personal?: {
    id: string;
    name: string;
    email: string;
    role: string;
    team: string | null;
    kpis: PersonalKPIs;
  };
}

type Period = "day" | "week" | "month" | "quarter";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
};

function ProgressRing({ value, max, color = "emerald", size = 120 }: { 
  value: number; 
  max: number; 
  color?: string;
  size?: number;
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`text-${color}-500 transition-all duration-700`}
          style={{ stroke: color === "emerald" ? "#10b981" : color === "blue" ? "#3b82f6" : color === "purple" ? "#a855f7" : "#f97316" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold text-white">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtext, 
  color = "slate" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  subtext?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    slate: "border-slate-700 bg-slate-800/50",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
  };

  const textColors: Record<string, string> = {
    slate: "text-slate-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className={`flex items-center gap-2 mb-2 ${textColors[color]}`}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
  );
}

export default function PersonalKPIPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const userName = session?.user?.name || session?.user?.email || "Utilisateur";

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/kpis/personal?period=${period}`);
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
  }, [period]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchKPIs();
    }
  }, [status, fetchKPIs, router]);

  if (status === "loading" || (loading && !kpiData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement de vos KPIs...</p>
        </div>
      </div>
    );
  }

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

  const personal = kpiData?.personal?.kpis;
  const trends = kpiData?.dailyTrends || [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Award className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mes Performances</h1>
              <p className="text-sm text-slate-400">
                Bienvenue, {userName} •{" "}
                {lastUpdate && `MAJ: ${lastUpdate.toLocaleTimeString("fr-FR")}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={fetchKPIs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {personal && (
        <>
          {/* Main Performance Rings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SOPs */}
            <div className="p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                SOPs Réalisés
              </h3>
              <div className="flex items-center justify-center gap-6">
                <ProgressRing value={personal.sopsCompleted} max={personal.sopsTotal || 1} color="emerald" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{personal.sopsCompleted}</div>
                  <div className="text-sm text-slate-400">sur {personal.sopsTotal}</div>
                </div>
              </div>
            </div>

            {/* TPs */}
            <div className="p-6 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                TPs Effectués
              </h3>
              <div className="flex items-center justify-center gap-6">
                <ProgressRing value={personal.tpsCompleted} max={personal.tpsTotal || 1} color="blue" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{personal.tpsCompleted}</div>
                  <div className="text-sm text-slate-400">sur {personal.tpsTotal}</div>
                  {personal.avgTPScore > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{personal.avgTPScore}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alertes */}
            <div className="p-6 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-slate-900">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Alertes Traitées
              </h3>
              <div className="flex items-center justify-center gap-6">
                <ProgressRing value={personal.alertsResolved} max={personal.alertsAssigned || 1} color="orange" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{personal.alertsResolved}</div>
                  <div className="text-sm text-slate-400">sur {personal.alertsAssigned}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Timer className="h-4 w-4" />}
              label="MTTR"
              value={`${personal.mttr}m`}
              subtext="Temps moyen résolution"
              color={personal.mttr <= 30 ? "emerald" : personal.mttr <= 60 ? "orange" : "slate"}
            />
            <StatCard
              icon={<Target className="h-4 w-4" />}
              label="Précision"
              value={`${personal.accuracyRate}%`}
              subtext="Taux de détection"
              color={personal.accuracyRate >= 80 ? "emerald" : personal.accuracyRate >= 60 ? "blue" : "slate"}
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Productivité"
              value={personal.productivity}
              subtext="Alertes analysées"
              color="purple"
            />
            <StatCard
              icon={<CheckCircle className="h-4 w-4" />}
              label="Taux Clôture"
              value={`${personal.alertClosureRate}%`}
              subtext="Alertes clôturées"
              color={personal.alertClosureRate >= 80 ? "emerald" : "blue"}
            />
          </div>

          {/* Activity Trend */}
          {trends.length > 0 && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Mon Activité (14 derniers jours)
              </h3>
              <div className="space-y-2">
                {trends.map((day) => {
                  const total = day.sops + day.tps + day.alerts;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-14">
                        {new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex-1 flex items-center gap-1 h-4">
                        {day.sops > 0 && (
                          <div
                            className="h-full bg-emerald-500/70 rounded-l"
                            style={{ width: `${(day.sops / Math.max(total, 1)) * 100}%` }}
                            title={`SOPs: ${day.sops}`}
                          />
                        )}
                        {day.tps > 0 && (
                          <div
                            className="h-full bg-blue-500/70"
                            style={{ width: `${(day.tps / Math.max(total, 1)) * 100}%` }}
                            title={`TPs: ${day.tps}`}
                          />
                        )}
                        {day.alerts > 0 && (
                          <div
                            className="h-full bg-orange-500/70 rounded-r"
                            style={{ width: `${(day.alerts / Math.max(total, 1)) * 100}%` }}
                            title={`Alertes: ${day.alerts}`}
                          />
                        )}
                        {total === 0 && (
                          <div className="h-full w-full bg-slate-700/30 rounded" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400 w-16 text-right">
                        {total > 0 ? `${day.sops}/${day.tps}/${day.alerts}` : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
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
            </div>
          )}

          {/* Achievements Preview */}
          <div className="p-6 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-slate-900">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              Progression
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm text-white font-medium">SOPs Maîtrisés</div>
                <div className="text-2xl font-bold text-emerald-400">{personal.sopsCompleted}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-sm text-white font-medium">TPs Complétés</div>
                <div className="text-2xl font-bold text-blue-400">{personal.tpsCompleted}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="text-sm text-white font-medium">Alertes Résolues</div>
                <div className="text-2xl font-bold text-orange-400">{personal.alertsResolved}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {!personal && !loading && (
        <div className="p-12 rounded-xl border border-slate-800 bg-slate-900 text-center">
          <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune donnée disponible</h3>
          <p className="text-slate-400">
            Commencez à traiter des alertes, compléter des SOPs ou suivre des formations pour voir vos KPIs.
          </p>
        </div>
      )}
    </div>
  );
}
