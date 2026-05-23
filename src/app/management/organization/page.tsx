import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function OrganizationPage() {
  return (
    <GovernanceDocumentsView
      section="organization"
      title="Organisation et Roles"
      subtitle="Structure organisationnelle du SOC, gouvernance des responsabilites et matrice d'escalade."
      highlights={[
        "Validation mensuelle de la matrice d'escalade par SOC Manager et RSSI.",
        "RACI maintenue a jour a chaque changement de processus critique.",
      ]}
      showRolesMatrix
    />
  );
}
