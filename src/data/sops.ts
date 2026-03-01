/**
 * SOPs - Procédures Opérationnelles Standard
 * SOC Analyst Assistant - Morakib
 * Version 1.0
 */

export interface SOPChecklistItem {
  id: string;
  text: string;
  required: boolean;
  category?: string;
}

export interface SOPStep {
  id: number;
  title: string;
  description: string;
  actions: string[];
  checklist?: SOPChecklistItem[];
  tips?: string[];
  commands?: { description: string; command: string }[];
  timeEstimate?: string;
  responsible?: string;
}

export interface SOPTemplate {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  version: string;
  alertTypes: string[];
  objectives: string[];
  scope: string;
  roles: { role: string; responsibilities: string[] }[];
  steps: SOPStep[];
  kpis?: { name: string; target: string; description: string }[];
  escalationMatrix?: { level: string; criteria: string; contact: string; sla: string }[];
  templates?: { name: string; content: string }[];
  annexes?: { title: string; content: string }[];
}

// ============================================
// SOP 1: ONBOARDING ANALYSTE SOC
// ============================================
export const sopOnboarding: SOPTemplate = {
  id: "onboarding-analyst",
  slug: "onboarding-analyste-soc",
  title: "Onboarding d'Analyste SOC (L1/L2/L3)",
  category: "Personnel",
  description: "Procédure d'intégration des nouveaux analystes SOC pour garantir l'acquisition des accès, compétences et connaissances nécessaires.",
  version: "1.0",
  alertTypes: [],
  objectives: [
    "Assurer acquisition rapide des accès et habilitations",
    "Formation sur les outils SOC (ELK, EDR, TheHive, MISP)",
    "Validation des compétences avant mise en production",
    "Assignation mentor et suivi progression"
  ],
  scope: "Tous les analystes SOC embauchés ou transférés dans l'équipe SOC interne",
  roles: [
    {
      role: "Chef SOC",
      responsibilities: [
        "Validation finale de l'onboarding",
        "Assignation du mentor",
        "Approbation des accès étendus"
      ]
    },
    {
      role: "Mentor (L2/L3)",
      responsibilities: [
        "Formation pratique quotidienne",
        "Revue des compétences",
        "Rapport d'évaluation"
      ]
    },
    {
      role: "Équipe IT/Sécurité",
      responsibilities: [
        "Création comptes et habilitations",
        "Configuration MFA",
        "Accès outils"
      ]
    },
    {
      role: "Nouvel Analyste",
      responsibilities: [
        "Compléter les formations",
        "Démontrer les compétences",
        "Documenter l'apprentissage"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Pré-boarding (J-7 à J-1)",
      description: "Préparation avant l'arrivée du nouvel analyste",
      timeEstimate: "1-2 heures",
      responsible: "IT + Chef SOC",
      actions: [
        "Envoyer welcome pack avec documentation",
        "Créer comptes AD/SSO et mail",
        "Configurer poste de travail sécurisé",
        "Préparer badge d'accès physique",
        "Planifier la première semaine"
      ],
      checklist: [
        { id: "pre-1", text: "Welcome pack envoyé", required: true },
        { id: "pre-2", text: "Accès documentation partagé", required: true },
        { id: "pre-3", text: "Planning 1ère semaine créé", required: true },
        { id: "pre-4", text: "Poste de travail commandé/préparé", required: true },
        { id: "pre-5", text: "Comptes AD/SSO créés", required: true },
        { id: "pre-6", text: "Mentor assigné et notifié", required: true }
      ],
      tips: [
        "Préparer une liste de contacts d'escalade",
        "Vérifier que le VPN fonctionne sur le poste"
      ]
    },
    {
      id: 2,
      title: "Jour 1 - Accueil et configuration",
      description: "Premier jour : présentation équipe, configuration accès, tour d'horizon",
      timeEstimate: "1 journée",
      responsible: "Chef SOC + Mentor",
      actions: [
        "Accueil par le Chef SOC",
        "Présentation de l'équipe et organigramme",
        "Signature NDA et politique sécurité",
        "Configuration MFA sur tous les comptes",
        "Test d'accès aux outils principaux",
        "Premier shadowing avec mentor"
      ],
      checklist: [
        { id: "j1-1", text: "Poste de travail fonctionnel", required: true },
        { id: "j1-2", text: "MFA activé", required: true },
        { id: "j1-3", text: "Accès mail et ticketing confirmé", required: true },
        { id: "j1-4", text: "Accès ELK/Kibana (lecture)", required: true },
        { id: "j1-5", text: "Accès TheHive", required: true },
        { id: "j1-6", text: "Accès Grafana (lecture)", required: true },
        { id: "j1-7", text: "NDA signé", required: true },
        { id: "j1-8", text: "Rencontre mentor effectuée", required: true }
      ],
      tips: [
        "Prévoir un déjeuner d'équipe pour favoriser l'intégration",
        "Donner accès à la documentation SOP dès le premier jour"
      ]
    },
    {
      id: 3,
      title: "Semaine 1 - Fondamentaux",
      description: "Formation sur les outils et processus de base",
      timeEstimate: "5 jours",
      responsible: "Mentor",
      actions: [
        "Introduction aux outils : ELK, Elastic EDR, TheHive, Cortex, MISP",
        "Formation logs Windows/Linux (Sysmon, Filebeat)",
        "Présentation du workflow d'alerte",
        "2-3 sessions de shadowing L1",
        "Exercices pratiques de recherche ELK"
      ],
      checklist: [
        { id: "s1-1", text: "Formation ELK basics complétée", required: true },
        { id: "s1-2", text: "Comprend la structure des logs Sysmon", required: true },
        { id: "s1-3", text: "Shadowing L1 (min 2 shifts)", required: true },
        { id: "s1-4", text: "Capable de créer une recherche ELK simple", required: false },
        { id: "s1-5", text: "TheHive : création de cas test", required: true },
        { id: "s1-6", text: "Documentation SOPs lue", required: true }
      ],
      commands: [
        {
          description: "Recherche erreurs Sysmon",
          command: 'event.provider:"Microsoft-Windows-Sysmon" AND event.action:"CreateProcess"'
        },
        {
          description: "Recherche connexion RDP",
          command: 'winlog.event_id:4624 AND logon.type:10'
        }
      ],
      tips: [
        "L'apprentissage se fait sur le shift réel",
        "Encourager les questions, pas de question stupide"
      ]
    },
    {
      id: 4,
      title: "Semaine 2 - Opérations L1",
      description: "Mise en pratique du triage d'alertes",
      timeEstimate: "5 jours",
      responsible: "Mentor",
      actions: [
        "Exercices pratiques de triage d'alertes",
        "Création et enrichissement de cas TheHive",
        "Utilisation des dashboards ELK",
        "Scénarios de handover",
        "Introduction aux playbooks"
      ],
      checklist: [
        { id: "s2-1", text: "Triage de 5+ alertes (supervisé)", required: true },
        { id: "s2-2", text: "Création de 3+ cas TheHive", required: true },
        { id: "s2-3", text: "Enrichissement IOC via MISP", required: true },
        { id: "s2-4", text: "Handover test réalisé", required: true },
        { id: "s2-5", text: "Dashboards ELK maîtrisés", required: false }
      ],
      tips: [
        "Documenter chaque action dans le cas TheHive",
        "Toujours vérifier la santé des capteurs avant analyse"
      ]
    },
    {
      id: 5,
      title: "Semaines 3-4 - Compétences intermédiaires",
      description: "Approfondissement des compétences L2",
      timeEstimate: "10 jours",
      responsible: "Mentor + L3",
      actions: [
        "Investigations L2 guidées",
        "Timeline et pivoting",
        "Elastic EDR console (isolation, collecte)",
        "Introduction Threat Hunting",
        "Playbooks Cortex overview"
      ],
      checklist: [
        { id: "s34-1", text: "Investigation L2 complète (guidée)", required: true },
        { id: "s34-2", text: "Timeline d'incident créée", required: true },
        { id: "s34-3", text: "Actions EDR exécutées (collecte)", required: true },
        { id: "s34-4", text: "Enrichissement MISP avancé", required: false },
        { id: "s34-5", text: "Concept Threat Hunting compris", required: true }
      ],
      tips: [
        "Commencer par des incidents simples avant d'escalader",
        "Toujours documenter les commandes exécutées"
      ]
    },
    {
      id: 6,
      title: "Mois 2-3 - Validation",
      description: "Évaluation finale et validation des compétences",
      timeEstimate: "4-8 semaines",
      responsible: "Mentor + Chef SOC",
      actions: [
        "Simulations d'incidents (tabletop)",
        "Évaluation pratique : gérer 3 incidents types",
        "Revue performance par mentor",
        "Validation Chef SOC",
        "Octroi accès étendus si validé"
      ],
      checklist: [
        { id: "v-1", text: "Tabletop exercise participé", required: true },
        { id: "v-2", text: "Évaluation pratique réussie (≥80%)", required: true },
        { id: "v-3", text: "Rapport mentor rédigé", required: true },
        { id: "v-4", text: "Validation Chef SOC obtenue", required: true },
        { id: "v-5", text: "Accès étendus octroyés", required: false }
      ],
      tips: [
        "Si non validé, prolonger le mentorat de 2-4 semaines",
        "Documenter les axes d'amélioration"
      ]
    }
  ],
  kpis: [
    { name: "Taux de complétion onboarding", target: "100%", description: "Tous les nouveaux analystes complètent l'onboarding" },
    { name: "Temps moyen onboarding", target: "≤ 8 semaines", description: "Durée jusqu'à validation" },
    { name: "Score évaluation", target: "≥ 80%", description: "Score minimum pour validation" }
  ],
  templates: [
    {
      name: "Mail d'accueil",
      content: `Objet : Bienvenue au SOC - Onboarding [Nom]

Bonjour [Nom],

Bienvenue dans l'équipe SOC ! Votre mentor sera [Nom Mentor].

Veuillez trouver en pièce jointe :
- Planning de votre première semaine
- Liste des accès à vérifier
- Documentation SOC

Pour toute question : soc-team@[domaine].com

Cordialement,
L'équipe SOC`
    },
    {
      name: "Ticket IT - Demande accès",
      content: `Objet : Demande accès SOC - [Nom] - Niveau [L1/L2/L3]

Description :
Création des accès pour nouvel analyste SOC.

Accès requis :
- [ ] AD/SSO
- [ ] Mail
- [ ] VPN
- [ ] ELK (lecture)
- [ ] Elastic EDR (console)
- [ ] TheHive
- [ ] Cortex (lecture)
- [ ] MISP (lecture)
- [ ] Grafana (lecture)
- [ ] Ticketing

Approuvé par : Chef SOC
Date souhaitée : [Date]`
    }
  ]
};

// ============================================
// SOP 2: SHIFT HANDOVER
// ============================================
export const sopShiftHandover: SOPTemplate = {
  id: "shift-handover",
  slug: "shift-handover",
  title: "Shift Handover (Passation de Shift)",
  category: "Opérations",
  description: "Garantir une passation d'informations complète et structurée entre shifts pour maintenir la continuité opérationnelle.",
  version: "1.0",
  alertTypes: [],
  objectives: [
    "Continuité opérationnelle 24/7",
    "Aucune perte d'information entre shifts",
    "Transfert clair des incidents en cours",
    "Documentation complète des actions"
  ],
  scope: "Tous les analystes SOC effectuant un changement de shift (L1, L2)",
  roles: [
    {
      role: "Analyste Sortant",
      responsibilities: [
        "Préparer et transmettre le handover complet",
        "Mettre à jour tous les tickets/cas",
        "Briefer l'analyste entrant"
      ]
    },
    {
      role: "Analyste Entrant",
      responsibilities: [
        "Lire et comprendre le handover",
        "Poser des questions si besoin",
        "Confirmer la prise en charge"
      ]
    },
    {
      role: "Chef SOC",
      responsibilities: [
        "Superviser la qualité des handovers",
        "Résoudre les handovers incomplets"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Préparation du handover (30 min avant fin de shift)",
      description: "L'analyste sortant prépare la documentation de passation",
      timeEstimate: "30 minutes",
      responsible: "Analyste Sortant",
      actions: [
        "Mettre à jour tous les tickets/cas TheHive avec notes récentes",
        "Vérifier dashboards ELK/Grafana pour alertes critiques",
        "Consolider liste priorisée des items non résolus",
        "Sauvegarder timelines et artefacts forensiques",
        "Rédiger le handover dans le template standardisé"
      ],
      checklist: [
        { id: "h1-1", text: "Tous les cas TheHive mis à jour", required: true },
        { id: "h1-2", text: "Dashboards vérifiés", required: true },
        { id: "h1-3", text: "Liste des incidents ouverts compilée", required: true },
        { id: "h1-4", text: "Artefacts sauvegardés et localisés", required: true },
        { id: "h1-5", text: "Template handover rempli", required: true }
      ],
      tips: [
        "Utiliser le template standardisé pour cohérence",
        "Inclure les contacts d'escalade"
      ]
    },
    {
      id: 2,
      title: "Passation en direct (15-30 min overlap)",
      description: "Briefing en personne ou par appel entre analystes",
      timeEstimate: "15-30 minutes",
      responsible: "Sortant + Entrant",
      actions: [
        "Revue en live du handover écrit",
        "Explications des incidents majeurs",
        "Présentation des preuves et recommandations",
        "Questions-réponses",
        "Si incident critique : briefing avec Chef SOC"
      ],
      checklist: [
        { id: "h2-1", text: "Briefing verbal effectué", required: true },
        { id: "h2-2", text: "Incidents majeurs expliqués", required: true },
        { id: "h2-3", text: "Questions répondues", required: true },
        { id: "h2-4", text: "Preuves/artefacts localisés ensemble", required: false }
      ],
      tips: [
        "Si pas d'overlap possible, prévoir appel asynchrone",
        "Enregistrer les points clés discutés"
      ]
    },
    {
      id: 3,
      title: "Confirmation de prise en charge",
      description: "L'analyste entrant confirme la réception et prend la relève",
      timeEstimate: "10 minutes",
      responsible: "Analyste Entrant",
      actions: [
        "Confirmer réception du handover (canal + ticket)",
        "Prioriser les actions immédiates",
        "Mettre à jour les cas avec 'prise en charge'",
        "Si éléments incomplets, contacter sortant ou escalader"
      ],
      checklist: [
        { id: "h3-1", text: "Confirmation postée sur canal handover", required: true },
        { id: "h3-2", text: "Tickets/cas repris et assignés", required: true },
        { id: "h3-3", text: "Actions prioritaires identifiées", required: true }
      ],
      tips: [
        "Objectif : confirmation en moins de 15 minutes",
        "Tout élément non clair doit être escaladé immédiatement"
      ]
    }
  ],
  kpis: [
    { name: "Taux handovers complets", target: "100%", description: "Tous les changements de shift documentés" },
    { name: "Temps confirmation réception", target: "< 15 min", description: "Délai entre fin shift et confirmation" },
    { name: "Incidents non documentés", target: "0", description: "Aucun incident manquant dans handover" }
  ],
  templates: [
    {
      name: "Template Handover Standard",
      content: `## SHIFT HANDOVER
**Période :** [DD/MM/YYYY HH:MM - HH:MM]
**Sortant :** [Nom]
**Entrant :** [Nom]

### Résumé Exécutif
[1-3 phrases résumant le shift]

### Cas Ouverts
| TheHive ID | Titre | Sévérité | Statut | Prochaine Action |
|------------|-------|----------|--------|------------------|
| #[ID] | [Titre] | [Sev] | [Statut] | [Action] |

### Alertes Critiques en Cours
- ELK Alert [ID] - [Source] - [Gravité] - [Action requise]

### Actions en Attente
- [ ] [Approbation isolation HOST-XXX]
- [ ] [Patch CVE-XXXX sur serveur Y]

### Problèmes Outils
- [ELK lent depuis 14h00 - ticket IT-123 ouvert]

### Contacts Escalade
- L3 : [Nom] - [Tel]
- Chef SOC : [Nom] - [Tel]

### Signatures
- Sortant : ________________ [Heure]
- Entrant : ________________ [Heure]`
    }
  ]
};

// ============================================
// SOP 3: GESTION DES INCIDENTS
// ============================================
export const sopIncidentManagement: SOPTemplate = {
  id: "incident-management",
  slug: "gestion-incidents",
  title: "Gestion des Incidents (Processus Complet)",
  category: "Incidents",
  description: "Processus standardisé pour la détection, classification, containment, éradication, récupération et retour d'expérience des incidents de sécurité.",
  version: "1.0",
  alertTypes: ["INTRUSION", "MALWARE", "DATA_BREACH", "RANSOMWARE", "PHISHING"],
  objectives: [
    "Détection rapide des incidents",
    "Classification et priorisation cohérente",
    "Containment efficace pour limiter l'impact",
    "Éradication complète de la menace",
    "Récupération des services",
    "Retour d'expérience et amélioration continue"
  ],
  scope: "Tous incidents affectant la confidentialité, intégrité ou disponibilité des actifs IT",
  roles: [
    {
      role: "L1",
      responsibilities: [
        "Triage initial et enrichissement basique",
        "Création ticket/TheHive",
        "Actions limitées (collecte logs, enrichir IOC)"
      ]
    },
    {
      role: "L2",
      responsibilities: [
        "Investigation approfondie",
        "Containment initial",
        "Recommandations remédiation"
      ]
    },
    {
      role: "L3",
      responsibilities: [
        "Analyses forensiques avancées",
        "Décisions techniques majeures",
        "Coordination externe"
      ]
    },
    {
      role: "Chef SOC",
      responsibilities: [
        "Activation incident majeur",
        "Communication management",
        "Validation escalades externes"
      ]
    },
    {
      role: "IT/Infrastructure",
      responsibilities: [
        "Exécution remédiation",
        "Soutien collecte preuves"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection & Enregistrement",
      description: "Identification initiale de l'incident et création du cas",
      timeEstimate: "5-15 minutes",
      responsible: "L1",
      actions: [
        "Identifier la source de l'alerte (ELK, EDR, firewall, user)",
        "Vérifier authenticité (pas de faux positif évident)",
        "Créer cas TheHive avec informations initiales",
        "Attacher preuves (logs, screenshots, IOC)"
      ],
      checklist: [
        { id: "d-1", text: "Source alerte identifiée", required: true, category: "Détection" },
        { id: "d-2", text: "Cas TheHive créé", required: true, category: "Documentation" },
        { id: "d-3", text: "IOCs initiaux documentés", required: true, category: "IOC" },
        { id: "d-4", text: "Sévérité proposée", required: true, category: "Classification" },
        { id: "d-5", text: "Evidence attachée", required: true, category: "Documentation" }
      ],
      commands: [
        {
          description: "Process creation Sysmon",
          command: 'event.provider:"Microsoft-Windows-Sysmon" AND event.action:"CreateProcess" AND process.name:("powershell.exe" OR "cmd.exe")'
        },
        {
          description: "Connexions sortantes suspectes",
          command: 'network.direction:outbound AND network.transport:tcp AND destination.port:>1024'
        }
      ]
    },
    {
      id: 2,
      title: "Triage Initial (L1)",
      description: "Vérification et enrichissement de l'alerte",
      timeEstimate: "15-30 minutes",
      responsible: "L1",
      actions: [
        "Vérifier santé capteurs (agent online, pas de clock skew)",
        "Enrichir IOCs : IP, domain, hashes via MISP/VirusTotal",
        "Collecter logs primaires ELK",
        "Évaluer si containment immédiat requis",
        "Décision : False Positive / Investigation / Escalade"
      ],
      checklist: [
        { id: "t-1", text: "Santé capteurs vérifiée", required: true },
        { id: "t-2", text: "IOCs enrichis (MISP, VT)", required: true },
        { id: "t-3", text: "Logs collectés et attachés", required: true },
        { id: "t-4", text: "Décision documentée (FP/Investigate/Escalate)", required: true }
      ],
      tips: [
        "Si containment immédiat requis, escalader à L2 immédiatement",
        "Documenter même les faux positifs pour tuning"
      ]
    },
    {
      id: 3,
      title: "Investigation & Containment (L2/L3)",
      description: "Analyse approfondie et limitation de la propagation",
      timeEstimate: "1-4 heures",
      responsible: "L2/L3",
      actions: [
        "Construire timeline des événements",
        "Identifier persistence mechanisms",
        "Rechercher mouvements latéraux",
        "Recommander/exécuter isolation si nécessaire",
        "Documenter toutes les actions horodatées"
      ],
      checklist: [
        { id: "i-1", text: "Timeline construite", required: true },
        { id: "i-2", text: "Persistence identifiée", required: true },
        { id: "i-3", text: "Lateral movement recherché", required: true },
        { id: "i-4", text: "Containment décidé et documenté", required: true },
        { id: "i-5", text: "Actions horodatées et signées", required: true }
      ],
      commands: [
        {
          description: "Tentatives RDP",
          command: 'winlog.event_id:4625 OR (winlog.event_id:4624 AND winlog.event_data.LogonType:10)'
        },
        {
          description: "Scheduled tasks créées",
          command: 'event.provider:"Microsoft-Windows-TaskScheduler" AND event.action:("TaskCreated" OR "TaskModified")'
        }
      ]
    },
    {
      id: 4,
      title: "Éradication",
      description: "Suppression complète de la menace",
      timeEstimate: "Variable",
      responsible: "L3 + IT",
      actions: [
        "Supprimer artefacts malveillants (process, tasks, persistence)",
        "Nettoyer registre/cron jobs",
        "Supprimer/désactiver comptes compromis",
        "Vérifier absence de backdoors",
        "Re-scanner environnements (EDR, vulns)"
      ],
      checklist: [
        { id: "e-1", text: "Artefacts malveillants supprimés", required: true },
        { id: "e-2", text: "Persistence mechanisms nettoyés", required: true },
        { id: "e-3", text: "Comptes compromis traités", required: true },
        { id: "e-4", text: "Scan post-éradication effectué", required: true }
      ]
    },
    {
      id: 5,
      title: "Recovery",
      description: "Remise en production des services",
      timeEstimate: "Variable",
      responsible: "IT + L3",
      actions: [
        "Remettre services en production selon plan validé",
        "Restituer systèmes à état sécurisé",
        "Appliquer patchs nécessaires",
        "Monitoring intensif post-recovery (48-72h)"
      ],
      checklist: [
        { id: "r-1", text: "Plan recovery validé par L3 et IT", required: true },
        { id: "r-2", text: "Systèmes restaurés à état clean", required: true },
        { id: "r-3", text: "Patchs appliqués", required: true },
        { id: "r-4", text: "Monitoring intensif activé", required: true }
      ]
    },
    {
      id: 6,
      title: "Lessons Learned",
      description: "Retour d'expérience et amélioration",
      timeEstimate: "1-2 heures",
      responsible: "Chef SOC + Équipe",
      actions: [
        "Organiser réunion post-incident (7 jours max)",
        "Documenter causes racines",
        "Identifier gaps et actions correctives",
        "Mettre à jour playbooks/SOPs",
        "Suivre actions correctives"
      ],
      checklist: [
        { id: "l-1", text: "Réunion post-incident tenue", required: true },
        { id: "l-2", text: "RCA (Root Cause Analysis) documenté", required: true },
        { id: "l-3", text: "Actions correctives identifiées", required: true },
        { id: "l-4", text: "Playbooks mis à jour si nécessaire", required: false },
        { id: "l-5", text: "Rapport final rédigé", required: true }
      ]
    }
  ],
  kpis: [
    { name: "MTTA (Mean Time To Acknowledge)", target: "< 15 min (Sev1)", description: "Temps entre détection et prise en charge" },
    { name: "MTTC (Mean Time To Contain)", target: "< 1h (Sev1)", description: "Temps jusqu'au containment" },
    { name: "MTTR (Mean Time To Resolve)", target: "< 24h (Sev1)", description: "Temps jusqu'à résolution complète" },
    { name: "% RCA complétés", target: "100%", description: "Tous incidents Sev1/2 ont un RCA" }
  ],
  escalationMatrix: [
    { level: "Sev1 - Critique", criteria: "Service critique down, exfiltration données sensibles, ransomware", contact: "Chef SOC + CTO + Legal + DPO", sla: "Immédiat" },
    { level: "Sev2 - Haute", criteria: "Compromis localisé, exfiltration limitée", contact: "Chef SOC + IT Lead", sla: "< 30 min" },
    { level: "Sev3 - Moyenne", criteria: "Tentative bloquée, IOC isolé", contact: "L2 Senior", sla: "< 2h" },
    { level: "Sev4 - Faible", criteria: "Alerte FP probable, informationnel", contact: "L2", sla: "< 24h" }
  ]
};

// ============================================
// SOP 4: TRIAGE DES ALERTES
// ============================================
export const sopAlertTriage: SOPTemplate = {
  id: "alert-triage",
  slug: "triage-alertes",
  title: "Triage des Alertes (L1 → L2 → L3)",
  category: "Alertes",
  description: "Procédure standardisée pour le triage des alertes afin d'identifier rapidement les vrais incidents et escalader correctement.",
  version: "1.0",
  alertTypes: ["SURICATA", "ZEEK", "EDR", "FIREWALL", "MAIL_GATEWAY"],
  objectives: [
    "Identification rapide des vrais incidents",
    "Réduction des faux positifs",
    "Escalade appropriée selon sévérité",
    "Documentation cohérente"
  ],
  scope: "Toutes les alertes reçues par le SOC",
  roles: [
    {
      role: "L1",
      responsibilities: [
        "Réception et vérification initiale",
        "Enrichissement basique",
        "Classification et création de cas",
        "Escalade si nécessaire"
      ]
    },
    {
      role: "L2",
      responsibilities: [
        "Investigation approfondie",
        "Confirmation compromission",
        "Containment initial",
        "Validation escalade L3"
      ]
    },
    {
      role: "L3",
      responsibilities: [
        "Investigations complexes",
        "Actions forensiques",
        "Coordination externe"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Réception de l'alerte",
      description: "Premier contact avec l'alerte dans le SIEM/EDR",
      timeEstimate: "2-5 minutes",
      responsible: "L1",
      actions: [
        "Lire l'alerte dans la console (SIEM/EDR/mailbox)",
        "Noter : timestamp, source rule, asset, user, severity, alert ID",
        "Vérifier si alerte similaire récente (pattern recognition)"
      ],
      checklist: [
        { id: "ra-1", text: "Alerte identifiée et lue", required: true },
        { id: "ra-2", text: "Métadonnées notées", required: true },
        { id: "ra-3", text: "Pattern recognition vérifié", required: false }
      ]
    },
    {
      id: 2,
      title: "Vérification santé capteurs",
      description: "S'assurer que l'alerte n'est pas due à un problème technique",
      timeEstimate: "2-3 minutes",
      responsible: "L1",
      actions: [
        "Confirmer que l'agent est online",
        "Vérifier clock skew potentiel",
        "Vérifier heartbeats EDR",
        "Contrôler intégrité logs (filebeat/sysmon)"
      ],
      checklist: [
        { id: "vs-1", text: "Agent source en ligne", required: true },
        { id: "vs-2", text: "Pas de problème d'horloge", required: true },
        { id: "vs-3", text: "Ingestion logs normale", required: true }
      ],
      tips: [
        "Un agent offline peut générer de fausses alertes",
        "Le clock skew peut fausser les corrélations"
      ]
    },
    {
      id: 3,
      title: "Enrichissement initial",
      description: "Collecte d'informations supplémentaires sur les IOCs",
      timeEstimate: "5-10 minutes",
      responsible: "L1",
      actions: [
        "Rechercher IOCs : IP, domain, hashes, user, process",
        "Lookup MISP, VirusTotal, Passive DNS via Cortex",
        "Exécuter requêtes ELK rapides",
        "Vérifier contexte asset (criticité, owner)"
      ],
      checklist: [
        { id: "ei-1", text: "IOCs identifiés", required: true },
        { id: "ei-2", text: "Lookup MISP/VT effectué", required: true },
        { id: "ei-3", text: "Requêtes ELK exécutées", required: true },
        { id: "ei-4", text: "Contexte asset documenté", required: true }
      ],
      commands: [
        {
          description: "Process creation par host",
          command: 'event.provider:"Microsoft-Windows-Sysmon" AND event.action:"CreateProcess" AND host.name:[host]'
        },
        {
          description: "Connexions réseau sortantes",
          command: 'network.direction:outbound AND destination.ip:[ip]'
        },
        {
          description: "RDP logons user",
          command: 'winlog.event_id:4624 AND winlog.event_data.LogonType:10 AND winlog.event_data.TargetUserName:[user]'
        }
      ]
    },
    {
      id: 4,
      title: "Décision L1",
      description: "Classifier l'alerte et décider de l'action",
      timeEstimate: "5 minutes",
      responsible: "L1",
      actions: [
        "Évaluer : FP évident, investigation nécessaire, ou containment urgent",
        "Si FP : documenter justification et fermer",
        "Si investigation : créer/assigner cas TheHive à L2",
        "Si containment urgent : escalader immédiatement à L2"
      ],
      checklist: [
        { id: "dl-1", text: "Décision prise et documentée", required: true },
        { id: "dl-2", text: "Si FP : justification claire", required: false },
        { id: "dl-3", text: "Si escalade : L2 notifié", required: false },
        { id: "dl-4", text: "Cas TheHive créé/mis à jour", required: true }
      ],
      tips: [
        "En cas de doute, escalader plutôt que fermer",
        "Documenter même les FP pour améliorer les règles"
      ]
    },
    {
      id: 5,
      title: "Investigation L2",
      description: "Analyse approfondie par L2",
      timeEstimate: "30-60 minutes",
      responsible: "L2",
      actions: [
        "Vérifier informations L1 et reproduire requêtes",
        "Étendre recherche (pivot user, host, network, timestamp)",
        "Collecter artefacts EDR (process list, network, autoruns)",
        "Construire timeline des événements",
        "Identifier persistence et lateral movement"
      ],
      checklist: [
        { id: "il-1", text: "Informations L1 vérifiées", required: true },
        { id: "il-2", text: "Pivot investigation effectué", required: true },
        { id: "il-3", text: "Artefacts EDR collectés", required: true },
        { id: "il-4", text: "Timeline construite", required: true },
        { id: "il-5", text: "Persistence/lateral movement recherché", required: true }
      ]
    },
    {
      id: 6,
      title: "Containment & Validation (L2)",
      description: "Actions de containment si compromission confirmée",
      timeEstimate: "Variable",
      responsible: "L2",
      actions: [
        "Si compromission : recommander/exécuter containment",
        "Documenter justification et commandes",
        "Obtenir approbation L3/Chef SOC si nécessaire",
        "Mettre à jour sévérité et notifier parties prenantes",
        "Si non confirmé : maintenir monitoring, tuning"
      ],
      checklist: [
        { id: "cv-1", text: "Statut compromission déterminé", required: true },
        { id: "cv-2", text: "Actions containment documentées", required: false },
        { id: "cv-3", text: "Approbations obtenues si requises", required: false },
        { id: "cv-4", text: "Sévérité mise à jour", required: true }
      ]
    },
    {
      id: 7,
      title: "Actions L3 (si escalade)",
      description: "Investigations avancées et forensics",
      timeEstimate: "Variable",
      responsible: "L3",
      actions: [
        "Capture mémoire/disk si malware sophistiqué",
        "Analyse forensique complète",
        "Déploiement règles réseau/firewall",
        "Coordination externe (vendors, CERT)",
        "Documentation chain of custody"
      ],
      checklist: [
        { id: "l3-1", text: "Capture forensique si nécessaire", required: false },
        { id: "l3-2", text: "Analyse complète effectuée", required: true },
        { id: "l3-3", text: "Règles déployées si nécessaire", required: false },
        { id: "l3-4", text: "Chain of custody documentée", required: true }
      ]
    }
  ],
  kpis: [
    { name: "Temps triage L1", target: "< 15 min", description: "Délai décision L1" },
    { name: "% escalades justifiées", target: "> 80%", description: "Escalades confirmées vraies" },
    { name: "% faux positifs", target: "< 20%", description: "Alertes FP sur total" }
  ]
};

// ============================================
// SOP 5: THREAT HUNTING
// ============================================
export const sopThreatHunting: SOPTemplate = {
  id: "threat-hunting",
  slug: "threat-hunting",
  title: "Threat Hunting",
  category: "Proactif",
  description: "Méthodologie de chasse proactive aux menaces pour détecter les activités malveillantes non détectées par les outils automatiques.",
  version: "1.0",
  alertTypes: [],
  objectives: [
    "Détecter menaces non identifiées par outils automatiques",
    "Améliorer la posture de sécurité",
    "Identifier les gaps de détection",
    "Alimenter les règles SIEM/EDR"
  ],
  scope: "Activités proactives de recherche de menaces sur l'infrastructure",
  roles: [
    {
      role: "Threat Hunter (L3)",
      responsibilities: [
        "Définir hypothèses de chasse",
        "Exécuter requêtes et analyses",
        "Documenter les découvertes"
      ]
    },
    {
      role: "L2 Support",
      responsibilities: [
        "Assister dans la collecte de données",
        "Valider les découvertes"
      ]
    },
    {
      role: "Chef SOC",
      responsibilities: [
        "Prioriser les chasses",
        "Valider les découvertes majeures",
        "Allouer les ressources"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Définition de l'hypothèse",
      description: "Formuler une hypothèse de menace à investiguer",
      timeEstimate: "30 minutes",
      responsible: "Threat Hunter",
      actions: [
        "Identifier la source d'inspiration (threat intel, MITRE ATT&CK, incident récent)",
        "Formuler hypothèse testable (ex: 'Un attaquant utilise DLL sideloading')",
        "Définir les indicateurs à rechercher",
        "Identifier les sources de données nécessaires"
      ],
      checklist: [
        { id: "th-1", text: "Source d'inspiration documentée", required: true },
        { id: "th-2", text: "Hypothèse formulée et écrite", required: true },
        { id: "th-3", text: "Indicateurs définis", required: true },
        { id: "th-4", text: "Data sources identifiées", required: true }
      ],
      tips: [
        "Utiliser MITRE ATT&CK comme référence",
        "S'inspirer des rapports threat intel récents"
      ]
    },
    {
      id: 2,
      title: "Préparation des requêtes",
      description: "Créer les requêtes de recherche spécifiques",
      timeEstimate: "30-60 minutes",
      responsible: "Threat Hunter",
      actions: [
        "Développer requêtes ELK/KQL",
        "Préparer scripts d'analyse si nécessaire",
        "Tester les requêtes sur période récente",
        "Ajuster pour réduire faux positifs"
      ],
      checklist: [
        { id: "pr-1", text: "Requêtes développées", required: true },
        { id: "pr-2", text: "Requêtes testées", required: true },
        { id: "pr-3", text: "Volume de résultats acceptable", required: true }
      ],
      commands: [
        {
          description: "DLL sideloading - rundll32 suspect",
          command: 'process.name:"rundll32.exe" AND NOT process.args:(*system32* OR *syswow64*)'
        },
        {
          description: "Exécution PowerShell encodé",
          command: 'process.name:"powershell.exe" AND process.args:(*-enc* OR *-encoded* OR *-e *)'
        },
        {
          description: "Connexions C2 potentielles",
          command: 'NOT destination.ip:(10.* OR 192.168.* OR 172.16.*) AND destination.port:(443 OR 8443 OR 8080) AND network.bytes_sent:>100000'
        }
      ]
    },
    {
      id: 3,
      title: "Exécution de la chasse",
      description: "Exécuter les requêtes et analyser les résultats",
      timeEstimate: "2-4 heures",
      responsible: "Threat Hunter",
      actions: [
        "Exécuter requêtes sur période définie",
        "Analyser les résultats",
        "Identifier anomalies et comportements suspects",
        "Trier les faux positifs vs vraies alertes"
      ],
      checklist: [
        { id: "ex-1", text: "Requêtes exécutées", required: true },
        { id: "ex-2", text: "Résultats analysés", required: true },
        { id: "ex-3", text: "Anomalies identifiées", required: true },
        { id: "ex-4", text: "FP vs TP triés", required: true }
      ]
    },
    {
      id: 4,
      title: "Investigation des découvertes",
      description: "Approfondir les anomalies identifiées",
      timeEstimate: "Variable",
      responsible: "Threat Hunter + L2",
      actions: [
        "Pour chaque anomalie : construire timeline",
        "Enrichir avec contexte (user, asset, network)",
        "Déterminer si menace réelle",
        "Si menace confirmée : créer incident"
      ],
      checklist: [
        { id: "id-1", text: "Chaque anomalie investiguée", required: true },
        { id: "id-2", text: "Timeline construite si pertinent", required: false },
        { id: "id-3", text: "Décision menace/non-menace prise", required: true },
        { id: "id-4", text: "Incidents créés si nécessaire", required: false }
      ]
    },
    {
      id: 5,
      title: "Documentation et amélioration",
      description: "Documenter les résultats et améliorer la détection",
      timeEstimate: "30-60 minutes",
      responsible: "Threat Hunter",
      actions: [
        "Documenter hypothèse, méthode, résultats",
        "Proposer nouvelles règles de détection si pertinent",
        "Partager IOCs avec MISP si applicable",
        "Mettre à jour playbooks si gap identifié"
      ],
      checklist: [
        { id: "da-1", text: "Rapport de chasse rédigé", required: true },
        { id: "da-2", text: "Nouvelles règles proposées si pertinent", required: false },
        { id: "da-3", text: "IOCs partagés via MISP", required: false },
        { id: "da-4", text: "Playbooks mis à jour si nécessaire", required: false }
      ]
    }
  ],
  kpis: [
    { name: "Chasses réalisées", target: "≥ 4/mois", description: "Nombre de threat hunts mensuels" },
    { name: "Taux découverte", target: "> 10%", description: "Chasses révélant des menaces" },
    { name: "Règles créées", target: "≥ 2/trimestre", description: "Nouvelles règles issues des hunts" }
  ]
};

// ============================================
// SOP 6: GESTION VULNÉRABILITÉS
// ============================================
export const sopVulnerabilityManagement: SOPTemplate = {
  id: "vulnerability-management",
  slug: "gestion-vulnerabilites",
  title: "Gestion des Vulnérabilités",
  category: "Vulnérabilités",
  description: "Processus de gestion des vulnérabilités depuis la détection jusqu'à la remédiation et validation.",
  version: "1.0",
  alertTypes: ["CVE", "VULNERABILITY"],
  objectives: [
    "Détection rapide des vulnérabilités",
    "Priorisation basée sur le risque",
    "Remédiation dans les SLAs",
    "Suivi et reporting"
  ],
  scope: "Toutes les vulnérabilités détectées sur l'infrastructure",
  roles: [
    {
      role: "SOC",
      responsibilities: [
        "Ingestion et enrichissement",
        "Notification équipes",
        "Suivi SLA"
      ]
    },
    {
      role: "IT/Infrastructure",
      responsibilities: [
        "Planification remédiation",
        "Application des patchs",
        "Validation post-patch"
      ]
    },
    {
      role: "RSSI/Security Manager",
      responsibilities: [
        "Validation exceptions",
        "Reporting direction"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Ingestion & Enregistrement",
      description: "Réception des nouvelles vulnérabilités",
      timeEstimate: "Automatique + 10 min",
      responsible: "SOC",
      actions: [
        "Réception depuis scanner (Nessus, Qualys, etc.)",
        "Import automatique dans système de gestion",
        "Dédoublonnage",
        "Assignation ID unique"
      ],
      checklist: [
        { id: "vi-1", text: "Vulnérabilité importée", required: true },
        { id: "vi-2", text: "ID unique assigné", required: true },
        { id: "vi-3", text: "Asset affecté identifié", required: true }
      ]
    },
    {
      id: 2,
      title: "Enrichissement SOC",
      description: "Ajout d'informations de contexte",
      timeEstimate: "15-30 minutes",
      responsible: "L2",
      actions: [
        "Ajouter contexte asset (criticité, owner)",
        "Vérifier si exploit public disponible (ExploitDB, CISA KEV)",
        "Évaluer exposition (Internet-facing, interne)",
        "Note CVSS et impact business"
      ],
      checklist: [
        { id: "ve-1", text: "Criticité asset documentée", required: true },
        { id: "ve-2", text: "Exploit disponible vérifié", required: true },
        { id: "ve-3", text: "Exposition évaluée", required: true },
        { id: "ve-4", text: "CVSS et impact notés", required: true }
      ]
    },
    {
      id: 3,
      title: "Priorisation (Triage)",
      description: "Déterminer la priorité de remédiation",
      timeEstimate: "10 minutes",
      responsible: "L2/L3",
      actions: [
        "Appliquer matrice de priorisation",
        "Tenir compte CVSS, exploit, exposition, criticité asset",
        "Assigner niveau priorité (Critical, High, Medium, Low)"
      ],
      checklist: [
        { id: "vp-1", text: "Matrice appliquée", required: true },
        { id: "vp-2", text: "Priorité assignée", required: true }
      ],
      tips: [
        "Critical : CVSS ≥ 9 + exploit public + Internet-facing",
        "High : CVSS ≥ 7 ou asset critique",
        "Medium : CVSS 4-6.9",
        "Low : CVSS < 4"
      ]
    },
    {
      id: 4,
      title: "Notification & SLA",
      description: "Notifier équipes et définir deadline",
      timeEstimate: "10 minutes",
      responsible: "SOC",
      actions: [
        "Notifier équipe responsable",
        "Définir SLA selon priorité",
        "Créer ticket de remédiation",
        "Documenter deadline"
      ],
      checklist: [
        { id: "vn-1", text: "Équipe notifiée", required: true },
        { id: "vn-2", text: "SLA défini", required: true },
        { id: "vn-3", text: "Ticket créé", required: true }
      ],
      tips: [
        "Critical : 24-48h",
        "High : 7 jours",
        "Medium : 30 jours",
        "Low : 90 jours"
      ]
    },
    {
      id: 5,
      title: "Remédiation",
      description: "Application de la correction",
      timeEstimate: "Variable",
      responsible: "IT/Infrastructure",
      actions: [
        "Planifier fenêtre de maintenance",
        "Appliquer patch ou mitigation",
        "Documenter actions effectuées",
        "Tester fonctionnement post-patch"
      ],
      checklist: [
        { id: "vr-1", text: "Patch planifié", required: true },
        { id: "vr-2", text: "Patch appliqué", required: true },
        { id: "vr-3", text: "Test fonctionnel effectué", required: true }
      ]
    },
    {
      id: 6,
      title: "Validation & Clôture",
      description: "Vérifier que la vulnérabilité est corrigée",
      timeEstimate: "15-30 minutes",
      responsible: "SOC",
      actions: [
        "Re-scanner l'asset",
        "Confirmer disparition de la vulnérabilité",
        "Mettre à jour le ticket",
        "Clôturer"
      ],
      checklist: [
        { id: "vv-1", text: "Re-scan effectué", required: true },
        { id: "vv-2", text: "Vulnérabilité confirmée corrigée", required: true },
        { id: "vv-3", text: "Ticket clôturé", required: true }
      ]
    }
  ],
  kpis: [
    { name: "% vulns Critical corrigées dans SLA", target: "> 95%", description: "Respect SLA 24-48h" },
    { name: "Âge moyen vulnérabilités ouvertes", target: "< 30 jours", description: "Moyenne âge vulns non corrigées" },
    { name: "% assets sans vuln critique", target: "> 98%", description: "Assets sans Critical ouvert" }
  ]
};

// ============================================
// SOP 7: ESCALATION
// ============================================
export const sopEscalation: SOPTemplate = {
  id: "escalation",
  slug: "escalation",
  title: "Escalation (Critères et Procédures)",
  category: "Communication",
  description: "Définir quand et comment escalader les incidents aux niveaux supérieurs et parties externes.",
  version: "1.0",
  alertTypes: [],
  objectives: [
    "Escalade rapide des incidents critiques",
    "Communication claire aux parties prenantes",
    "Respect des SLAs",
    "Traçabilité des décisions"
  ],
  scope: "Tous les incidents nécessitant une escalade au-delà du SOC",
  roles: [
    {
      role: "Analyste (L1/L2/L3)",
      responsibilities: [
        "Identifier le besoin d'escalade",
        "Préparer le briefing",
        "Exécuter l'escalade"
      ]
    },
    {
      role: "Chef SOC",
      responsibilities: [
        "Valider les escalades majeures",
        "Coordonner avec management"
      ]
    },
    {
      role: "Management/Direction",
      responsibilities: [
        "Décisions business",
        "Communication externe"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Identification du trigger",
      description: "Reconnaître qu'une escalade est nécessaire",
      timeEstimate: "Immédiat",
      responsible: "Analyste",
      actions: [
        "Identifier le critère d'escalade (voir matrice)",
        "Déterminer le niveau d'escalade approprié",
        "Préparer les informations nécessaires"
      ],
      checklist: [
        { id: "et-1", text: "Critère d'escalade identifié", required: true },
        { id: "et-2", text: "Niveau d'escalade déterminé", required: true }
      ]
    },
    {
      id: 2,
      title: "Préparation du briefing",
      description: "Rassembler les informations pour l'escalade",
      timeEstimate: "5-10 minutes",
      responsible: "Analyste",
      actions: [
        "Résumer l'incident (qui, quoi, quand, où)",
        "Lister les actions déjà prises",
        "Identifier les décisions nécessaires",
        "Préparer les options/recommandations"
      ],
      checklist: [
        { id: "eb-1", text: "Résumé incident préparé", required: true },
        { id: "eb-2", text: "Actions prises listées", required: true },
        { id: "eb-3", text: "Décisions nécessaires identifiées", required: true },
        { id: "eb-4", text: "Recommandations préparées", required: true }
      ]
    },
    {
      id: 3,
      title: "Exécution de l'escalade",
      description: "Contacter la personne appropriée",
      timeEstimate: "5-15 minutes",
      responsible: "Analyste/Chef SOC",
      actions: [
        "Contacter via canal approprié (appel pour urgent)",
        "Délivrer le briefing structuré",
        "Obtenir les décisions/approbations",
        "Documenter l'escalade"
      ],
      checklist: [
        { id: "ee-1", text: "Contact établi", required: true },
        { id: "ee-2", text: "Briefing délivré", required: true },
        { id: "ee-3", text: "Décisions obtenues", required: true },
        { id: "ee-4", text: "Escalade documentée dans le cas", required: true }
      ]
    },
    {
      id: 4,
      title: "Suivi post-escalade",
      description: "Suivre les actions et décisions",
      timeEstimate: "Continu",
      responsible: "Analyste assigné",
      actions: [
        "Exécuter les actions décidées",
        "Maintenir la communication avec l'escalade",
        "Mettre à jour régulièrement",
        "Documenter la résolution"
      ],
      checklist: [
        { id: "es-1", text: "Actions exécutées", required: true },
        { id: "es-2", text: "Updates réguliers fournis", required: true },
        { id: "es-3", text: "Résolution documentée", required: true }
      ]
    }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Alerte nécessitant investigation approfondie", contact: "L2 de service", sla: "15 min" },
    { level: "L2 → L3", criteria: "Compromission confirmée, forensic nécessaire", contact: "L3 de service", sla: "30 min" },
    { level: "L3 → Chef SOC", criteria: "Incident majeur, décision business requise", contact: "Chef SOC", sla: "15 min" },
    { level: "Chef SOC → Direction", criteria: "Impact business majeur, communication publique", contact: "RSSI/CTO", sla: "Immédiat" },
    { level: "Externe", criteria: "Obligation légale, support vendor", contact: "Legal/Vendor", sla: "Selon contexte" }
  ],
  templates: [
    {
      name: "Template Briefing Escalade",
      content: `## BRIEFING ESCALADE
**Date/Heure :** [Timestamp]
**De :** [Nom Analyste] (L[X])
**À :** [Nom Escalade]

### SITUATION
[1-2 phrases décrivant l'incident]

### IMPACT
- Systèmes affectés : [liste]
- Utilisateurs impactés : [nombre/scope]
- Données à risque : [oui/non, type]

### ACTIONS DÉJÀ PRISES
1. [Action 1]
2. [Action 2]
3. [Action 3]

### DÉCISIONS NÉCESSAIRES
- [ ] [Décision 1]
- [ ] [Décision 2]

### RECOMMANDATION
[Votre recommandation avec justification]

### PROCHAINES ÉTAPES SI APPROUVÉ
1. [Étape 1]
2. [Étape 2]`
    }
  ],
  kpis: [
    { name: "Respect SLA escalade", target: "> 95%", description: "Escalades dans les délais" },
    { name: "Qualité briefings", target: "> 90% complets", description: "Briefings contenant toutes les infos" }
  ]
};

// ============================================
// SOP 8: REPORTING & KPI
// ============================================
export const sopReporting: SOPTemplate = {
  id: "reporting-kpi",
  slug: "reporting-kpi",
  title: "Reporting & KPI",
  category: "Reporting",
  description: "Processus de création des rapports et suivi des indicateurs de performance du SOC.",
  version: "1.0",
  alertTypes: [],
  objectives: [
    "Visibilité sur la performance SOC",
    "Identification des axes d'amélioration",
    "Communication avec le management",
    "Conformité et audit"
  ],
  scope: "Tous les rapports opérationnels et stratégiques du SOC",
  roles: [
    {
      role: "Analyste L2/L3",
      responsibilities: [
        "Collecte données quotidiennes",
        "Contribution aux rapports thématiques"
      ]
    },
    {
      role: "Chef SOC",
      responsibilities: [
        "Validation des rapports",
        "Présentation au management",
        "Définition des KPIs"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Collecte des données",
      description: "Rassembler les métriques nécessaires",
      timeEstimate: "30 min/jour",
      responsible: "Analyste",
      actions: [
        "Extraire données des dashboards (ELK, Grafana)",
        "Compiler tickets/cas TheHive",
        "Récupérer métriques automatisées",
        "Vérifier cohérence des données"
      ],
      checklist: [
        { id: "rc-1", text: "Données ELK extraites", required: true },
        { id: "rc-2", text: "Tickets TheHive compilés", required: true },
        { id: "rc-3", text: "Métriques vérifiées", required: true }
      ]
    },
    {
      id: 2,
      title: "Calcul des KPIs",
      description: "Calculer les indicateurs de performance",
      timeEstimate: "1 heure/semaine",
      responsible: "Chef SOC",
      actions: [
        "MTTA/MTTR par sévérité",
        "Volume alertes/incidents",
        "Taux de faux positifs",
        "Respect des SLAs"
      ],
      checklist: [
        { id: "rk-1", text: "MTTA/MTTR calculés", required: true },
        { id: "rk-2", text: "Volumes comptabilisés", required: true },
        { id: "rk-3", text: "FP rate calculé", required: true },
        { id: "rk-4", text: "SLA compliance mesurée", required: true }
      ]
    },
    {
      id: 3,
      title: "Rédaction du rapport",
      description: "Créer le rapport selon le template",
      timeEstimate: "2-4 heures",
      responsible: "Chef SOC",
      actions: [
        "Utiliser template approprié (daily/weekly/monthly)",
        "Inclure KPIs avec tendances",
        "Ajouter analyse et recommandations",
        "Inclure incidents notables"
      ],
      checklist: [
        { id: "rr-1", text: "Template utilisé", required: true },
        { id: "rr-2", text: "KPIs inclus avec graphiques", required: true },
        { id: "rr-3", text: "Analyse rédigée", required: true },
        { id: "rr-4", text: "Incidents notables documentés", required: false }
      ]
    },
    {
      id: 4,
      title: "Distribution et archivage",
      description: "Envoyer et archiver le rapport",
      timeEstimate: "15 minutes",
      responsible: "Chef SOC",
      actions: [
        "Valider le rapport",
        "Envoyer aux destinataires",
        "Archiver pour audit",
        "Planifier présentation si nécessaire"
      ],
      checklist: [
        { id: "rd-1", text: "Rapport validé", required: true },
        { id: "rd-2", text: "Envoyé aux destinataires", required: true },
        { id: "rd-3", text: "Archivé", required: true }
      ]
    }
  ],
  kpis: [
    { name: "MTTA (Mean Time To Acknowledge)", target: "< 15 min (Sev1)", description: "Temps entre alerte et prise en charge" },
    { name: "MTTR (Mean Time To Resolve)", target: "< 4h (Sev2)", description: "Temps jusqu'à résolution" },
    { name: "Volume alertes", target: "Tracké", description: "Nombre d'alertes par jour/semaine" },
    { name: "Taux faux positifs", target: "< 20%", description: "Pourcentage FP sur total" },
    { name: "SLA Compliance", target: "> 95%", description: "Respect des délais" },
    { name: "Coverage 24/7", target: "100%", description: "Pas de gap de couverture" }
  ],
  templates: [
    {
      name: "Rapport Hebdomadaire SOC",
      content: `# RAPPORT SOC HEBDOMADAIRE
**Période :** [Date début] - [Date fin]
**Rédigé par :** [Chef SOC]

## RÉSUMÉ EXÉCUTIF
[3-4 phrases résumant la semaine]

## KPIs DE LA SEMAINE
| Métrique | Valeur | Cible | Tendance |
|----------|--------|-------|----------|
| MTTA Sev1 | [X] min | < 15 min | ↑/↓/→ |
| MTTR Sev2 | [X] h | < 4h | ↑/↓/→ |
| Volume alertes | [N] | - | ↑/↓/→ |
| % FP | [X]% | < 20% | ↑/↓/→ |
| SLA Compliance | [X]% | > 95% | ↑/↓/→ |

## INCIDENTS NOTABLES
### Incident #1
- **Titre :** [Titre]
- **Sévérité :** [Sev]
- **Résumé :** [Description courte]
- **Statut :** [Résolu/En cours]

## ACCOMPLISSEMENTS
- [Accomplissement 1]
- [Accomplissement 2]

## DÉFIS ET ACTIONS
| Défi | Action | Responsable | Deadline |
|------|--------|-------------|----------|
| [Défi] | [Action] | [Nom] | [Date] |

## PROCHAINE SEMAINE
- [Priorité 1]
- [Priorité 2]`
    }
  ]
};

// ============================================
// EXPORT ALL SOPs
// ============================================
export const allSOPs: SOPTemplate[] = [
  sopOnboarding,
  sopShiftHandover,
  sopIncidentManagement,
  sopAlertTriage,
  sopThreatHunting,
  sopVulnerabilityManagement,
  sopEscalation,
  sopReporting
];

export function getSOPBySlug(slug: string): SOPTemplate | undefined {
  return allSOPs.find(sop => sop.slug === slug);
}

export function getSOPsByCategory(category: string): SOPTemplate[] {
  return allSOPs.filter(sop => sop.category === category);
}

export function getAllSOPCategories(): string[] {
  return [...new Set(allSOPs.map(sop => sop.category))];
}
