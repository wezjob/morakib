import { User, Award, Clock, Target, Settings, Bell } from "lucide-react";

const badges = [
  { id: "1", name: "Premier Pas", icon: "🌟", earned: true, description: "Première alerte résolue" },
  { id: "2", name: "En Feu", icon: "🔥", earned: true, description: "10 alertes en un jour" },
  { id: "3", name: "Précision", icon: "🎯", earned: false, description: "95% accuracy sur 50 alertes" },
  { id: "4", name: "Expert SOP", icon: "📚", earned: false, description: "Tous les SOPs consultés" },
  { id: "5", name: "Velocité", icon: "⚡", earned: true, description: "MTTR < 5 min sur 20 alertes" },
  { id: "6", name: "Champion", icon: "🏆", earned: false, description: "Top performer du mois" },
];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-white">Mon Espace</h1>
          </div>
          <p className="text-slate-400 mt-1">
            Gérez votre profil et suivez votre progression
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          <Settings className="h-4 w-4" />
          Paramètres
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
            JD
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">John Doe</h2>
            <p className="text-slate-400">Analyste SOC N1</p>
            <p className="text-sm text-slate-500 mt-1">john.doe@company.com</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">1,250</p>
            <p className="text-sm text-slate-400">Points totaux</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-sm text-slate-400">Alertes traitées</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">7.2 min</p>
              <p className="text-sm text-slate-400">MTTR moyen</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">94%</p>
              <p className="text-sm text-slate-400">Taux de précision</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Mes Badges</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-4 text-center ${
                badge.earned
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-slate-700 bg-slate-800 opacity-50"
              }`}
            >
              <span className="text-3xl">{badge.icon}</span>
              <p className="mt-2 text-sm font-medium text-white">{badge.name}</p>
              <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Préférences de Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Nouvelles alertes assignées", enabled: true },
            { label: "Mises à jour des SOPs", enabled: true },
            { label: "Rappels de tâches", enabled: false },
            { label: "Résumé quotidien", enabled: true },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{pref.label}</span>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pref.enabled ? "bg-emerald-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pref.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
