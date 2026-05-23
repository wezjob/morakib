import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function FoundationsPage() {
  return (
    <GovernanceDocumentsView
      section="foundations"
      title="Documents Fondateurs du SOC"
      subtitle="Socle documentaire qui officialise la mission, les politiques, les exigences de securite et les principes de gouvernance du SOC."
      highlights={[
        "Charte et politiques valides par la direction et revues annuellement.",
        "Alignement explicite entre objectifs metier et posture cyber.",
        "Tra cabilite des obligations et des responsables de controle.",
      ]}
    />
  );
}
