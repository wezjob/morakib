export type GovernanceSectionKey =
  | "foundations"
  | "organization"
  | "processes"
  | "metrics"
  | "compliance"
  | "roadmap";

export interface GovernanceDocument {
  id: string;
  title: string;
  objective: string;
  alignment: string;
  details: string[];
}

export interface KeyRoleDefinition {
  role: string;
  level: string;
  responsibilities: string[];
}

export const governanceDocuments: Record<GovernanceSectionKey, GovernanceDocument[]> = {
  foundations: [
    {
      id: "GOV-CHRT-01",
      title: "Charte du SOC",
      objective:
        "Acte fondateur qui officialise le SOC, definit sa mission, son perimetre, son autorite et ses relations avec les autres entites.",
      alignment:
        "NIST CSF (GOVERN): Etablir le contexte organisationnel et la strategie cyber.",
      details: [
        "Mission SOC: detection, analyse, reponse, coordination de crise.",
        "Perimetre couvert: on-prem, cloud, endpoints, applications critiques.",
        "Autorite: pouvoir d'escalade, de confinement et d'activation de crise.",
        "Interfaces: DSI, RSSI, Direction, Juridique, RH, metiers.",
        "Modele de service: 24/7 ou etendu, SLA et OLA associes.",
        "Revues annuelles avec validation direction et RSSI.",
      ],
    },
    {
      id: "GOV-POL-01",
      title: "Politique de Securite de l'Information",
      objective:
        "Document directeur de haut niveau qui exprime les intentions, principes et orientations generales en matiere de securite.",
      alignment:
        "NIST CSF (GOVERN): Definir la politique de gestion des risques cyber.",
      details: [
        "Principes de confidentialite, integrite, disponibilite et tracabilite.",
        "Engagement de la direction et gouvernance des risques.",
        "Roles et responsabilites globales de securite.",
        "Exigences minimales de controle par domaine (identite, reseau, endpoint, donnees).",
        "Cadre de conformite: ISO 27001, NIS2, exigences contractuelles.",
      ],
    },
    {
      id: "GOV-POL-02",
      title: "Politique de Reponse aux Incidents",
      objective:
        "Document strategique qui decrit les objectifs globaux et les principes de reponse aux incidents.",
      alignment: "NIST SP 800-61: Base de preparation et de gouvernance IR.",
      details: [
        "Definition incident evenement majeur, niveaux de severite.",
        "Objectifs MTTD/MTTR et principes de priorisation.",
        "Regles de communication interne/externe en situation de crise.",
        "Principe de conservation des preuves et chain-of-custody.",
        "Cadre de lecons apprises et amelioration continue.",
      ],
    },
    {
      id: "GOV-POL-03",
      title: "Politique d'Exploitation du SOC",
      objective:
        "Regles de fonctionnement quotidien du SOC: horaires, quarts, acces physique/logique et hygiene operationnelle.",
      alignment: "NIST CSF (PROTECT): PR.AC et controles operationnels.",
      details: [
        "Organisation des shifts, passation et permanence.",
        "Controle d'acces salle SOC et bastion d'administration.",
        "Regles d'usage des outils SOC, comptes techniques et secrets.",
        "Procedures de continuit e en cas d'indisponibilite d'outillage.",
        "Regles de supervision et escalation hors heures ouvrables.",
      ],
    },
    {
      id: "GOV-POL-04",
      title: "Politique de Classification et Controle des Donnees",
      objective:
        "Definit comment les donnees SOC (logs, alertes, rapports) sont classifiees, traitees, stockees et detruites.",
      alignment: "NIST CSF (IDENTIFY): ID.AM, ID.DE.",
      details: [
        "Niveaux de classification: public, interne, sensible, critique.",
        "Regles de retention des logs et evidences forensiques.",
        "Chiffrement au repos/en transit et gestion des cles.",
        "Controles d'acces par role et besoin d'en connaitre.",
        "Procedure de purge securisee et obligations RGPD.",
      ],
    },
  ],
  organization: [
    {
      id: "GOV-ORG-01",
      title: "Organigramme du SOC",
      objective:
        "Schema hierarchique et fonctionnel du SOC sous autorite RSSI avec liens vers DSI, Direction et Juridique.",
      alignment: "NIST CSF (GOVERN): Definir roles et responsabilites.",
      details: [
        "Lignes de management et delegation d'autorite.",
        "Lien fonctionnel avec CERT/CSIRT, IT Ops, CISO office.",
        "Points de contact metiers critiques.",
        "Mode nominal et mode crise (war room).",
      ],
    },
    {
      id: "GOV-ORG-02",
      title: "Matrice RACI des Responsabilites",
      objective:
        "Clarifier qui est Responsable, Approbateur, Consulte et Informe pour chaque processus et actif critique.",
      alignment: "NIST SP 800-61: Clarifier autorite et coordination.",
      details: [
        "RACI pour triage, investigation, confinement, eradication, recovery.",
        "RACI pour communication de crise et notifications leg ales.",
        "RACI pour changements de regles SIEM/EDR et exceptions.",
        "RACI pour gestion des preuves et audits.",
      ],
    },
    {
      id: "GOV-ORG-03",
      title: "Fiches de Poste SOC",
      objective:
        "Descriptions detaillees des roles SOC (Manager, N1/N2/N3, Threat Hunter) avec limites d'autorite.",
      alignment: "NIST CSF (GOVERN): Communiquer roles et responsabilites.",
      details: [
        "Competences techniques, outils maitrises et certifications attendues.",
        "Responsabilites quotidiennes et indicateurs de performance.",
        "Limites de decision (exemple: isolation serveur critique).",
        "Escalade vers manager, RSSI et cellule de crise.",
      ],
    },
    {
      id: "GOV-ORG-04",
      title: "Matrice d'Escalade des Incidents",
      objective:
        "Definir qui est informe, quand et par quel canal selon type/severite d'incident.",
      alignment: "NIST SP 800-61: Protocoles de communication.",
      details: [
        "Matrice par severite (P1/P2/P3/P4) et delais de notification.",
        "Canaux officiels: ticketing, bridge de crise, messagerie d'urgence.",
        "Escalade direction/juridique/regulateur selon impact.",
        "Template de message de crise et chaine de validation.",
      ],
    },
  ],
  processes: [
    {
      id: "GOV-PROC-01",
      title: "Processus d'Approbation des Changements",
      objective:
        "Cadre formel pour approuver toute modification impactant la securite (regles SIEM, couverture de surveillance, desactivation d'alerte).",
      alignment: "NIST CSF (PROTECT): PR.IP Gestion des changements.",
      details: [
        "Workflow RFC securite: demande, analyse impact, validation, implementation.",
        "Backout plan obligatoire pour changements critiques.",
        "Segregation des roles: demandeur, validateur, implementateur.",
        "Journal d'audit des changements et evidence de tests.",
      ],
    },
    {
      id: "GOV-PROC-02",
      title: "Processus d'Acceptation des Risques",
      objective:
        "Documenter, evaluer et faire approuver les risques residuels acceptes par la hierarchie.",
      alignment: "NIST SP 800-30: Processus de gestion des risques.",
      details: [
        "Format standard: risque, scenario, impact, probabilite, controles compensatoires.",
        "Validation obligatoire par niveau d'autorite defini.",
        "Date d'expiration et plan de reduction associe.",
        "Revue trimestrielle des risques acceptes.",
      ],
    },
    {
      id: "GOV-PROC-03",
      title: "Processus de Revue de Performance du SOC",
      objective:
        "Cadencer les revues quotidiennes/hebdomadaires/mensuelles/trimestrielles des KPIs et KRIs avec RSSI et Direction.",
      alignment: "NIST CSF (GOVERN): Surveiller et evaluer la performance.",
      details: [
        "Daily ops review: backlog alertes, incidents ouverts, capacite.",
        "Weekly review: qualite triage, faux positifs, detections manquantes.",
        "Monthly board: tendances de risque et recommandations budget.",
        "Quarterly executive: maturite SOC et roadmap.",
      ],
    },
    {
      id: "GOV-PROC-04",
      title: "Plan de Renforcement des Competences",
      objective:
        "Plan annuel de formation par role pour maintenir les competences face a l'evolution des menaces.",
      alignment: "NIST SP 800-61: Maintenir preparation et competence equipe.",
      details: [
        "Parcours obligatoire N1/N2/N3 + objectifs de certification.",
        "Exercices tabletop, purple team, simulations de crise.",
        "Suivi individuel des ecarts de competence.",
        "Mesure de l'impact formation sur performance operationnelle.",
      ],
    },
  ],
  metrics: [
    {
      id: "GOV-MET-01",
      title: "Tableau de Bord Operationnel",
      objective:
        "Visualisation temps reel pour managers SOC: alertes, charge analystes, sante capteurs et efficacite detection.",
      alignment: "NIST CSF (DETECT, RESPOND): DE.AE, RS.MI.",
      details: [
        "KPIs: MTTD, MTTR, taux escalation, taux faux positifs.",
        "Charge par analyste et saturation des files.",
        "Disponibilite pipeline logs et connecteurs critiques.",
        "Alertes sans proprietaire et tickets hors SLA.",
      ],
    },
    {
      id: "GOV-MET-02",
      title: "Tableau de Bord Strategique",
      objective:
        "Synthese pour RSSI/Direction avec tendances de risque et exposition globale.",
      alignment: "NIST CSF (GOVERN): Visibilite pour strategie et supervision.",
      details: [
        "KRIs: exposition vuln crit, non-conformites, dette de remediation.",
        "Tendances trimestrielles incidents par famille MITRE.",
        "Efficacite des investissements securite.",
        "Niveau de risque residuel par domaine metier.",
      ],
    },
    {
      id: "GOV-MET-03",
      title: "Framework de Mesure de Maturite",
      objective:
        "Evaluer periodiquement la maturite SOC (strategie, processus, technologie, people) via modele de type SOC-CMM.",
      alignment: "NIST CSF: Evaluation etat actuel/cible gestion des risques.",
      details: [
        "Auto-evaluation annuelle multi-dimensions.",
        "Niveaux de maturite cibles par capacite SOC.",
        "Plan d'action priorise pour combler les gaps.",
        "Benchmark interne/externe des performances.",
      ],
    },
    {
      id: "GOV-REP-01",
      title: "Rapport d'Incident Post-Mortem",
      objective:
        "Rapport structure apres incident majeur: timeline, mapping MITRE ATT&CK, efficacite reponse, lessons learned et actions correctives.",
      alignment: "NIST SP 800-61: Phase Lessons Learned.",
      details: [
        "Chronologie complete des evenements.",
        "Root cause analysis et facteurs contributifs.",
        "Evaluation de performance (temps detection, containment, recovery).",
        "Plan d'actions avec proprietaires et echeances.",
      ],
    },
    {
      id: "GOV-REP-02",
      title: "Rapport d'Audit Interne du SOC",
      objective:
        "Rapport formel de conformite et efficacite SOC avec non-conformites, points forts et recommandations.",
      alignment: "NIST CSF (GOVERN): Verification conformite et efficacite.",
      details: [
        "Constats classes par criticite.",
        "Evidences collecte es et tests de controle.",
        "Plan de remediation trace avec responsabilites.",
        "Suivi de cloture des recommandations.",
      ],
    },
  ],
  compliance: [
    {
      id: "GOV-COMP-01",
      title: "Matrice de Conformite Reglementaire",
      objective:
        "Cartographie entre exigences reglementaires (RGPD, NIS2, DORA, ISO) et controles/preuves SOC.",
      alignment: "NIST CSF (GOVERN): GV.OC obligations legales et reglementaires.",
      details: [
        "Lien exigence -> controle -> proprietaire -> preuve.",
        "Niveau de conformite et statut de remediation.",
        "Cycle de revue et mise a jour reglementaire.",
        "Tra cabilite des ecarts et derogations.",
      ],
    },
    {
      id: "GOV-COMP-02",
      title: "Preuves d'Audit ISO 27001:2022",
      objective:
        "Ensemble documentaire de preuve pour audits ISO 27001 (politiques, revues direction, competences, evidences controles).",
      alignment: "NIST CSF (GOVERN, PROTECT): Preuves de certification.",
      details: [
        "Registre des politiques et approbations.",
        "Preuves de formation et competence personnel SOC.",
        "Resultats d'audits internes et actions correctives.",
        "Preuves operationnelles de controle (logs, tickets, rapports).",
      ],
    },
  ],
  roadmap: [
    {
      id: "GOV-ROAD-01",
      title: "Feuille de Route d'Evolution du SOC",
      objective:
        "Plan strategique 1-3 ans pour faire evoluer capacites SOC selon risques, technologies et priorites metier.",
      alignment: "NIST CSF (GOVERN): GV.PO strategie et priorites.",
      details: [
        "Vision cible SOC (people, process, tech).",
        "Lots annuels: quick wins, medium wins, transformations.",
        "Investissements: automatisation SOAR, threat hunting, detection engineering.",
        "Dependencies IT/metier et jalons de livraison.",
        "Mesures de succes et gouvernance de pilotage.",
      ],
    },
  ],
};

