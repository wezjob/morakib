"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Award, Clock, Target, Settings, Bell, BookOpen, Trophy, Star, ArrowRight, CheckCircle2, Play, Circle } from "lucide-react";
import { allLabs, Lab } from "@/data/labs";

interface GuideProgress {
  id: string;
  guideId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  completionPercentage: number;
  completed: boolean;
  score: number | null;
  totalTimeSeconds: number;
}

const badges = [
  { id: "1", name: "Premier Pas", icon: "🌟", earned: true, description: "Première alerte résolue" },
  { id: "2", name: "En Feu", icon: "🔥", earned: true, description: "10 alertes en un jour" },
  { id: "3", name: "Précision", icon: "🎯", earned: false, description: "95% accuracy sur 50 alertes" },
  { id: "4", name: "Expert SOP", icon: "📚", earned: false, description: "Tous les SOPs consultés" },
  { id: "5", name: "Velocité", icon: "⚡", earned: true, description: "MTTR < 5 min sur 20 alertes" },
  { id: "6", name: "Champion", icon: "🏆", earned: false, description: "Top performer du mois" },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [guideProgress, setGuideProgress] = useState<GuideProgress[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLabs(allLabs);
    fetchGuideProgress();
  }, []);

  const fetchGuideProgress = async () => {
    try {
      const res = await fetch("/api/guide-progress");
      if (res.ok) {
        const data = await res.json();
        setGuideProgress(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching guide progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLabProgress = (labId: string) => {
    return guideProgress.find(p => p.guideId === labId);
  };

  const completedLabs = guideProgress.filter(p => p.completed).length;
  const inProgressLabs = guideProgress.filter(p => !p.completed && p.completionPercentage > 0).length;
  const totalLabs = labs.length;
  const certifications = guideProgress.filter(p => p.completed && p.score && p.score >= 80);
  const totalTrainingTime = guideProgress.reduce((acc, p) => acc + (p.totalTimeSeconds || 0), 0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
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

      {/* Training Progress Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Ma Formation</h3>
          </div>
          <Link 
            href="/labs"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
          >
            Voir tous les labs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{completedLabs}</p>
            <p className="text-xs text-slate-400">Labs Terminés</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <div className="flex justify-center mb-2">
              <Play className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{inProgressLabs}</p>
            <p className="text-xs text-slate-400">En Cours</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{certifications.length}</p>
            <p className="text-xs text-slate-400">Certifications</p>
          </div>
          <div className="rounded-lg bg-slate-800 p-4 text-center">
            <div className="flex justify-center mb-2">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatTime(totalTrainingTime)}</p>
            <p className="text-xs text-slate-400">Temps Total</p>
          </div>
        </div>

        {/* Global Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Progression globale</span>
            <span className="text-white font-medium">
              {completedLabs}/{totalLabs} labs ({Math.round((completedLabs / Math.max(totalLabs, 1)) * 100)}%)
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${(completedLabs / Math.max(totalLabs, 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Labs List */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto" />
          </div>
        ) : (
          <div className="space-y-3">
            {labs.slice(0, 5).map(lab => {
              const progress = getLabProgress(lab.id);
              const isCompleted = progress?.completed;
              const isInProgress = progress && !progress.completed && progress.completionPercentage > 0;
              
              return (
                <Link 
                  key={lab.id} 
                  href={`/labs/${lab.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isCompleted 
                      ? "bg-emerald-500/20" 
                      : isInProgress 
                        ? "bg-blue-500/20" 
                        : "bg-slate-700"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : isInProgress ? (
                      <Play className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lab.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{lab.difficulty}</span>
                      <span>•</span>
                      <span>{lab.duration}</span>
                    </div>
                  </div>
                  {progress && (
                    <div className="text-right">
                      {isCompleted && progress.score !== null ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">{progress.score}%</span>
                        </div>
                      ) : (
                        <div className="w-16">
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${progress.completionPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{progress.completionPercentage}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-sm font-medium text-white mb-3">Certifications Obtenues</h4>
            <div className="flex flex-wrap gap-2">
              {certifications.map(cert => {
                const lab = labs.find(l => l.id === cert.guideId);
                return lab ? (
                  <div 
                    key={cert.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs"
                  >
                    <Trophy className="h-3 w-3" />
                    {lab.certification}
                    <span className="text-yellow-500/50">|</span>
                    <span>{cert.score}%</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
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
