"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Search,
  Filter,
  Download,
  Eye,
  Award,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";
import { allLabs, Lab } from "@/data/labs";

interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  totalGuides: number;
  completedGuides: number;
  inProgressGuides: number;
  progressPercentage: number;
  averageScore: number | null;
  totalTimeSeconds: number;
  lastActivity: string | null;
}

interface GuideStat {
  guideId: string;
  title: string;
  totalUsers: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  averageScore: number | null;
  averageTimeSeconds: number;
  completionRate: number;
}

interface ProgressEntry {
  id: string;
  guideId: string;
  userId: string;
  user: { name: string; email: string };
  completionPercentage: number;
  completed: boolean;
  score: number | null;
  validated: boolean;
  validatedAt: string | null;
  totalTimeSeconds: number;
  startedAt: string;
  completedAt: string | null;
}

export default function AdminTrainingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [guideStats, setGuideStats] = useState<GuideStat[]>([]);
  const [allProgress, setAllProgress] = useState<ProgressEntry[]>([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalGuides: 0,
    overallCompletionRate: 0,
    averageScore: 0,
    totalCertifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "score">("progress");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);

  const labs: Lab[] = allLabs;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user is admin or lead
      const userRole = (session?.user as any)?.role;
      if (userRole !== "ADMIN" && userRole !== "LEAD") {
        router.push("/");
      } else {
        fetchData();
      }
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/guide-progress");
      if (res.ok) {
        const data = await res.json();
        setUserStats(data.userStats || []);
        setGuideStats(data.guideStats || []);
        setAllProgress(data.progress || []);
        setSummary(data.summary || {
          totalUsers: 0,
          totalGuides: 0,
          overallCompletionRate: 0,
          averageScore: 0,
          totalCertifications: 0
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateProgress = async (progressId: string, notes: string = "") => {
    setValidating(progressId);
    try {
      const res = await fetch("/api/admin/guide-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId, notes })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error validating:", error);
    } finally {
      setValidating(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const filteredUsers = userStats
    .filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "completed") return matchesSearch && user.completedGuides > 0;
      if (filterStatus === "in-progress") return matchesSearch && user.inProgressGuides > 0;
      if (filterStatus === "not-started") return matchesSearch && user.completedGuides === 0 && user.inProgressGuides === 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "progress") {
        comparison = a.progressPercentage - b.progressPercentage;
      } else if (sortBy === "score") {
        comparison = (a.averageScore || 0) - (b.averageScore || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getUserProgress = (userId: string) => {
    return allProgress.filter(p => p.userId === userId);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Suivi de Formation</h1>
          </div>
          <p className="text-slate-400 mt-1">
            Suivez la progression des analystes sur les labs de formation
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          <Download className="h-4 w-4" />
          Exporter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalUsers}</p>
              <p className="text-xs text-slate-400">Analystes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalGuides}</p>
              <p className="text-xs text-slate-400">Labs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.overallCompletionRate}%</p>
              <p className="text-xs text-slate-400">Taux complétion</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.averageScore || 0}%</p>
              <p className="text-xs text-slate-400">Score moyen</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Trophy className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalCertifications}</p>
              <p className="text-xs text-slate-400">Certifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Overview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          Vue par Lab
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {labs.map(lab => {
            const stat = guideStats.find(g => g.guideId === lab.id);
            return (
              <div key={lab.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white text-sm">{lab.title}</h4>
                    <p className="text-xs text-slate-500">{lab.difficulty} • {lab.duration}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stat && stat.completionRate > 50 
                      ? "bg-emerald-500/20 text-emerald-400"
                      : stat && stat.completionRate > 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-slate-700 text-slate-400"
                  }`}>
                    {stat?.completionRate || 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-purple-500"
                    style={{ width: `${stat?.completionRate || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {stat?.completedCount || 0}/{stat?.totalUsers || filteredUsers.length} complété
                  </span>
                  {stat?.averageScore && (
                    <span className="text-yellow-400">
                      Score moy: {Math.round(stat.averageScore)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Progression des Analystes
          </h3>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none w-48"
              />
            </div>
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="all">Tous</option>
              <option value="completed">A complété</option>
              <option value="in-progress">En cours</option>
              <option value="not-started">Non commencé</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">Aucun analyste trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Analyste</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">
                    <button 
                      onClick={() => {
                        if (sortBy === "progress") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        else { setSortBy("progress"); setSortOrder("desc"); }
                      }}
                      className="flex items-center gap-1 mx-auto hover:text-white"
                    >
                      Progression
                      {sortBy === "progress" && (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Labs</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">
                    <button 
                      onClick={() => {
                        if (sortBy === "score") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        else { setSortBy("score"); setSortOrder("desc"); }
                      }}
                      className="flex items-center gap-1 mx-auto hover:text-white"
                    >
                      Score Moy
                      {sortBy === "score" && (
                        sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Temps</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const userProgress = getUserProgress(user.id);
                  const isExpanded = selectedUser === user.id;
                  
                  return (
                    <>
                      <tr 
                        key={user.id} 
                        className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${isExpanded ? "bg-slate-800/50" : ""}`}
                        onClick={() => setSelectedUser(isExpanded ? null : user.id)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                              {user.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{user.name || "Sans nom"}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${user.progressPercentage >= 100 ? "bg-emerald-500" : "bg-purple-500"}`}
                                style={{ width: `${user.progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-10">{user.progressPercentage}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="text-emerald-400">{user.completedGuides}✓</span>
                            <span className="text-blue-400">{user.inProgressGuides}↻</span>
                            <span className="text-slate-500">{user.totalGuides - user.completedGuides - user.inProgressGuides}○</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.averageScore !== null ? (
                            <span className={`text-sm font-medium ${
                              user.averageScore >= 80 ? "text-emerald-400" : 
                              user.averageScore >= 60 ? "text-yellow-400" : "text-red-400"
                            }`}>
                              {Math.round(user.averageScore)}%
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-slate-400">
                          {formatTime(user.totalTimeSeconds)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button 
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(isExpanded ? null : user.id); }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${user.id}-details`}>
                          <td colSpan={6} className="bg-slate-800/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {labs.map(lab => {
                                const progress = userProgress.find(p => p.guideId === lab.id);
                                return (
                                  <div 
                                    key={lab.id}
                                    className={`rounded-lg border p-3 ${
                                      progress?.completed
                                        ? "border-emerald-500/30 bg-emerald-500/10"
                                        : progress
                                          ? "border-blue-500/30 bg-blue-500/10"
                                          : "border-slate-700 bg-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="text-sm font-medium text-white">{lab.title}</p>
                                      {progress?.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      ) : progress ? (
                                        <Clock className="h-4 w-4 text-blue-400" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-slate-500" />
                                      )}
                                    </div>
                                    {progress ? (
                                      <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Progression:</span>
                                          <span className="text-white">{progress.completionPercentage}%</span>
                                        </div>
                                        {progress.score !== null && (
                                          <div className="flex justify-between">
                                            <span className="text-slate-400">Score:</span>
                                            <span className={progress.score >= 80 ? "text-emerald-400" : "text-yellow-400"}>
                                              {progress.score}%
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Temps:</span>
                                          <span className="text-slate-300">{formatTime(progress.totalTimeSeconds)}</span>
                                        </div>
                                        {progress.completed && !progress.validated && (
                                          <button
                                            onClick={() => validateProgress(progress.id)}
                                            disabled={validating === progress.id}
                                            className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"
                                          >
                                            {validating === progress.id ? (
                                              "Validation..."
                                            ) : (
                                              <>
                                                <Check className="h-3 w-3" />
                                                Valider
                                              </>
                                            )}
                                          </button>
                                        )}
                                        {progress.validated && (
                                          <div className="flex items-center gap-1 text-emerald-400 mt-1">
                                            <Check className="h-3 w-3" />
                                            Validé
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500">Non commencé</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
