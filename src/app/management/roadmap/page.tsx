import GovernanceDocumentsView from "@/components/management/governance-documents-view";

export default function RoadmapPage() {
  return (
    <GovernanceDocumentsView
      section="roadmap"
      title="Roadmap et Amelioration Continue"
      subtitle="Plan pluriannuel d'evolution SOC, avec jalons, priorites, dependances et mesure de succes."
      highlights={[
        "People: recrutement cible, parcours d'expertise N2/N3, retention.",
        "Process: standardisation IR, quality gates et post-mortems actionnables.",
        "Technology: SIEM tuning, automatisation SOAR, capacites forensiques.",
        "Governance: pilotage risque-base, reporting executif et budget trace.",
      ]}
    />
  );
}
