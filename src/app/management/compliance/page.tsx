import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function CompliancePage() {
  return (
    <GovernanceDocumentsView
      section="compliance"
      title="Conformite et Audit"
      subtitle="Cartographie des obligations reglementaires, evidences et preparation des audits ISO 27001:2022."
      highlights={[
        "Les preuves sont indexees par controle, periode, proprietaire et statut.",
        "Tout ecart critique declenche une action corrective avec verification de cloture.",
      ]}
    />
  );
}
