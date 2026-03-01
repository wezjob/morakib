"use client";

import { useState } from "react";
import { useCreateAlert, useUpdateAlert } from "@/hooks/use-alerts";
import { AlertSeverity, AlertStatus, AlertSource } from "@/types";
import { Loader2 } from "lucide-react";

interface AlertFormProps {
  alert?: {
    id: string;
    title: string;
    description?: string;
    severity: string;
    status: string;
    source: string;
    sourceIp?: string;
    destIp?: string;
    destPort?: number;
    protocol?: string;
    ruleName?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const severities: AlertSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const statuses: AlertStatus[] = ["NEW", "ASSIGNED", "INVESTIGATING", "RESOLVED", "ESCALATED", "FALSE_POSITIVE"];
const sources: AlertSource[] = ["SURICATA", "ZEEK", "FILEBEAT", "ELASTIC", "CUSTOM"];

export function AlertForm({ alert, onSuccess, onCancel }: AlertFormProps) {
  const isEdit = !!alert;
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();

  const [formData, setFormData] = useState({
    title: alert?.title || "",
    description: alert?.description || "",
    severity: (alert?.severity as AlertSeverity) || "MEDIUM",
    status: (alert?.status as AlertStatus) || "NEW",
    source: (alert?.source as AlertSource) || "SURICATA",
    sourceIp: alert?.sourceIp || "",
    destIp: alert?.destIp || "",
    destPort: alert?.destPort?.toString() || "",
    protocol: alert?.protocol || "",
    ruleName: alert?.ruleName || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title: formData.title,
      description: formData.description,
      severity: formData.severity as AlertSeverity,
      status: formData.status as AlertStatus,
      source: formData.source as AlertSource,
      sourceIp: formData.sourceIp,
      destIp: formData.destIp,
      destPort: formData.destPort ? parseInt(formData.destPort) : undefined,
      protocol: formData.protocol,
      ruleName: formData.ruleName,
    };

    try {
      if (isEdit) {
        await updateAlert.mutateAsync({ id: alert.id, ...data });
      } else {
        await createAlert.mutateAsync(data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving alert:", error);
    }
  };

  const isLoading = createAlert.isPending || updateAlert.isPending;

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
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Titre de l'alerte"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Description de l'alerte"
        />
      </div>

      {/* Severity & Status Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Sévérité *
          </label>
          <select
            required
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {severities.map((s) => (
              <option key={s} value={s}>{s}</option>
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
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AlertStatus })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Source *
        </label>
        <select
          required
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value as AlertSource })}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Network Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            IP Source
          </label>
          <input
            type="text"
            value={formData.sourceIp}
            onChange={(e) => setFormData({ ...formData, sourceIp: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="192.168.1.100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            IP Destination
          </label>
          <input
            type="text"
            value={formData.destIp}
            onChange={(e) => setFormData({ ...formData, destIp: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="10.0.0.1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Port Destination
          </label>
          <input
            type="number"
            value={formData.destPort}
            onChange={(e) => setFormData({ ...formData, destPort: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="443"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Protocole
          </label>
          <input
            type="text"
            value={formData.protocol}
            onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="TCP"
          />
        </div>
      </div>

      {/* Rule Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Nom de la règle
        </label>
        <input
          type="text"
          value={formData.ruleName}
          onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="LABSOC SSH Brute Force"
        />
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
          {isEdit ? "Mettre à jour" : "Créer l'alerte"}
        </button>
      </div>
    </form>
  );
}