export const keyRoles: KeyRoleDefinition[] = [
  {
    role: "RSSI (Chief Information Security Officer)",
    level: "Direction",
    responsibilities: [
      "Definit la strategie securite et arbitrages de risque.",
      "Reporte au comite de direction et valide priorites SOC.",
      "Assure coherence avec obligations reglementaires.",
    ],
  },
  {
    role: "SOC Manager",
    level: "Management",
    responsibilities: [
      "Pilote operations SOC et performance equipe.",
      "Gere budget, capacite, qualite de service.",
      "Conduit amelioration continue et roadmap.",
    ],
  },
  {
    role: "Analyste SOC Niveau 1",
    level: "Operationnel",
    responsibilities: [
      "Supervise alertes 24/7 et qualifie criticite.",
      "Effectue triage et enrichissement initial.",
      "Escalade incidents verifies vers N2.",
    ],
  },
  {
    role: "Analyste SOC Niveau 2",
    level: "Operationnel",
    responsibilities: [
      "Mene investigations approfondies.",
      "Execute confinement et coordination technique.",
      "Documente hypotheses et recommandations.",
    ],
  },
  {
    role: "Analyste SOC Niveau 3 / Threat Hunter",
    level: "Operationnel",
    responsibilities: [
      "Recherche proactive de menaces avancees.",
      "Construit detections personnalisees et use-cases.",
      "Contribue a l'automatisation des reponses.",
    ],
  },
  {
    role: "Ingenieur Securite / Forensics",
    level: "Support / Expertise",
    responsibilities: [
      "Maintient outillage SIEM/EDR/SOAR.",
      "Conduit analyses forensiques majeures.",
      "Supporte la qualite des traces et evidences.",
    ],
  },
];

export const governanceNav = [
  { key: "foundations", label: "Documents Fondateurs", href: "/management/foundations" },
  { key: "organization", label: "Organisation & Roles", href: "/management/organization" },
  { key: "processes", label: "Processus", href: "/management/processes" },
  { key: "metrics", label: "Reporting & Metriques", href: "/management/metrics" },
  { key: "compliance", label: "Conformite", href: "/management/compliance" },
  { key: "roadmap", label: "Roadmap", href: "/management/roadmap" },
] as const;
