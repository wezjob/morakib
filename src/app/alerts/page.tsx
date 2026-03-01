"use client";

import { useState } from "react";
import { AlertsTable } from "@/components/alerts/alerts-table";
import { AlertsFilters } from "@/components/alerts/alerts-filters";
import { AlertForm } from "@/components/alerts/alert-form";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle, Plus } from "lucide-react";

export default function AlertsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

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

      {/* Alerts Table */}
      <AlertsTable />

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
