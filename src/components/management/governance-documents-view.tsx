"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Download,
  FileText,
  History,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Shield,
  Target,
  Trash2,
  X,
} from "lucide-react";

import { governanceNav, GovernanceSectionKey, keyRoles } from "@/data/governance-docs";

interface GovernanceApiDocument {
  id: string;
  code: string;
  section: GovernanceSectionKey;
  title: string;
  objective: string;
  alignment: string;
  details: string[];
  sortOrder: number;
  workflowStatus: "DRAFT" | "IN_REVIEW_LEAD" | "IN_REVIEW_ADMIN" | "APPROVED";
  submittedForReviewAt: string | null;
  leadReviewedAt: string | null;
  leadReviewedByName: string | null;
  leadReviewedByRole: string | null;
  leadSignatureLabel: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  approvedByRole: string | null;
  signatureLabel: string | null;
}

interface GovernanceVersion {
  id: string;
  versionNo: number;
  action: string;
  actorName: string | null;
  actorRole: string | null;
  createdAt: string;
}

interface GovernanceNotification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

interface GovernanceDocumentsViewProps {
  section: GovernanceSectionKey;
  title: string;
  subtitle: string;
  highlights?: string[];
  showRolesMatrix?: boolean;
}

const emptyForm = {
  code: "",
  title: "",
  objective: "",
  alignment: "",
  detailsText: "",
};

