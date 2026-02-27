import { GraduationCap, BookOpen, PlayCircle, Target, CheckCircle } from "lucide-react";
import Link from "next/link";

const guides = [
  {
    id: "1",
    title: "Analyser une alerte SSH Brute Force",
    description: "Apprenez à identifier et traiter les tentatives de brute force SSH.",
    duration: "15 min",
    level: "Débutant",
    completed: true,
    steps: 6,
  },
  {
    id: "2",
    title: "Investigation DNS Tunneling",
    description: "Guide complet pour détecter l'exfiltration de données via DNS.",
    duration: "25 min",
    level: "Intermédiaire",
    completed: false,
    steps: 8,
  },
  {
    id: "3",
    title: "Utiliser Kibana pour la recherche",
    description: "Maîtrisez les requêtes KQL pour analyser les logs efficacement.",
    duration: "20 min",
    level: "Débutant",
    completed: false,
    steps: 5,
  },
  {
    id: "4",
    title: "Analyse des logs Zeek",
    description: "Comprendre et exploiter les métadonnées réseau de Zeek.",
    duration: "30 min",
    level: "Intermédiaire",
    completed: false,
    steps: 7,
  },
];

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
        <h2 className="text-lg font-semibold text-white mb-4">
          Guides de Formation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guide/${guide.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {guide.completed ? (
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <PlayCircle className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {guide.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {guide.level}
                </span>
                <span>{guide.duration}</span>
                <span>{guide.steps} étapes</span>
              </div>

              {guide.completed && (
                <div className="mt-3">
                  <span className="text-xs text-emerald-400">✓ Complété</span>
                </div>
              )}
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
