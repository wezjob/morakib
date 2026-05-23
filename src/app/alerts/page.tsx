"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertsTable } from "@/components/alerts/alerts-table";
import { AlertsFilters } from "@/components/alerts/alerts-filters";
import { AlertForm } from "@/components/alerts/alert-form";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle, Plus } from "lucide-react";
import type { AlertStatus } from "@/types";

function AlertsPageContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const searchParams = useSearchParams();

  const action = searchParams.get("action");
  const view = searchParams.get("view");

  const presetStatus = useMemo<AlertStatus | undefined>(() => {
    if (view === "evidence") return "INVESTIGATING";
    if (view === "closure") return "ESCALATED";
    return undefined;
  }, [view]);

  useEffect(() => {
    if (action === "new") {
      setShowCreateModal(true);
    }
  }, [action]);

  const contextualTitle =
    view === "evidence"
      ? "Vue preuves: incidents en investigation"
      : view === "closure"
      ? "Vue clôture: incidents escaladés"
      : null;

  const contextualDescription =
    view === "evidence"
      ? "Ajoutez les preuves depuis le détail incident (menu Actions incident)."
      : view === "closure"
      ? "Finalisez les investigations et clôturez les incidents depuis leur fiche détail."
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">Alertes</h1>
          </div>
          <p className="text-slate-400 mt-1">
            Gérez et analysez les alertes de sécurité
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Exporter
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Nouvelle alerte
          </button>
        </div>
      </div>

      {/* Filters */}
      <AlertsFilters />

      {contextualTitle && (
        <div className="rounded-xl border border-blue-800/50 bg-blue-900/20 p-4">
          <p className="text-sm font-medium text-blue-200">{contextualTitle}</p>
          <p className="mt-1 text-sm text-slate-300">{contextualDescription}</p>
        </div>
      )}

      {/* Alerts Table */}
      <AlertsTable presetStatus={presetStatus} />

      {/* Create Alert Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une alerte"
        size="lg"
      >
        <AlertForm
          onSuccess={() => setShowCreateModal(false)}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-300">Chargement...</div>}>
      <AlertsPageContent />
    </Suspense>
  );
}
