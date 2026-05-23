import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function MetricsPage() {
  return (
    <GovernanceDocumentsView
      section="metrics"
      title="Metriques et Reporting"
      subtitle="Pilotage de la performance SOC par KPIs/KRIs, rapports post-incident et audits internes."
      highlights={[
        "Quotidien: operations SOC et backlog.",
        "Hebdomadaire: efficacite detection/reponse et qualite triage.",
        "Mensuel: synthese manager + RSSI.",
        "Trimestriel: comite direction, risque et budget.",
      ]}
    />
  );
}
