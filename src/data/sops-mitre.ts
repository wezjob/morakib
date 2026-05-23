/**
 * SOPs MITRE ATT&CK - Procédures de Réponse aux Techniques d'Attaque
 * SOC Analyst Assistant - Morakib
 * Version 1.0
 * 
 * Ces SOPs sont mappés sur le framework MITRE ATT&CK Enterprise v14
 * pour une réponse structurée aux menaces.
 */

import { SOPTemplate, SOPStep, SOPChecklistItem } from "./sops";
import {
  sopMitreExecution,
  sopMitrePersistence,
  sopMitrePrivilegeEscalation,
  sopMitreDefenseEvasion,
  sopMitreDiscovery,
  sopMitreCollection,
  sopMitreExfiltration,
  allExtendedMitreSOPs
} from "./sops-mitre-extended";

// ============================================
// SOP MITRE-01: PHISHING & SPEARPHISHING
// Techniques: T1566, T1566.001, T1566.002
// Tactic: Initial Access (TA0001)
// ============================================
export const sopMitrePhishing: SOPTemplate = {
  id: "mitre-phishing",
  slug: "mitre-phishing-response",
  title: "Réponse au Phishing (T1566)",
  category: "MITRE - Initial Access",
  description: "Procédure de détection, analyse et réponse aux attaques de phishing incluant spearphishing avec pièces jointes (T1566.001) et liens (T1566.002).",
  version: "1.0",
  alertTypes: ["Phishing", "Email Malveillant", "Pièce Jointe Suspecte", "URL Malveillante"],
  objectives: [
    "Identifier et confirmer l'attaque de phishing",
    "Contenir la propagation en quarantaine",
    "Analyser les indicateurs de compromission (IOCs)",
    "Remédier aux systèmes impactés",
    "Documenter et partager les IOCs"
  ],
  scope: "Tout incident impliquant des emails malveillants ciblant les utilisateurs de l'organisation",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection initiale et triage",
        "Collecte des IOCs basiques",
        "Escalade si nécessaire"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse approfondie sandbox",
        "Recherche des victimes additionnelles",
        "Actions de containment"
      ]
    },
    {
      role: "Analyste SOC L3 / IR",
      responsibilities: [
        "Analyse malware avancée",
        "Forensics sur endpoints compromis",
        "Coordination de la réponse"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Qualification",
      description: "Identifier et qualifier l'email de phishing signalé ou détecté",
      actions: [
        "Recevoir l'alerte ou le signalement utilisateur",
        "Accéder à la console de sécurité email (O365/Proofpoint/Mimecast)",
        "Extraire les métadonnées de l'email (expéditeur, sujet, date/heure)",
        "Vérifier les en-têtes SPF, DKIM, DMARC",
        "Identifier le type de phishing (pièce jointe / lien / crédentials harvest)"
      ],
      checklist: [
        { id: "ph-1-1", text: "Email original récupéré (.eml)", required: true },
        { id: "ph-1-2", text: "Expéditeur identifié (real sender vs display name)", required: true },
        { id: "ph-1-3", text: "Vérification SPF/DKIM/DMARC effectuée", required: true },
        { id: "ph-1-4", text: "Type de payload identifié (attachment/link)", required: true },
        { id: "ph-1-5", text: "Nombre de destinataires identifié", required: true }
      ],
      tips: [
        "Vérifier le header 'Reply-To' qui diffère souvent du 'From'",
        "Attention aux domaines lookalike (ex: m1crosoft.com)",
        "Les phishing sophistiqués passent souvent SPF/DKIM"
      ],
      commands: [
        { description: "Extraire headers email (Linux)", command: "grep -E '^(From|To|Subject|Date|Received|X-)' email.eml" },
        { description: "Vérifier SPF domain", command: "dig txt _spf.domain.com" }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Extraction des IOCs",
      description: "Extraire tous les indicateurs de compromission de l'email",
      actions: [
        "Extraire les URLs contenues dans l'email",
        "Extraire les hash des pièces jointes (MD5, SHA256)",
        "Identifier les IPs sources des headers Received",
        "Relever les domaines d'expéditeur et de phishing",
        "Documenter les patterns (sujets, noms de fichiers)"
      ],
      checklist: [
        { id: "ph-2-1", text: "URLs extraites et défusées", required: true },
        { id: "ph-2-2", text: "Hash SHA256 des pièces jointes", required: true },
        { id: "ph-2-3", text: "IPs sources documentées", required: true },
        { id: "ph-2-4", text: "Domaines malveillants identifiés", required: true },
        { id: "ph-2-5", text: "IOCs formatés (STIX/CSV)", required: false }
      ],
      tips: [
        "Utiliser CyberChef pour défuser les URLs: hxxp://",
        "Ne JAMAIS cliquer directement sur les liens",
        "Utiliser urlscan.io pour preview sécurisé"
      ],
      commands: [
        { description: "Hash SHA256 fichier", command: "sha256sum malicious_attachment.exe" },
        { description: "Extraire URLs d'un fichier", command: "grep -oE 'https?://[^\"]+' email.html | sort -u" },
        { description: "Défuser URL", command: "echo 'http://malware.com' | sed 's/http/hxxp/g; s/\\./[.]/g'" }
      ],
      timeEstimate: "15-20 min",
      responsible: "Analyste L1/L2"
    },
    {
      id: 3,
      title: "Analyse de Réputation et Sandbox",
      description: "Vérifier les IOCs contre les bases de menaces et analyser en sandbox",
      actions: [
        "Soumettre les hash sur VirusTotal",
        "Vérifier les domaines/URLs sur URLhaus, PhishTank",
        "Soumettre les pièces jointes en sandbox (Any.Run, Joe Sandbox)",
        "Analyser le comportement du malware (processus, réseau, fichiers)",
        "Extraire les IOCs secondaires du rapport sandbox"
      ],
      checklist: [
        { id: "ph-3-1", text: "VirusTotal vérifié (hash + URL)", required: true },
        { id: "ph-3-2", text: "Sandbox analysis complétée", required: true, category: "Si pièce jointe" },
        { id: "ph-3-3", text: "C2 servers identifiés", required: false },
        { id: "ph-3-4", text: "Patterns de comportement documentés", required: true },
        { id: "ph-3-5", text: "Famille de malware identifiée", required: false }
      ],
      tips: [
        "Any.Run permet une analyse interactive",
        "Vérifier les connexions réseau du sandbox",
        "Les documents Office malveillants lancent souvent PowerShell"
      ],
      commands: [
        { description: "Requête VirusTotal API (hash)", command: "curl -s 'https://www.virustotal.com/api/v3/files/{hash}' -H 'x-apikey: YOUR_API_KEY'" },
        { description: "Vérifier URL sur URLhaus", command: "curl -s -d 'url=http://example.com' https://urlhaus-api.abuse.ch/v1/url/" }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Identification des Victimes",
      description: "Rechercher tous les utilisateurs ayant reçu ou interagi avec l'email",
      actions: [
        "Rechercher tous les destinataires de l'email dans le gateway",
        "Identifier qui a ouvert l'email",
        "Identifier qui a cliqué sur les liens",
        "Identifier qui a ouvert les pièces jointes",
        "Établir la liste des endpoints potentiellement compromis"
      ],
      checklist: [
        { id: "ph-4-1", text: "Liste complète des destinataires", required: true },
        { id: "ph-4-2", text: "Utilisateurs ayant ouvert l'email", required: true },
        { id: "ph-4-3", text: "Clics sur liens identifiés (proxy logs)", required: true },
        { id: "ph-4-4", text: "Ouvertures de pièces jointes (EDR)", required: true },
        { id: "ph-4-5", text: "Liste des endpoints à analyser", required: true }
      ],
      tips: [
        "Utiliser Message Trace dans O365 pour tracking",
        "Corréler avec les logs proxy pour les clics",
        "L'EDR peut montrer l'exécution de PJ"
      ],
      commands: [
        { description: "Recherche ELK emails similaires", command: 'email.subject:"*URGENT*" AND email.attachments.hash.sha256:"{hash}"' },
        { description: "Recherche proxy clicks", command: 'url.domain:"{phishing_domain}" AND event.category:"web"' }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 5,
      title: "Containment",
      description: "Contenir l'attaque pour stopper la propagation",
      actions: [
        "Mettre en quarantaine tous les emails similaires",
        "Bloquer les domaines/URLs de phishing sur le proxy",
        "Bloquer les hash de pièces jointes en EDR",
        "Ajouter les IPs C2 en blocage firewall",
        "Isoler les endpoints compromis du réseau"
      ],
      checklist: [
        { id: "ph-5-1", text: "Emails similaires en quarantaine", required: true },
        { id: "ph-5-2", text: "URLs/domaines bloqués (proxy)", required: true },
        { id: "ph-5-3", text: "Hash bloqués (EDR)", required: true },
        { id: "ph-5-4", text: "IPs bloquées (firewall)", required: false },
        { id: "ph-5-5", text: "Endpoints isolés si compromis", required: true }
      ],
      tips: [
        "Documenter chaque action de blocage avec timestamp",
        "Utiliser des IOC-based rules temporaires",
        "Communiquer avec les utilisateurs impactés"
      ],
      commands: [
        { description: "Purge emails O365 (PowerShell)", command: "Search-Mailbox -SearchQuery 'subject:\"Phishing Subject\"' -DeleteContent" },
        { description: "Isoler endpoint CrowdStrike", command: "falconctl -s 'network_containment=enable'" }
      ],
      timeEstimate: "15-30 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 6,
      title: "Investigation Endpoints Compromis",
      description: "Forensics sur les endpoints qui ont interagi avec le phishing",
      actions: [
        "Collecter les artefacts de l'EDR",
        "Rechercher les processus enfants suspects (Office → PowerShell)",
        "Identifier les connexions réseau vers les C2",
        "Vérifier la persistence (scheduled tasks, registry)",
        "Rechercher les fichiers créés/modifiés"
      ],
      checklist: [
        { id: "ph-6-1", text: "Process tree analysé", required: true },
        { id: "ph-6-2", text: "Connexions réseau vérifiées", required: true },
        { id: "ph-6-3", text: "Persistence mechanisms vérifiés", required: true },
        { id: "ph-6-4", text: "Credential access vérifié", required: true },
        { id: "ph-6-5", text: "Timeline d'infection documentée", required: true }
      ],
      tips: [
        "T1059.001: Vérifier PowerShell Script Block Logs",
        "T1547: Chercher dans HKCU/HKLM Run keys",
        "Vérifier les scheduled tasks créées"
      ],
      commands: [
        { description: "PowerShell process depuis Office (ELK)", command: 'process.parent.name:("winword.exe" OR "excel.exe") AND process.name:"powershell.exe"' },
        { description: "Connexions réseau process (Sysmon)", command: 'event.code:3 AND process.name:"powershell.exe" AND NOT destination.ip:("10.*" OR "192.168.*")' }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L3"
    },
    {
      id: 7,
      title: "Éradication et Récupération",
      description: "Supprimer les artefacts malveillants et restaurer les systèmes",
      actions: [
        "Supprimer les fichiers malveillants identifiés",
        "Supprimer les mécanismes de persistence",
        "Réinitialiser les mots de passe des comptes compromis",
        "Scanner les systèmes avec signatures mises à jour",
        "Restaurer les systèmes si nécessaire"
      ],
      checklist: [
        { id: "ph-7-1", text: "Fichiers malveillants supprimés", required: true },
        { id: "ph-7-2", text: "Persistence éradiquée", required: true },
        { id: "ph-7-3", text: "Passwords reset effectués", required: true },
        { id: "ph-7-4", text: "Scan AV/EDR post-remediation", required: true },
        { id: "ph-7-5", text: "Systèmes remis en production", required: true }
      ],
      tips: [
        "Toujours scanner avant de remettre en réseau",
        "Forcer déconnexion des sessions actives",
        "Vérifier les tokens OAuth/refresh tokens"
      ],
      commands: [
        { description: "Révoquer sessions Azure AD", command: "Revoke-AzureADUserAllRefreshToken -ObjectId user@company.com" },
        { description: "Supprimer scheduled task", command: "schtasks /Delete /TN 'MaliciousTask' /F" }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 8,
      title: "Documentation et Lessons Learned",
      description: "Documenter l'incident et partager les indicateurs",
      actions: [
        "Compléter le rapport d'incident",
        "Exporter les IOCs vers MISP/TIP",
        "Créer/mettre à jour les règles de détection",
        "Planifier le post-mortem si impact significatif",
        "Communiquer les recommandations"
      ],
      checklist: [
        { id: "ph-8-1", text: "Rapport d'incident complet", required: true },
        { id: "ph-8-2", text: "IOCs partagés (MISP)", required: true },
        { id: "ph-8-3", text: "Règles de détection créées/mises à jour", required: true },
        { id: "ph-8-4", text: "Post-mortem planifié", required: false },
        { id: "ph-8-5", text: "Sensibilisation utilisateurs planifiée", required: false }
      ],
      tips: [
        "Inclure les TTPs observés dans le rapport",
        "Mapper sur MITRE ATT&CK pour le rapport CTI",
        "Proposer des formations ciblées"
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    }
  ],
  kpis: [
    { name: "MTTD (Mean Time To Detect)", target: "< 15 min", description: "Temps entre réception et détection du phishing" },
    { name: "MTTR (Mean Time To Respond)", target: "< 4h", description: "Temps entre détection et containment complet" },
    { name: "Taux de containment", target: "> 95%", description: "% d'emails similaires mis en quarantaine" },
    { name: "Utilisateurs impactés", target: "0", description: "Nombre d'utilisateurs ayant exécuté le payload" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Pièce jointe malveillante confirmée", contact: "SOC L2 On-Call", sla: "15 min" },
    { level: "L2 → L3", criteria: "Endpoint compromis détecté", contact: "SOC L3 / IR Team", sla: "30 min" },
    { level: "L3 → CISO", criteria: "Multiple endpoints compromis / Data exfiltration", contact: "CISO + Legal", sla: "1h" }
  ]
};

// ============================================
// SOP MITRE-02: LATERAL MOVEMENT
// Techniques: T1021, T1021.001, T1021.002, T1021.004, T1570
// Tactic: Lateral Movement (TA0008)
// ============================================
export const sopMitreLateralMovement: SOPTemplate = {
  id: "mitre-lateral-movement",
  slug: "mitre-lateral-movement-response",
  title: "Réponse au Mouvement Latéral (T1021)",
  category: "MITRE - Lateral Movement",
  description: "Procédure de détection et réponse aux techniques de mouvement latéral incluant RDP (T1021.001), SMB (T1021.002), SSH (T1021.004) et transfert d'outils (T1570).",
  version: "1.0",
  alertTypes: ["Mouvement Latéral", "RDP Suspect", "SMB Malveillant", "Pass-The-Hash", "PsExec"],
  objectives: [
    "Détecter les mouvements latéraux anormaux",
    "Identifier l'étendue de la compromission",
    "Contenir la propagation de l'attaquant",
    "Éradiquer l'accès de l'attaquant",
    "Renforcer la segmentation réseau"
  ],
  scope: "Tout mouvement réseau interne suspect entre systèmes de l'organisation",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes de mouvement latéral",
        "Qualification initiale de l'activité",
        "Escalade rapide si confirmé"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des patterns de connexion",
        "Corrélation multi-systèmes",
        "Actions de containment"
      ]
    },
    {
      role: "Analyste SOC L3 / IR",
      responsibilities: [
        "Analyse forensic des systèmes compromis",
        "Identification du patient zéro",
        "Coordination de l'éradication"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Triage Initial",
      description: "Identifier et qualifier l'activité de mouvement latéral suspecte",
      actions: [
        "Recevoir l'alerte de mouvement latéral (EDR/SIEM)",
        "Identifier les systèmes source et destination",
        "Vérifier le type de connexion (RDP/SMB/SSH/WinRM)",
        "Identifier le compte utilisateur impliqué",
        "Corréler avec les activités normales de l'utilisateur"
      ],
      checklist: [
        { id: "lm-1-1", text: "Système source identifié", required: true },
        { id: "lm-1-2", text: "Système destination identifié", required: true },
        { id: "lm-1-3", text: "Type de mouvement latéral identifié", required: true },
        { id: "lm-1-4", text: "Compte utilisateur identifié", required: true },
        { id: "lm-1-5", text: "Activité normale vérifiée avec l'utilisateur", required: true }
      ],
      tips: [
        "Les mouvements IT admin pendant les heures ouvrées peuvent être normaux",
        "Attention aux comptes de service utilisés interactivement",
        "Vérifier si le compte a été utilisé depuis plusieurs sources"
      ],
      commands: [
        { description: "Connexions RDP (Windows Event)", command: 'winlog.event_id:4624 AND winlog.event_data.LogonType:10' },
        { description: "Connexions SMB (Sysmon)", command: 'event.code:3 AND destination.port:445' },
        { description: "PsExec detection", command: 'process.name:"psexec.exe" OR process.name:"psexesvc.exe"' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse des Patterns de Connexion",
      description: "Analyser les connexions pour identifier les anomalies",
      actions: [
        "Cartographier toutes les connexions depuis le système source",
        "Cartographier toutes les connexions vers le système destination",
        "Identifier les first-time connections",
        "Vérifier les heures inhabituelles de connexion",
        "Rechercher les échecs d'authentification préalables"
      ],
      checklist: [
        { id: "lm-2-1", text: "Graph des connexions établi", required: true },
        { id: "lm-2-2", text: "First-time connections identifiées", required: true },
        { id: "lm-2-3", text: "Connexions hors heures vérifiées", required: true },
        { id: "lm-2-4", text: "Échecs auth préalables vérifiés", required: true },
        { id: "lm-2-5", text: "Pattern d'attaque identifié", required: false }
      ],
      tips: [
        "Un attaquant teste souvent plusieurs systèmes (brute-force)",
        "Pass-the-Hash: LogonType 3 avec NTLM sans échec préalable",
        "Chercher les connexions vers des serveurs sensibles"
      ],
      commands: [
        { description: "Connexions depuis source IP (24h)", command: 'source.ip:"{IP}" AND winlog.event_id:4624 | stats count by destination.ip' },
        { description: "First-time RDP connections", command: 'winlog.event_id:4624 AND winlog.event_data.LogonType:10 NOT (user.name:"admin" AND destination.ip:(10.0.0.* OR 10.0.1.*))' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Identification de la Technique",
      description: "Déterminer la technique MITRE ATT&CK utilisée",
      actions: [
        "Analyser le LogonType Windows pour identifier la méthode",
        "Vérifier l'utilisation de credentials vs hash",
        "Identifier les outils utilisés (PsExec, WMI, PowerShell)",
        "Rechercher les traces de Mimikatz/credential dumping",
        "Documenter la technique MITRE identifiée"
      ],
      checklist: [
        { id: "lm-3-1", text: "Méthode d'authentification identifiée", required: true },
        { id: "lm-3-2", text: "Outils utilisés identifiés", required: true },
        { id: "lm-3-3", text: "Credential theft vérifié sur source", required: true },
        { id: "lm-3-4", text: "Technique MITRE documentée", required: true }
      ],
      tips: [
        "T1021.001 (RDP): LogonType 10",
        "T1021.002 (SMB): LogonType 3 + port 445",
        "T1021.006 (WinRM): Events 91, 168 dans Microsoft-Windows-WinRM",
        "Pass-the-Hash: NTLM auth sans mot de passe tapé"
      ],
      commands: [
        { description: "Détection Mimikatz", command: 'process.args:("sekurlsa" OR "kerberos" OR "lsadump") OR file.name:"mimikatz.exe"' },
        { description: "WMI Remote Execution", command: 'process.parent.name:"wmiprvse.exe" AND process.name:("powershell.exe" OR "cmd.exe")' }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Identification du Patient Zéro",
      description: "Remonter la chaîne pour identifier la source initiale de compromission",
      actions: [
        "Analyser l'historique des connexions du système source",
        "Identifier comment le système source a été compromis",
        "Rechercher les accès initiaux (phishing, exploitation)",
        "Tracer la timeline de l'attaque",
        "Établir le scope de la compromission"
      ],
      checklist: [
        { id: "lm-4-1", text: "Patient zéro identifié", required: true },
        { id: "lm-4-2", text: "Vecteur d'accès initial identifié", required: true },
        { id: "lm-4-3", text: "Timeline de l'attaque établie", required: true },
        { id: "lm-4-4", text: "Tous les systèmes compromis identifiés", required: true }
      ],
      tips: [
        "Remonter les connexions entrantes du système source",
        "Vérifier les alertes email/web dans les heures précédentes",
        "L'attaquant peut avoir pivoté plusieurs fois"
      ],
      commands: [
        { description: "Connexions entrantes vers source", command: 'destination.ip:"{source_ip}" AND winlog.event_id:4624 | stats count by source.ip, user.name | sort -count' },
        { description: "Timeline processus (Sysmon)", command: 'event.code:1 AND host.name:"{hostname}" | sort @timestamp' }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L3"
    },
    {
      id: 5,
      title: "Containment Réseau",
      description: "Isoler les systèmes compromis pour stopper la propagation",
      actions: [
        "Isoler le patient zéro via EDR",
        "Isoler les systèmes compromis identifiés",
        "Bloquer les connexions RDP/SMB depuis les systèmes compromis",
        "Désactiver les comptes utilisés pour le mouvement latéral",
        "Révoquer les sessions Kerberos si Pass-the-Ticket"
      ],
      checklist: [
        { id: "lm-5-1", text: "Patient zéro isolé", required: true },
        { id: "lm-5-2", text: "Systèmes compromis isolés", required: true },
        { id: "lm-5-3", text: "Comptes désactivés/passwords reset", required: true },
        { id: "lm-5-4", text: "Sessions Kerberos révoquées", required: false },
        { id: "lm-5-5", text: "Règles firewall temporaires appliquées", required: false }
      ],
      tips: [
        "L'isolation EDR est préférable au débranchement réseau (préserve les preuves)",
        "Krbtgt password reset si Golden Ticket suspecté (2x avec 10h d'intervalle)",
        "Communiquer avec les utilisateurs impactés"
      ],
      commands: [
        { description: "Désactiver compte AD", command: "Disable-ADAccount -Identity 'compromised_user'" },
        { description: "Reset password AD", command: "Set-ADAccountPassword -Identity 'user' -Reset -NewPassword (ConvertTo-SecureString 'NewP@ssw0rd!' -AsPlainText -Force)" },
        { description: "Purger tickets Kerberos", command: "klist purge" }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 6,
      title: "Forensics Endpoints",
      description: "Analyser les endpoints compromis pour comprendre les actions de l'attaquant",
      actions: [
        "Collecter les logs Windows Security, Sysmon, PowerShell",
        "Analyser les processus et commandes exécutés",
        "Rechercher les outils d'attaque déposés",
        "Identifier la persistence installée",
        "Vérifier l'exfiltration de données"
      ],
      checklist: [
        { id: "lm-6-1", text: "Logs collectés et préservés", required: true },
        { id: "lm-6-2", text: "Outils d'attaque identifiés", required: true },
        { id: "lm-6-3", text: "Persistence identifiée", required: true },
        { id: "lm-6-4", text: "Actions de l'attaquant documentées", required: true },
        { id: "lm-6-5", text: "IOCs extraits", required: true }
      ],
      tips: [
        "Vérifier les prefetch files pour les exécutions",
        "Analyser les ShimCache et AmCache",
        "Les attaquants nettoient souvent les Event Logs (Event ID 1102)"
      ],
      commands: [
        { description: "Process exécutés (dernières 24h)", command: 'event.code:1 AND host.name:"{hostname}" | stats count by process.name, process.args | sort -count' },
        { description: "Fichiers créés récemment", command: 'event.code:11 AND host.name:"{hostname}" AND file.extension:("exe" OR "dll" OR "ps1")' }
      ],
      timeEstimate: "45-90 min",
      responsible: "Analyste L3"
    },
    {
      id: 7,
      title: "Éradication",
      description: "Supprimer tous les artefacts de l'attaquant",
      actions: [
        "Supprimer les outils d'attaque de tous les systèmes",
        "Supprimer les mécanismes de persistence",
        "Réinitialiser tous les comptes compromis",
        "Réinitialiser le mot de passe krbtgt si nécessaire",
        "Scanner tous les systèmes du réseau"
      ],
      checklist: [
        { id: "lm-7-1", text: "Outils d'attaque supprimés", required: true },
        { id: "lm-7-2", text: "Persistence éradiquée", required: true },
        { id: "lm-7-3", text: "Comptes réinitialisés", required: true },
        { id: "lm-7-4", text: "Scan complet effectué", required: true },
        { id: "lm-7-5", text: "Krbtgt reset si nécessaire", required: false }
      ],
      tips: [
        "Le krbtgt reset invalide tous les tickets Kerberos",
        "Effectuer le scan avant de remettre les systèmes en réseau",
        "Vérifier les Shadow Copies pour les anciennes compromissions"
      ],
      commands: [
        { description: "Reset krbtgt (2x)", command: "Reset-KrbtgtPassword -Server DC01 -Credential (Get-Credential)" },
        { description: "Forcer replication AD", command: "repadmin /syncall /AdeP" }
      ],
      timeEstimate: "60-120 min",
      responsible: "Analyste L3 + IT"
    },
    {
      id: 8,
      title: "Renforcement et Lessons Learned",
      description: "Améliorer les défenses et documenter l'incident",
      actions: [
        "Compléter le rapport d'incident avec timeline",
        "Identifier les gaps de détection",
        "Proposer des améliorations de segmentation",
        "Créer de nouvelles règles de détection",
        "Planifier le post-mortem"
      ],
      checklist: [
        { id: "lm-8-1", text: "Rapport d'incident complet", required: true },
        { id: "lm-8-2", text: "TTPs MITRE documentés", required: true },
        { id: "lm-8-3", text: "Nouvelles règles de détection créées", required: true },
        { id: "lm-8-4", text: "Recommandations de segmentation", required: true },
        { id: "lm-8-5", text: "Post-mortem planifié", required: true }
      ],
      tips: [
        "Mapper toutes les techniques sur MITRE Navigator",
        "Identifier les LOLBAS utilisés",
        "Proposer une authentification forte (MFA pour RDP)"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3"
    }
  ],
  kpis: [
    { name: "MTTD Lateral Movement", target: "< 30 min", description: "Temps de détection du mouvement latéral" },
    { name: "MTTR Containment", target: "< 2h", description: "Temps pour contenir complètement l'attaquant" },
    { name: "Systèmes impactés", target: "< 3", description: "Nombre de systèmes compromis avant containment" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Mouvement latéral confirmé", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Multiple systèmes compromis", contact: "SOC L3 / IR Team", sla: "20 min" },
    { level: "L3 → CISO", criteria: "Accès aux systèmes critiques / DC compromis", contact: "CISO + IT Director", sla: "30 min" }
  ]
};

// ============================================
// SOP MITRE-03: RANSOMWARE INCIDENT
// Techniques: T1486, T1490, T1489, T1485
// Tactic: Impact (TA0040)
// ============================================
export const sopMitreRansomware: SOPTemplate = {
  id: "mitre-ransomware",
  slug: "mitre-ransomware-response",
  title: "Réponse aux Ransomwares (T1486)",
  category: "MITRE - Impact",
  description: "Procédure d'urgence pour la détection et réponse aux attaques de ransomware incluant le chiffrement de données (T1486), suppression de backups (T1490) et arrêt de services (T1489).",
  version: "1.0",
  alertTypes: ["Ransomware", "Encryption Detected", "Mass File Modification", "Volume Shadow Delete"],
  objectives: [
    "Détecter le ransomware le plus tôt possible",
    "Stopper immédiatement la propagation",
    "Préserver les systèmes non-impactés",
    "Identifier et éradiquer l'accès de l'attaquant",
    "Coordonner la récupération avec IT"
  ],
  scope: "Tout incident impliquant un chiffrement malveillant de données ou destruction de backups",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection et alerte immédiate",
        "Escalade d'urgence vers L2/L3",
        "Documentation initiale"
      ]
    },
    {
      role: "Analyste SOC L2/L3",
      responsibilities: [
        "Isolation immédiate des systèmes",
        "Coordination de la réponse",
        "Investigation forensic"
      ]
    },
    {
      role: "CISO / Incident Commander",
      responsibilities: [
        "Activation du plan de crise",
        "Communication avec la direction",
        "Décisions stratégiques (payer/ne pas payer)"
      ]
    },
    {
      role: "Équipe IT",
      responsibilities: [
        "Isolation réseau",
        "Protection des backups",
        "Restauration des systèmes"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "ALERTE IMMÉDIATE",
      description: "Détecter et déclencher l'alerte d'urgence ransomware",
      actions: [
        "IDENTIFIER les signes de ransomware (fichiers chiffrés, ransom notes)",
        "ALERTER immédiatement le SOC L2/L3 et CISO",
        "NE PAS éteindre les machines (préserve la RAM)",
        "DOCUMENTER le premier système détecté (patient zéro potentiel)",
        "Activer le protocole d'urgence cyber"
      ],
      checklist: [
        { id: "rw-1-1", text: "Alerte déclenchée immédiatement", required: true },
        { id: "rw-1-2", text: "SOC L2/L3 notifié", required: true },
        { id: "rw-1-3", text: "CISO notifié", required: true },
        { id: "rw-1-4", text: "Premier système documenté", required: true },
        { id: "rw-1-5", text: "Protocole d'urgence activé", required: true }
      ],
      tips: [
        "CRITIQUE: Ne PAS attendre pour escalader",
        "Chaque minute compte pour limiter l'impact",
        "Les ransomwares modernes se propagent en minutes"
      ],
      commands: [
        { description: "Détection chiffrement masse (Sysmon)", command: 'event.code:11 AND file.extension:(".encrypted" OR ".locked" OR ".crypted") | stats count by host.name' },
        { description: "Détection ransom note", command: 'file.name:("readme.txt" OR "decrypt*.txt" OR "how_to_recover*" OR "ransom*")' }
      ],
      timeEstimate: "< 5 min",
      responsible: "Analyste L1 (puis L2/L3)"
    },
    {
      id: 2,
      title: "ISOLATION D'URGENCE",
      description: "Isoler immédiatement pour stopper la propagation",
      actions: [
        "ISOLER les systèmes infectés via EDR (ne pas éteindre!)",
        "DÉCONNECTER les segments réseau affectés",
        "PROTÉGER les backups (déconnecter du réseau)",
        "BLOQUER les comptes compromis/utilisés par le ransomware",
        "ISOLER les serveurs critiques préventivement"
      ],
      checklist: [
        { id: "rw-2-1", text: "Systèmes infectés isolés (EDR)", required: true },
        { id: "rw-2-2", text: "Segments réseau déconnectés", required: true },
        { id: "rw-2-3", text: "Backups protégés/offline", required: true },
        { id: "rw-2-4", text: "Comptes suspendus", required: true },
        { id: "rw-2-5", text: "Serveurs critiques isolés/protégés", required: true }
      ],
      tips: [
        "L'isolation EDR préserve la RAM et les preuves",
        "Les backups online peuvent être ciblés (T1490)",
        "Isoler les Domain Controllers en priorité"
      ],
      commands: [
        { description: "Isolation via CrowdStrike", command: "falconctl -s --cid=<CID> network_containment=enable" },
        { description: "Désactiver compte AD immédiat", command: "Get-ADUser -Filter {Enabled -eq $true} | Where Name -like '*suspicious*' | Disable-ADAccount" }
      ],
      timeEstimate: "15-30 min",
      responsible: "Analyste L2/L3 + IT"
    },
    {
      id: 3,
      title: "Identification du Ransomware",
      description: "Identifier la famille de ransomware et ses caractéristiques",
      actions: [
        "Collecter un sample du ransomware et des fichiers chiffrés",
        "Identifier la famille via ID Ransomware (id-ransomware.malwarehunterteam.com)",
        "Rechercher si un décrypteur gratuit existe (NoMoreRansom.org)",
        "Analyser la note de rançon pour identifier le groupe",
        "Documenter les IOCs (extensions, hash, C2)"
      ],
      checklist: [
        { id: "rw-3-1", text: "Sample ransomware collecté", required: true },
        { id: "rw-3-2", text: "Famille identifiée", required: true },
        { id: "rw-3-3", text: "Décrypteur recherché", required: true },
        { id: "rw-3-4", text: "Note de rançon analysée", required: true },
        { id: "rw-3-5", text: "IOCs documentés", required: true }
      ],
      tips: [
        "NoMoreRansom.org offre des décrypteurs gratuits",
        "Certaines familles ont des bugs exploitables",
        "Ne JAMAIS communiquer avec l'attaquant sans accord du CISO"
      ],
      commands: [
        { description: "Hash du sample", command: "sha256sum ransomware_sample.exe" },
        { description: "Strings analysis", command: "strings ransomware_sample.exe | grep -E '(http|bitcoin|tor|onion)'" }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L3"
    },
    {
      id: 4,
      title: "Évaluation de l'Impact",
      description: "Déterminer l'étendue des dégâts et les systèmes impactés",
      actions: [
        "Lister tous les systèmes avec fichiers chiffrés",
        "Identifier les données critiques impactées",
        "Vérifier l'état des backups (intégrité)",
        "Évaluer si exfiltration de données (double extortion)",
        "Estimer le temps de récupération"
      ],
      checklist: [
        { id: "rw-4-1", text: "Inventaire systèmes impactés", required: true },
        { id: "rw-4-2", text: "Données critiques identifiées", required: true },
        { id: "rw-4-3", text: "État des backups vérifié", required: true },
        { id: "rw-4-4", text: "Exfiltration évaluée", required: true },
        { id: "rw-4-5", text: "Estimation temps récupération", required: true }
      ],
      tips: [
        "80% des ransomwares modernes font de l'exfiltration first",
        "Vérifier les volumes de données sortantes avant l'incident",
        "Prioriser la récupération par criticité business"
      ],
      commands: [
        { description: "Systèmes avec fichiers chiffrés", command: 'file.extension:".locked" | stats count by host.name | sort -count' },
        { description: "Exfiltration potentielle", command: 'source.ip:<internal_range> AND destination.bytes:>100000000 AND NOT destination.ip:<known_good>' }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 5,
      title: "Investigation - Vecteur d'Accès Initial",
      description: "Identifier comment le ransomware est entré dans le réseau",
      actions: [
        "Analyser le patient zéro pour l'accès initial",
        "Rechercher les emails de phishing récents",
        "Vérifier les connexions VPN/RDP suspectes",
        "Analyser les vulnérabilités exploitées",
        "Tracer la timeline complète de l'attaque"
      ],
      checklist: [
        { id: "rw-5-1", text: "Patient zéro identifié", required: true },
        { id: "rw-5-2", text: "Vecteur d'accès initial identifié", required: true },
        { id: "rw-5-3", text: "Timeline de l'attaque établie", required: true },
        { id: "rw-5-4", text: "Tous les IOCs extraits", required: true },
        { id: "rw-5-5", text: "Lateral movement paths documentés", required: true }
      ],
      tips: [
        "Les ransomwares restent souvent dormants plusieurs jours/semaines",
        "Chercher les Cobalt Strike beacons, Emotet, IcedID",
        "L'accès initial peut être via un broker (Initial Access Broker)"
      ],
      commands: [
        { description: "Cobalt Strike detection", command: 'process.name:"rundll32.exe" AND process.args:("http" OR "https" OR "dll" OR ".dll,Start")' },
        { description: "RDP Brute Force", command: 'winlog.event_id:4625 AND winlog.event_data.LogonType:10 | stats count by source.ip | where count > 50' }
      ],
      timeEstimate: "60-120 min",
      responsible: "Analyste L3"
    },
    {
      id: 6,
      title: "Éradication",
      description: "Supprimer le ransomware et tout accès de l'attaquant",
      actions: [
        "Supprimer tous les samples de ransomware identifiés",
        "Supprimer les backdoors et outils d'attaque",
        "Éradiquer la persistence",
        "Réinitialiser TOUS les comptes (domaine et local)",
        "Réinitialiser le krbtgt (2 fois à 10-12h d'intervalle)"
      ],
      checklist: [
        { id: "rw-6-1", text: "Ransomware supprimé de tous les systèmes", required: true },
        { id: "rw-6-2", text: "Backdoors éradiqués", required: true },
        { id: "rw-6-3", text: "Persistence supprimée", required: true },
        { id: "rw-6-4", text: "Mots de passe domaine réinitialisés", required: true },
        { id: "rw-6-5", text: "Krbtgt réinitialisé (x2)", required: true }
      ],
      tips: [
        "Les attaquants laissent souvent plusieurs backdoors",
        "Le krbtgt reset invalide tous les Golden Tickets",
        "Reconstruire les systèmes from scratch si possible"
      ],
      commands: [
        { description: "Recherche backdoors communs", command: 'process.name:("ngrok.exe" OR "teamviewer*.exe" OR "anydesk*.exe") OR file.name:("beacon.exe" OR "cobaltstrike*")' },
        { description: "Reset krbtgt", command: "Reset-KrbtgtPassword -DomainController DC01" }
      ],
      timeEstimate: "2-4 heures",
      responsible: "Analyste L3 + IT"
    },
    {
      id: 7,
      title: "Récupération",
      description: "Restaurer les systèmes et données à partir des backups",
      actions: [
        "Vérifier l'intégrité des backups avant restauration",
        "Restaurer les systèmes par ordre de priorité business",
        "Scanner les systèmes restaurés avant connexion au réseau",
        "Implémenter le monitoring renforcé",
        "Tester les systèmes restaurés"
      ],
      checklist: [
        { id: "rw-7-1", text: "Intégrité backups vérifiée", required: true },
        { id: "rw-7-2", text: "Systèmes critiques restaurés", required: true },
        { id: "rw-7-3", text: "Scans post-restauration effectués", required: true },
        { id: "rw-7-4", text: "Monitoring renforcé actif", required: true },
        { id: "rw-7-5", text: "Tests fonctionnels passés", required: true }
      ],
      tips: [
        "Restaurer sur nouveau hardware si possible",
        "Maintenir les systèmes compromis offline pour forensic",
        "Surveillance 24/7 pendant les 72 premières heures"
      ],
      timeEstimate: "Variable (heures à jours)",
      responsible: "IT + SOC"
    },
    {
      id: 8,
      title: "Post-Incident et Reporting",
      description: "Documentation complète et amélioration continue",
      actions: [
        "Rédiger le rapport d'incident complet",
        "Notifier les autorités si requis (CNIL, ANSSI)",
        "Conduire le post-mortem avec toutes les parties",
        "Identifier et implémenter les améliorations",
        "Mettre à jour le plan de réponse incident"
      ],
      checklist: [
        { id: "rw-8-1", text: "Rapport incident complet", required: true },
        { id: "rw-8-2", text: "Notification autorités effectuée", required: false },
        { id: "rw-8-3", text: "Post-mortem conduit", required: true },
        { id: "rw-8-4", text: "Plan d'amélioration défini", required: true },
        { id: "rw-8-5", text: "Playbook mis à jour", required: true }
      ],
      tips: [
        "Notification CNIL si données personnelles (72h)",
        "Contacter l'ANSSI pour les OIV/OSE",
        "Planifier un test de restauration régulier"
      ],
      timeEstimate: "3-5 jours",
      responsible: "CISO + SOC L3"
    }
  ],
  kpis: [
    { name: "MTTD Ransomware", target: "< 10 min", description: "Temps de détection de l'activité ransomware" },
    { name: "MTTI (Isolation)", target: "< 30 min", description: "Temps pour isoler complètement les systèmes impactés" },
    { name: "Systèmes chiffrés", target: "< 5", description: "Nombre de systèmes avant containment" },
    { name: "RTO (Recovery Time)", target: "< 24h", description: "Temps pour restaurer les systèmes critiques" }
  ],
  escalationMatrix: [
    { level: "L1 → ALL", criteria: "Ransomware détecté", contact: "L2 + L3 + CISO immédiatement", sla: "< 5 min" },
    { level: "CISO → Direction", criteria: "Impact confirmé", contact: "DG + DSI + Juridique", sla: "30 min" },
    { level: "Direction → Externes", criteria: "Décision stratégique", contact: "ANSSI/CNIL/Assurance/Communication", sla: "1-24h" }
  ]
};

// ============================================
// SOP MITRE-04: COMMAND AND CONTROL (C2)
// Techniques: T1071, T1095, T1572, T1573
// Tactic: Command and Control (TA0011)
// ============================================
export const sopMitreC2: SOPTemplate = {
  id: "mitre-c2-detection",
  slug: "mitre-c2-detection-response",
  title: "Détection C2 - Command and Control (T1071)",
  category: "MITRE - Command and Control",
  description: "Procédure de détection et réponse aux communications C2 incluant HTTP/HTTPS (T1071.001), DNS (T1071.004), tunneling (T1572) et communications chiffrées (T1573).",
  version: "1.0",
  alertTypes: ["C2 Communication", "Beaconing", "DNS Tunneling", "Suspicious HTTP", "Encrypted Traffic"],
  objectives: [
    "Détecter les communications C2 sortantes",
    "Identifier les systèmes infectés",
    "Bloquer les communications avec le C2",
    "Analyser le malware pour comprendre les capacités",
    "Éradiquer l'infection complètement"
  ],
  scope: "Toute communication suspecte vers des serveurs de Command and Control",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes C2",
        "Triage initial et qualification",
        "Escalade si confirmé"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des patterns de communication",
        "Identification du malware",
        "Blocage et containment"
      ]
    },
    {
      role: "Analyste SOC L3 / Threat Hunter",
      responsibilities: [
        "Analyse malware avancée",
        "Recherche de compromissions additionnelles",
        "Extraction de IOCs et TTPs"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Triage",
      description: "Identifier et qualifier l'alerte de communication C2",
      actions: [
        "Recevoir l'alerte C2 (NDR/SIEM/EDR)",
        "Identifier le système source des connexions",
        "Identifier la destination (IP/domaine)",
        "Vérifier la réputation de la destination",
        "Qualifier le type de C2 (HTTP, DNS, custom protocol)"
      ],
      checklist: [
        { id: "c2-1-1", text: "Système source identifié", required: true },
        { id: "c2-1-2", text: "Destination C2 identifiée", required: true },
        { id: "c2-1-3", text: "Réputation vérifiée (VT, OTX)", required: true },
        { id: "c2-1-4", text: "Type de protocole C2 identifié", required: true },
        { id: "c2-1-5", text: "Faux positif éliminé", required: true }
      ],
      tips: [
        "Les C2 légitimes (TeamViewer, AnyDesk) doivent être validés",
        "Vérifier si le domaine est nouvellement enregistré",
        "Les domaines DGA sont un signal fort de C2"
      ],
      commands: [
        { description: "Réputation domaine VirusTotal", command: "curl -s --request GET --url 'https://www.virustotal.com/api/v3/domains/{domain}' -H 'x-apikey: {key}'" },
        { description: "WHOIS domaine", command: "whois {domain} | grep -E '(Creation|Registrar|Name Server)'" }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse du Pattern de Communication",
      description: "Analyser le comportement de la communication C2",
      actions: [
        "Analyser la fréquence des connexions (beaconing)",
        "Identifier les intervalles réguliers (jitter)",
        "Analyser le volume de données échangées",
        "Examiner les User-Agent et headers HTTP",
        "Détecter l'obfuscation/encoding dans les requêtes"
      ],
      checklist: [
        { id: "c2-2-1", text: "Pattern de beaconing identifié", required: true },
        { id: "c2-2-2", text: "Intervalles analysés", required: true },
        { id: "c2-2-3", text: "Volume de données mesuré", required: true },
        { id: "c2-2-4", text: "Headers HTTP analysés", required: true },
        { id: "c2-2-5", text: "Framework C2 identifié si possible", required: false }
      ],
      tips: [
        "Cobalt Strike: beacons réguliers avec jitter configurable",
        "HTTP C2: souvent POST vers /submit ou pages aléatoires",
        "DNS C2: requêtes TXT ou AAAA avec données encodées"
      ],
      commands: [
        { description: "Beaconing detection (SIEM)", command: 'destination.ip:"{C2_IP}" | bucket span=1m | stats count by _time | where std(count) < 2' },
        { description: "DNS C2 detection", command: 'dns.question.type:TXT AND dns.question.name:*.{suspicious_domain} | stats count by host.name' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Identification du Malware",
      description: "Identifier le malware responsable des communications C2",
      actions: [
        "Collecter le processus générant les connexions via EDR",
        "Extraire le binaire/script malveillant",
        "Analyser en sandbox si nécessaire",
        "Identifier la famille de malware (Cobalt Strike, Sliver, etc.)",
        "Documenter les IOCs du malware"
      ],
      checklist: [
        { id: "c2-3-1", text: "Processus malveillant identifié", required: true },
        { id: "c2-3-2", text: "Binaire/script extrait", required: true },
        { id: "c2-3-3", text: "Famille malware identifiée", required: true },
        { id: "c2-3-4", text: "IOCs documentés (hash, mutex, etc.)", required: true },
        { id: "c2-3-5", text: "Configuration C2 extraite si possible", required: false }
      ],
      tips: [
        "Cobalt Strike: rechercher les beacon configs (watermark)",
        "Utiliser YARA rules pour identification",
        "Les DLLs malveillantes peuvent être injectées en mémoire"
      ],
      commands: [
        { description: "Process tree (Sysmon)", command: 'event.code:1 AND process.executable:"{suspicious_path}" | table @timestamp, process.name, process.parent.name, process.args' },
        { description: "Network connections process", command: 'event.code:3 AND process.name:"{malicious_process}" | table destination.ip, destination.port' }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    },
    {
      id: 4,
      title: "Blocage et Containment",
      description: "Bloquer les communications C2 et isoler les systèmes",
      actions: [
        "Bloquer les IPs/domaines C2 sur firewall et proxy",
        "Isoler le(s) système(s) infecté(s) via EDR",
        "Créer des règles de détection pour le pattern C2",
        "Rechercher d'autres systèmes communiquant vers le même C2",
        "Bloquer les hash malveillants en EDR"
      ],
      checklist: [
        { id: "c2-4-1", text: "C2 bloqué (firewall/proxy)", required: true },
        { id: "c2-4-2", text: "Système(s) isolé(s)", required: true },
        { id: "c2-4-3", text: "Règles de détection créées", required: true },
        { id: "c2-4-4", text: "Autres victimes recherchées", required: true },
        { id: "c2-4-5", text: "Hash bloqués", required: true }
      ],
      tips: [
        "Les C2 ont souvent des backup domains",
        "Vérifier les fast-flux DNS",
        "Bloquer aussi les IP ranges du provider d'hébergement"
      ],
      commands: [
        { description: "Ajouter IP en blocklist", command: "iptables -A OUTPUT -d {C2_IP} -j DROP" },
        { description: "Recherche autres victimes", command: 'destination.ip:"{C2_IP}" | stats count by source.ip, host.name' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 5,
      title: "Investigation Forensics",
      description: "Analyser en profondeur le système compromis",
      actions: [
        "Collecter les artefacts forensics (memory, logs, files)",
        "Analyser la timeline d'infection",
        "Identifier l'accès initial",
        "Documenter toutes les actions de l'attaquant",
        "Identifier l'exfiltration de données potentielle"
      ],
      checklist: [
        { id: "c2-5-1", text: "Artifacts collectés", required: true },
        { id: "c2-5-2", text: "Timeline établie", required: true },
        { id: "c2-5-3", text: "Accès initial identifié", required: true },
        { id: "c2-5-4", text: "Actions attaquant documentées", required: true },
        { id: "c2-5-5", text: "Exfiltration évaluée", required: true }
      ],
      tips: [
        "La mémoire peut contenir la config C2 déchiffrée",
        "Vérifier les commandes exécutées via C2",
        "Les attaquants font souvent du discovery (whoami, net user)"
      ],
      commands: [
        { description: "Dump mémoire (winpmem)", command: "winpmem.exe memory.raw" },
        { description: "Commands executed", command: 'process.parent.executable:"{malware_path}" | table @timestamp, process.args' }
      ],
      timeEstimate: "45-90 min",
      responsible: "Analyste L3"
    },
    {
      id: 6,
      title: "Éradication et Récupération",
      description: "Supprimer le malware et restaurer le système",
      actions: [
        "Supprimer le malware et les fichiers associés",
        "Supprimer les mécanismes de persistence",
        "Réinitialiser les credentials compromis",
        "Scanner le système avec signatures à jour",
        "Remettre le système en production avec monitoring"
      ],
      checklist: [
        { id: "c2-6-1", text: "Malware supprimé", required: true },
        { id: "c2-6-2", text: "Persistence éradiquée", required: true },
        { id: "c2-6-3", text: "Credentials réinitialisés", required: true },
        { id: "c2-6-4", text: "Scan post-remediation clean", required: true },
        { id: "c2-6-5", text: "Système remis en production", required: true }
      ],
      tips: [
        "Considérer une réinstallation complète pour les compromissions sévères",
        "Vérifier les Shadow Copies pour la persistence",
        "Continuer le monitoring renforcé 30 jours"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3 + IT"
    },
    {
      id: 7,
      title: "Threat Intelligence et Partage",
      description: "Documenter et partager les IOCs avec la communauté",
      actions: [
        "Compléter le rapport d'incident",
        "Exporter les IOCs vers MISP",
        "Mettre à jour les règles SIEM/SOAR",
        "Partager avec les ISACs si applicable",
        "Documenter les TTPs MITRE ATT&CK"
      ],
      checklist: [
        { id: "c2-7-1", text: "Rapport d'incident complet", required: true },
        { id: "c2-7-2", text: "IOCs exportés (MISP)", required: true },
        { id: "c2-7-3", text: "Règles de détection mises à jour", required: true },
        { id: "c2-7-4", text: "TTPs documentés (MITRE)", required: true }
      ],
      tips: [
        "Les IOCs C2 peuvent aider d'autres organisations",
        "Mapper les techniques sur ATT&CK Navigator",
        "Planifier un threat hunt sur les TTPs observés"
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2/L3"
    }
  ],
  kpis: [
    { name: "MTTD C2", target: "< 30 min", description: "Temps de détection des communications C2" },
    { name: "MTTR Blocage", target: "< 1h", description: "Temps pour bloquer et contenir" },
    { name: "Dwell Time", target: "< 24h", description: "Temps entre compromission et détection" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "C2 confirmé", contact: "SOC L2 On-Call", sla: "15 min" },
    { level: "L2 → L3", criteria: "Malware sophistiqué / APT indicators", contact: "SOC L3 / IR", sla: "30 min" },
    { level: "L3 → CISO", criteria: "Multiple systèmes / Data exfiltration", contact: "CISO", sla: "1h" }
  ]
};

// ============================================
// SOP MITRE-05: CREDENTIAL ACCESS
// Techniques: T1003, T1110, T1555, T1558
// Tactic: Credential Access (TA0006)
// ============================================
export const sopMitreCredentialAccess: SOPTemplate = {
  id: "mitre-credential-access",
  slug: "mitre-credential-theft-response",
  title: "Réponse au Vol de Credentials (T1003)",
  category: "MITRE - Credential Access",
  description: "Procédure de détection et réponse au vol de credentials incluant OS Credential Dumping (T1003), Brute Force (T1110), Password Stores (T1555) et Kerberoasting (T1558.003).",
  version: "1.0",
  alertTypes: ["Credential Dumping", "Mimikatz", "Brute Force", "Kerberoasting", "LSASS Access"],
  objectives: [
    "Détecter les tentatives de vol de credentials",
    "Identifier les comptes potentiellement compromis",
    "Contenir et réinitialiser les credentials",
    "Identifier l'étendue de l'accès obtenu",
    "Renforcer la protection des credentials"
  ],
  scope: "Tout incident impliquant le vol ou l'extraction de credentials système ou utilisateur",
  roles: [
    {
      role: "Analyste SOC L1",
      responsibilities: [
        "Détection des alertes credential theft",
        "Triage et escalade",
        "Documentation initiale"
      ]
    },
    {
      role: "Analyste SOC L2",
      responsibilities: [
        "Analyse des techniques utilisées",
        "Identification des comptes compromis",
        "Coordination du reset"
      ]
    },
    {
      role: "Analyste SOC L3 / IR",
      responsibilities: [
        "Forensics avancé",
        "Analyse d'impact sur l'AD",
        "Recommandations de hardening"
      ]
    }
  ],
  steps: [
    {
      id: 1,
      title: "Détection et Classification",
      description: "Identifier et classifier le type de credential attack",
      actions: [
        "Recevoir l'alerte de credential access (EDR/SIEM)",
        "Identifier le système et l'utilisateur source",
        "Classifier la technique (dumping, brute force, kerberoasting)",
        "Vérifier si l'activité est légitime (pentest, admin)",
        "Évaluer la criticité des comptes potentiellement impactés"
      ],
      checklist: [
        { id: "ca-1-1", text: "Système source identifié", required: true },
        { id: "ca-1-2", text: "Technique classifiée (MITRE)", required: true },
        { id: "ca-1-3", text: "Activité légitime éliminée", required: true },
        { id: "ca-1-4", text: "Criticité des comptes évaluée", required: true }
      ],
      tips: [
        "T1003.001: LSASS memory access (Mimikatz)",
        "T1003.002: SAM database access",
        "T1003.003: NTDS.dit extraction",
        "T1558.003: Kerberoasting (TGS requests)"
      ],
      commands: [
        { description: "Accès LSASS (Sysmon)", command: 'event.code:10 AND winlog.event_data.TargetImage:"*lsass.exe" AND winlog.event_data.GrantedAccess:("0x1010" OR "0x1038")' },
        { description: "Kerberoasting detection", command: 'winlog.event_id:4769 AND winlog.event_data.TicketEncryptionType:0x17' }
      ],
      timeEstimate: "10-15 min",
      responsible: "Analyste L1"
    },
    {
      id: 2,
      title: "Analyse de la Technique",
      description: "Comprendre précisément comment les credentials ont été accédés",
      actions: [
        "Identifier l'outil utilisé (Mimikatz, Rubeus, LaZagne)",
        "Analyser les commandes exécutées",
        "Déterminer quels credentials ont été extraits",
        "Vérifier si des credentials ont été utilisés post-extraction",
        "Identifier la persistence ou le mouvement latéral"
      ],
      checklist: [
        { id: "ca-2-1", text: "Outil identifié", required: true },
        { id: "ca-2-2", text: "Commandes analysées", required: true },
        { id: "ca-2-3", text: "Type de credentials extrait", required: true },
        { id: "ca-2-4", text: "Utilisation post-extraction vérifiée", required: true }
      ],
      tips: [
        "Mimikatz 'sekurlsa::logonpasswords' extrait les NTLM hashes",
        "DCSync (T1003.006) simule un DC pour extraire les hash AD",
        "Kerberoasting cible les service accounts avec SPN"
      ],
      commands: [
        { description: "Mimikatz detection", command: 'process.args:("sekurlsa" OR "kerberos::ptt" OR "lsadump::dcsync")' },
        { description: "DCSync detection", command: 'winlog.event_id:4662 AND winlog.event_data.Properties:("*1131f6ad*" OR "*1131f6aa*")' }
      ],
      timeEstimate: "20-30 min",
      responsible: "Analyste L2"
    },
    {
      id: 3,
      title: "Identification des Comptes Compromis",
      description: "Lister tous les comptes potentiellement compromis",
      actions: [
        "Lister les utilisateurs connectés au système compromis",
        "Identifier les service accounts avec cached credentials",
        "Vérifier les comptes admin locaux et de domaine",
        "Pour DCSync: considérer TOUS les comptes du domaine compromis",
        "Prioriser par criticité (admin, service, standard)"
      ],
      checklist: [
        { id: "ca-3-1", text: "Utilisateurs connectés listés", required: true },
        { id: "ca-3-2", text: "Service accounts identifiés", required: true },
        { id: "ca-3-3", text: "Comptes admin identifiés", required: true },
        { id: "ca-3-4", text: "Liste priorisée créée", required: true }
      ],
      tips: [
        "Les credentials restent en cache même après logoff",
        "LSA Secrets contient les mots de passe de service accounts",
        "DCSync peut extraire le hash du krbtgt (Golden Ticket)"
      ],
      commands: [
        { description: "Logons sur système", command: 'winlog.event_id:4624 AND host.name:"{hostname}" | stats values(user.name) by winlog.event_data.LogonType' },
        { description: "Service accounts", command: 'Get-ADUser -Filter {ServicePrincipalName -ne "$null"} | Select Name, SamAccountName' }
      ],
      timeEstimate: "15-25 min",
      responsible: "Analyste L2"
    },
    {
      id: 4,
      title: "Containment et Reset Immédiat",
      description: "Isoler et réinitialiser les credentials compromis",
      actions: [
        "Isoler le système source via EDR",
        "Forcer le logout de tous les utilisateurs impactés",
        "Réinitialiser les mots de passe des comptes compromis",
        "Réinitialiser les mots de passe des service accounts",
        "Révoquer les tokens Kerberos (klist purge)"
      ],
      checklist: [
        { id: "ca-4-1", text: "Système isolé", required: true },
        { id: "ca-4-2", text: "Sessions utilisateurs terminées", required: true },
        { id: "ca-4-3", text: "Passwords utilisateurs reset", required: true },
        { id: "ca-4-4", text: "Service accounts reset", required: true },
        { id: "ca-4-5", text: "Tokens Kerberos révoqués", required: true }
      ],
      tips: [
        "Forcer le changement au prochain login ne suffit pas",
        "Les service accounts peuvent nécessiter une coordination IT",
        "Révoquer tous les refresh tokens (Azure AD)"
      ],
      commands: [
        { description: "Reset password AD", command: "Set-ADAccountPassword -Identity {user} -Reset -NewPassword (ConvertTo-SecureString 'TempP@ss123!' -AsPlainText -Force)" },
        { description: "Force logout Azure", command: "Revoke-AzureADUserAllRefreshToken -ObjectId {user@domain.com}" }
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2 + IT"
    },
    {
      id: 5,
      title: "Reset Krbtgt (si DCSync/Golden Ticket)",
      description: "Procédure spéciale si le krbtgt est compromis",
      actions: [
        "Évaluer si le compte krbtgt a été compromis",
        "Planifier le double reset du krbtgt",
        "Effectuer le premier reset krbtgt",
        "Attendre 10-12 heures (max ticket lifetime)",
        "Effectuer le second reset krbtgt"
      ],
      checklist: [
        { id: "ca-5-1", text: "Compromission krbtgt évaluée", required: true },
        { id: "ca-5-2", text: "Premier reset krbtgt effectué", required: false, category: "Si krbtgt compromis" },
        { id: "ca-5-3", text: "Attente 10-12h respectée", required: false, category: "Si krbtgt compromis" },
        { id: "ca-5-4", text: "Second reset krbtgt effectué", required: false, category: "Si krbtgt compromis" }
      ],
      tips: [
        "Le krbtgt reset invalide TOUS les tickets Kerberos existants",
        "Impact: tous les utilisateurs doivent se réauthentifier",
        "Planifier pendant une période de faible activité"
      ],
      commands: [
        { description: "Reset krbtgt", command: "Reset-KrbtgtPassword -DomainController {DC} -Credential (Get-Credential)" },
        { description: "Vérifier reset", command: "Get-ADUser krbtgt -Properties PasswordLastSet | Select PasswordLastSet" }
      ],
      timeEstimate: "24h (si krbtgt)",
      responsible: "Analyste L3 + IT AD"
    },
    {
      id: 6,
      title: "Analyse d'Impact et Lateral Movement",
      description: "Vérifier si les credentials ont été utilisés malicieusement",
      actions: [
        "Rechercher l'utilisation des credentials compromis post-extraction",
        "Identifier tout mouvement latéral avec ces credentials",
        "Vérifier les accès aux systèmes sensibles",
        "Analyser les modifications AD (groupes, GPO)",
        "Rechercher la persistence sur d'autres systèmes"
      ],
      checklist: [
        { id: "ca-6-1", text: "Post-exploitation analysée", required: true },
        { id: "ca-6-2", text: "Lateral movement vérifié", required: true },
        { id: "ca-6-3", text: "Accès systèmes sensibles vérifié", required: true },
        { id: "ca-6-4", text: "Modifications AD vérifiées", required: true }
      ],
      tips: [
        "Pass-the-Hash: LogonType 3 avec NTLM",
        "Vérifier les Event ID 4648 (explicit credentials)",
        "Les admin accounts donnent accès à tout le domaine"
      ],
      commands: [
        { description: "Logins avec comptes compromis", command: 'winlog.event_id:4624 AND user.name:{compromised_user} AND @timestamp >= "{extraction_time}"' },
        { description: "AD Changes", command: 'winlog.event_id:(4728 OR 4732 OR 4756) AND user.name:{compromised_user}' }
      ],
      timeEstimate: "45-90 min",
      responsible: "Analyste L3"
    },
    {
      id: 7,
      title: "Éradication et Hardening",
      description: "Supprimer l'accès et renforcer la protection",
      actions: [
        "Supprimer les outils d'attaque du système",
        "Supprimer la persistence installée",
        "Activer Credential Guard si non activé",
        "Restreindre les comptes admin locaux (LAPS)",
        "Implémenter la tier isolation (T0/T1/T2)"
      ],
      checklist: [
        { id: "ca-7-1", text: "Outils d'attaque supprimés", required: true },
        { id: "ca-7-2", text: "Persistence éradiquée", required: true },
        { id: "ca-7-3", text: "Credential Guard planifié", required: false },
        { id: "ca-7-4", text: "LAPS déployé", required: false },
        { id: "ca-7-5", text: "Recommandations hardening documentées", required: true }
      ],
      tips: [
        "Credential Guard protège contre LSASS dumping",
        "LAPS randomize les passwords admin local",
        "Protected Users group renforce la protection des credentials"
      ],
      timeEstimate: "30-60 min",
      responsible: "Analyste L2/L3 + IT"
    },
    {
      id: 8,
      title: "Documentation et Lessons Learned",
      description: "Documenter l'incident et améliorer les défenses",
      actions: [
        "Compléter le rapport d'incident",
        "Documenter les TTPs MITRE observés",
        "Créer/améliorer les règles de détection",
        "Planifier le post-mortem",
        "Définir les actions de hardening à long terme"
      ],
      checklist: [
        { id: "ca-8-1", text: "Rapport d'incident complet", required: true },
        { id: "ca-8-2", text: "TTPs documentés", required: true },
        { id: "ca-8-3", text: "Règles de détection mises à jour", required: true },
        { id: "ca-8-4", text: "Plan hardening défini", required: true }
      ],
      timeEstimate: "30-45 min",
      responsible: "Analyste L2"
    }
  ],
  kpis: [
    { name: "MTTD Credential Theft", target: "< 15 min", description: "Temps de détection de l'accès aux credentials" },
    { name: "MTTR Reset", target: "< 2h", description: "Temps pour reset tous les comptes compromis" },
    { name: "Comptes compromis", target: "0 admin", description: "Nombre de comptes admin utilisés malicieusement" }
  ],
  escalationMatrix: [
    { level: "L1 → L2", criteria: "Credential dumping confirmé", contact: "SOC L2 On-Call", sla: "10 min" },
    { level: "L2 → L3", criteria: "Admin accounts / DCSync", contact: "SOC L3 / IR", sla: "15 min" },
    { level: "L3 → CISO", criteria: "krbtgt compromis / Domain compromise", contact: "CISO + IT Director", sla: "30 min" }
  ]
};

// ============================================
// EXPORT ALL MITRE SOPs
// ============================================
export const allMitreSOPs: SOPTemplate[] = [
  sopMitrePhishing,
  sopMitreLateralMovement,
  sopMitreRansomware,
  sopMitreC2,
  sopMitreCredentialAccess,
  ...allExtendedMitreSOPs
];

// Re-export extended SOPs for direct access
export {
  sopMitreExecution,
  sopMitrePersistence,
  sopMitrePrivilegeEscalation,
  sopMitreDefenseEvasion,
  sopMitreDiscovery,
  sopMitreCollection,
  sopMitreExfiltration
};

export function getMitreSOPByTechnique(techniqueId: string): SOPTemplate | undefined {
  const techniqueToSOP: Record<string, SOPTemplate> = {
    // Initial Access - Phishing
    'T1566': sopMitrePhishing,
    'T1566.001': sopMitrePhishing,
    'T1566.002': sopMitrePhishing,
    // Lateral Movement
    'T1021': sopMitreLateralMovement,
    'T1021.001': sopMitreLateralMovement,
    'T1021.002': sopMitreLateralMovement,
    'T1021.004': sopMitreLateralMovement,
    'T1570': sopMitreLateralMovement,
    // Impact - Ransomware
    'T1486': sopMitreRansomware,
    'T1490': sopMitreRansomware,
    'T1489': sopMitreRansomware,
    'T1485': sopMitreRansomware,
    // C2
    'T1071': sopMitreC2,
    'T1071.001': sopMitreC2,
    'T1071.004': sopMitreC2,
    'T1572': sopMitreC2,
    'T1573': sopMitreC2,
    'T1095': sopMitreC2,
    // Credential Access
    'T1003': sopMitreCredentialAccess,
    'T1003.001': sopMitreCredentialAccess,
    'T1003.002': sopMitreCredentialAccess,
    'T1003.003': sopMitreCredentialAccess,
    'T1003.006': sopMitreCredentialAccess,
    'T1110': sopMitreCredentialAccess,
    'T1555': sopMitreCredentialAccess,
    'T1558': sopMitreCredentialAccess,
    'T1558.003': sopMitreCredentialAccess,
    // Execution
    'T1059': sopMitreExecution,
    'T1059.001': sopMitreExecution,
    'T1059.003': sopMitreExecution,
    'T1059.005': sopMitreExecution,
    'T1059.007': sopMitreExecution,
    'T1204': sopMitreExecution,
    'T1204.001': sopMitreExecution,
    'T1204.002': sopMitreExecution,
    'T1053': sopMitreExecution,
    // Persistence
    'T1547': sopMitrePersistence,
    'T1547.001': sopMitrePersistence,
    'T1053.005': sopMitrePersistence,
    'T1136': sopMitrePersistence,
    'T1136.001': sopMitrePersistence,
    'T1136.002': sopMitrePersistence,
    'T1543': sopMitrePersistence,
    'T1543.003': sopMitrePersistence,
    // Privilege Escalation
    'T1068': sopMitrePrivilegeEscalation,
    'T1548': sopMitrePrivilegeEscalation,
    'T1548.002': sopMitrePrivilegeEscalation,
    'T1134': sopMitrePrivilegeEscalation,
    'T1055': sopMitrePrivilegeEscalation,
    'T1055.001': sopMitrePrivilegeEscalation,
    'T1055.002': sopMitrePrivilegeEscalation,
    // Defense Evasion
    'T1070': sopMitreDefenseEvasion,
    'T1070.001': sopMitreDefenseEvasion,
    'T1070.004': sopMitreDefenseEvasion,
    'T1562': sopMitreDefenseEvasion,
    'T1562.001': sopMitreDefenseEvasion,
    'T1027': sopMitreDefenseEvasion,
    'T1036': sopMitreDefenseEvasion,
    'T1036.005': sopMitreDefenseEvasion,
    // Discovery
    'T1087': sopMitreDiscovery,
    'T1087.001': sopMitreDiscovery,
    'T1087.002': sopMitreDiscovery,
    'T1082': sopMitreDiscovery,
    'T1083': sopMitreDiscovery,
    'T1057': sopMitreDiscovery,
    'T1018': sopMitreDiscovery,
    'T1016': sopMitreDiscovery,
    // Collection
    'T1560': sopMitreCollection,
    'T1560.001': sopMitreCollection,
    'T1074': sopMitreCollection,
    'T1074.001': sopMitreCollection,
    'T1005': sopMitreCollection,
    'T1114': sopMitreCollection,
    'T1114.001': sopMitreCollection,
    'T1114.002': sopMitreCollection,
    // Exfiltration
    'T1041': sopMitreExfiltration,
    'T1048': sopMitreExfiltration,
    'T1048.002': sopMitreExfiltration,
    'T1048.003': sopMitreExfiltration,
    'T1567': sopMitreExfiltration,
    'T1567.002': sopMitreExfiltration,
    'T1537': sopMitreExfiltration
  };
  return techniqueToSOP[techniqueId];
}

export function getMitreSOPByTactic(tacticId: string): SOPTemplate[] {
  const tacticToSOPs: Record<string, SOPTemplate[]> = {
    'TA0001': [sopMitrePhishing], // Initial Access
    'TA0002': [sopMitreExecution], // Execution
    'TA0003': [sopMitrePersistence], // Persistence
    'TA0004': [sopMitrePrivilegeEscalation], // Privilege Escalation
    'TA0005': [sopMitreDefenseEvasion], // Defense Evasion
    'TA0006': [sopMitreCredentialAccess], // Credential Access
    'TA0007': [sopMitreDiscovery], // Discovery
    'TA0008': [sopMitreLateralMovement], // Lateral Movement
    'TA0009': [sopMitreCollection], // Collection
    'TA0010': [sopMitreExfiltration], // Exfiltration
    'TA0011': [sopMitreC2], // C2
    'TA0040': [sopMitreRansomware] // Impact
  };
  return tacticToSOPs[tacticId] || [];
}
