"use client";

import { AlertTriangle, Clock, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { useStats } from "@/hooks/use-stats";

export function DashboardStats() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg p-2 bg-slate-800 h-9 w-9" />
              <div className="h-4 w-12 bg-slate-800 rounded" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-16 bg-slate-800 rounded" />
              <div className="h-4 w-24 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-6 text-center">
        <p className="text-red-400">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  const statCards = [
    {
      name: "Alertes en attente",
      value: String(stats.alerts.new),
      change: stats.alerts.trend > 0 ? `+${stats.alerts.trend}` : String(stats.alerts.trend),
      changeType: stats.alerts.trend > 0 ? "increase" : "decrease",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      isNegativeGood: true,
    },
    {
      name: "En cours d'analyse",
      value: String(stats.alerts.inProgress),
      change: "",
      changeType: "neutral",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      isNegativeGood: false,
    },
    {
      name: "Résolues aujourd'hui",
      value: String(stats.alerts.closed),
      change: stats.alerts.today > stats.alerts.yesterday 
        ? `+${stats.alerts.today - stats.alerts.yesterday}` 
        : String(stats.alerts.today - stats.alerts.yesterday),
      changeType: stats.alerts.today >= stats.alerts.yesterday ? "increase" : "decrease",
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      isNegativeGood: false,
    },
    {
      name: "Alertes critiques",
      value: String(stats.alerts.critical),
      change: "",
      changeType: "neutral",
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      isNegativeGood: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            {stat.change && (
              <span
                className={`text-xs font-medium ${
                  stat.isNegativeGood
                    ? stat.changeType === "increase"
                      ? "text-red-400"
                      : "text-emerald-400"
                    : stat.changeType === "increase"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {stat.change}
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
