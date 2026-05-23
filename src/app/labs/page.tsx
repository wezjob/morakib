"use client";

import { useEffect, useState } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Target,
  ArrowRight,
  Trophy,
  Star,
  Lock,
  Filter,
  Search
} from "lucide-react";
import Link from "next/link";
import { allLabs, Lab } from "@/data/labs";

interface GuideProgress {
  guideId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  completionPercentage: number;
  completed: boolean;
  score: number | null;
  validatedAt: string | null;
}

const difficultyColors: Record<string, string> = {
  "Débutant": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Intermédiaire": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "Avancé": "text-red-400 bg-red-500/10 border-red-500/30",
};

const categoryColors: Record<string, string> = {
  "Initial Access": "bg-blue-500/20 text-blue-400",
  "Execution": "bg-orange-500/20 text-orange-400",
  "Credential Access": "bg-red-500/20 text-red-400",
  "Persistence": "bg-purple-500/20 text-purple-400",
  "Privilege Escalation": "bg-pink-500/20 text-pink-400",
  "Defense Evasion": "bg-slate-500/20 text-slate-400",
  "Discovery": "bg-cyan-500/20 text-cyan-400",
  "Lateral Movement": "bg-indigo-500/20 text-indigo-400",
  "Collection": "bg-amber-500/20 text-amber-400",
  "Exfiltration": "bg-rose-500/20 text-rose-400",
  "Command & Control": "bg-teal-500/20 text-teal-400",
  "Impact": "bg-red-600/20 text-red-500",
};

export default function LabsPage() {
  const [progress, setProgress] = useState<Record<string, GuideProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/guide-progress");
      if (res.ok) {
        const data = await res.json();
        const progressMap: Record<string, GuideProgress> = {};
        data.forEach((p: GuideProgress) => {
          progressMap[p.guideId] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabProgress = (labId: string) => {
    return progress[labId] || null;
  };

  const getProgressStatus = (labId: string): "not-started" | "in-progress" | "completed" | "validated" => {
    const p = getLabProgress(labId);
    if (!p) return "not-started";
    if (p.validatedAt) return "validated";
    if (p.completed) return "completed";
    if (p.completionPercentage > 0) return "in-progress";
    return "not-started";
  };

  const filteredLabs = allLabs.filter(lab => {
    const matchesSearch = lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lab.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    if (filter === "not-started") return matchesSearch && getProgressStatus(lab.id) === "not-started";
    if (filter === "in-progress") return matchesSearch && getProgressStatus(lab.id) === "in-progress";
    if (filter === "completed") return matchesSearch && ["completed", "validated"].includes(getProgressStatus(lab.id));
    return matchesSearch;
  });

  const stats = {
    total: allLabs.length,
    completed: allLabs.filter(l => ["completed", "validated"].includes(getProgressStatus(l.id))).length,
    inProgress: allLabs.filter(l => getProgressStatus(l.id) === "in-progress").length,
    notStarted: allLabs.filter(l => getProgressStatus(l.id) === "not-started").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-white">Travaux Pratiques (Labs)</h1>
        </div>
        <p className="text-slate-400 mt-1">
          Exercices pratiques guidés basés sur les SOPs MITRE ATT&CK. Complétez tous les labs pour valider vos compétences.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Labs disponibles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-xs text-slate-400">Complétés</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <PlayCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              <p className="text-xs text-slate-400">En cours</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-500/10 p-2">
              <Target className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.notStarted}</p>
              <p className="text-xs text-slate-400">À commencer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Progression globale</span>
          <span className="text-sm text-slate-400">
            {stats.completed}/{stats.total} labs complétés
          </span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${(stats.completed / stats.total) * 100}%` }}
          />
        </div>
        {stats.completed === stats.total && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Félicitations! Tous les labs sont complétés!</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" 
                ? "bg-purple-600 text-white" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter("not-started")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "not-started" 
                ? "bg-slate-600 text-white" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            À faire
          </button>
          <button
            onClick={() => setFilter("in-progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "in-progress" 
                ? "bg-yellow-600 text-white" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "completed" 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Complétés
          </button>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLabs.map((lab) => {
          const labProgress = getLabProgress(lab.id);
          const status = getProgressStatus(lab.id);
          
          return (
            <Link
              key={lab.id}
              href={`/labs/${lab.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-lg px-3 py-1 text-xs font-medium ${categoryColors[lab.category] || "bg-slate-500/20 text-slate-400"}`}>
                  {lab.category}
                </div>
                {status === "validated" && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs">Validé</span>
                  </div>
                )}
                {status === "completed" && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Complété</span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors mb-2">
                {lab.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                {lab.description}
              </p>

              {/* Progress Bar (if started) */}
              {labProgress && labProgress.completionPercentage > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Progression</span>
                    <span className="text-white">{labProgress.completionPercentage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        labProgress.completed 
                          ? "bg-emerald-500" 
                          : "bg-purple-500"
                      }`}
                      style={{ width: `${labProgress.completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${difficultyColors[lab.difficulty]}`}>
                  {lab.difficulty}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="h-3 w-3" />
                  {lab.duration}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <BookOpen className="h-3 w-3" />
                  {lab.steps.length} étapes
                </span>
              </div>

              {/* Score (if completed) */}
              {labProgress?.score && (
                <div className="mt-4 flex items-center gap-2 pt-4 border-t border-slate-800">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white">Score: {labProgress.score}%</span>
                </div>
              )}

              {/* CTA */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Certification: {lab.certification}
                </span>
                <ArrowRight className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredLabs.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun lab ne correspond à votre recherche</p>
        </div>
      )}
    </div>
  );
}
