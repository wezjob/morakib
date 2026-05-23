"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  History,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useSOPInstances, useCreateSOPInstance, useDeleteSOPInstance, SOPInstance, SOPInstanceStatus } from "@/hooks/use-sop-instances";
import { useSOPs } from "@/hooks/use-sops";
import { allSOPs, SOPTemplate } from "@/data/sops";
import Link from "next/link";

const statusConfig: Record<SOPInstanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Brouillon", color: "bg-slate-500/20 text-slate-400", icon: FileText },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  COMPLETED: { label: "Complété", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  VALIDATED: { label: "Validé", color: "bg-purple-500/20 text-purple-400", icon: UserCheck },
  ARCHIVED: { label: "Archivé", color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
};

// Temporary user ID - in production this would come from auth
const CURRENT_USER_ID = "demo-user-id";

function SOPInstancesContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const isPlaybooksSection = section === "playbooks";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sopFilter, setSopFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<SOPInstance | null>(null);

  // Form state for creating new instance
  const [formSopSlug, setFormSopSlug] = useState("");
  const [formSubjectName, setFormSubjectName] = useState("");
  const [formSubjectEmail, setFormSubjectEmail] = useState("");
  const [formSubjectRole, setFormSubjectRole] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  const { data: playbooksCatalog } = useSOPs({ category: "Playbook NIST" });

  const selectableProcedures = isPlaybooksSection
    ? (playbooksCatalog || []).map((pb) => ({
        slug: pb.slug,
        title: pb.title,
        version: 1,
        totalSteps: pb.checklist?.length || pb.procedures?.length || 1,
      }))
    : allSOPs.map((sop: SOPTemplate) => ({
        slug: sop.slug,
        title: sop.title,
        version: sop.version,
        totalSteps: sop.steps.length,
      }));

  const { data, isLoading, refetch } = useSOPInstances({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sopSlug: sopFilter || undefined,
    section: isPlaybooksSection ? "playbooks" : "sops",
    page,
    limit: 10,
  });

  const createMutation = useCreateSOPInstance();
  const deleteMutation = useDeleteSOPInstance();

  const handleCreate = async () => {
    const selectedSop = selectableProcedures.find((s) => s.slug === formSopSlug);
    if (!selectedSop) return;

    try {
      await createMutation.mutateAsync({
        sopSlug: formSopSlug,
        sopTitle: selectedSop.title,
        sopVersion: String(selectedSop.version || "1.0"),
        subjectName: formSubjectName,
        subjectEmail: formSubjectEmail || undefined,
        subjectRole: formSubjectRole || undefined,
        createdById: CURRENT_USER_ID,
        totalSteps: selectedSop.totalSteps,
        dueDate: formDueDate || undefined,
      });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating instance:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedInstance) return;
    try {
      await deleteMutation.mutateAsync(selectedInstance.id);
      setDeleteDialogOpen(false);
      setSelectedInstance(null);
    } catch (error) {
      console.error("Error deleting instance:", error);
    }
  };

  const resetForm = () => {
    setFormSopSlug("");
    setFormSubjectName("");
    setFormSubjectEmail("");
    setFormSubjectRole("");
    setFormDueDate("");
  };

  const openDeleteDialog = (instance: SOPInstance) => {
    setSelectedInstance(instance);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isPlaybooksSection ? "Playbooks remplis" : "SOPs Remplis"}
            </h1>
            <p className="text-slate-400">
              {isPlaybooksSection
                ? "Suivi et historique des playbooks complétés"
                : "Suivi et historique des procédures complétées"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isPlaybooksSection ? "Nouveau Playbook" : "Nouveau SOP"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).slice(0, 4).map(([status, config]) => {
          const count = data?.instances.filter((i) => i.status === status).length || 0;
          const Icon = config.icon;
          return (
            <Card key={status} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{config.label}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isPlaybooksSection ? "Instances de Playbooks" : "Instances de SOPs"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {data?.pagination.total || 0} instance(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">Tous statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Complété</option>
              <option value="VALIDATED">Validé</option>
            </Select>
            <Select
              value={sopFilter}
              onChange={(e) => setSopFilter(e.target.value)}
              className="w-56"
            >
              <option value="">{isPlaybooksSection ? "Tous les Playbooks" : "Toutes les SOPs"}</option>
              {allSOPs
                .filter((sop: SOPTemplate) =>
                  isPlaybooksSection ? sop.slug.startsWith("nist-playbook") : !sop.slug.startsWith("nist-playbook")
                )
                .map((sop: SOPTemplate) => (
                <option key={sop.slug} value={sop.slug}>
                  {sop.title}
                </option>
                ))}
            </Select>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>{isPlaybooksSection ? "Playbook" : "SOP"}</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                    </TableCell>
                  </TableRow>
                ) : !data?.instances.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                      Aucune instance trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  data.instances.map((instance) => {
                    const status = statusConfig[instance.status];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <span className="font-mono text-sm text-emerald-400">
                            {instance.reference}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-white truncate">{instance.sopTitle}</p>
                            <p className="text-xs text-slate-500">v{instance.sopVersion}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{instance.subjectName}</p>
                            {instance.subjectRole && (
                              <p className="text-xs text-slate-500">{instance.subjectRole}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {instance.mentor ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {instance.mentor.name?.slice(0, 2).toUpperCase() || "??"}
                                </span>
                              </div>
                              <span className="text-slate-300">{instance.mentor.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${instance.completionPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">
                              {instance.completionPercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-300">
                            {new Date(instance.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                          {instance._count?.history && (
                            <p className="text-xs text-slate-500">
                              v{instance.version} · {instance._count.history} modif.
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/sops/instances/${instance.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/sops/instances/${instance.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/sops/instances/${instance.id}/history`}>
                              <Button variant="ghost" size="sm">
                                <History className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(instance)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-400">
                Page {data.pagination.page} sur {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              {isPlaybooksSection ? "Créer une nouvelle instance Playbook" : "Créer une nouvelle instance SOP"}
            </DialogTitle>
            <DialogDescription>
              {isPlaybooksSection
                ? "Démarrer le remplissage d&apos;un playbook pour une personne ou un cas spécifique"
                : "Démarrer le remplissage d&apos;un SOP pour une personne ou un cas spécifique"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sop">{isPlaybooksSection ? "Playbook à remplir *" : "SOP à remplir *"}</Label>
              <Select
                id="sop"
                value={formSopSlug}
                onChange={(e) => setFormSopSlug(e.target.value)}
              >
                <option value="">{isPlaybooksSection ? "Sélectionner un Playbook..." : "Sélectionner un SOP..."}</option>
                {selectableProcedures.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectName">Nom du sujet *</Label>
              <Input
                id="subjectName"
                value={formSubjectName}
                onChange={(e) => setFormSubjectName(e.target.value)}
                placeholder="Ex: Ahmed Bennani"
              />
              <p className="text-xs text-slate-500">
                {isPlaybooksSection
                  ? "La personne concernée par ce playbook (ex: analyste en charge)"
                  : "La personne concernée par ce SOP (ex: nouvel analyste)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectEmail">Email</Label>
                <Input
                  id="subjectEmail"
                  type="email"
                  value={formSubjectEmail}
                  onChange={(e) => setFormSubjectEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectRole">Rôle</Label>
                <Input
                  id="subjectRole"
                  value={formSubjectRole}
                  onChange={(e) => setFormSubjectRole(e.target.value)}
                  placeholder="Analyste L1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Date limite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formSopSlug || !formSubjectName || createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Supprimer l&apos;instance
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L&apos;instance et tout son historique seront supprimés.
            </DialogDescription>
          </DialogHeader>

          {selectedInstance && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="font-mono text-emerald-400">{selectedInstance.reference}</p>
                <p className="text-white mt-1">{selectedInstance.title}</p>
                <p className="text-sm text-slate-400 mt-1">{selectedInstance.subjectName}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SOPInstancesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-300">Chargement...</div>}>
      <SOPInstancesContent />
    </Suspense>
  );
}
