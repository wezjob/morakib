import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function ProcessesPage() {
  return (
    <GovernanceDocumentsView
      section="processes"
      title="Processus de Gouvernance"
      subtitle="Processus formels pour maitriser changements, risques, performance SOC et plan de competences."
      highlights={[
        "Chaque processus inclut proprietaire, periodicite, preuves attendues et plan de remediation.",
        "Les processus critiques sont revus mensuellement en comite RSSI.",
      ]}
    />
  );
}
