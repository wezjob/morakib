"use client";

import { AlertTriangle, Clock, CheckCircle, TrendingUp } from "lucide-react";

const stats = [
  {
    name: "Alertes en attente",
    value: "12",
    change: "+3",
    changeType: "increase" as const,
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    name: "En cours d'analyse",
    value: "5",
    change: "-2",
    changeType: "decrease" as const,
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    name: "Résolues aujourd'hui",
    value: "23",
    change: "+8",
    changeType: "increase" as const,
    icon: CheckCircle,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    name: "MTTR (moyenne)",
    value: "14 min",
    change: "-3 min",
    changeType: "decrease" as const,
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <span
              className={`text-xs font-medium ${
                stat.changeType === "increase" && stat.name.includes("attente")
                  ? "text-red-400"
                  : stat.changeType === "decrease"
                  ? "text-emerald-400"
                  : "text-emerald-400"
              }`}
            >
              {stat.change}
            </span>
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
