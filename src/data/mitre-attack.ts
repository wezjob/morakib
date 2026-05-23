/**
 * MITRE ATT&CK Framework Data
 * Source: https://attack.mitre.org/
 * Version: Enterprise ATT&CK v14
 */

// ============================================
// TACTICS (14 Enterprise Tactics)
// ============================================
export interface MitreTactic {
  id: string;
  name: string;
  shortName: string;
  description: string;
  order: number;
  color: string;
}

export const MITRE_TACTICS: MitreTactic[] = [
  {
    id: "TA0043",
    name: "Reconnaissance",
    shortName: "Recon",
    description: "L'adversaire tente de recueillir des informations utilisables pour planifier des opérations futures.",
    order: 1,
    color: "#6B7280"
  },
  {
    id: "TA0042",
    name: "Resource Development",
    shortName: "ResoDev",
    description: "L'adversaire tente d'établir des ressources à utiliser pour les opérations.",
    order: 2,
    color: "#8B5CF6"
  },
  {
    id: "TA0001",
    name: "Initial Access",
    shortName: "InitAccess",
    description: "L'adversaire tente d'entrer dans votre réseau.",
    order: 3,
    color: "#EF4444"
  },
  {
    id: "TA0002",
    name: "Execution",
    shortName: "Execution",
    description: "L'adversaire tente d'exécuter du code malveillant.",
    order: 4,
    color: "#F97316"
  },
  {
    id: "TA0003",
    name: "Persistence",
    shortName: "Persist",
    description: "L'adversaire tente de maintenir son accès.",
    order: 5,
    color: "#F59E0B"
  },
  {
    id: "TA0004",
    name: "Privilege Escalation",
    shortName: "PrivEsc",
    description: "L'adversaire tente d'obtenir des permissions de niveau supérieur.",
    order: 6,
    color: "#EAB308"
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    shortName: "DefEvade",
    description: "L'adversaire tente d'éviter d'être détecté.",
    order: 7,
    color: "#84CC16"
  },
  {
    id: "TA0006",
    name: "Credential Access",
    shortName: "CredAccess",
    description: "L'adversaire tente de voler des noms de compte et des mots de passe.",
    order: 8,
    color: "#22C55E"
  },
  {
    id: "TA0007",
    name: "Discovery",
    shortName: "Discovery",
    description: "L'adversaire tente de comprendre votre environnement.",
    order: 9,
    color: "#14B8A6"
  },
  {
    id: "TA0008",
    name: "Lateral Movement",
    shortName: "LatMove",
    description: "L'adversaire tente de se déplacer dans votre environnement.",
    order: 10,
    color: "#06B6D4"
  },
  {
    id: "TA0009",
    name: "Collection",
    shortName: "Collect",
    description: "L'adversaire tente de collecter des données d'intérêt.",
    order: 11,
    color: "#3B82F6"
  },
  {
    id: "TA0011",
    name: "Command and Control",
    shortName: "C2",
    description: "L'adversaire tente de communiquer avec les systèmes compromis.",
    order: 12,
    color: "#6366F1"
  },
  {
    id: "TA0010",
    name: "Exfiltration",
    shortName: "Exfil",
    description: "L'adversaire tente de voler des données.",
    order: 13,
    color: "#A855F7"
  },
  {
    id: "TA0040",
    name: "Impact",
    shortName: "Impact",
    description: "L'adversaire tente de manipuler, interrompre ou détruire vos systèmes et données.",
    order: 14,
    color: "#EC4899"
  }
];

// ============================================
// TECHNIQUES (Selected key techniques)
// ============================================
export interface MitreTechnique {
  id: string;
  name: string;
  tacticIds: string[];
  description: string;
  detection: string[];
  mitigation: string[];
  dataSources: string[];
  elkQueries?: string[];
  procedures?: string[];
  platforms: string[];
}

