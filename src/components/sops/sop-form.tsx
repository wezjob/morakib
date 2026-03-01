"use client";

import { useState } from "react";
import { useCreateSOP, useUpdateSOP } from "@/hooks/use-sops";
import { Loader2, Plus, X } from "lucide-react";

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
];

const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function SOPForm({ sop, onSuccess, onCancel }: SOPFormProps) {
  const isEdit = !!sop;
  const createSOP = useCreateSOP();
  const updateSOP = useUpdateSOP();

  const [formData, setFormData] = useState({
    title: sop?.title || "",
    slug: sop?.slug || "",
    category: sop?.category || "Intrusion",
    alertTypes: sop?.alertTypes || [],
    contentMarkdown: sop?.contentMarkdown || "",
    checklist: sop?.checklist || [""],
    status: sop?.status || "DRAFT",
  });

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

  const handleAlertTypeToggle = (alertType: string) => {
    const newTypes = formData.alertTypes.includes(alertType)
      ? formData.alertTypes.filter((t) => t !== alertType)
      : [...formData.alertTypes, alertType];
    setFormData({ ...formData, alertTypes: newTypes });
  };

  const handleChecklistChange = (index: number, value: string) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index] = value;
    setFormData({ ...formData, checklist: newChecklist });
  };

  const addChecklistItem = () => {
    setFormData({ ...formData, checklist: [...formData.checklist, ""] });
  };

  const removeChecklistItem = (index: number) => {
    const newChecklist = formData.checklist.filter((_, i) => i !== index);
    setFormData({ ...formData, checklist: newChecklist });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      checklist: formData.checklist.filter((item) => item.trim() !== ""),
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
          placeholder="Titre de la SOP"
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
          placeholder="ssh-brute-force"
        />
      </div>

      {/* Category & Status Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Catégorie *
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Statut *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          Contenu (Markdown) *
        </label>
        <textarea
          required
          value={formData.contentMarkdown}
          onChange={(e) => setFormData({ ...formData, contentMarkdown: e.target.value })}
          rows={8}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
          placeholder="## Objectif&#10;&#10;Décrire les étapes à suivre...&#10;&#10;## Procédure&#10;&#10;1. Première étape&#10;2. Seconde étape"
        />
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Checklist
        </label>
        <div className="space-y-2">
          {formData.checklist.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleChecklistChange(index, e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder={`Étape ${index + 1}`}
              />
              {formData.checklist.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChecklistItem(index)}
                  className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addChecklistItem}
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <Plus className="h-4 w-4" />
            Ajouter une étape
          </button>
        </div>
      </div>

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
