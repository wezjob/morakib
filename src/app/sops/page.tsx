"use client";

import { useState, useMemo } from "react";
import { FileText, Plus, Search, Loader2, BookOpen, Database } from "lucide-react";
import { SOPCard } from "@/components/sops/sop-card";
import { SOPTemplateCard } from "@/components/sops/sop-template-card";
import { SOPForm } from "@/components/sops/sop-form";
import { Modal } from "@/components/ui/modal";
import { useSOPs } from "@/hooks/use-sops";
import { allSOPs, getAllSOPCategories } from "@/data/sops";

// Combined categories from both sources
const dbCategories = ["Authentification", "Réseau", "Malware", "Web", "Endpoint", "Intrusion"];
const templateCategories = getAllSOPCategories();
const allCategories = ["Toutes", ...new Set([...dbCategories, ...templateCategories])];

export default function SOPsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "templates" | "custom">("all");
  
  const { data: sops, isLoading, error } = useSOPs({
    category: selectedCategory === "Toutes" ? undefined : selectedCategory,
    search: search || undefined,
  });

  // Filter template SOPs based on search and category
  const filteredTemplateSops = useMemo(() => {
    return allSOPs.filter(sop => {
      const matchesCategory = selectedCategory === "Toutes" || sop.category === selectedCategory;
      const matchesSearch = !search || 
        sop.title.toLowerCase().includes(search.toLowerCase()) ||
        sop.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">
              Procédures Opérationnelles (SOPs)
            </h1>
          </div>
          <p className="text-slate-400 mt-1">
            Bibliothèque des procédures standard pour l&apos;analyse et la réponse aux incidents
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Nouvelle SOP
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une SOP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                cat === selectedCategory
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("all")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "all"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          Toutes
        </button>
        <button
          onClick={() => setViewMode("templates")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "templates"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Procédures Standard ({filteredTemplateSops.length})
        </button>
        <button
          onClick={() => setViewMode("custom")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "custom"
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Database className="h-4 w-4" />
          SOPs Personnalisées ({sops?.length || 0})
        </button>
      </div>

      {/* Template SOPs Section */}
      {(viewMode === "all" || viewMode === "templates") && filteredTemplateSops.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">
              Procédures Standard Interactives
            </h2>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              {filteredTemplateSops.length} SOPs
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Procédures complètes avec checklists interactives, suivi de progression et templates
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplateSops.map((sop) => (
              <SOPTemplateCard key={sop.id} sop={sop} />
            ))}
          </div>
        </div>
      )}

      {/* Database SOPs Section */}
      {(viewMode === "all" || viewMode === "custom") && (
        <div className="space-y-4">
          {viewMode === "all" && (
            <>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">
                  SOPs Personnalisées
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                Procédures créées par votre équipe
              </p>
            </>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-800/50 bg-red-900/20 p-6 text-center">
              <p className="text-red-400">Erreur lors du chargement des SOPs</p>
            </div>
          ) : sops && sops.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sops.map((sop) => (
                <SOPCard key={sop.id} sop={sop} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">Aucune SOP personnalisée trouvée</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                Créer votre première SOP
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create SOP Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une SOP"
        size="xl"
      >
        <SOPForm
          onSuccess={() => setShowCreateModal(false)}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}
