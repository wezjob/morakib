import { BarChart3, TrendingUp, Users, Clock, Target, Award } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
        </div>
        <p className="text-slate-400 mt-1">
          Métriques de performance et rapports d&apos;activité
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">94%</p>
              <p className="text-sm text-slate-400">Taux de précision</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">8.5 min</p>
              <p className="text-sm text-slate-400">MTTR moyen</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-sm text-slate-400">Alertes cette semaine</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Award className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1,250</p>
              <p className="text-sm text-slate-400">Points totaux</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Alertes par Jour
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>Graphique à venir</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Répartition par Sévérité
          </h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>Graphique à venir</p>
          </div>
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-white">
            Classement Équipe
          </h3>
        </div>
        <div className="space-y-3">
          {[
            { rank: 1, name: "Marie Laurent", alerts: 45, accuracy: 98 },
            { rank: 2, name: "Ahmed Khalil", alerts: 42, accuracy: 95 },
            { rank: 3, name: "Sophie Martin", alerts: 38, accuracy: 96 },
            { rank: 4, name: "Jean Dupont", alerts: 35, accuracy: 92 },
            { rank: 5, name: "Vous", alerts: 28, accuracy: 94, isYou: true },
          ].map((analyst) => (
            <div
              key={analyst.rank}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                analyst.isYou ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-slate-800"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  analyst.rank === 1
                    ? "bg-yellow-500 text-black"
                    : analyst.rank === 2
                    ? "bg-slate-400 text-black"
                    : analyst.rank === 3
                    ? "bg-orange-600 text-white"
                    : "bg-slate-700 text-white"
                }`}
              >
                {analyst.rank}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {analyst.name}
                  {analyst.isYou && (
                    <span className="ml-2 text-emerald-400">(vous)</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {analyst.alerts} alertes
                </p>
                <p className="text-xs text-slate-400">
                  {analyst.accuracy}% précision
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
