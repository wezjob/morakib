import { GraduationCap, BookOpen, PlayCircle, Target, Clock, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { guides, getAllCategories } from "@/data/guides";

const quickActions = [
  {
    title: "Comment rechercher une IP?",
    query: 'source.ip: "IP_ADDRESS" OR destination.ip: "IP_ADDRESS"',
  },
  {
    title: "Filtrer par sévérité",
    query: 'event.severity: [1 TO 3]',
  },
  {
    title: "Alertes des dernières 24h",
    query: '@timestamp >= now-24h',
  },
];

const levelColors: Record<string, string> = {
  "Débutant": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Intermédiaire": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Avancé": "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function GuidePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">Mode Guidé</h1>
        </div>
        <p className="text-slate-400 mt-1">
          Apprenez les bases de l&apos;analyse SOC avec des guides pratiques et des exemples
        </p>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Requêtes Rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <div
              key={action.title}
              className="rounded-lg border border-slate-700 bg-slate-800 p-4"
            >
              <p className="text-sm font-medium text-white mb-2">{action.title}</p>
              <code className="block text-xs font-mono text-emerald-400 bg-slate-950 p-2 rounded">
                {action.query}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Guides Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Guides de Formation ({guides.length})
          </h2>
          <div className="flex gap-2">
            {getAllCategories().map((cat) => (
              <span key={cat} className="px-2 py-1 text-xs rounded-full border border-slate-700 bg-slate-800 text-slate-400">
                {cat}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guide/${guide.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2 group-hover:bg-purple-500/20 transition-colors">
                  <PlayCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {guide.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${levelColors[guide.level]}`}>
                  {guide.level}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="h-3 w-3" />
                  {guide.duration}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Target className="h-3 w-3" />
                  {guide.steps.length} étapes
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {guide.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400">
                    {tag}
                  </span>
                ))}
                {guide.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-500">
                    +{guide.tags.length - 3}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Commencer le guide
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Conseils du Jour</h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Toujours vérifier le contexte d&apos;une alerte avant de conclure</li>
          <li>• Documenter chaque étape de votre investigation</li>
          <li>• En cas de doute, n&apos;hésitez pas à escalader vers un analyste senior</li>
          <li>• Utilisez les SOPs comme guide, mais adaptez selon le contexte</li>
        </ul>
      </div>
    </div>
  );
}