export const MITRE_TECHNIQUES: MitreTechnique[] = [
  // ===== INITIAL ACCESS =====
  {
    id: "T1566",
    name: "Phishing",
    tacticIds: ["TA0001"],
    description: "Envoi de messages de phishing pour obtenir l'accès aux systèmes des victimes.",
    detection: [
      "Surveiller les pièces jointes email suspectes",
      "Analyser les liens URL dans les emails",
      "Vérifier les expéditeurs usurpés (SPF/DKIM/DMARC)"
    ],
    mitigation: [
      "Formation sensibilisation utilisateurs",
      "Filtrage des emails",
      "Sandbox pour pièces jointes",
      "URL rewriting"
    ],
    dataSources: ["Email Gateway", "Web Proxy", "Endpoint Detection"],
    elkQueries: [
      'event.category:"email" AND (attachment.extension:("exe" OR "js" OR "vbs" OR "ps1") OR email.subject:*urgent* OR email.subject:*password*)',
      'url.domain:* AND NOT url.registered_domain:(microsoft.com OR google.com) AND email.direction:"inbound"'
    ],
    procedures: [
      "1. Identifier l'email suspect dans le gateway",
      "2. Extraire les IOCs (URLs, attachments, sender)",
      "3. Vérifier réputation des IOCs sur VT/MISP",
      "4. Rechercher d'autres destinataires",
      "5. Mettre en quarantaine les emails similaires",
      "6. Notifier les utilisateurs impactés"
    ],
    platforms: ["Windows", "macOS", "Linux"]
  },
  {
    id: "T1566.001",
    name: "Spearphishing Attachment",
    tacticIds: ["TA0001"],
    description: "Envoi d'emails ciblés avec pièces jointes malveillantes.",
    detection: [
      "Analyser les pièces jointes avec sandbox",
      "Détecter les documents avec macros",
      "Surveiller les extensions doubles (.pdf.exe)"
    ],
    mitigation: [
      "Désactiver les macros par défaut",
      "Bloquer les types de fichiers dangereux",
      "Utiliser Protected View pour Office"
    ],
    dataSources: ["Email Gateway", "Endpoint Detection", "Process Monitoring"],
    elkQueries: [
      'process.parent.name:"outlook.exe" AND process.name:("powershell.exe" OR "cmd.exe" OR "wscript.exe")',
      'event.provider:"Microsoft-Windows-Sysmon" AND event.action:"FileCreate" AND file.extension:("exe" OR "dll" OR "scr") AND process.name:("winword.exe" OR "excel.exe")'
    ],
    procedures: [
      "1. Isoler le poste ayant ouvert la pièce jointe",
      "2. Collecter l'email original et la pièce jointe",
      "3. Analyser en sandbox (Any.Run, Joe Sandbox)",
      "4. Extraire les IOCs du malware",
      "5. Rechercher les connexions C2",
      "6. Scanner tous les endpoints avec les IOCs"
    ],
    platforms: ["Windows", "macOS", "Linux"]
  },
  {
    id: "T1190",
    name: "Exploit Public-Facing Application",
    tacticIds: ["TA0001"],
    description: "Exploitation de vulnérabilités dans des applications exposées sur Internet.",
    detection: [
      "Surveiller les erreurs applicatives",
      "Détecter les payloads d'exploitation dans les logs",
      "WAF anomaly detection"
    ],
    mitigation: [
      "Patch management rapide",
      "WAF avec règles à jour",
      "Segmentation réseau"
    ],
    dataSources: ["Web Application Firewall", "Application Logs", "Network Traffic"],
    elkQueries: [
      'http.response.status_code:500 AND url.query:*SELECT* OR url.query:*UNION*',
      'url.path:*../* OR url.query:*%00* OR url.query:*%0a*',
      'http.request.body.content:*<script>* OR http.request.body.content:*eval(*'
    ],
    procedures: [
      "1. Identifier l'exploitation dans les logs WAF/App",
      "2. Corréler avec les connexions réseau",
      "3. Vérifier si l'exploitation a réussi",
      "4. Isoler le serveur si compromis",
      "5. Appliquer le patch de sécurité",
      "6. Forensic du serveur"
    ],
    platforms: ["Linux", "Windows", "Containers"]
  },
  {
    id: "T1133",
    name: "External Remote Services",
    tacticIds: ["TA0001", "TA0003"],
    description: "Utilisation de services distants légitimes (VPN, RDP, SSH) pour l'accès initial ou la persistance.",
    detection: [
      "Connexions depuis des localisations inhabituelles",
      "Connexions en dehors des heures de travail",
      "Échecs d'authentification multiples"
    ],
    mitigation: [
      "MFA obligatoire",
      "Limiter les plages IP autorisées",
      "Monitoring des connexions VPN/RDP"
    ],
    dataSources: ["VPN Logs", "Authentication Logs", "Network Traffic"],
    elkQueries: [
      'event.action:"vpn_connection" AND source.geo.country_iso_code:NOT("FR" OR "MA")',
      'winlog.event_id:4624 AND winlog.event_data.LogonType:10 AND NOT source.ip:(10.* OR 192.168.*)',
      'event.action:"ssh_login" AND event.outcome:"failure" | stats count by source.ip | where count > 10'
    ],
    procedures: [
      "1. Identifier les connexions suspectes",
      "2. Vérifier le compte utilisateur concerné",
      "3. Contacter l'utilisateur pour validation",
      "4. Si non légitime: révoquer les sessions",
      "5. Reset du mot de passe + MFA",
      "6. Analyser les actions post-connexion"
    ],
    platforms: ["Windows", "Linux", "macOS", "Network"]
  },
  {
    id: "T1078",
    name: "Valid Accounts",
    tacticIds: ["TA0001", "TA0003", "TA0004", "TA0005"],
    description: "Utilisation de comptes légitimes compromis pour l'accès, la persistance ou l'évasion.",
    detection: [
      "Connexions depuis des localisations anormales",
      "Utilisation de comptes dormants",
      "Comportement utilisateur anormal"
    ],
    mitigation: [
      "MFA sur tous les comptes",
      "Rotation des mots de passe",
      "Monitoring UEBA"
    ],
    dataSources: ["Authentication Logs", "Active Directory", "Cloud Audit Logs"],
    elkQueries: [
      'winlog.event_id:4624 AND user.name:admin* AND source.ip:NOT(10.0.0.0/8)',
      'event.action:"successful_login" AND user.risk_score:>70',
      'azure.auditlogs.operation_name:"Sign-in activity" AND azure.auditlogs.properties.is_risky_sign_in:true'
    ],
    procedures: [
      "1. Identifier le compte compromis",
      "2. Analyser l'historique des connexions",
      "3. Identifier les actions effectuées",
      "4. Révoquer toutes les sessions",
      "5. Reset du mot de passe",
      "6. Vérifier les modifications (groupes, permissions)"
    ],
    platforms: ["Windows", "Linux", "macOS", "Cloud", "SaaS"]
  },

  // ===== EXECUTION =====
  {
    id: "T1059",
    name: "Command and Scripting Interpreter",
    tacticIds: ["TA0002"],
    description: "Utilisation d'interpréteurs de commandes et de scripts pour exécuter des commandes.",
    detection: [
      "Surveiller les processus PowerShell/cmd",
      "Détecter les scripts encodés",
      "Analyser les arguments de ligne de commande"
    ],
    mitigation: [
      "Application Whitelisting",
      "Constrained Language Mode PowerShell",
      "Script Block Logging"
    ],
    dataSources: ["Process Monitoring", "Command Line", "Script Logs"],
    elkQueries: [
      'process.name:"powershell.exe" AND process.args:(*-enc* OR *-encoded* OR *downloadstring* OR *iex*)',
      'process.name:"cmd.exe" AND process.args:(*certutil* OR *bitsadmin* OR *reg add*)',
      'process.name:"wscript.exe" OR process.name:"cscript.exe" AND process.parent.name:NOT("explorer.exe")'
    ],
    procedures: [
      "1. Identifier le processus suspect",
      "2. Décoder les commandes encodées (base64)",
      "3. Analyser la chaîne de processus parent",
      "4. Identifier les connexions réseau associées",
      "5. Collecter les artefacts (scripts, fichiers créés)",
      "6. Rechercher sur d'autres endpoints"
    ],
    platforms: ["Windows", "macOS", "Linux"]
  },
  {
    id: "T1059.001",
    name: "PowerShell",
    tacticIds: ["TA0002"],
    description: "Exécution de commandes et scripts via PowerShell.",
    detection: [
      "Script Block Logging activé",
      "Détection des commandes obfusquées",
      "Download cradles (IEX, DownloadString)"
    ],
    mitigation: [
      "Constrained Language Mode",
      "Désactiver PowerShell v2",
      "Bloquer PowerShell ISE"
    ],
    dataSources: ["PowerShell Logs", "Process Monitoring", "Module Logging"],
    elkQueries: [
      'winlog.event_id:4104 AND powershell.file.script_block_text:(*invoke-expression* OR *downloadstring* OR *Net.WebClient*)',
      'process.name:"powershell.exe" AND process.args:*bypass* AND process.args:*hidden*',
      'winlog.event_id:4103 AND powershell.command.value:*mimikatz*'
    ],
    procedures: [
      "1. Extraire le Script Block (Event ID 4104)",
      "2. Décoder/deobfusquer le script",
      "3. Identifier l'objectif du script",
      "4. Rechercher les artefacts créés",
      "5. Corréler avec les connexions réseau",
      "6. Identifier la source (email, web, RCE)"
    ],
    platforms: ["Windows"]
  },

  // ===== PERSISTENCE =====
  {
    id: "T1053",
    name: "Scheduled Task/Job",
    tacticIds: ["TA0002", "TA0003", "TA0004"],
    description: "Création de tâches planifiées pour exécuter du code à intervalles réguliers.",
    detection: [
      "Surveiller la création de tâches planifiées",
      "Analyser les binaires exécutés par les tâches",
      "Détecter les tâches avec des noms suspects"
    ],
    mitigation: [
      "Audit des tâches planifiées",
      "Restreindre le droit de créer des tâches",
      "Surveiller les modifications"
    ],
    dataSources: ["Windows Event Logs", "Process Monitoring", "Task Scheduler"],
    elkQueries: [
      'winlog.event_id:4698 OR winlog.event_id:106',
      'process.name:"schtasks.exe" AND process.args:*/create*',
      'event.provider:"Microsoft-Windows-TaskScheduler" AND event.action:("TaskCreated" OR "TaskModified")'
    ],
    procedures: [
      "1. Identifier la tâche planifiée créée",
      "2. Analyser l'action exécutée (binaire, script)",
      "3. Vérifier la légitimité de la tâche",
      "4. Identifier le créateur de la tâche",
      "5. Supprimer si malveillante",
      "6. Scanner l'exécutable associé"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },
  {
    id: "T1547.001",
    name: "Registry Run Keys / Startup Folder",
    tacticIds: ["TA0003", "TA0004"],
    description: "Ajout de clés de registre ou fichiers dans les dossiers de démarrage pour la persistance.",
    detection: [
      "Surveiller les modifications des clés Run",
      "Analyser les fichiers dans Startup",
      "Détecter les binaires non signés au démarrage"
    ],
    mitigation: [
      "Audit des clés de registre",
      "Application Whitelisting",
      "Surveiller les modifications"
    ],
    dataSources: ["Registry", "File Monitoring", "Process Monitoring"],
    elkQueries: [
      'winlog.event_id:13 AND registry.path:*\\\\Run\\\\*',
      'event.action:"SetValue" AND registry.key:*CurrentVersion\\\\Run*',
      'file.path:*\\\\Start Menu\\\\Programs\\\\Startup\\\\* AND event.action:"FileCreate"'
    ],
    procedures: [
      "1. Identifier la clé de registre modifiée",
      "2. Analyser l'exécutable pointé",
      "3. Vérifier la signature du binaire",
      "4. Scanner le fichier (VT, sandbox)",
      "5. Supprimer la persistence",
      "6. Nettoyer le système"
    ],
    platforms: ["Windows"]
  },

  // ===== PRIVILEGE ESCALATION =====
  {
    id: "T1055",
    name: "Process Injection",
    tacticIds: ["TA0004", "TA0005"],
    description: "Injection de code dans d'autres processus pour l'exécution ou l'évasion.",
    detection: [
      "Surveiller les appels API d'injection",
      "Détecter les allocations mémoire suspectes",
      "Analyser les relations processus parent/enfant"
    ],
    mitigation: [
      "Application Whitelisting",
      "Credential Guard",
      "Protected Process Light"
    ],
    dataSources: ["Process Monitoring", "API Monitoring", "Memory Analysis"],
    elkQueries: [
      'winlog.event_id:8 AND process.name:NOT(process.target.name)',
      'event.action:"CreateRemoteThread" AND process.executable:NOT(*system32*)',
      'winlog.event_id:10 AND process.Sysmon.CallTrace:*ntdll*'
    ],
    procedures: [
      "1. Identifier le processus injecteur",
      "2. Identifier le processus cible",
      "3. Collecter les dumps mémoire",
      "4. Analyser le code injecté",
      "5. Identifier les actions post-injection",
      "6. Tuer les processus malveillants"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },

  // ===== DEFENSE EVASION =====
  {
    id: "T1070",
    name: "Indicator Removal",
    tacticIds: ["TA0005"],
    description: "Suppression des indicateurs de compromission pour éviter la détection.",
    detection: [
      "Surveiller la suppression des logs",
      "Détecter le clearing des event logs",
      "Analyser les gaps dans les logs"
    ],
    mitigation: [
      "Centralisation des logs (SIEM)",
      "Logs immuables",
      "Alertes sur effacement"
    ],
    dataSources: ["Windows Event Logs", "File Monitoring", "Process Monitoring"],
    elkQueries: [
      'winlog.event_id:1102 OR winlog.event_id:104',
      'process.name:"wevtutil.exe" AND process.args:*cl*',
      'process.name:"powershell.exe" AND process.args:*Clear-EventLog*'
    ],
    procedures: [
      "1. Identifier l'action d'effacement",
      "2. Rechercher les logs avant effacement (backup)",
      "3. Identifier qui a effectué l'effacement",
      "4. Analyser le contexte (compromission probable)",
      "5. Restaurer les logs si possible",
      "6. Renforcer la protection des logs"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },
  {
    id: "T1562.001",
    name: "Disable or Modify Tools",
    tacticIds: ["TA0005"],
    description: "Désactivation ou modification des outils de sécurité.",
    detection: [
      "Surveiller l'état des agents de sécurité",
      "Détecter les modifications de services",
      "Alerter sur les désactivations"
    ],
    mitigation: [
      "Protection anti-tampering",
      "Monitoring de l'état des agents",
      "Alertes centralisées"
    ],
    dataSources: ["Process Monitoring", "Service Monitoring", "Windows Registry"],
    elkQueries: [
      'process.args:(*stop* AND *defender*) OR process.args:(*disable* AND *antivirus*)',
      'winlog.event_id:7036 AND service.name:(*defender* OR *security*) AND service.state:"stopped"',
      'registry.path:*DisableAntiSpyware* OR registry.path:*DisableRealtimeMonitoring*'
    ],
    procedures: [
      "1. Identifier la désactivation de sécurité",
      "2. Restaurer immédiatement l'outil",
      "3. Identifier l'acteur (process, user)",
      "4. Rechercher les actions entre désactivation et restauration",
      "5. Scanner le système compromis",
      "6. Renforcer la protection anti-tampering"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },

  // ===== CREDENTIAL ACCESS =====
  {
    id: "T1003",
    name: "OS Credential Dumping",
    tacticIds: ["TA0006"],
    description: "Extraction des credentials depuis le système d'exploitation.",
    detection: [
      "Accès au processus LSASS",
      "Utilisation de tools connus (Mimikatz)",
      "Lecture du fichier SAM"
    ],
    mitigation: [
      "Credential Guard",
      "Protected Users group",
      "LSASS protection"
    ],
    dataSources: ["Process Monitoring", "API Monitoring", "Memory"],
    elkQueries: [
      'process.name:"mimikatz.exe" OR process.args:*sekurlsa* OR process.args:*logonpasswords*',
      'winlog.event_id:10 AND process.Sysmon.TargetImage:*lsass.exe* AND process.Sysmon.GrantedAccess:(0x1010 OR 0x1410)',
      'process.name:"procdump.exe" AND process.args:*lsass*'
    ],
    procedures: [
      "1. Identifier l'outil de dump utilisé",
      "2. Bloquer/tuer le processus",
      "3. Identifier les comptes potentiellement compromis",
      "4. Reset des mots de passe concernés",
      "5. Vérifier les connexions avec les credentials",
      "6. Déployer les mitigations (Credential Guard)"
    ],
    platforms: ["Windows"]
  },
  {
    id: "T1110",
    name: "Brute Force",
    tacticIds: ["TA0006"],
    description: "Tentatives répétées de deviner les credentials.",
    detection: [
      "Multiple échecs de connexion",
      "Spraying sur plusieurs comptes",
      "Source IP inhabituelle"
    ],
    mitigation: [
      "Lockout policy",
      "MFA",
      "Rate limiting"
    ],
    dataSources: ["Authentication Logs", "Active Directory", "Application Logs"],
    elkQueries: [
      'winlog.event_id:4625 | stats count by source.ip, user.name | where count > 10',
      'event.action:"authentication_failure" AND event.outcome:"failure" | stats count by source.ip | where count > 50',
      'azure.signinlogs.result_type:50126 | stats dc(user.name) by source.ip | where dc > 5'
    ],
    procedures: [
      "1. Identifier l'IP source des tentatives",
      "2. Compter les tentatives et comptes ciblés",
      "3. Vérifier si des connexions ont réussi",
      "4. Bloquer l'IP source",
      "5. Reset des comptes ciblés si nécessaire",
      "6. Vérifier la réputation de l'IP"
    ],
    platforms: ["Windows", "Linux", "macOS", "Cloud"]
  },

  // ===== LATERAL MOVEMENT =====
  {
    id: "T1021",
    name: "Remote Services",
    tacticIds: ["TA0008"],
    description: "Utilisation de services distants (RDP, SSH, SMB) pour le mouvement latéral.",
    detection: [
      "Connexions RDP internes inhabituelles",
      "Utilisation de comptes de service",
      "Accès à de nouveaux systèmes"
    ],
    mitigation: [
      "Segmentation réseau",
      "JEA/PAM",
      "Monitoring des connexions internes"
    ],
    dataSources: ["Authentication Logs", "Network Traffic", "Process Monitoring"],
    elkQueries: [
      'winlog.event_id:4624 AND winlog.event_data.LogonType:10 AND source.ip:(10.* OR 192.168.*)',
      'network.protocol:"smb" AND destination.port:445 AND NOT destination.ip:(*domain_controller*)',
      'process.name:"psexec.exe" OR process.args:*\\\\\\\\*\\\\admin$*'
    ],
    procedures: [
      "1. Identifier la source du mouvement latéral",
      "2. Tracer la chaîne de compromission",
      "3. Identifier tous les systèmes accédés",
      "4. Isoler les systèmes compromis",
      "5. Reset des comptes utilisés",
      "6. Nettoyer chaque système de la chaîne"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },
  {
    id: "T1021.002",
    name: "SMB/Windows Admin Shares",
    tacticIds: ["TA0008"],
    description: "Utilisation des partages administratifs Windows (C$, ADMIN$) pour le mouvement latéral.",
    detection: [
      "Accès aux partages admin",
      "Copie de fichiers vers C$",
      "Création de services distants"
    ],
    mitigation: [
      "Désactiver les partages admin",
      "UAC remote restrictions",
      "Network segmentation"
    ],
    dataSources: ["Network Traffic", "File Monitoring", "Authentication Logs"],
    elkQueries: [
      'destination.port:445 AND file.path:*\\\\C$\\\\*',
      'winlog.event_id:5145 AND share.name:(*C$* OR *ADMIN$* OR *IPC$*)',
      'event.action:"service_installed" AND service.name:NOT(*known_service*)'
    ],
    procedures: [
      "1. Identifier les accès aux partages admin",
      "2. Corréler avec les authentifications",
      "3. Identifier les fichiers copiés",
      "4. Tracer l'origine de l'attaquant",
      "5. Isoler les systèmes impactés",
      "6. Scanner les fichiers déposés"
    ],
    platforms: ["Windows"]
  },

  // ===== COMMAND & CONTROL =====
  {
    id: "T1071",
    name: "Application Layer Protocol",
    tacticIds: ["TA0011"],
    description: "Utilisation de protocoles applicatifs standards (HTTP, HTTPS, DNS) pour le C2.",
    detection: [
      "Trafic vers domaines suspects",
      "Beaconing régulier",
      "Anomalies de volume de trafic"
    ],
    mitigation: [
      "Web filtering",
      "SSL inspection",
      "DNS filtering"
    ],
    dataSources: ["Network Traffic", "Web Proxy", "DNS Logs"],
    elkQueries: [
      'destination.domain:*.xyz OR destination.domain:*.top OR destination.domain:*.tk',
      'network.bytes_sent:>1000000 AND destination.port:443 AND NOT destination.registered_domain:(*microsoft* OR *google*)',
      'dns.question.type:"TXT" AND dns.question.name:*.* | stats count by dns.question.name | where count > 100'
    ],
    procedures: [
      "1. Identifier les connexions C2 suspectes",
      "2. Analyser le pattern de beaconing",
      "3. Identifier les endpoints sources",
      "4. Bloquer le domaine/IP C2",
      "5. Isoler les endpoints compromis",
      "6. Analyser le malware"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },
  {
    id: "T1071.004",
    name: "DNS",
    tacticIds: ["TA0011"],
    description: "Utilisation du protocole DNS pour les communications C2 ou l'exfiltration.",
    detection: [
      "Requêtes DNS longues/encodées",
      "Volume élevé de requêtes vers un domaine",
      "Requêtes TXT inhabituelles"
    ],
    mitigation: [
      "DNS filtering",
      "Bloquer les résolveurs externes",
      "Surveiller les requêtes DNS"
    ],
    dataSources: ["DNS Logs", "Network Traffic", "Endpoint DNS Cache"],
    elkQueries: [
      'dns.question.name.length:>50',
      'dns.question.type:"TXT" AND NOT dns.question.name:(*_dmarc* OR *_spf*)',
      'dns.question.name:* | eval entropy=calculate_entropy(dns.question.subdomain) | where entropy > 3.5'
    ],
    procedures: [
      "1. Identifier le domaine suspect",
      "2. Analyser le contenu des requêtes",
      "3. Décoder les données (base64, hex)",
      "4. Identifier les endpoints sources",
      "5. Sinkholer le domaine",
      "6. Nettoyer les endpoints"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },

  // ===== EXFILTRATION =====
  {
    id: "T1041",
    name: "Exfiltration Over C2 Channel",
    tacticIds: ["TA0010"],
    description: "Exfiltration de données via le canal de command & control.",
    detection: [
      "Volume sortant anormal",
      "Uploads vers des destinations suspectes",
      "Transfer de fichiers sensibles"
    ],
    mitigation: [
      "DLP",
      "Network segmentation",
      "Egress filtering"
    ],
    dataSources: ["Network Traffic", "DLP Alerts", "Endpoint Monitoring"],
    elkQueries: [
      'network.direction:"outbound" AND network.bytes_sent:>10000000',
      'file.name:(*password* OR *confidential* OR *secret*) AND event.action:"FileRead" AND network.bytes_sent:>0',
      'destination.port:(443 OR 80) AND network.bytes_sent:>network.bytes_received*10'
    ],
    procedures: [
      "1. Identifier la destination de l'exfiltration",
      "2. Quantifier les données exfiltrées",
      "3. Identifier les fichiers/données concernés",
      "4. Bloquer la destination",
      "5. Isoler les endpoints sources",
      "6. Évaluer l'impact (notification RGPD?)"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  },

  // ===== IMPACT =====
  {
    id: "T1486",
    name: "Data Encrypted for Impact",
    tacticIds: ["TA0040"],
    description: "Chiffrement des données pour impacter la disponibilité (ransomware).",
    detection: [
      "Multiple fichiers modifiés rapidement",
      "Extensions de fichiers changées",
      "Création de notes de rançon"
    ],
    mitigation: [
      "Backups réguliers et testés",
      "EDR avec protection ransomware",
      "Network segmentation"
    ],
    dataSources: ["File Monitoring", "Process Monitoring", "Network Traffic"],
    elkQueries: [
      'file.extension:("encrypted" OR "locked" OR "crypt") AND event.action:"FileCreate"',
      'file.name:(*readme* OR *decrypt* OR *ransom*) AND file.extension:("txt" OR "html")',
      'process.name:* | stats dc(file.path) by process.name | where dc > 100'
    ],
    procedures: [
      "1. ISOLER IMMÉDIATEMENT les systèmes affectés",
      "2. Identifier la souche de ransomware",
      "3. Rechercher des décrypteurs connus",
      "4. Évaluer l'étendue du chiffrement",
      "5. Identifier le vecteur d'entrée",
      "6. Restaurer depuis backups si disponibles"
    ],
    platforms: ["Windows", "Linux", "macOS"]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTacticById(tacticId: string): MitreTactic | undefined {
  return MITRE_TACTICS.find(t => t.id === tacticId);
}

export function getTechniqueById(techniqueId: string): MitreTechnique | undefined {
  return MITRE_TECHNIQUES.find(t => t.id === techniqueId);
}

export function getTechniquesByTactic(tacticId: string): MitreTechnique[] {
  return MITRE_TECHNIQUES.filter(t => t.tacticIds.includes(tacticId));
}

export function getTacticsForTechnique(techniqueId: string): MitreTactic[] {
  const technique = getTechniqueById(techniqueId);
  if (!technique) return [];
  return technique.tacticIds.map(id => getTacticById(id)).filter(Boolean) as MitreTactic[];
}

export function searchTechniques(query: string): MitreTechnique[] {
  const q = query.toLowerCase();
  return MITRE_TECHNIQUES.filter(t => 
    t.id.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  );
}

// Group techniques by tactic for display
export function getTechniquesGroupedByTactic(): Map<MitreTactic, MitreTechnique[]> {
  const map = new Map<MitreTactic, MitreTechnique[]>();
  
  MITRE_TACTICS.forEach(tactic => {
    const techniques = getTechniquesByTactic(tactic.id);
    if (techniques.length > 0) {
      map.set(tactic, techniques);
    }
  });
  
  return map;
}

// MITRE ATT&CK Navigator color scheme
export function getTacticColor(tacticId: string): string {
  const tactic = getTacticById(tacticId);
  return tactic?.color || "#6B7280";
}
