"use client";

import { useState, useMemo } from "react";
import { useCreateSOP, useUpdateSOP } from "@/hooks/use-sops";
import { 
  Loader2, 
  Plus, 
  X, 
  Shield, 
  Terminal, 
  ListChecks,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Eye,
  Lightbulb
} from "lucide-react";
import { 
  MITRE_TACTICS, 
  MITRE_TECHNIQUES, 
  getTechniquesByTactic,
  getTacticById,
  type MitreTechnique 
} from "@/data/mitre-attack";

interface SOPFormProps {
  sop?: {
    id: string;
    title: string;
    slug: string;
    category: string;
    alertTypes: string[];
    contentMarkdown: string;
    checklist?: string[];
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    mitreTactics?: string[];
    mitreTechniques?: string[];
    elkQueries?: { description: string; query: string }[];
    procedures?: string[];
    detection?: string[];
    mitigation?: string[];
    dataSources?: string[];
    severity?: string;
    estimatedTime?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  "Intrusion",
  "Malware",
  "Phishing",
  "DDoS",
  "DataLeak",
  "Compliance",
  "Network",
  "Authentication",
  "Ransomware",
  "Lateral Movement",
  "Credential Access",
  "Command & Control",
];

const alertTypeOptions = [
  "SSH Brute Force",
  "Scan de ports",
  "Malware détecté",
  "Connexion suspecte",
  "Exfiltration de données",
  "Phishing email",
  "DDoS Attack",
  "Ransomware",
  "Lateral Movement",
  "Privilege Escalation",
  "DNS Tunneling",
  "C2 Communication",
  "Process Injection",
  "Credential Dumping",
];

const dataSourceOptions = [
  "Windows Event Logs",
  "Sysmon",
  "PowerShell Logs",
  "Process Monitoring",
  "Network Traffic",
  "DNS Logs",
  "Web Proxy",
  "Email Gateway",
  "EDR/XDR",
  "Application Logs",
  "Authentication Logs",
  "File Monitoring",
  "Registry Monitoring",
  "Active Directory",
  "Cloud Audit Logs",
  "WAF Logs",
];

const severityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function SOPFormMitre({ sop, onSuccess, onCancel }: SOPFormProps) {
  const isEdit = !!sop;
  const createSOP = useCreateSOP();
  const updateSOP = useUpdateSOP();

  // Form state
  const [formData, setFormData] = useState({
    title: sop?.title || "",
    slug: sop?.slug || "",
    category: sop?.category || "Intrusion",
    alertTypes: sop?.alertTypes || [],
    contentMarkdown: sop?.contentMarkdown || "",
    checklist: sop?.checklist || [""],
    status: sop?.status || "DRAFT",
    mitreTactics: sop?.mitreTactics || [],
    mitreTechniques: sop?.mitreTechniques || [],
    elkQueries: sop?.elkQueries || [{ description: "", query: "" }],
    procedures: sop?.procedures || [""],
    detection: sop?.detection || [""],
    mitigation: sop?.mitigation || [""],
    dataSources: sop?.dataSources || [],
    severity: sop?.severity || "MEDIUM",
    estimatedTime: sop?.estimatedTime || "15-30 min",
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"basic" | "mitre" | "guide">("basic");
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(new Set());
  const [techniqueSearch, setTechniqueSearch] = useState("");

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: isEdit ? formData.slug : generateSlug(title),
    });
  };

  // MITRE tactics toggle
  const toggleTactic = (tacticId: string) => {
    const newTactics = formData.mitreTactics.includes(tacticId)
      ? formData.mitreTactics.filter((t) => t !== tacticId)
      : [...formData.mitreTactics, tacticId];
    setFormData({ ...formData, mitreTactics: newTactics });
  };