export default function GovernanceDocumentsView({
  section,
  title,
  subtitle,
  highlights = [],
  showRolesMatrix = false,
}: GovernanceDocumentsViewProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const isAdmin = userRole === "ADMIN";
  const isLead = userRole === "LEAD";
  const canEdit = userRole === "ADMIN" || userRole === "LEAD";

  const [documents, setDocuments] = useState<GovernanceApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GovernanceApiDocument | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [historyByDoc, setHistoryByDoc] = useState<Record<string, GovernanceVersion[]>>({});
  const [openHistoryDocId, setOpenHistoryDocId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<GovernanceNotification[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ section });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return params.toString();
  }, [section, search]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/governance-docs?${queryString}`);
      if (!response.ok) {
        throw new Error("Erreur de chargement");
      }

      const payload = await response.json();
      setDocuments((payload.documents || []) as GovernanceApiDocument[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const loadNotifications = useCallback(async () => {
    if (!canEdit) return;
    try {
      const response = await fetch("/api/governance-docs/notifications?unreadOnly=true");
      if (!response.ok) return;
      const payload = await response.json();
      setNotifications((payload.notifications || []) as GovernanceNotification[]);
    } catch {
      // Ignore notification errors to avoid blocking the governance page.
    }
  }, [canEdit]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const openEdit = (doc: GovernanceApiDocument) => {
    setEditingId(doc.id);
    setDraft({ ...doc });
  };

  const closeEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft) return;

    setSavingId(draft.id);
    try {
      const response = await fetch(`/api/governance-docs/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: draft.code,
          title: draft.title,
          objective: draft.objective,
          alignment: draft.alignment,
          details: draft.details,
          sortOrder: draft.sortOrder,
        }),
      });

      if (!response.ok) {
        throw new Error("Enregistrement impossible");
      }

      await loadDocuments();
      await loadNotifications();
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSavingId(null);
    }
  };

  const removeDoc = async (docId: string) => {
    if (!window.confirm("Supprimer ce document ?")) return;

    setSavingId(docId);
    try {
      const response = await fetch(`/api/governance-docs/${docId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Suppression impossible");
      }
      await loadDocuments();
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de suppression");
    } finally {
      setSavingId(null);
    }
  };

  const createDoc = async () => {
    const details = createForm.detailsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    setSavingId("create");
    try {
      const response = await fetch("/api/governance-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          code: createForm.code,
          title: createForm.title,
          objective: createForm.objective,
          alignment: createForm.alignment,
          details,
        }),
      });

      if (!response.ok) {
        throw new Error("Creation impossible");
      }

      setCreateForm(emptyForm);
      setShowCreate(false);
      await loadDocuments();
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de creation");
    } finally {
      setSavingId(null);
    }
  };

  const transitionWorkflow = async (
    docId: string,
    status: "DRAFT" | "IN_REVIEW_LEAD" | "IN_REVIEW_ADMIN" | "APPROVED"
  ) => {
    setSavingId(docId);
    try {
      let signatureLabel: string | undefined;
      if (status === "IN_REVIEW_ADMIN") {
        const proposed = `${session?.user?.name || session?.user?.email || "Utilisateur"} (${userRole || "LEAD"})`;
        signatureLabel = window.prompt("Signature validation Lead", proposed) || proposed;
      }
      if (status === "APPROVED") {
        const proposed = `${session?.user?.name || session?.user?.email || "Utilisateur"} (${userRole || "UNKNOWN"})`;
        signatureLabel = window.prompt("Signature validation Admin/RSSI", proposed) || proposed;
      }

      const response = await fetch(`/api/governance-docs/${docId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, signatureLabel }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Transition workflow impossible");
      }

      await loadDocuments();
      await loadNotifications();
      if (openHistoryDocId === docId) {
        await loadHistory(docId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur workflow");
    } finally {
      setSavingId(null);
    }
  };

  const loadHistory = async (docId: string) => {
    try {
      const response = await fetch(`/api/governance-docs/${docId}/versions`);
      if (!response.ok) {
        throw new Error("Historique indisponible");
      }
      const payload = await response.json();
      setHistoryByDoc((prev) => ({ ...prev, [docId]: payload.versions || [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement historique");
    }
  };

  const toggleHistory = async (docId: string) => {
    const willOpen = openHistoryDocId !== docId;
    setOpenHistoryDocId(willOpen ? docId : null);
    if (willOpen) {
      await loadHistory(docId);
    }
  };

  const workflowLabel = (status: GovernanceApiDocument["workflowStatus"]) => {
    if (status === "APPROVED") return "Approuve";
    if (status === "IN_REVIEW_ADMIN") return "En revue Admin/RSSI";
    if (status === "IN_REVIEW_LEAD") return "En revue Lead";
    return "Brouillon";
  };

  const workflowBadgeClass = (status: GovernanceApiDocument["workflowStatus"]) => {
    if (status === "APPROVED") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    if (status === "IN_REVIEW_ADMIN") return "border-indigo-500/40 bg-indigo-500/10 text-indigo-300";
    if (status === "IN_REVIEW_LEAD") return "border-blue-500/40 bg-blue-500/10 text-blue-300";
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/management/governance"
          className="rounded-lg border border-gray-700 bg-gray-900/40 px-3 py-2 text-sm text-gray-200 hover:text-white"
        >
          Recherche globale
        </Link>
        {governanceNav.map((item) => {
          const isActive = item.key === section;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-red-500 bg-red-500/10 text-red-300"
                  : "border-gray-800 bg-gray-900/30 text-gray-300 hover:border-gray-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-300">{subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/governance-docs/export?section=${section}&format=pdf&layout=official`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 hover:text-white"
          >
            <Download className="h-4 w-4" /> Export PDF
          </a>
          <a
            href={`/api/governance-docs/export?section=${section}&format=docx&layout=official`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 hover:text-white"
          >
            <Download className="h-4 w-4" /> Export Word
          </a>
          <Link
            href={`/management/governance/print?section=${section}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 hover:text-white"
          >
            <Printer className="h-4 w-4" /> Impression
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher dans les documents de cette section"
              className="w-full rounded-lg border border-gray-700 bg-gray-950/60 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-red-500"
            />
          </div>

          {canEdit ? (
            <button
              type="button"
              onClick={() => setShowCreate((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20"
            >
              <Plus className="h-4 w-4" /> Nouveau document
            </button>
          ) : null}
        </div>

        {showCreate ? (
          <div className="mt-4 grid gap-2 rounded-lg border border-gray-800 bg-gray-950/40 p-4">
            <input
              value={createForm.code}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Code (ex: GOV-PROC-05)"
              className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Titre"
              className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={createForm.objective}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, objective: event.target.value }))}
              placeholder="Objectif"
              rows={2}
              className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={createForm.alignment}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, alignment: event.target.value }))}
              placeholder="Alignement NIST/MITRE"
              rows={2}
              className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={createForm.detailsText}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, detailsText: event.target.value }))}
              placeholder="Details (une ligne par point)"
              rows={4}
              className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void createDoc()}
                disabled={savingId === "create"}
                className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Creer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateForm(emptyForm);
                }}
                className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading ? <p className="text-sm text-gray-300">Chargement des documents...</p> : null}

      {!loading ? (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const isEditing = editingId === doc.id && draft;
            const isLocked = doc.workflowStatus === "APPROVED";
                  const canLeadApprove = isLead && doc.workflowStatus === "IN_REVIEW_LEAD";
            const canAdminApprove = isAdmin && doc.workflowStatus === "IN_REVIEW_ADMIN";
            return (
              <article key={doc.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300">
                      {isEditing ? draft.code : doc.code}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${workflowBadgeClass(doc.workflowStatus)}`}>
                      {workflowLabel(doc.workflowStatus)}
                    </span>
                    <h2 className="text-lg font-semibold text-white">{isEditing ? draft.title : doc.title}</h2>
                  </div>
                  {canEdit ? (
                    <div className="flex gap-2">
                      {!isEditing && !isLocked ? (
                        <button
                          type="button"
                          onClick={() => openEdit(doc)}
                          className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-xs text-gray-200"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            disabled={savingId === doc.id}
                            className="inline-flex items-center gap-1 rounded border border-emerald-500/50 px-2 py-1 text-xs text-emerald-300"
                          >
                            <Save className="h-3.5 w-3.5" /> Sauver
                          </button>
                          <button
                            type="button"
                            onClick={closeEdit}
                            className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-xs text-gray-200"
                          >
                            <X className="h-3.5 w-3.5" /> Annuler
                          </button>
                        </>
                      )}
                      {doc.workflowStatus === "DRAFT" ? (
                        <button
                          type="button"
                          onClick={() => void transitionWorkflow(doc.id, "IN_REVIEW_LEAD")}
                          disabled={savingId === doc.id}
                          className="inline-flex items-center gap-1 rounded border border-blue-500/40 px-2 py-1 text-xs text-blue-300 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> Soumettre Lead
                        </button>
                      ) : null}

                      {canLeadApprove ? (
                        <button
                          type="button"
                          onClick={() => void transitionWorkflow(doc.id, "IN_REVIEW_ADMIN")}
                          disabled={savingId === doc.id}
                          className="inline-flex items-center gap-1 rounded border border-indigo-500/40 px-2 py-1 text-xs text-indigo-300 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valider Lead
                        </button>
                      ) : null}

                      {canAdminApprove ? (
                        <button
                          type="button"
                          onClick={() => void transitionWorkflow(doc.id, "APPROVED")}
                          disabled={savingId === doc.id}
                          className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Valider Admin
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void transitionWorkflow(doc.id, "DRAFT")}
                        disabled={savingId === doc.id || doc.workflowStatus === "DRAFT" || !isAdmin}
                        className="inline-flex items-center gap-1 rounded border border-amber-500/40 px-2 py-1 text-xs text-amber-300 disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Deverrouiller
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleHistory(doc.id)}
                        className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-xs text-gray-200"
                      >
                        <History className="h-3.5 w-3.5" /> Historique
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeDoc(doc.id)}
                        disabled={savingId === doc.id || isLocked}
                        className="inline-flex items-center gap-1 rounded border border-red-500/40 px-2 py-1 text-xs text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </div>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-3 grid gap-2">
                    <input
                      value={draft.code}
                      onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                      className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <input
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <textarea
                      rows={2}
                      value={draft.objective}
                      onChange={(event) => setDraft({ ...draft, objective: event.target.value })}
                      className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <textarea
                      rows={2}
                      value={draft.alignment}
                      onChange={(event) => setDraft({ ...draft, alignment: event.target.value })}
                      className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                    <textarea
                      rows={5}
                      value={draft.details.join("\n")}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          details: event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean),
                        })
                      }
                      className="rounded border border-gray-700 bg-black/20 px-3 py-2 text-sm text-white"
                    />
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          <Target className="h-4 w-4" />
                          Objectif
                        </p>
                        <p className="text-sm text-gray-200">{doc.objective}</p>
                      </div>
                      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          <Shield className="h-4 w-4" />
                          Alignement
                        </p>
                        <p className="text-sm text-gray-200">{doc.alignment}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                      <p className="mb-3 text-xs text-gray-400">
                        Signature Lead: {doc.leadSignatureLabel || "N/A"}
                        {doc.leadReviewedByName ? ` - ${doc.leadReviewedByName}` : ""}
                        {doc.leadReviewedAt ? ` - ${new Date(doc.leadReviewedAt).toLocaleString("fr-FR")}` : ""}
                      </p>
                      <p className="mb-3 text-xs text-gray-400">
                        Signature Admin/RSSI: {doc.signatureLabel || "N/A"}
                        {doc.approvedByName ? ` - ${doc.approvedByName}` : ""}
                        {doc.approvedAt ? ` - ${new Date(doc.approvedAt).toLocaleString("fr-FR")}` : ""}
                      </p>
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <FileText className="h-4 w-4" />
                        Contenu detaille
                      </p>
                      <ul className="space-y-2 text-sm text-gray-200">
                        {doc.details.map((detail) => (
                          <li key={`${doc.id}-${detail}`} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                          <a
                            href={`/api/governance-docs/audit/export?section=${section}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-600 hover:text-white"
                          >
                            <History className="h-4 w-4" /> Audit CSV
                          </a>

                {openHistoryDocId === doc.id ? (
                  <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Historique des versions</p>
                    <ul className="space-y-2 text-xs text-gray-300">
                      {(historyByDoc[doc.id] || []).map((version) => (
                        <li key={version.id} className="rounded border border-gray-800 bg-gray-950/40 p-2">
                          <p className="font-semibold text-white">v{version.versionNo} - {version.action}</p>

                      {notifications.length > 0 ? (
                        <div className="rounded-xl border border-indigo-700/40 bg-indigo-950/20 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                            Alertes internes gouvernance
                          </p>
                          <ul className="space-y-2 text-sm text-indigo-100">
                            {notifications.slice(0, 5).map((notification) => (
                              <li key={notification.id} className="rounded border border-indigo-800/40 bg-indigo-950/30 p-2">
                                <p className="font-semibold">{notification.title}</p>
                                <p>{notification.message}</p>
                                <div className="mt-1 flex items-center justify-between text-xs text-indigo-300">
                                  <span>{new Date(notification.createdAt).toLocaleString("fr-FR")}</span>
                                  {notification.link ? (
                                    <Link href={notification.link} className="underline hover:text-indigo-100">
                                      Ouvrir
                                    </Link>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch("/api/governance-docs/notifications", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ids: notifications.map((n) => n.id) }),
                              });
                              setNotifications([]);
                            }}
                            className="mt-3 rounded border border-indigo-600/40 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-900/40"
                          >
                            Marquer comme lues
                          </button>
                        </div>
                      ) : null}
                          <p>{version.actorName || "Inconnu"} ({version.actorRole || "UNKNOWN"})</p>
                          <p>{new Date(version.createdAt).toLocaleString("fr-FR")}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">Points de pilotage</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-200">
            {highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showRolesMatrix ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
            Roles et responsabilites cles
          </h3>
          <div className="mt-3 grid gap-3">
            {keyRoles.map((roleDef) => (
              <div key={roleDef.role} className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{roleDef.role}</p>
                  <span className="rounded-md border border-gray-700 px-2 py-0.5 text-xs text-gray-300">
                    {roleDef.level}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-gray-200">
                  {roleDef.responsibilities.map((responsibility) => (
                    <li key={responsibility}>- {responsibility}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
