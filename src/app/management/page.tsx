"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Shield,
  Briefcase,
  BarChart3,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  Target,
  Award,
} from "lucide-react";

interface QuickStats {
  totalAnalysts: number;
  activeAlerts: number;
  resolvedToday: number;
  avgMTTR: number;
  tpCompletedThisWeek: number;
  sopCompletionRate: number;
}

export default function ManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (userRole !== "ADMIN" && userRole !== "LEAD") {
        router.push("/");
      } else {
        fetchQuickStats();
      }
    }
  }, [status, userRole]);

  const fetchQuickStats = async () => {
    try {
      const res = await fetch("/api/admin/kpis?period=week");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalAnalysts: data.summary.totalPersonnel || 0,
          activeAlerts: data.summary.alertsPending || 0,
          resolvedToday: data.summary.alertsResolved || 0,
          avgMTTR: data.summary.mttr || 0,
          tpCompletedThisWeek: data.summary.tpsCompleted || 0,
          sopCompletionRate: data.summary.sopCompletionRate || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const quickLinks = [
    {
      title: "Cadre Gouvernance",
      description: "Charte SOC et politiques fondatrices",
      href: "/management/foundations",
      icon: Shield,
      color: "purple",
      stats: "5 documents",
    },
    {
      title: "Organisation & Rôles",
      description: "Organigramme, RACI, escalade et fiches de poste",
      href: "/management/organization",
      icon: Users,
      color: "blue",
      stats: "4 documents + matrice rôles",
    },
    {
      title: "Processus",
      description: "Changements, risques, performance et compétences",
      href: "/management/processes",
      icon: Briefcase,
      color: "emerald",
      stats: "4 processus critiques",
    },
    {
      title: "Reporting",
      description: "KPIs, KRIs, post-mortem et audit interne",
      href: "/management/metrics",
      icon: BarChart3,
      color: "blue",
      stats: "5 référentiels",
    },
    {
      title: "Conformité",
      description: "Matrice réglementaire et preuves d'audit",
      href: "/management/compliance",
      icon: Award,
      color: "emerald",
      stats: "2 packs conformité",
    },
    {
      title: "Roadmap SOC",
      description: "Plan d'évolution stratégique 1-3 ans",
      href: "/management/roadmap",
      icon: TrendingUp,
      color: "purple",
      stats: "vision pluriannuelle",
    },
    {
      title: "KPIs Équipe",
      description: "Indicateurs de performance de tous les analystes",
      href: "/management/kpis",
      icon: BarChart3,
      color: "emerald",
      stats: stats ? `${stats.totalAnalysts} analystes` : "...",
    },
    {
      title: "Suivi Formation",
      description: "Progression des TPs et certifications",
      href: "/management/training",
      icon: GraduationCap,
      color: "blue",
      stats: stats ? `${stats.tpCompletedThisWeek} TPs cette semaine` : "...",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion d&apos;Équipe</h1>
          <p className="text-slate-400">
            Suivi des performances et pilotage opérationnel
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Users className="h-4 w-4" />
              Analystes actifs
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalAnalysts}</div>
          </div>
          <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes en cours
            </div>
            <div className="text-2xl font-bold text-orange-400">{stats.activeAlerts}</div>
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
              <CheckCircle className="h-4 w-4" />
              Résolues (semaine)
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.resolvedToday}</div>
          </div>
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
              <Clock className="h-4 w-4" />
              MTTR moyen
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.avgMTTR}m</div>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group p-6 rounded-xl border transition-all hover:scale-[1.02] ${
              link.color === "emerald"
                ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900 hover:border-emerald-500/50"
                : link.color === "purple"
                  ? "border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900 hover:border-purple-500/50"
                  : "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900 hover:border-blue-500/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <link.icon
                  className={`h-10 w-10 mb-4 ${
                    link.color === "emerald"
                      ? "text-emerald-400"
                      : link.color === "purple"
                        ? "text-purple-400"
                        : "text-blue-400"
                  }`}
                />
                <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{link.description}</p>
                <span
                  className={`text-sm font-medium ${
                    link.color === "emerald"
                      ? "text-emerald-400"
                      : link.color === "purple"
                        ? "text-purple-400"
                        : "text-blue-400"
                  }`}
                >
                  {link.stats}
                </span>
              </div>
              <ArrowRight
                className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                  link.color === "emerald"
                    ? "text-emerald-400"
                    : link.color === "purple"
                      ? "text-purple-400"
                      : "text-blue-400"
                }`}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            Objectifs Équipe
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Taux complétion SOPs</span>
                <span className="text-white">{stats?.sopCompletionRate || 0}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats?.sopCompletionRate || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">MTTR objectif (&lt;30m)</span>
                <span className={stats && stats.avgMTTR <= 30 ? "text-emerald-400" : "text-orange-400"}>
                  {stats?.avgMTTR || 0}m
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats && stats.avgMTTR <= 30 ? "bg-emerald-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(100, 100 - (stats?.avgMTTR || 0) * 2)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Actions Rapides
          </h3>
          <div className="space-y-2">
            <Link
              href="/management/foundations"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-slate-300">Ouvrir la charte et politiques</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>
            <Link
              href="/management/kpis"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-slate-300">Voir tous les KPIs</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>
            <Link
              href="/management/training"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-slate-300">Valider les certifications</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>
            <Link
              href="/alerts"
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <span className="text-slate-300">Superviser les alertes</span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