  // MITRE techniques toggle
  const toggleTechnique = (techniqueId: string) => {
    const newTechniques = formData.mitreTechniques.includes(techniqueId)
      ? formData.mitreTechniques.filter((t) => t !== techniqueId)
      : [...formData.mitreTechniques, techniqueId];
    
    // Also add the tactic if not already added
    const technique = MITRE_TECHNIQUES.find(t => t.id === techniqueId);
    if (technique && !formData.mitreTechniques.includes(techniqueId)) {
      const newTactics = [...formData.mitreTactics];
      technique.tacticIds.forEach(tid => {
        if (!newTactics.includes(tid)) {
          newTactics.push(tid);
        }
      });
      setFormData({ ...formData, mitreTechniques: newTechniques, mitreTactics: newTactics });
    } else {
      setFormData({ ...formData, mitreTechniques: newTechniques });
    }
  };

  // Toggle tactic expansion in UI
  const toggleTacticExpand = (tacticId: string) => {
    const newExpanded = new Set(expandedTactics);
    if (newExpanded.has(tacticId)) {
      newExpanded.delete(tacticId);
    } else {
      newExpanded.add(tacticId);
    }
    setExpandedTactics(newExpanded);
  };

  // Filter techniques by search
  const filteredTechniques = useMemo(() => {
    if (!techniqueSearch) return MITRE_TECHNIQUES;
    const q = techniqueSearch.toLowerCase();
    return MITRE_TECHNIQUES.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }, [techniqueSearch]);

  // Alert type toggle
  const handleAlertTypeToggle = (alertType: string) => {
    const newTypes = formData.alertTypes.includes(alertType)
      ? formData.alertTypes.filter((t) => t !== alertType)
      : [...formData.alertTypes, alertType];
    setFormData({ ...formData, alertTypes: newTypes });
  };

  // Data source toggle
  const handleDataSourceToggle = (ds: string) => {
    const newSources = formData.dataSources.includes(ds)
      ? formData.dataSources.filter((s) => s !== ds)
      : [...formData.dataSources, ds];
    setFormData({ ...formData, dataSources: newSources });
  };

  // Array field handlers
  const handleArrayFieldChange = (field: keyof typeof formData, index: number, value: string) => {
    const arr = [...(formData[field] as string[])];
    arr[index] = value;
    setFormData({ ...formData, [field]: arr });
  };

