/**
 * SOPs MITRE ATT&CK Extended - Procédures Additionnelles
 * SOC Analyst Assistant - Morakib
 * Version 1.0
 * 
 * Ces SOPs couvrent les tactiques MITRE ATT&CK restantes:
 * - Execution (TA0002)
 * - Persistence (TA0003)
 * - Privilege Escalation (TA0004)
 * - Defense Evasion (TA0005)
 * - Discovery (TA0007)
 * - Collection (TA0009)
 * - Exfiltration (TA0010)
 */

import { SOPTemplate } from "./sops";

// ============================================
// SOP MITRE-06: EXECUTION
// Techniques: T1059, T1059.001, T1059.003, T1204, T1053
// Tactic: Execution (TA0002)
// ============================================
export const sopMitreExecution: SOPTemplate = {
  id: "mitre-execution",
  slug: "mitre-execution-response",
  title: "Réponse à l'Exécution Malveillante (T1059)",
  category: "MITRE - Execution",
  description: "Procédure de détection et réponse aux techniques d'exécution de code malveillant incluant PowerShell (T1059.001), Windows Command Shell (T1059.003), User Execution (T1204) et Scheduled Tasks (T1053).",
  version: "1.0",
  alertTypes: ["PowerShell Suspect", "Script Malveillant", "Macro Malicieuse", "Scheduled Task Suspect"],
  objectives: [
    "Détecter l'exécution de code malveillant",
    "Identifier la technique d'exécution utilisée",
    "Bloquer et contenir l'exécution",
    "Analyser le payload exécuté",
    "Éradiquer et remédier"
  ],
  scope: "Tout incident impliquant l'exécution non autorisée de scripts, commandes ou binaires malveillants",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes d'exécution suspecte",
        "Triage initial et qualification",
        "Escalade si malveillant"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse du script/commande",
        "Décodage des payloads obfusqués",
        "Actions de containment"
      ]
    },
    {
      role: "Analyste SOC L3 / Malware Analyst",
      responsibilities: [
        "Analyse avancée du malware",
        "Reverse engineering si nécessaire",
        "Extraction complète des IOCs"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Triage",
      description: "Identifier et qualifier l'exécution suspecte",
      actions: [
        "Recevoir l'alerte d'exécution suspecte (EDR/SIEM)",
        "Identifier le système et l'utilisateur concerné",
        "Déterminer le type d'exécution (PowerShell, CMD, WMI, Script)",
        "Analyser la ligne de commande complète",
        "Vérifier le processus parent (chaîne d'exécution)"
      ],
      checklist: [
        { id: "ex-1-1", text: "Système et utilisateur identifiés", required: true },
        { id: "ex-1-2", text: "Type d'exécution déterminé", required: true },
        { id: "ex-1-3", text: "Ligne de commande complète collectée", required: true },
        { id: "ex-1-4", text: "Process tree analysé", required: true },
        { id: "ex-1-5", text: "Contexte utilisateur vérifié (légitime?)", required: true }
      ],
      tips: [
        "Word/Excel → PowerShell = TRÈS suspect (macro malveillante)",
        "Les encodages base64 sont courants pour l'obfuscation",
        "Vérifier si l'utilisateur a vraiment exécuté quelque chose"
      ],
      commands: [
        { description: "PowerShell encoded commands", command: 'process.name:"powershell.exe" AND process.args:(*-enc* OR *-encoded* OR *-e * OR *frombase64*)' },
        { description: "Office spawning scripts", command: 'process.parent.name:("winword.exe" OR "excel.exe" OR "powerpnt.exe") AND process.name:("powershell.exe" OR "cmd.exe" OR "wscript.exe" OR "cscript.exe" OR "mshta.exe")' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Décodage et Analyse du Payload",
      description: "Décoder les commandes obfusquées et analyser le payload",
      actions: [
        "Décoder les commandes base64 si présentes",
        "Analyser les techniques d'obfuscation (string concatenation, char codes)",
        "Identifier l'objectif du script (download, execute, recon)",
        "Extraire les URLs, IPs, domaines contactés",
        "Identifier le malware ou framework utilisé"
      ],
      checklist: [
        { id: "ex-2-1", text: "Commandes décodées", required: true },
        { id: "ex-2-2", text: "Obfuscation analysée", required: true },
        { id: "ex-2-3", text: "Objectif du payload identifié", required: true },
        { id: "ex-2-4", text: "IOCs extraits (URLs, IPs)", required: true },
        { id: "ex-2-5", text: "Framework/Malware identifié", required: false }
      ],
      tips: [
        "Utiliser CyberChef pour décoder (From Base64 → Decompress)",
        "Les download cradles: IEX, DownloadString, Invoke-WebRequest",
        "Cobalt Strike, Empire, Metasploit ont des signatures connues"
      ],
      commands: [
        { description: "Décoder base64 (PowerShell)", command: "[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('BASE64_STRING'))" },
        { description: "Décoder base64 (Linux)", command: "echo 'BASE64_STRING' | base64 -d" }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Analyse des Actions Post-Exécution",
      description: "Déterminer ce qui s'est passé après l'exécution du payload",
      actions: [
        "Rechercher les fichiers créés/modifiés",
        "Identifier les connexions réseau établies",
        "Vérifier les processus enfants créés",
        "Rechercher les modifications registry",
        "Identifier la persistence éventuelle"
      ],
      checklist: [
        { id: "ex-3-1", text: "Fichiers créés/modifiés listés", required: true },
        { id: "ex-3-2", text: "Connexions réseau analysées", required: true },
        { id: "ex-3-3", text: "Processus enfants identifiés", required: true },
        { id: "ex-3-4", text: "Modifications registry vérifiées", required: true },
        { id: "ex-3-5", text: "Persistence identifiée", required: true }
      ],
      tips: [
        "Sysmon Event 11 = File Create",
        "Sysmon Event 3 = Network Connection",
        "Sysmon Event 13 = Registry modification"
      ],
      commands: [
        { description: "Fichiers créés par processus", command: 'event.code:11 AND process.name:"powershell.exe" AND host.name:"{hostname}"' },
        { description: "Connexions du processus", command: 'event.code:3 AND process.name:"powershell.exe" AND host.name:"{hostname}" | table destination.ip, destination.port' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Containment",
      description: "Isoler et contenir la menace",
      actions: [
        "Isoler le système affecté via EDR",
        "Terminer les processus malveillants",
        "Bloquer les IOCs identifiés (IPs, domaines, hash)",
        "Rechercher d'autres systèmes avec la même activité",
        "Suspendre les comptes si compromis"
      ],
      checklist: [
        { id: "ex-4-1", text: "Système isolé", required: true },
        { id: "ex-4-2", text: "Processus malveillants terminés", required: true },
        { id: "ex-4-3", text: "IOCs bloqués", required: true },
        { id: "ex-4-4", text: "Autres systèmes vérifiés", required: true },
        { id: "ex-4-5", text: "Comptes sécurisés si nécessaire", required: false }
      ],
      tips: [
        "Ne pas éteindre si possible (préserve la RAM)",
        "Kill le process tree complet, pas juste le parent",
        "Vérifier les scheduled tasks créées"
      ],
      commands: [
        { description: "Terminer process et enfants", command: "taskkill /F /T /PID {PID}" },
        { description: "Rechercher IOC sur d'autres hôtes", command: 'process.hash.sha256:"{hash}" | stats count by host.name' }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 5,
      title: "Éradication et Remédiation",
      description: "Supprimer les artefacts malveillants et restaurer",
      actions: [
        "Supprimer les fichiers malveillants",
        "Supprimer les scheduled tasks malveillantes",
        "Nettoyer les entrées registry malveillantes",
        "Scanner avec EDR/AV mis à jour",
        "Remettre le système en production"
      ],
      checklist: [
        { id: "ex-5-1", text: "Fichiers malveillants supprimés", required: true },
        { id: "ex-5-2", text: "Scheduled tasks nettoyées", required: true },
        { id: "ex-5-3", text: "Registry nettoyé", required: true },
        { id: "ex-5-4", text: "Scan post-remediation clean", required: true },
        { id: "ex-5-5", text: "Système remis en production", required: true }
      ],
      tips: [
        "Vérifier les WMI subscriptions (T1546.003)",
        "Vérifier les DLLs dans les répertoires systèmes",
        "Monitoring renforcé pendant 48h"
      ],
      timeEstimate: "20-40 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 6,
      title: "Documentation et Amélioration",
      description: "Documenter l'incident et améliorer les défenses",
      actions: [
        "Compléter le rapport d'incident",
        "Créer des règles de détection pour le pattern observé",
        "Partager les IOCs sur MISP",
        "Recommander des améliorations (Constrained Language Mode, etc.)",
        "Planifier une sensibilisation si user execution"
      ],
      checklist: [
        { id: "ex-6-1", text: "Rapport complet", required: true },
        { id: "ex-6-2", text: "Règles de détection créées", required: true },
        { id: "ex-6-3", text: "IOCs partagés", required: true },
        { id: "ex-6-4", text: "Recommandations documentées", required: true }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    }
  ],
  kpis: [
    { name: "MTTD Execution", target: "< 10 min", description: "Temps de détection de l'exécution suspecte" },
    { name: "MTTR Containment", target: "< 1h", description: "Temps pour contenir l'exécution" },
    { name: "Payload Analysis Time", target: "< 30 min", description: "Temps pour analyser complètement le payload" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Exécution malveillante confirmée", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Malware avancé / Obfuscation complexe", contact: "SOC L3 / Malware Team", sla: "30 min" },
    { level: "L3 → CISO", criteria: "Multiple systèmes / APT indicators", contact: "CISO", sla: "1h" }
  ]
};

// ============================================
// SOP MITRE-07: PERSISTENCE
// Techniques: T1547, T1053, T1136, T1543
// Tactic: Persistence (TA0003)
// ============================================
export const sopMitrePersistence: SOPTemplate = {
  id: "mitre-persistence",
  slug: "mitre-persistence-response",
  title: "Réponse à la Persistence (T1547)",
  category: "MITRE - Persistence",
  description: "Procédure de détection et réponse aux mécanismes de persistence incluant Registry Run Keys (T1547.001), Scheduled Tasks (T1053), Account Creation (T1136) et Services (T1543).",
  version: "1.0",
  alertTypes: ["Registry Modification", "Scheduled Task Creation", "New Account", "Service Creation", "Startup Folder"],
  objectives: [
    "Détecter les mécanismes de persistence installés",
    "Identifier toutes les instances de persistence",
    "Éradiquer complètement la persistence",
    "Identifier l'accès initial et le mouvement latéral",
    "Renforcer la surveillance des points de persistence"
  ],
  scope: "Tout mécanisme permettant à un attaquant de maintenir son accès après reboot",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes de persistence",
        "Qualification initiale",
        "Escalade vers L2"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des mécanismes de persistence",
        "Recherche d'autres instances",
        "Éradication"
      ]
    },
    {
      role: "Analyste SOC L3",
      responsibilities: [
        "Analyse forensic complète",
        "Identification du scope complet",
        "Recommandations de hardening"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Classification",
      description: "Identifier et classifier le type de persistence",
      actions: [
        "Recevoir l'alerte de persistence (EDR/SIEM)",
        "Identifier le système et l'utilisateur concerné",
        "Classifier le type de persistence (Registry/Task/Service/Account)",
        "Identifier le binaire ou script de persistence",
        "Vérifier si l'activité est autorisée (IT/Admin)"
      ],
      checklist: [
        { id: "pe-1-1", text: "Type de persistence identifié", required: true },
        { id: "pe-1-2", text: "Technique MITRE mappée", required: true },
        { id: "pe-1-3", text: "Binaire/Script associé identifié", required: true },
        { id: "pe-1-4", text: "Activité légitime éliminée", required: true }
      ],
      tips: [
        "T1547.001: HKLM/HKCU Run, RunOnce keys",
        "T1053.005: Scheduled Tasks (schtasks)",
        "T1543.003: Windows Services",
        "T1136.001: Local Account creation"
      ],
      commands: [
        { description: "Registry Run Keys", command: 'winlog.event_id:13 AND registry.path:*\\Run*' },
        { description: "Scheduled Task Creation", command: 'winlog.event_id:4698 OR (event.code:1 AND process.name:"schtasks.exe" AND process.args:"/create")' },
        { description: "Service Creation", command: 'winlog.event_id:7045 OR winlog.event_id:4697' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse de la Persistence",
      description: "Analyser en détail le mécanisme de persistence",
      actions: [
        "Collecter le binaire/script référencé par la persistence",
        "Analyser la commande/arguments de lancement",
        "Vérifier les privilèges requis (SYSTEM/User)",
        "Identifier quand la persistence a été créée",
        "Rechercher le processus qui a créé la persistence"
      ],
      checklist: [
        { id: "pe-2-1", text: "Payload de persistence collecté", required: true },
        { id: "pe-2-2", text: "Arguments de lancement analysés", required: true },
        { id: "pe-2-3", text: "Timestamp de création identifié", required: true },
        { id: "pe-2-4", text: "Processus créateur identifié", required: true },
        { id: "pe-2-5", text: "Hash du payload obtenu", required: true }
      ],
      tips: [
        "Les timestamps aident à corréler avec l'accès initial",
        "Les services SYSTEM permettent les privilèges élevés",
        "Vérifier si le binaire est signé et par qui"
      ],
      commands: [
        { description: "Détails scheduled task", command: "schtasks /query /tn '{task_name}' /v /fo list" },
        { description: "Détails service", command: "sc qc {service_name}" },
        { description: "Registry value", command: "reg query 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'" }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Recherche d'Autres Instances",
      description: "Rechercher tous les mécanismes de persistence sur le réseau",
      actions: [
        "Scanner tous les endpoints pour le hash du payload",
        "Rechercher les mêmes noms de task/service/registry",
        "Vérifier les comptes créés récemment sur le domaine",
        "Analyser les patterns de création (même heure, même méthode)",
        "Établir la liste complète des systèmes compromis"
      ],
      checklist: [
        { id: "pe-3-1", text: "Scan endpoint avec hash effectué", required: true },
        { id: "pe-3-2", text: "Recherche noms similaires effectuée", required: true },
        { id: "pe-3-3", text: "Comptes AD vérifiés", required: true },
        { id: "pe-3-4", text: "Liste systèmes compromis complète", required: true }
      ],
      tips: [
        "Les attaquants utilisent souvent le même nom de task/service",
        "Vérifier les comptes créés avec des patterns suspects",
        "Les WMI subscriptions sont souvent oubliées dans l'éradication"
      ],
      commands: [
        { description: "Recherche hash sur parc", command: 'file.hash.sha256:"{hash}" | stats count by host.name' },
        { description: "Comptes créés récemment", command: 'winlog.event_id:4720 AND @timestamp >= "now-7d"' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Éradication Complète",
      description: "Supprimer tous les mécanismes de persistence",
      actions: [
        "Supprimer les entrées registry malveillantes",
        "Supprimer les scheduled tasks malveillantes",
        "Désactiver/Supprimer les services malveillants",
        "Supprimer/Désactiver les comptes créés par l'attaquant",
        "Supprimer les fichiers de payload"
      ],
      checklist: [
        { id: "pe-4-1", text: "Registry entries supprimées", required: true },
        { id: "pe-4-2", text: "Scheduled tasks supprimées", required: true },
        { id: "pe-4-3", text: "Services supprimés", required: true },
        { id: "pe-4-4", text: "Comptes désactivés/supprimés", required: true },
        { id: "pe-4-5", text: "Fichiers payload supprimés", required: true }
      ],
      tips: [
        "Toujours désactiver avant de supprimer (rollback possible)",
        "Documenter chaque suppression avec timestamp",
        "Vérifier les WMI Event Subscriptions (souvent oubliées)"
      ],
      commands: [
        { description: "Supprimer registry key", command: "reg delete 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' /v '{value_name}' /f" },
        { description: "Supprimer scheduled task", command: "schtasks /delete /tn '{task_name}' /f" },
        { description: "Supprimer service", command: "sc delete '{service_name}'" },
        { description: "WMI Subscriptions", command: "Get-WMIObject -Namespace root\\Subscription -Class __EventFilter | Remove-WMIObject" }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 5,
      title: "Vérification et Monitoring",
      description: "Vérifier l'éradication complète et surveiller",
      actions: [
        "Scanner les systèmes pour confirmer la suppression",
        "Vérifier qu'aucune persistence n'est recréée",
        "Mettre en place des alertes spécifiques",
        "Surveiller les comportements suspects 72h",
        "Valider avec un reboot test"
      ],
      checklist: [
        { id: "pe-5-1", text: "Scan post-éradication clean", required: true },
        { id: "pe-5-2", text: "Alertes spécifiques créées", required: true },
        { id: "pe-5-3", text: "Monitoring renforcé actif", required: true },
        { id: "pe-5-4", text: "Reboot test effectué", required: false }
      ],
      timeEstimate: "15-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 6,
      title: "Documentation et Hardening",
      description: "Documenter et renforcer les défenses",
      actions: [
        "Compléter le rapport d'incident",
        "Mapper les TTPs sur MITRE ATT&CK",
        "Recommander le hardening (GPO restrictions)",
        "Créer des règles de détection permanentes",
        "Planifier l'audit des mécanismes de persistence"
      ],
      checklist: [
        { id: "pe-6-1", text: "Rapport complet", required: true },
        { id: "pe-6-2", text: "TTPs documentés", required: true },
        { id: "pe-6-3", text: "Recommandations hardening", required: true },
        { id: "pe-6-4", text: "Règles de détection créées", required: true }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    }
  ],
  kpis: [
    { name: "MTTD Persistence", target: "< 1h", description: "Temps de détection de la persistence" },
    { name: "Éradication complète", target: "100%", description: "Toutes les instances supprimées" },
    { name: "Récurrence", target: "0", description: "Aucune réapparition dans les 30 jours" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Persistence confirmée", contact: "SOC L2 On-Call", sla: "15 min" },
    { level: "L2 → L3", criteria: "Multiple systèmes / Service SYSTEM", contact: "SOC L3", sla: "30 min" },
    { level: "L3 → CISO", criteria: "Persistence sur DC / Serveurs critiques", contact: "CISO", sla: "1h" }
  ]
};

// ============================================
// SOP MITRE-08: PRIVILEGE ESCALATION
// Techniques: T1068, T1548, T1134, T1055
// Tactic: Privilege Escalation (TA0004)
// ============================================
export const sopMitrePrivilegeEscalation: SOPTemplate = {
  id: "mitre-privesc",
  slug: "mitre-privilege-escalation-response",
  title: "Réponse à l'Escalade de Privilèges (T1068)",
  category: "MITRE - Privilege Escalation",
  description: "Procédure de détection et réponse aux techniques d'escalade de privilèges incluant Exploitation (T1068), Bypass UAC (T1548.002), Token Manipulation (T1134) et Process Injection (T1055).",
  version: "1.0",
  alertTypes: ["Privilege Escalation", "UAC Bypass", "Token Manipulation", "Process Injection", "Exploit Detection"],
  objectives: [
    "Détecter les tentatives d'escalade de privilèges",
    "Identifier la technique utilisée",
    "Contenir et révoquer les privilèges obtenus",
    "Corriger la vulnérabilité exploitée",
    "Renforcer les contrôles de privilèges"
  ],
  scope: "Toute tentative d'obtention de privilèges supérieurs non autorisés",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection initiale",
        "Qualification de l'alerte",
        "Escalade immédiate"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse de la technique",
        "Identification de la vulnérabilité",
        "Containment"
      ]
    },
    {
      role: "Analyste SOC L3",
      responsibilities: [
        "Analyse avancée d'exploit",
        "Forensics complet",
        "Recommandations patch"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Identification",
      description: "Détecter et identifier la technique d'escalade",
      actions: [
        "Recevoir l'alerte d'escalade de privilèges",
        "Identifier le système et le processus concerné",
        "Déterminer le niveau de privilège avant/après",
        "Identifier la technique utilisée (exploit, UAC bypass, token)",
        "Vérifier si l'activité est légitime"
      ],
      checklist: [
        { id: "pv-1-1", text: "Système et processus identifiés", required: true },
        { id: "pv-1-2", text: "Niveau de privilège analysé", required: true },
        { id: "pv-1-3", text: "Technique MITRE identifiée", required: true },
        { id: "pv-1-4", text: "Activité légitime éliminée", required: true }
      ],
      tips: [
        "Token SYSTEM depuis processus utilisateur = suspect",
        "Sysmon Event 10 avec SeDebugPrivilege = warning",
        "UAC bypass: processus elevated sans prompt"
      ],
      commands: [
        { description: "Process elevated", command: 'winlog.event_id:4688 AND winlog.event_data.TokenElevationType:"%%1937"' },
        { description: "UAC Bypass indicators", command: 'process.name:("fodhelper.exe" OR "eventvwr.exe" OR "sdclt.exe") AND process.parent.name:NOT("explorer.exe")' },
        { description: "Process Injection", command: 'event.code:8 OR (event.code:10 AND winlog.event_data.GrantedAccess:("0x1F0FFF" OR "0x1FFFFF"))' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse de la Technique",
      description: "Comprendre comment l'escalade a été réalisée",
      actions: [
        "Analyser le processus qui a effectué l'escalade",
        "Identifier l'exploit ou la technique utilisée",
        "Vérifier si une vulnérabilité connue est exploitée",
        "Analyser les arguments et le contexte d'exécution",
        "Documenter la chaîne d'attaque complète"
      ],
      checklist: [
        { id: "pv-2-1", text: "Processus analysé", required: true },
        { id: "pv-2-2", text: "Exploit/Technique identifié", required: true },
        { id: "pv-2-3", text: "CVE identifié si applicable", required: false },
        { id: "pv-2-4", text: "Chaîne d'attaque documentée", required: true }
      ],
      tips: [
        "Vérifier les CVE récents pour le système",
        "T1055 (Injection): souvent suivi de credential dumping",
        "Les UAC bypass utilisent des binaires Microsoft signés"
      ],
      commands: [
        { description: "Process tree complet", command: 'event.code:1 AND host.name:"{hostname}" | table @timestamp, process.parent.name, process.name, process.args | sort @timestamp' },
        { description: "DLL Injection", command: 'event.code:7 AND process.name:"{target_process}" AND file.path:NOT("C:\\Windows\\*")' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Containment et Révocation",
      description: "Contenir et révoquer les privilèges obtenus",
      actions: [
        "Isoler le système concerné",
        "Terminer les processus avec privilèges escaladés",
        "Révoquer les tokens d'accès",
        "Désactiver les comptes si nécessaire",
        "Bloquer les IOCs identifiés"
      ],
      checklist: [
        { id: "pv-3-1", text: "Système isolé", required: true },
        { id: "pv-3-2", text: "Processus terminés", required: true },
        { id: "pv-3-3", text: "Tokens révoqués", required: true },
        { id: "pv-3-4", text: "IOCs bloqués", required: true }
      ],
      tips: [
        "Terminer le process tree complet",
        "Après token manipulation: forcer re-login des sessions",
        "Vérifier ce qui a été fait avec les privilèges élevés"
      ],
      commands: [
        { description: "Kill process tree", command: "taskkill /F /T /PID {pid}" },
        { description: "Force logoff user", command: "logoff {session_id}" }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Analyse d'Impact",
      description: "Déterminer ce qui a été fait avec les privilèges élevés",
      actions: [
        "Analyser les actions post-escalade",
        "Rechercher le credential dumping",
        "Vérifier les modifications système",
        "Identifier le mouvement latéral éventuel",
        "Évaluer les données potentiellement compromises"
      ],
      checklist: [
        { id: "pv-4-1", text: "Actions post-escalade analysées", required: true },
        { id: "pv-4-2", text: "Credential access vérifié", required: true },
        { id: "pv-4-3", text: "Modifications système listées", required: true },
        { id: "pv-4-4", text: "Lateral movement vérifié", required: true }
      ],
      tips: [
        "Avec SYSTEM: vérifier l'accès à LSASS",
        "Vérifier les fichiers créés dans System32",
        "Les attaquants installent souvent une persistence"
      ],
      commands: [
        { description: "Actions après escalade", command: 'host.name:"{hostname}" AND @timestamp >= "{escalation_time}" | sort @timestamp' },
        { description: "LSASS access post-escalade", command: 'event.code:10 AND winlog.event_data.TargetImage:"*lsass.exe" AND host.name:"{hostname}" AND @timestamp >= "{time}"' }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L3"
    },
    {
      id: 5,
      title: "Remédiation et Patch",
      description: "Corriger la vulnérabilité et nettoyer",
      actions: [
        "Appliquer les patches de sécurité si CVE",
        "Supprimer les fichiers malveillants",
        "Restaurer les configurations modifiées",
        "Renforcer la politique UAC",
        "Scanner le système post-remediation"
      ],
      checklist: [
        { id: "pv-5-1", text: "Patch appliqué si CVE", required: false },
        { id: "pv-5-2", text: "Fichiers malveillants supprimés", required: true },
        { id: "pv-5-3", text: "Configuration restaurée", required: true },
        { id: "pv-5-4", text: "Scan post-remediation clean", required: true }
      ],
      tips: [
        "Prioriser le patch sur tous les systèmes similaires",
        "Renforcer UAC: AlwaysNotify",
        "Implémenter le credential guard si pas déjà fait"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3 + IT"
    },
    {
      id: 6,
      title: "Documentation et Prévention",
      description: "Documenter et améliorer la prévention",
      actions: [
        "Compléter le rapport d'incident",
        "Documenter la technique MITRE utilisée",
        "Créer des règles de détection",
        "Recommander les mesures de hardening",
        "Planifier l'audit des privilèges"
      ],
      checklist: [
        { id: "pv-6-1", text: "Rapport complet", required: true },
        { id: "pv-6-2", text: "TTPs documentés", required: true },
        { id: "pv-6-3", text: "Règles de détection créées", required: true },
        { id: "pv-6-4", text: "Plan de hardening défini", required: true }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    }
  ],
  kpis: [
    { name: "MTTD PrivEsc", target: "< 15 min", description: "Temps de détection de l'escalade" },
    { name: "MTTR Containment", target: "< 1h", description: "Temps pour contenir et révoquer" },
    { name: "Patch Time", target: "< 24h", description: "Temps pour patcher si CVE" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "PrivEsc confirmée", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Exploit 0-day / Multiple systèmes", contact: "SOC L3 / IR", sla: "20 min" },
    { level: "L3 → CISO", criteria: "Domain Admin obtenu / Serveurs critiques", contact: "CISO", sla: "30 min" }
  ]
};

// ============================================
// SOP MITRE-09: DEFENSE EVASION
// Techniques: T1070, T1562, T1027, T1036
// Tactic: Defense Evasion (TA0005)
// ============================================
export const sopMitreDefenseEvasion: SOPTemplate = {
  id: "mitre-defense-evasion",
  slug: "mitre-defense-evasion-response",
  title: "Réponse à l'Évasion de Défense (T1070)",
  category: "MITRE - Defense Evasion",
  description: "Procédure de détection et réponse aux techniques d'évasion incluant Indicator Removal (T1070), Impair Defenses (T1562), Obfuscated Files (T1027) et Masquerading (T1036).",
  version: "1.0",
  alertTypes: ["Log Tampering", "AV Disabled", "EDR Tampered", "Obfuscated Script", "Masquerading"],
  objectives: [
    "Détecter les tentatives d'évasion des défenses",
    "Identifier les systèmes avec défenses compromises",
    "Restaurer les contrôles de sécurité",
    "Analyser ce qui a été masqué/supprimé",
    "Renforcer la protection des agents de sécurité"
  ],
  scope: "Toute technique visant à éviter la détection ou désactiver les contrôles de sécurité",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes d'évasion",
        "Vérification état des agents",
        "Escalade immédiate"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des techniques d'évasion",
        "Restauration des défenses",
        "Investigation"
      ]
    },
    {
      role: "Analyste SOC L3",
      responsibilities: [
        "Analyse forensic avancée",
        "Récupération de données supprimées",
        "Hardening des défenses"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Qualification",
      description: "Détecter et qualifier la technique d'évasion",
      actions: [
        "Recevoir l'alerte d'évasion de défense",
        "Identifier le système et le processus concerné",
        "Classifier la technique (log clear, AV disable, masquerading)",
        "Vérifier l'état actuel des défenses",
        "Évaluer la criticité (serveur vs workstation)"
      ],
      checklist: [
        { id: "de-1-1", text: "Technique d'évasion identifiée", required: true },
        { id: "de-1-2", text: "Système concerné identifié", required: true },
        { id: "de-1-3", text: "État des défenses vérifié", required: true },
        { id: "de-1-4", text: "Criticité évaluée", required: true }
      ],
      tips: [
        "T1070.001: Clear Windows Event Logs (Event 1102)",
        "T1562.001: Disable Windows Defender",
        "T1036: Process name mimicing (svchost vs svch0st)"
      ],
      commands: [
        { description: "Log clearing detection", command: 'winlog.event_id:1102 OR winlog.event_id:104' },
        { description: "Defender disabled", command: 'winlog.event_id:5001 OR (process.name:"powershell.exe" AND process.args:"Set-MpPreference" AND process.args:"-DisableRealtimeMonitoring")' },
        { description: "Masquerading detection", command: 'process.name:"svchost.exe" AND process.executable:NOT("C:\\Windows\\System32\\svchost.exe")' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse de l'Évasion",
      description: "Comprendre la technique d'évasion utilisée",
      actions: [
        "Analyser la méthode utilisée pour l'évasion",
        "Identifier le processus responsable",
        "Déterminer quand l'évasion a commencé",
        "Rechercher d'autres systèmes avec même technique",
        "Documenter la timeline"
      ],
      checklist: [
        { id: "de-2-1", text: "Méthode d'évasion analysée", required: true },
        { id: "de-2-2", text: "Processus responsable identifié", required: true },
        { id: "de-2-3", text: "Timestamp de début identifié", required: true },
        { id: "de-2-4", text: "Autres systèmes vérifiés", required: true }
      ],
      tips: [
        "Identifier CE QUI s'est passé AVANT l'évasion",
        "Les attaquants désactivent les défenses avant les actions critiques",
        "Vérifier les Shadow Copies supprimées (T1490)"
      ],
      commands: [
        { description: "Actions avant log clear", command: 'host.name:"{hostname}" AND @timestamp < "{clear_time}" | sort -@timestamp | head 100' },
        { description: "EDR agent status", command: 'event.dataset:"endpoint.events" AND host.name:"{hostname}" | stats latest(@timestamp) by event.action' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Restauration des Défenses",
      description: "Restaurer les contrôles de sécurité désactivés",
      actions: [
        "Réactiver les services de sécurité désactivés",
        "Restaurer les configurations modifiées",
        "Vérifier l'intégrité des agents",
        "Forcer la mise à jour des signatures",
        "Confirmer le bon fonctionnement"
      ],
      checklist: [
        { id: "de-3-1", text: "Services de sécurité réactivés", required: true },
        { id: "de-3-2", text: "Configurations restaurées", required: true },
        { id: "de-3-3", text: "Intégrité agents vérifiée", required: true },
        { id: "de-3-4", text: "Signatures à jour", required: true },
        { id: "de-3-5", text: "Fonctionnement confirmé", required: true }
      ],
      tips: [
        "Vérifier les exclusions ajoutées (antivirus)",
        "Réinstaller l'agent si compromis",
        "Protéger les agents avec des politiques de tamper protection"
      ],
      commands: [
        { description: "Réactiver Defender", command: "Set-MpPreference -DisableRealtimeMonitoring $false" },
        { description: "Forcer maj signatures", command: "Update-MpSignature" },
        { description: "Vérifier exclusions", command: "Get-MpPreference | Select-Object -ExpandProperty ExclusionPath" }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Récupération des Données Supprimées",
      description: "Tenter de récupérer les logs et données effacés",
      actions: [
        "Identifier les logs supprimés",
        "Vérifier les backups de logs (SIEM)",
        "Utiliser des outils de recovery si possible",
        "Rechercher dans les sources alternatives",
        "Documenter les gaps dans les logs"
      ],
      checklist: [
        { id: "de-4-1", text: "Logs supprimés identifiés", required: true },
        { id: "de-4-2", text: "Backups SIEM vérifiés", required: true },
        { id: "de-4-3", text: "Sources alternatives exploitées", required: true },
        { id: "de-4-4", text: "Gaps documentés", required: true }
      ],
      tips: [
        "Les logs forwarded au SIEM avant clear sont préservés",
        "Sysmon logs sont souvent séparés",
        "Les logs network (firewall, proxy) peuvent compenser"
      ],
      commands: [
        { description: "Recherche SIEM période effacée", command: 'host.name:"{hostname}" AND @timestamp >= "{start}" AND @timestamp <= "{end}"' },
        { description: "Logs alternatives", command: 'source.ip:"{host_ip}" OR destination.ip:"{host_ip}" AND @timestamp >= "{start}"' }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L3"
    },
    {
      id: 5,
      title: "Investigation Post-Évasion",
      description: "Comprendre ce que l'attaquant a fait pendant l'évasion",
      actions: [
        "Analyser les actions dans la période non-loggée",
        "Corréler avec les logs réseau",
        "Rechercher les indicateurs de compromission",
        "Identifier les données potentiellement exfiltrées",
        "Établir la timeline complète"
      ],
      checklist: [
        { id: "de-5-1", text: "Période analysée via sources alternatives", required: true },
        { id: "de-5-2", text: "IOCs recherchés", required: true },
        { id: "de-5-3", text: "Exfiltration évaluée", required: true },
        { id: "de-5-4", text: "Timeline complétée", required: true }
      ],
      tips: [
        "Les connexions réseau persistent même si logs endpoint effacés",
        "Vérifier l'EDR cloud pour les données déjà envoyées",
        "Les attaquants effacent les logs après les actions critiques"
      ],
      timeEstimate: "45-90 min",
      responsible: "Analyste L3"
    },
    {
      id: 6,
      title: "Hardening et Documentation",
      description: "Renforcer les défenses et documenter",
      actions: [
        "Compléter le rapport d'incident",
        "Implémenter la tamper protection",
        "Centraliser les logs en temps réel",
        "Créer des alertes sur les techniques d'évasion",
        "Former les équipes sur les nouvelles techniques"
      ],
      checklist: [
        { id: "de-6-1", text: "Rapport complet", required: true },
        { id: "de-6-2", text: "Tamper protection implémentée", required: true },
        { id: "de-6-3", text: "Forwarding logs vérifié", required: true },
        { id: "de-6-4", text: "Alertes créées", required: true }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    }
  ],
  kpis: [
    { name: "MTTD Defense Evasion", target: "< 30 min", description: "Temps de détection de l'évasion" },
    { name: "Defense Restoration", target: "< 1h", description: "Temps pour restaurer les défenses" },
    { name: "Log Recovery", target: "> 80%", description: "Pourcentage de logs récupérés" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Évasion de défense confirmée", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Multiple systèmes / Logs critiques effacés", contact: "SOC L3", sla: "20 min" },
    { level: "L3 → CISO", criteria: "DC/Serveurs critiques / Evidence tampering", contact: "CISO + Legal", sla: "30 min" }
  ]
};

// ============================================
// SOP MITRE-10: DISCOVERY
// Techniques: T1087, T1082, T1083, T1057
// Tactic: Discovery (TA0007)
// ============================================
export const sopMitreDiscovery: SOPTemplate = {
  id: "mitre-discovery",
  slug: "mitre-discovery-response",
  title: "Réponse à la Reconnaissance Interne (T1087)",
  category: "MITRE - Discovery",
  description: "Procédure de détection et réponse aux techniques de discovery incluant Account Discovery (T1087), System Information (T1082), File/Directory Discovery (T1083) et Process Discovery (T1057).",
  version: "1.0",
  alertTypes: ["Internal Reconnaissance", "AD Enumeration", "Network Scanning", "Sensitive File Search"],
  objectives: [
    "Détecter la reconnaissance interne suspecte",
    "Identifier l'étendue de la collecte d'information",
    "Bloquer et contenir l'acteur malveillant",
    "Évaluer les informations potentiellement obtenues",
    "Renforcer la défense en profondeur"
  ],
  scope: "Toute activité de collecte d'information sur l'environnement par un acteur malveillant",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes de discovery",
        "Qualification initiale",
        "Escalade si malveillant"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des patterns de reconnaissance",
        "Identification du scope",
        "Containment"
      ]
    },
    {
      role: "Analyste SOC L3",
      responsibilities: [
        "Corrélation avec autres techniques",
        "Analyse de la chaîne d'attaque",
        "Évaluation de l'impact"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Triage",
      description: "Identifier et qualifier l'activité de discovery",
      actions: [
        "Recevoir l'alerte de reconnaissance",
        "Identifier le système et l'utilisateur source",
        "Classifier le type de discovery (accounts, network, files)",
        "Vérifier si l'activité est légitime (IT admin, pentest)",
        "Évaluer le volume et la fréquence des requêtes"
      ],
      checklist: [
        { id: "ds-1-1", text: "Source identifiée", required: true },
        { id: "ds-1-2", text: "Type de discovery classifié", required: true },
        { id: "ds-1-3", text: "Activité légitime vérifiée", required: true },
        { id: "ds-1-4", text: "Volume/Fréquence analysé", required: true }
      ],
      tips: [
        "net user /domain est commun mais suspect depuis un workstation standard",
        "Les outils comme BloodHound font beaucoup de requêtes LDAP",
        "Le discovery suit généralement l'accès initial ou le mouvement latéral"
      ],
      commands: [
        { description: "AD Enumeration", command: 'process.name:("net.exe" OR "net1.exe") AND process.args:("user" OR "group" OR "localgroup" OR "domain")' },
        { description: "System info commands", command: 'process.name:("systeminfo.exe" OR "hostname.exe" OR "ipconfig.exe" OR "whoami.exe")' },
        { description: "BloodHound/SharpHound", command: 'process.name:"sharphound.exe" OR process.args:("invoke-bloodhound" OR "sharphound")' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse des Patterns de Reconnaissance",
      description: "Comprendre l'étendue de la reconnaissance effectuée",
      actions: [
        "Lister toutes les commandes de discovery exécutées",
        "Identifier les cibles de la reconnaissance (users, groups, shares)",
        "Analyser les outils utilisés (natifs vs tools)",
        "Rechercher les fichiers de sortie (output files)",
        "Déterminer les informations potentiellement obtenues"
      ],
      checklist: [
        { id: "ds-2-1", text: "Commandes de discovery listées", required: true },
        { id: "ds-2-2", text: "Cibles identifiées", required: true },
        { id: "ds-2-3", text: "Outils identifiés", required: true },
        { id: "ds-2-4", text: "Output files recherchés", required: true }
      ],
      tips: [
        "Les attaquants sauvegardent souvent les résultats dans des fichiers",
        "Chercher les fichiers .txt, .csv, .json dans les répertoires temp",
        "SharpHound crée des fichiers .zip avec les données BloodHound"
      ],
      commands: [
        { description: "Toutes les commandes discovery", command: 'host.name:"{hostname}" AND process.name:("net.exe" OR "nltest.exe" OR "dsquery.exe" OR "ldapsearch" OR "adfind.exe") | table @timestamp, process.args' },
        { description: "Fichiers créés par process", command: 'event.code:11 AND process.name:"{discovery_process}" AND (file.extension:"txt" OR file.extension:"csv" OR file.extension:"zip")' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Containment",
      description: "Contenir l'acteur avant qu'il n'agisse sur les informations",
      actions: [
        "Isoler le système source",
        "Terminer les processus de reconnaissance actifs",
        "Suspendre le compte utilisateur si compromis",
        "Bloquer les outils identifiés sur le parc",
        "Alerter sur les cibles sensibles découvertes"
      ],
      checklist: [
        { id: "ds-3-1", text: "Système isolé", required: true },
        { id: "ds-3-2", text: "Processus terminés", required: true },
        { id: "ds-3-3", text: "Compte sécurisé", required: true },
        { id: "ds-3-4", text: "Outils bloqués", required: true }
      ],
      tips: [
        "Le discovery précède souvent le mouvement latéral",
        "Agir avant que l'attaquant n'utilise les informations",
        "Les comptes admin découverts sont des cibles prioritaires"
      ],
      commands: [
        { description: "Bloquer hash outil", command: 'Add-MpPreference -ThreatIDDefaultAction_Actions "{hash}"' },
        { description: "Suspendre compte", command: "Disable-ADAccount -Identity '{username}'" }
      ],
      timeEstimate: "15-20 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Évaluation de l'Impact",
      description: "Comprendre ce que l'attaquant a appris",
      actions: [
        "Lister les informations potentiellement collectées",
        "Évaluer l'impact sur les comptes privilégiés découverts",
        "Identifier les chemins d'attaque possibles",
        "Alerter les propriétaires des systèmes sensibles découverts",
        "Établir un plan de protection des cibles identifiées"
      ],
      checklist: [
        { id: "ds-4-1", text: "Informations collectées estimées", required: true },
        { id: "ds-4-2", text: "Comptes sensibles identifiés", required: true },
        { id: "ds-4-3", text: "Chemins d'attaque évalués", required: true },
        { id: "ds-4-4", text: "Propriétaires alertés", required: true }
      ],
      tips: [
        "BloodHound peut identifier les chemins vers Domain Admin",
        "Les service accounts avec SPN sont des cibles Kerberoasting",
        "Les shares découverts peuvent contenir des credentials"
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 5,
      title: "Corrélation et Investigation",
      description: "Relier le discovery à une chaîne d'attaque plus large",
      actions: [
        "Rechercher l'accès initial (comment l'attaquant est arrivé)",
        "Identifier les techniques précédentes (execution, persistence)",
        "Rechercher les techniques suivantes (lateral movement, credential access)",
        "Établir la timeline complète de l'attaque",
        "Identifier tous les systèmes impactés"
      ],
      checklist: [
        { id: "ds-5-1", text: "Accès initial identifié", required: true },
        { id: "ds-5-2", text: "Techniques précédentes analysées", required: true },
        { id: "ds-5-3", text: "Techniques suivantes recherchées", required: true },
        { id: "ds-5-4", text: "Timeline établie", required: true }
      ],
      tips: [
        "Le discovery est rarement une fin en soi",
        "Chercher les actions APRÈS le discovery (lateral movement)",
        "L'attaquant peut avoir plusieurs points de présence"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L3"
    },
    {
      id: 6,
      title: "Remédiation et Hardening",
      description: "Remédier et réduire la surface d'attaque",
      actions: [
        "Supprimer les fichiers de reconnaissance",
        "Réinitialiser les mots de passe des comptes sensibles découverts",
        "Implémenter les protections contre le discovery",
        "Créer des règles de détection",
        "Documenter l'incident"
      ],
      checklist: [
        { id: "ds-6-1", text: "Fichiers supprimés", required: true },
        { id: "ds-6-2", text: "Comptes sensibles sécurisés", required: true },
        { id: "ds-6-3", text: "Protections implémentées", required: true },
        { id: "ds-6-4", text: "Rapport complet", required: true }
      ],
      tips: [
        "Limiter les requêtes LDAP anonymes",
        "Utiliser des LAPS pour les mots de passe admin locaux",
        "Implémenter le tiering AD"
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    }
  ],
  kpis: [
    { name: "MTTD Discovery", target: "< 30 min", description: "Temps de détection de la reconnaissance" },
    { name: "Containment", target: "< 1h", description: "Temps pour contenir avant action" },
    { name: "Correlation", target: "100%", description: "Taux de corrélation avec chaîne d'attaque" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Discovery malveillant confirmé", contact: "SOC L2 On-Call", sla: "15 min" },
    { level: "L2 → L3", criteria: "AD enumeration / BloodHound", contact: "SOC L3", sla: "30 min" },
    { level: "L3 → CISO", criteria: "Chemins vers DC identifiés / APT indicators", contact: "CISO", sla: "1h" }
  ]
};

// ============================================
// SOP MITRE-11: COLLECTION
// Techniques: T1560, T1074, T1005, T1114
// Tactic: Collection (TA0009)
// ============================================
export const sopMitreCollection: SOPTemplate = {
  id: "mitre-collection",
  slug: "mitre-collection-response",
  title: "Réponse à la Collecte de Données (T1560)",
  category: "MITRE - Collection",
  description: "Procédure de détection et réponse aux techniques de collecte de données incluant Archive Collected Data (T1560), Data Staged (T1074), Data from Local System (T1005) et Email Collection (T1114).",
  version: "1.0",
  alertTypes: ["Data Collection", "Mass File Access", "Archive Creation", "Email Export", "Database Query"],
  objectives: [
    "Détecter la collecte de données suspecte",
    "Identifier les données ciblées",
    "Bloquer l'exfiltration avant qu'elle ne se produise",
    "Évaluer les données potentiellement compromises",
    "Alerter les propriétaires des données"
  ],
  scope: "Toute activité de collecte massive ou ciblée de données sensibles",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes de collecte",
        "Qualification initiale",
        "Escalade"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des données ciblées",
        "Évaluation de l'impact",
        "Containment"
      ]
    },
    {
      role: "Analyste SOC L3 / DLP Team",
      responsibilities: [
        "Forensics avancé",
        "Classification des données",
        "Notification légale si nécessaire"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Qualification",
      description: "Identifier et qualifier l'activité de collecte",
      actions: [
        "Recevoir l'alerte de collecte de données",
        "Identifier le système, l'utilisateur et le processus",
        "Classifier le type de collecte (files, email, database)",
        "Vérifier si l'activité est légitime (backup, admin)",
        "Évaluer le volume de données concerné"
      ],
      checklist: [
        { id: "co-1-1", text: "Source de collecte identifiée", required: true },
        { id: "co-1-2", text: "Type de données ciblées identifié", required: true },
        { id: "co-1-3", text: "Activité légitime vérifiée", required: true },
        { id: "co-1-4", text: "Volume estimé", required: true }
      ],
      tips: [
        "Les attaquants créent souvent des archives .zip, .rar, .7z",
        "Attention aux accès massifs à des fichiers sensibles",
        "La staging area est souvent dans un répertoire temp"
      ],
      commands: [
        { description: "Archive creation", command: 'process.name:("7z.exe" OR "rar.exe" OR "winzip*.exe" OR "powershell.exe") AND process.args:("a" OR "-zip" OR "compress-archive")' },
        { description: "Mass file access", command: 'event.code:4663 AND file.path:("*confidential*" OR "*secret*" OR "*password*") | stats count by user.name, host.name | where count > 50' },
        { description: "Email export", command: 'process.name:("outlook.exe") AND file.extension:("pst" OR "ost")' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse des Données Ciblées",
      description: "Comprendre quelles données ont été collectées",
      actions: [
        "Identifier les fichiers/dossiers accédés",
        "Classifier la sensibilité des données",
        "Rechercher les archives créées",
        "Analyser les requêtes base de données si applicable",
        "Documenter le scope des données"
      ],
      checklist: [
        { id: "co-2-1", text: "Fichiers accédés listés", required: true },
        { id: "co-2-2", text: "Classification effectuée", required: true },
        { id: "co-2-3", text: "Archives identifiées", required: true },
        { id: "co-2-4", text: "Scope documenté", required: true }
      ],
      tips: [
        "Les attaquants ciblent: credentials, PII, IP, documents financiers",
        "Vérifier les mots-clés dans les noms de fichiers",
        "Les exports de BDD peuvent être volumineux"
      ],
      commands: [
        { description: "Fichiers accédés par processus", command: 'event.code:4663 AND process.name:"{suspect_process}" | table file.path, @timestamp' },
        { description: "Archives créées", command: 'event.code:11 AND file.extension:("zip" OR "rar" OR "7z" OR "tar") | table file.path, process.name' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Containment Immédiat",
      description: "Bloquer la collecte avant l'exfiltration",
      actions: [
        "Isoler le système source",
        "Terminer les processus de collecte",
        "Bloquer l'accès aux données sensibles",
        "Suspendre le compte si compromis",
        "Supprimer les archives créées si possible"
      ],
      checklist: [
        { id: "co-3-1", text: "Système isolé", required: true },
        { id: "co-3-2", text: "Processus terminés", required: true },
        { id: "co-3-3", text: "Accès aux données bloqué", required: true },
        { id: "co-3-4", text: "Archives supprimées si trouvées", required: true }
      ],
      tips: [
        "La collecte précède généralement l'exfiltration",
        "Agir rapidement pour éviter l'exfil",
        "Les données peuvent être staging sur un autre système"
      ],
      commands: [
        { description: "Supprimer archives", command: 'del /F /Q "{archive_path}"' },
        { description: "Révoquer accès share", command: "net use \\\\server\\share /delete" }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Vérification de l'Exfiltration",
      description: "Vérifier si les données ont déjà été exfiltrées",
      actions: [
        "Analyser les connexions réseau sortantes",
        "Rechercher les uploads vers le cloud",
        "Vérifier les transferts de fichiers volumineux",
        "Analyser les connexions C2 potentielles",
        "Évaluer si les données ont quitté le réseau"
      ],
      checklist: [
        { id: "co-4-1", text: "Connexions sortantes analysées", required: true },
        { id: "co-4-2", text: "Cloud uploads vérifiés", required: true },
        { id: "co-4-3", text: "Transferts volumineux identifiés", required: true },
        { id: "co-4-4", text: "Exfiltration évaluée (oui/non)", required: true }
      ],
      tips: [
        "Vérifier les connexions vers file sharing (Dropbox, Google Drive, Mega)",
        "Les données peuvent être exfiltrées via DNS ou HTTP",
        "Corréler avec le SOP Exfiltration si confirmé"
      ],
      commands: [
        { description: "Connexions sortantes", command: 'source.ip:"{host_ip}" AND destination.bytes:>10000000 | stats sum(destination.bytes) by destination.ip' },
        { description: "Cloud uploads", command: 'url.domain:("dropbox.com" OR "drive.google.com" OR "mega.nz" OR "uploadfiles*") AND source.ip:"{host_ip}"' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 5,
      title: "Notification et Impact",
      description: "Évaluer l'impact et notifier les parties prenantes",
      actions: [
        "Classifier précisément les données compromises",
        "Identifier les obligations réglementaires (GDPR, etc.)",
        "Alerter les propriétaires des données",
        "Préparer la notification au DPO si nécessaire",
        "Documenter pour le rapport d'incident"
      ],
      checklist: [
        { id: "co-5-1", text: "Données classifiées", required: true },
        { id: "co-5-2", text: "Obligations réglementaires évaluées", required: true },
        { id: "co-5-3", text: "Propriétaires alertés", required: true },
        { id: "co-5-4", text: "DPO notifié si applicable", required: false }
      ],
      tips: [
        "GDPR: notification 72h en cas de données personnelles",
        "Documenter précisément pour d'éventuelles poursuites",
        "Les données clients sont généralement prioritaires"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L3 + Legal/DPO"
    },
    {
      id: 6,
      title: "Remédiation et Documentation",
      description: "Remédier et documenter l'incident",
      actions: [
        "Supprimer tous les artefacts de collecte",
        "Renforcer les contrôles d'accès aux données sensibles",
        "Implémenter/améliorer le DLP",
        "Créer des alertes de détection",
        "Compléter le rapport d'incident"
      ],
      checklist: [
        { id: "co-6-1", text: "Artefacts supprimés", required: true },
        { id: "co-6-2", text: "Contrôles renforcés", required: true },
        { id: "co-6-3", text: "Alertes créées", required: true },
        { id: "co-6-4", text: "Rapport complet", required: true }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    }
  ],
  kpis: [
    { name: "MTTD Collection", target: "< 30 min", description: "Temps de détection de la collecte" },
    { name: "Prevention Rate", target: "> 90%", description: "Collecte détectée avant exfiltration" },
    { name: "Data Classification", target: "< 1h", description: "Temps pour classifier les données" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Collecte de données confirmée", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Données sensibles / Volume important", contact: "SOC L3 / DLP Team", sla: "20 min" },
    { level: "L3 → CISO", criteria: "Données client / Réglementaire", contact: "CISO + Legal + DPO", sla: "30 min" }
  ]
};

// ============================================
// SOP MITRE-12: EXFILTRATION
// Techniques: T1041, T1048, T1567, T1537
// Tactic: Exfiltration (TA0010)
// ============================================
export const sopMitreExfiltration: SOPTemplate = {
  id: "mitre-exfiltration",
  slug: "mitre-exfiltration-response",
  title: "Réponse à l'Exfiltration de Données (T1041)",
  category: "MITRE - Exfiltration",
  description: "Procédure de détection et réponse à l'exfiltration de données incluant C2 Channel (T1041), Alternative Protocol (T1048), Web Service (T1567) et Transfer to Cloud (T1537).",
  version: "1.0",
  alertTypes: ["Data Exfiltration", "Large Upload", "Cloud Storage Upload", "DNS Exfiltration", "Encrypted Channel"],
  objectives: [
    "Détecter l'exfiltration de données en cours ou passée",
    "Stopper immédiatement l'exfiltration",
    "Quantifier les données exfiltrées",
    "Identifier les destinations de l'exfiltration",
    "Notifier les parties prenantes selon les obligations"
  ],
  scope: "Tout transfert non autorisé de données hors du réseau de l'organisation",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes d'exfiltration",
        "Escalade IMMÉDIATE",
        "Isolation préliminaire"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des canaux d'exfiltration",
        "Quantification des données",
        "Blocage complet"
      ]
    },
    {
      role: "Analyste SOC L3 / IR",
      responsibilities: [
        "Forensics complet",
        "Classification des données",
        "Coordination avec Legal/DPO"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "DÉTECTION ET BLOCAGE IMMÉDIAT",
      description: "Détecter et stopper immédiatement l'exfiltration",
      actions: [
        "ALERTER immédiatement L2/L3 et CISO",
        "BLOQUER les connexions sortantes suspectes",
        "ISOLER le système source",
        "Identifier le canal d'exfiltration",
        "Préserver les preuves"
      ],
      checklist: [
        { id: "ex-1-1", text: "Escalade CISO effectuée", required: true },
        { id: "ex-1-2", text: "Connexions bloquées", required: true },
        { id: "ex-1-3", text: "Système isolé", required: true },
        { id: "ex-1-4", text: "Canal identifié", required: true }
      ],
      tips: [
        "PRIORITÉ ABSOLUE: chaque minute = plus de données exfiltrées",
        "L'exfiltration peut utiliser plusieurs canaux simultanés",
        "Ne pas éteindre le système (préserver la RAM)"
      ],
      commands: [
        { description: "Large outbound transfers", command: 'NOT destination.ip:(10.* OR 192.168.* OR 172.16.*) AND destination.bytes:>100000000 | stats sum(destination.bytes) by source.ip, destination.ip' },
        { description: "DNS exfiltration", command: 'dns.question.name:* AND dns.question.name:/.{50,}/ | stats count by dns.question.name' },
        { description: "Cloud uploads", command: 'url.domain:("dropbox.com" OR "drive.google.com" OR "mega.nz" OR "we.tl" OR "1fichier.com") AND http.request.method:"POST" | stats sum(http.request.bytes) by source.ip' }
      ],
      timeEstimate: "< 10 min",
      responsible: "Analyste L1/L2"
    },
    {
      id: 2,
      title: "Identification du Canal d'Exfiltration",
      description: "Comprendre comment les données sortent",
      actions: [
        "Analyser le protocole utilisé (HTTP, DNS, HTTPS, FTP)",
        "Identifier les destinations (IPs, domaines)",
        "Déterminer si chiffrement utilisé",
        "Rechercher les processus responsables",
        "Documenter la méthode technique"
      ],
      checklist: [
        { id: "ex-2-1", text: "Protocole identifié", required: true },
        { id: "ex-2-2", text: "Destinations documentées", required: true },
        { id: "ex-2-3", text: "Chiffrement analysé", required: true },
        { id: "ex-2-4", text: "Processus identifié", required: true },
        { id: "ex-2-5", text: "Technique MITRE mappée", required: true }
      ],
      tips: [
        "T1041: Exfil via C2 (même canal que les commandes)",
        "T1048: DNS, ICMP, ou ports non-standard",
        "T1567: Services web légitimes (hard to block)",
        "T1537: Cloud storage accounts"
      ],
      commands: [
        { description: "Connexions du processus suspect", command: 'event.code:3 AND process.pid:{pid} | table destination.ip, destination.port, destination.bytes' },
        { description: "HTTP POST volumes", command: 'http.request.method:"POST" AND source.ip:"{host_ip}" | stats sum(http.request.bytes) by url.domain' }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Quantification des Données Exfiltrées",
      description: "Estimer précisément le volume et type de données",
      actions: [
        "Calculer le volume total transféré",
        "Identifier les fichiers/données source",
        "Estimer la période d'exfiltration (début à fin)",
        "Classifier les données exfiltrées",
        "Documenter les preuves de l'exfiltration"
      ],
      checklist: [
        { id: "ex-3-1", text: "Volume total calculé", required: true },
        { id: "ex-3-2", text: "Fichiers source identifiés", required: true },
        { id: "ex-3-3", text: "Période établie", required: true },
        { id: "ex-3-4", text: "Classification effectuée", required: true },
        { id: "ex-3-5", text: "Preuves préservées", required: true }
      ],
      tips: [
        "Corréler avec le SOP Collection pour les fichiers accédés",
        "Le volume réseau peut être supérieur aux fichiers (overhead)",
        "L'exfiltration peut avoir commencé bien avant la détection"
      ],
      commands: [
        { description: "Volume par destination", command: 'source.ip:"{host_ip}" AND @timestamp >= "{start}" | stats sum(destination.bytes) by destination.ip, destination.port' },
        { description: "Timeline d'exfiltration", command: 'source.ip:"{host_ip}" AND destination.ip:"{exfil_ip}" | bucket span=1h | stats sum(destination.bytes) by _time' }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 4,
      title: "Investigation de la Source",
      description: "Comprendre comment l'attaquant a collecté les données",
      actions: [
        "Tracer la chaîne d'attaque complète",
        "Identifier l'accès initial",
        "Analyser les techniques de collection utilisées",
        "Identifier tous les systèmes compromis",
        "Documenter la timeline complète"
      ],
      checklist: [
        { id: "ex-4-1", text: "Chaîne d'attaque établie", required: true },
        { id: "ex-4-2", text: "Accès initial identifié", required: true },
        { id: "ex-4-3", text: "Techniques de collection analysées", required: true },
        { id: "ex-4-4", text: "Tous les systèmes impactés identifiés", required: true }
      ],
      tips: [
        "L'exfiltration est souvent la dernière étape",
        "D'autres systèmes peuvent avoir été utilisés pour staging",
        "Vérifier si l'attaquant a toujours accès"
      ],
      timeEstimate: "45-90 min",
      responsible: "Analyste L3"
    },
    {
      id: 5,
      title: "Blocage et Éradication",
      description: "Bloquer complètement et éradiquer l'accès",
      actions: [
        "Bloquer toutes les destinations d'exfiltration identifiées",
        "Éradiquer l'accès de l'attaquant",
        "Supprimer les outils et malware",
        "Réinitialiser les comptes compromis",
        "Vérifier que l'exfiltration est stoppée"
      ],
      checklist: [
        { id: "ex-5-1", text: "Destinations bloquées", required: true },
        { id: "ex-5-2", text: "Accès éradiqué", required: true },
        { id: "ex-5-3", text: "Outils supprimés", required: true },
        { id: "ex-5-4", text: "Comptes réinitialisés", required: true },
        { id: "ex-5-5", text: "Arrêt confirmé par monitoring", required: true }
      ],
      tips: [
        "Bloquer les IPs ET les domaines (DGA possible)",
        "L'attaquant peut avoir des canaux backup",
        "Monitoring renforcé minimum 72h"
      ],
      commands: [
        { description: "Bloquer IP firewall", command: "netsh advfirewall firewall add rule name='Block Exfil' dir=out action=block remoteip={ip}" },
        { description: "Vérifier arrêt", command: 'destination.ip:"{exfil_ip}" AND @timestamp >= "now-1h" | stats count' }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 6,
      title: "Notification et Conformité",
      description: "Gérer les obligations de notification",
      actions: [
        "Préparer le rapport d'impact détaillé",
        "Notifier le DPO avec les données classifiées",
        "Évaluer les obligations GDPR/réglementaires",
        "Coordonner avec Legal pour la notification",
        "Préparer la communication si nécessaire"
      ],
      checklist: [
        { id: "ex-6-1", text: "Rapport d'impact préparé", required: true },
        { id: "ex-6-2", text: "DPO notifié", required: true },
        { id: "ex-6-3", text: "Obligations évaluées", required: true },
        { id: "ex-6-4", text: "Legal consulté", required: true }
      ],
      tips: [
        "GDPR Article 33: notification CNIL dans 72h",
        "GDPR Article 34: notification aux personnes si risque élevé",
        "Conserver toutes les preuves pour d'éventuelles poursuites"
      ],
      timeEstimate: "Variable",
      responsible: "CISO + Legal + DPO"
    },
    {
      id: 7,
      title: "Documentation et Post-Mortem",
      description: "Documentation complète et lessons learned",
      actions: [
        "Compléter le rapport d'incident détaillé",
        "Mapper toutes les TTPs sur MITRE ATT&CK",
        "Conduire le post-mortem",
        "Identifier les améliorations nécessaires",
        "Mettre à jour les playbooks"
      ],
      checklist: [
        { id: "ex-7-1", text: "Rapport complet avec preuves", required: true },
        { id: "ex-7-2", text: "TTPs documentés", required: true },
        { id: "ex-7-3", text: "Post-mortem conduit", required: true },
        { id: "ex-7-4", text: "Plan d'amélioration défini", required: true }
      ],
      timeEstimate: "2-5 jours",
      responsible: "CISO + SOC L3"
    }
  ],
  kpis: [
    { name: "MTTD Exfiltration", target: "< 30 min", description: "Temps de détection de l'exfiltration" },
    { name: "MTTI (Stop)", target: "< 15 min", description: "Temps pour stopper l'exfiltration" },
    { name: "Quantification", target: "< 4h", description: "Temps pour quantifier précisément" },
    { name: "Notification", target: "< 72h", description: "Notification CNIL si applicable" }
  ],
  escalationMatrix: [
    { level: "L1 → ALL", criteria: "Exfiltration détectée", contact: "L2 + L3 + CISO immédiatement", sla: "< 5 min" },
    { level: "CISO → Direction", criteria: "Données sensibles confirmées", contact: "DG + Legal + DPO", sla: "30 min" },
    { level: "Direction → Autorités", criteria: "Données personnelles", contact: "CNIL / ANSSI", sla: "< 72h" }
  ]
};

// ============================================
// EXPORT ALL EXTENDED MITRE SOPs
// ============================================
export const allExtendedMitreSOPs: SOPTemplate[] = [
  sopMitreExecution,
  sopMitrePersistence,
  sopMitrePrivilegeEscalation,
  sopMitreDefenseEvasion,
  sopMitreDiscovery,
  sopMitreCollection,
  sopMitreExfiltration
];