  const addArrayFieldItem = (field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: [...(formData[field] as string[]), ""] });
  };

  const removeArrayFieldItem = (field: keyof typeof formData, index: number) => {
    const arr = (formData[field] as string[]).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: arr });
  };

  // ELK queries handlers
  const handleElkQueryChange = (index: number, field: "description" | "query", value: string) => {
    const queries = [...formData.elkQueries];
    queries[index] = { ...queries[index], [field]: value };
    setFormData({ ...formData, elkQueries: queries });
  };

  const addElkQuery = () => {
    setFormData({ ...formData, elkQueries: [...formData.elkQueries, { description: "", query: "" }] });
  };

  const removeElkQuery = (index: number) => {
    const queries = formData.elkQueries.filter((_, i) => i !== index);
    setFormData({ ...formData, elkQueries: queries });
  };

  // Auto-fill from selected technique
  const autoFillFromTechnique = (technique: MitreTechnique) => {
    setFormData({
      ...formData,
      detection: technique.detection.length > 0 ? technique.detection : formData.detection,
      mitigation: technique.mitigation.length > 0 ? technique.mitigation : formData.mitigation,
      dataSources: technique.dataSources.length > 0 ? technique.dataSources : formData.dataSources,
      elkQueries: technique.elkQueries?.length 
        ? technique.elkQueries.map((q, i) => ({ description: `Requête ${i+1}`, query: q }))
        : formData.elkQueries,
      procedures: technique.procedures?.length ? technique.procedures : formData.procedures,
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      checklist: formData.checklist.filter((item) => item.trim() !== ""),
      procedures: formData.procedures.filter((item) => item.trim() !== ""),
      detection: formData.detection.filter((item) => item.trim() !== ""),
      mitigation: formData.mitigation.filter((item) => item.trim() !== ""),
      elkQueries: formData.elkQueries.filter((q) => q.query.trim() !== ""),
    };

    try {
      if (isEdit) {
        await updateSOP.mutateAsync({ id: sop.id, ...data });
      } else {
        await createSOP.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving SOP:", error);
    }
  };

  const isLoading = createSOP.isPending || updateSOP.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "basic"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          📋 Informations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mitre")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "mitre"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Shield className="inline h-4 w-4 mr-1" />
          MITRE ATT&CK
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guide")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "guide"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Lightbulb className="inline h-4 w-4 mr-1" />
          Guide Pratique
        </button>
      </div>

      {/* Basic Tab */}
      {activeTab === "basic" && (
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Analyse Brute Force SSH"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Slug (URL) *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="analyse-brute-force-ssh"
            />
          </div>

          {/* Category, Status, Severity, Time Row */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Sévérité
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                {severityOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Temps estimé
              </label>
              <input
                type="text"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                placeholder="15-30 min"
              />
            </div>
          </div>

          {/* Alert Types */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Types d'alertes associés
            </label>
            <div className="flex flex-wrap gap-2">
              {alertTypeOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAlertTypeToggle(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    formData.alertTypes.includes(type)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Content Markdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description / Contenu (Markdown)
            </label>
            <textarea
              value={formData.contentMarkdown}
              onChange={(e) => setFormData({ ...formData, contentMarkdown: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none font-mono text-sm"
              placeholder="## Objectif&#10;&#10;Décrire les étapes à suivre...&#10;&#10;## Procédure&#10;&#10;1. Première étape&#10;2. Seconde étape"
            />
          </div>
        </div>
      )}

      {/* MITRE ATT&CK Tab */}
      {activeTab === "mitre" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-sm text-emerald-300">
              <Shield className="inline h-4 w-4 mr-1" />
              Sélectionnez les tactiques et techniques MITRE ATT&CK liées à cette SOP.
              Les informations seront utilisées pour enrichir les guides pratiques.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une technique (ex: T1566, Phishing)..."
              value={techniqueSearch}
              onChange={(e) => setTechniqueSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Selected techniques summary */}
          {formData.mitreTechniques.length > 0 && (
            <div className="rounded-lg bg-slate-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  Techniques sélectionnées ({formData.mitreTechniques.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.mitreTechniques.map((tid) => {
                  const technique = MITRE_TECHNIQUES.find(t => t.id === tid);
                  return (
                    <div
                      key={tid}
                      className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs"
                    >
                      <span className="font-mono text-red-400">{tid}</span>
                      <span className="text-slate-300">{technique?.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleTechnique(tid)}
                        className="ml-1 text-slate-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {technique && (
                        <button
                          type="button"
                          onClick={() => autoFillFromTechnique(technique)}
                          className="ml-1 text-emerald-400 hover:text-emerald-300"
                          title="Remplir automatiquement depuis cette technique"
                        >
                          <Lightbulb className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tactics and Techniques Tree */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {MITRE_TACTICS.map((tactic) => {
              const techniques = techniqueSearch 
                ? filteredTechniques.filter(t => t.tacticIds.includes(tactic.id))
                : getTechniquesByTactic(tactic.id);
              
              if (techniques.length === 0 && techniqueSearch) return null;
              
              const isExpanded = expandedTactics.has(tactic.id);
              const isSelected = formData.mitreTactics.includes(tactic.id);
              const selectedCount = techniques.filter(t => formData.mitreTechniques.includes(t.id)).length;

              return (
                <div key={tactic.id} className="rounded-lg border border-slate-700 bg-slate-800/50">
                  {/* Tactic Header */}
                  <button
                    type="button"
                    onClick={() => toggleTacticExpand(tactic.id)}
                    className="w-full flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tactic.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{tactic.id}</span>
                        <span className="font-medium text-white">{tactic.name}</span>
                        {selectedCount > 0 && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">
                            {selectedCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {techniques.length} techniques
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Techniques List */}
                  {isExpanded && (
                    <div className="border-t border-slate-700 p-2 space-y-1">
                      {techniques.map((technique) => {
                        const isSelected = formData.mitreTechniques.includes(technique.id);
                        return (
                          <button
                            key={technique.id}
                            type="button"
                            onClick={() => toggleTechnique(technique.id)}
                            className={`w-full flex items-start gap-3 rounded-lg p-2 text-left transition-colors ${
                              isSelected
                                ? "bg-emerald-500/20 border border-emerald-500/50"
                                : "hover:bg-slate-700/50"
                            }`}
                          >
                            <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-600"
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-red-400">{technique.id}</span>
                                <span className="text-sm text-white">{technique.name}</span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                                {technique.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guide Pratique Tab */}
      {activeTab === "guide" && (
        <div className="space-y-4">
          {/* Data Sources */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Eye className="inline h-4 w-4 mr-1" />
              Sources de données requises
            </label>
            <div className="flex flex-wrap gap-2">
              {dataSourceOptions.map((ds) => (
                <button
                  key={ds}
                  type="button"
                  onClick={() => handleDataSourceToggle(ds)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    formData.dataSources.includes(ds)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {ds}
                </button>
              ))}
            </div>
          </div>

          {/* Detection Methods */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Eye className="inline h-4 w-4 mr-1" />
              Méthodes de détection
            </label>
            <div className="space-y-2">
              {formData.detection.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayFieldChange("detection", index, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white text-sm"
                    placeholder="Comment détecter cette activité..."
                  />
                  {formData.detection.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayFieldItem("detection", index)}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem("detection")}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Ajouter une méthode de détection
              </button>
            </div>
          </div>

          {/* ELK Queries */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Terminal className="inline h-4 w-4 mr-1" />
              Requêtes ELK / KQL
            </label>
            <div className="space-y-3">
              {formData.elkQueries.map((query, index) => (
                <div key={index} className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={query.description}
                      onChange={(e) => handleElkQueryChange(index, "description", e.target.value)}
                      className="flex-1 rounded border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-white"
                      placeholder="Description de la requête"
                    />
                    {formData.elkQueries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeElkQuery(index)}
                        className="rounded bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={query.query}
                    onChange={(e) => handleElkQueryChange(index, "query", e.target.value)}
                    rows={2}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-emerald-400 font-mono text-sm"
                    placeholder='event.category:"authentication" AND event.outcome:"failure"'
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addElkQuery}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Ajouter une requête
              </button>
            </div>
          </div>

          {/* Procedures */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <ListChecks className="inline h-4 w-4 mr-1" />
              Procédure d'investigation (étapes)
            </label>
            <div className="space-y-2">
              {formData.procedures.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-400">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayFieldChange("procedures", index, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white text-sm"
                    placeholder={`Étape ${index + 1}...`}
                  />
                  {formData.procedures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayFieldItem("procedures", index)}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem("procedures")}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Ajouter une étape
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <ListChecks className="inline h-4 w-4 mr-1" />
              Checklist de validation
            </label>
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayFieldChange("checklist", index, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white text-sm"
                    placeholder="Point de vérification..."
                  />
                  {formData.checklist.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayFieldItem("checklist", index)}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem("checklist")}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Ajouter un point
              </button>
            </div>
          </div>

          {/* Mitigation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Mesures de mitigation
            </label>
            <div className="space-y-2">
              {formData.mitigation.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayFieldChange("mitigation", index, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white text-sm"
                    placeholder="Mesure de mitigation..."
                  />
                  {formData.mitigation.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayFieldItem("mitigation", index)}
                      className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayFieldItem("mitigation")}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" />
                Ajouter une mesure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Mettre à jour" : "Créer la SOP"}
        </button>
      </div>
    </form>
  );
}
