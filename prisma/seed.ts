import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Parse DATABASE_URL or use explicit params
const dbUrl = process.env.DATABASE_URL || "postgresql://morakib:morakib_password@localhost:5433/morakib";
const url = new URL(dbUrl);

const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port || "5432"),
  database: url.pathname.slice(1).split("?")[0],
  user: url.username,
  password: url.password,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create Teams
  const blueTeam = await db.team.upsert({
    where: { name: "Blue Team Alpha" },
    update: {},
    create: {
      name: "Blue Team Alpha",
      description: "Primary SOC monitoring team",
    },
  });

  const blueTeam2 = await db.team.upsert({
    where: { name: "Blue Team Beta" },
    update: {},
    create: {
      name: "Blue Team Beta",
      description: "Secondary SOC monitoring team",
    },
  });

  console.log("✅ Teams created");

  // Create Users
  const users = await Promise.all([
    db.user.upsert({
      where: { email: "lead@morakib.local" },
      update: {},
      create: {
        email: "lead@morakib.local",
        name: "Sarah Bennani",
        role: "LEAD",
        teamId: blueTeam.id,
      },
    }),
    db.user.upsert({
      where: { email: "senior@morakib.local" },
      update: {},
      create: {
        email: "senior@morakib.local",
        name: "Karim Alaoui",
        role: "ANALYST_SENIOR",
        teamId: blueTeam.id,
      },
    }),
    db.user.upsert({
      where: { email: "analyst1@morakib.local" },
      update: {},
      create: {
        email: "analyst1@morakib.local",
        name: "Youssef Tazi",
        role: "ANALYST_JUNIOR",
        teamId: blueTeam.id,
      },
    }),
    db.user.upsert({
      where: { email: "analyst2@morakib.local" },
      update: {},
      create: {
        email: "analyst2@morakib.local",
        name: "Fatima Zahra",
        role: "ANALYST_JUNIOR",
        teamId: blueTeam2.id,
      },
    }),
  ]);

  console.log("✅ Users created");

  // Create Badges
  const badges = await Promise.all([
    db.badge.upsert({
      where: { name: "First Alert" },
      update: {},
      create: {
        name: "First Alert",
        description: "Handled your first alert",
        icon: "🎯",
        points: 10,
        condition: { type: "alerts_handled", count: 1 },
      },
    }),
    db.badge.upsert({
      where: { name: "Fast Responder" },
      update: {},
      create: {
        name: "Fast Responder",
        description: "Responded to critical alert in under 5 minutes",
        icon: "⚡",
        points: 25,
        condition: { type: "response_time", minutes: 5, severity: "CRITICAL" },
      },
    }),
    db.badge.upsert({
      where: { name: "True Positive Hunter" },
      update: {},
      create: {
        name: "True Positive Hunter",
        description: "Found 10 true positives",
        icon: "🔍",
        points: 50,
        condition: { type: "true_positives", count: 10 },
      },
    }),
    db.badge.upsert({
      where: { name: "SOP Master" },
      update: {},
      create: {
        name: "SOP Master",
        description: "Created 5 SOPs",
        icon: "📚",
        points: 100,
        condition: { type: "sops_created", count: 5 },
      },
    }),
  ]);

  console.log("✅ Badges created");

  // Create SOPs
  const sops = await Promise.all([
    db.sOP.upsert({
      where: { slug: "analyse-brute-force-ssh" },
      update: {},
      create: {
        title: "Analyse Brute Force SSH",
        slug: "analyse-brute-force-ssh",
        category: "Authentification",
        status: "PUBLISHED",
        alertTypes: ["SSH_BRUTE_FORCE", "FAILED_LOGIN"],
        contentMarkdown: `# Analyse Brute Force SSH

## Description
Procédure d'investigation des tentatives de brute force SSH.

## Checklist
- [ ] Identifier l'IP source
- [ ] Vérifier la réputation de l'IP (AbuseIPDB)
- [ ] Compter le nombre de tentatives
- [ ] Vérifier si des connexions réussies
- [ ] Analyser les comptes ciblés
- [ ] Vérifier la géolocalisation
- [ ] Documenter les findings

## Requêtes Kibana
\`\`\`
event.action:"ssh_login" AND event.outcome:"failure"
source.ip:"{source_ip}" AND event.category:"authentication"
\`\`\`
`,
        checklist: [
          "Identifier l'IP source",
          "Vérifier la réputation de l'IP (AbuseIPDB)",
          "Compter le nombre de tentatives",
          "Vérifier si des connexions réussies",
          "Analyser les comptes ciblés",
          "Vérifier la géolocalisation",
          "Documenter les findings",
        ],
        examples: [
          {
            title: "Brute force depuis IP connue malveillante",
            description: "IP avec score AbuseIPDB > 80, +1000 tentatives en 1h",
            conclusion: "TRUE_POSITIVE",
            actions: ["Bloquer IP au firewall", "Créer ticket incident"],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "analyse-trafic-dns-suspect" },
      update: {},
      create: {
        title: "Analyse Trafic DNS Suspect",
        slug: "analyse-trafic-dns-suspect",
        category: "Réseau",
        status: "PUBLISHED",
        alertTypes: ["DNS_TUNNEL", "DGA_DETECTED"],
        contentMarkdown: `# Analyse Trafic DNS Suspect

## Description
Investigation des alertes DNS tunneling et DGA.

## Checklist
- [ ] Identifier le domaine suspect
- [ ] Vérifier sur VirusTotal
- [ ] Analyser la fréquence des requêtes
- [ ] Vérifier l'entropie du domaine
- [ ] Identifier l'hôte source
- [ ] Rechercher d'autres IOCs

## Requêtes Kibana
\`\`\`
dns.question.name:*{domain}*
source.ip:"{source_ip}" AND dns.type:"query"
\`\`\`
`,
        checklist: [
          "Identifier le domaine suspect",
          "Vérifier sur VirusTotal",
          "Analyser la fréquence des requêtes",
          "Vérifier l'entropie du domaine",
          "Identifier l'hôte source",
          "Rechercher d'autres IOCs",
        ],
        createdById: users[1].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "analyse-malware-detecte" },
      update: {},
      create: {
        title: "Analyse Malware Détecté",
        slug: "analyse-malware-detecte",
        category: "Malware",
        status: "PUBLISHED",
        alertTypes: ["MALWARE_DETECTED", "RANSOMWARE"],
        contentMarkdown: `# Analyse Malware Détecté

## Description
Procédure d'investigation des détections malware.

## Checklist
- [ ] Identifier le fichier/hash
- [ ] Vérifier sur VirusTotal
- [ ] Identifier l'hôte affecté
- [ ] Vérifier la quarantaine
- [ ] Analyser la source de l'infection
- [ ] Rechercher la propagation latérale
- [ ] Vérifier les connexions C2

## Requêtes Kibana
\`\`\`
file.hash.sha256:"{hash}"
host.name:"{hostname}" AND event.category:"malware"
\`\`\`
`,
        checklist: [
          "Identifier le fichier/hash",
          "Vérifier sur VirusTotal",
          "Identifier l'hôte affecté",
          "Vérifier la quarantaine",
          "Analyser la source de l'infection",
          "Rechercher la propagation latérale",
          "Vérifier les connexions C2",
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "gestion-visite-autorites-soc" },
      update: {},
      create: {
        title: "Gestion Visite des Autorités au SOC",
        slug: "gestion-visite-autorites-soc",
        category: "Gouvernance",
        status: "PUBLISHED",
        alertTypes: ["VISITE_AUTORITE", "AUDIT_AUTORITE"],
        contentMarkdown: `# Gestion Visite des Autorités au SOC

## Description
Procédure standard pour préparer, accompagner et clôturer une visite d'autorité (régulateur, autorité judiciaire, inspection interne) au SOC.

## Checklist
- [ ] Valider l'identité et le mandat de l'autorité
- [ ] Informer RSSI, responsable SOC et direction
- [ ] Désigner un point de contact unique (POC)
- [ ] Ouvrir un journal de visite horodaté
- [ ] Limiter l'accès aux zones et systèmes autorisés
- [ ] Préparer les preuves demandées (logs, rapports, procédures)
- [ ] Flouter/masquer les données non concernées (principe de minimisation)
- [ ] Faire signer la fiche de consultation/transfert de preuves
- [ ] Noter toutes les actions réalisées pendant la visite
- [ ] Produire le compte-rendu final et le plan d'actions

## Points de contrôle conformité
- Chaîne de conservation des preuves (chain of custody)
- Respect du besoin d'en connaître
- Traçabilité complète des accès et extractions

## Modèle de journal de visite
- Date/Heure début-fin
- Nom/Entité autorité
- Objet de la demande
- Systèmes consultés
- Données extraites
- Responsable SOC présent
- Signature des parties
`,
        checklist: [
          "Valider l'identité et le mandat de l'autorité",
          "Informer RSSI, responsable SOC et direction",
          "Désigner un point de contact unique (POC)",
          "Ouvrir un journal de visite horodaté",
          "Limiter l'accès aux zones et systèmes autorisés",
          "Préparer les preuves demandées (logs, rapports, procédures)",
          "Flouter/masquer les données non concernées (principe de minimisation)",
          "Faire signer la fiche de consultation/transfert de preuves",
          "Noter toutes les actions réalisées pendant la visite",
          "Produire le compte-rendu final et le plan d'actions",
        ],
        examples: [
          {
            title: "Inspection régulateur sur incident critique",
            description: "Demande de consultation des journaux liés à un incident P1 des 72 dernières heures.",
            conclusion: "TRUE_POSITIVE",
            actions: [
              "Extraction des logs concernés uniquement",
              "Masquage des données hors périmètre",
              "Remise du PV de visite signé",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "permanence-service-general-soc" },
      update: {},
      create: {
        title: "Permanence du Service General au SOC",
        slug: "permanence-service-general-soc",
        category: "Operations",
        status: "PUBLISHED",
        alertTypes: ["PERMANENCE_SVC_GENERAL", "RELEVE_PERMANENCE"],
        contentMarkdown: `# Permanence du Service General au SOC

## Description
Procedure de permanence pour le service general supportant le SOC (ouverture/fermeture, releve, incidents logistiques et continuité de service).

## Checklist
- [ ] Prise de poste et verification des moyens (badge, radio, acces)
- [ ] Verification des locaux critiques (salle SOC, onduleurs, climatisation)
- [ ] Controle du registre visiteurs/entrants/sortants
- [ ] Verification des canaux de contact d'urgence
- [ ] Releve des incidents techniques ou logistiques en cours
- [ ] Escalade immediate des anomalies critiques au responsable d'astreinte
- [ ] Mise a jour de la main courante horodatee
- [ ] Passage de consignes en fin de permanence
- [ ] Signature de releve entre equipes

## Niveaux d'escalade
- Niveau 1: incident mineur local (traitement sur site)
- Niveau 2: impact operationnel SOC (notification responsable SOC)
- Niveau 3: indisponibilite critique (escalade direction + plan de continuite)

## Main courante minimale
- Date/heure
- Agent de permanence
- Evenement constate
- Action entreprise
- Personne notifiee
- Statut (ouvert / resolu / escalade)
`,
        checklist: [
          "Prise de poste et verification des moyens (badge, radio, acces)",
          "Verification des locaux critiques (salle SOC, onduleurs, climatisation)",
          "Controle du registre visiteurs/entrants/sortants",
          "Verification des canaux de contact d'urgence",
          "Releve des incidents techniques ou logistiques en cours",
          "Escalade immediate des anomalies critiques au responsable d'astreinte",
          "Mise a jour de la main courante horodatee",
          "Passage de consignes en fin de permanence",
          "Signature de releve entre equipes",
        ],
        examples: [
          {
            title: "Panne climatisation hors heures ouvrables",
            description: "Alerte temperature elevee en salle SOC pendant la permanence de nuit.",
            conclusion: "NEEDS_ESCALATION",
            actions: [
              "Ouverture ticket maintenance prioritaire",
              "Notification astreinte infrastructure",
              "Suivi temperature toutes les 15 minutes jusqu'au retablissement",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "nist-playbook-phishing" },
      update: {},
      create: {
        title: "NIST Playbook - Reponse Incident Phishing",
        slug: "nist-playbook-phishing",
        category: "Playbook NIST",
        status: "PUBLISHED",
        severity: "HIGH",
        estimatedTime: "30-90 min",
        alertTypes: ["PHISHING_EMAIL", "CREDENTIAL_THEFT", "MALICIOUS_URL"],
        mitreTactics: ["TA0001", "TA0006", "TA0002"],
        mitreTechniques: ["T1566", "T1566.001", "T1204", "T1078"],
        dataSources: ["Email Gateway", "Proxy Logs", "Authentication Logs", "EDR/XDR"],
        contentMarkdown: `# SOC Incident Response Playbook 2: Phishing Campaign

      ## Scenario
      One or more users receive malicious emails containing credential-harvesting links, weaponized attachments, or fake OAuth consent pages.

      ## Incident Classification

      | Category | Details |
      |---|---|
      | Incident Type | Social Engineering - Phishing |
      | Severity | High |
      | Priority | High/Critical (if privileged account affected) |
      | Detection Sources | SEG, EDR/XDR, SIEM, User Reports, IAM Logs |

      ## Phases and Actions

      ### 1. Preparation (Pre-Incident Setup)

      | Task | Tool/Action |
      |---|---|
      | Email protection baseline | SPF, DKIM, DMARC enforcement |
      | Security awareness training | Simulated phishing campaigns |
      | Logging coverage | Email gateway, proxy, endpoint, IAM logs |
      | IOC subscriptions | Threat intelligence for phishing domains and kits |

      ### 2. Detection and Analysis

      | Step | Action |
      |---|---|
      | Confirm phishing activity | Analyze headers, sender spoofing, malicious links/attachments |
      | Identify impact scope | List recipients, clicked users, credential submissions |
      | Analyze attacker behavior | Look for suspicious sign-ins, mailbox rule creation, OAuth grants |
      | MITRE ATT&CK mapping | T1566 (Phishing), T1566.001 (Spearphishing Attachment), T1204 (User Execution), T1078 (Valid Accounts) |

      ### 3. Containment

      | Step | Action |
      |---|---|
      | Block indicators | Block domains/URLs/hashes in SEG, proxy, DNS, EDR |
      | Purge emails | Remove malicious emails from all impacted mailboxes |
      | Restrict compromised users | Force session revocation and temporary account lock if needed |
      | Isolate host | If payload executed, isolate endpoint via EDR |

      ### 4. Eradication

      | Step | Action |
      |---|---|
      | Remove persistence | Delete malicious inbox rules, OAuth tokens, scheduled tasks |
      | Credential hygiene | Reset passwords, rotate secrets, re-enroll MFA |
      | Endpoint cleanup | Full AV/EDR scan and artifact removal |
      | Validate eradication | Confirm no recurring events for 24-72h |

      ### 5. Recovery

      | Step | Action |
      |---|---|
      | Restore access | Re-enable accounts after validation |
      | Enhanced monitoring | Watch IAM and mail telemetry for relapse |
      | User communication | Send targeted awareness and remediation guidance |
      | Policy reinforcement | Apply stricter anti-spoofing and SEG policies |

      ### 6. Lessons Learned and Reporting

      | Step | Action |
      |---|---|
      | Conduct post-incident review | Capture root cause and control gaps |
      | Improve detections | Tune SIEM/EDR correlation and SEG policies |
      | Document findings | Include impacted users, IOCs and timeline |
      | Share indicators | Internal SOC sharing and CTI channels if authorized |

      ## Tools Typically Involved
      - SIEM (e.g., Splunk, QRadar, Sentinel)
      - EDR/XDR (e.g., CrowdStrike, Cortex XDR, SentinelOne)
      - Secure Email Gateway (Proofpoint, Defender for O365, Mimecast)
      - IAM platform (Azure AD, Okta, Keycloak)
      - Threat intelligence feeds

      ## Success Metrics

      | Metric | Target |
      |---|---|
      | Detection Time | <10 minutes from first report/alert |
      | Containment Time | <20 minutes from confirmation |
      | Purge Completion | 100% impacted mailboxes |
      | Account Recovery | <4 hours for standard users |
      `,
        checklist: [
          "Verifier entete complet du mail (sender, return-path, DKIM/SPF/DMARC)",
          "Identifier les destinataires internes et externes touches",
          "Extraire et valider IOCs (URL, domaine, hash, IP)",
          "Bloquer IOCs sur Secure Email Gateway, DNS, proxy et EDR",
          "Rechercher clics et executions sur endpoints",
          "Reinitialiser mots de passe des comptes impactes",
          "Purger le message dans toutes les boites affectees",
          "Documenter timeline et decisions dans le dossier incident",
          "Produire un retour d'experience et mettre a jour les regles de detection",
        ],
        detection: [
          "Correlation alertes SEG + proxy + EDR",
          "Anomalies authentification (MFA fatigue, impossible travel)",
          "Detection clic URL malveillante suivie d'evenements process suspects",
        ],
        mitigation: [
          "Durcir politiques DMARC/SPF/DKIM",
          "Activer sandboxing des pieces jointes",
          "Renforcer sensibilisation utilisateurs et simulation phishing",
        ],
        procedures: [
          "Ouvrir incident P2 (ou P1 si compromission confirmee)",
          "Assigner analyste L2 et valider scope en moins de 15 min",
          "Executer containment multi-controles avant eradication",
          "Valider la recuperation avec evidences de non-reinfection",
        ],
        elkQueries: [
          {
            description: "Emails suspects contenant URL externe",
            query: "event.dataset:email* AND (email.subject:*urgent* OR email.subject:*verify*)",
          },
          {
            description: "Clic URL puis execution process anormal",
            query: "host.name:* AND event.category:(web OR process) AND url.domain:*",
          },
        ],
        examples: [
          {
            title: "Phishing O365 avec page de login clonee",
            description: "Multiple users ont clique une URL frauduleuse et saisi leurs identifiants.",
            conclusion: "TRUE_POSITIVE",
            actions: [
              "Blocage domaine phishing",
              "Reset passwords + revocation sessions",
              "Purge du mail + communication interne",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "nist-playbook-ransomware" },
      update: {},
      create: {
        title: "NIST Playbook - Reponse Incident Ransomware",
        slug: "nist-playbook-ransomware",
        category: "Playbook NIST",
        status: "PUBLISHED",
        severity: "CRITICAL",
        estimatedTime: "1-4 heures",
        alertTypes: ["RANSOMWARE", "MASS_ENCRYPTION", "C2_ACTIVITY"],
        mitreTactics: ["TA0002", "TA0005", "TA0040", "TA0011"],
        mitreTechniques: ["T1486", "T1059", "T1027", "T1490"],
        dataSources: ["EDR/XDR", "Windows Event Logs", "File Monitoring", "Network Traffic"],
        contentMarkdown: `# SOC Incident Response Playbook 1: Ransomware Infection

      ## Scenario
      An endpoint or server exhibits signs of ransomware activity such as file encryption, ransom notes, or alerts from EDR/XDR tools.

      ## Incident Classification

      | Category | Details |
      |---|---|
      | Incident Type | Malware - Ransomware |
      | Severity | High |
      | Priority | Critical (due to potential business impact and data loss) |
      | Detection Sources | EDR/XDR, SIEM, User Report, Antivirus, NDR |

      ## Phases and Actions

      ### 1. Preparation (Pre-Incident Setup)

      | Task | Tool/Action |
      |---|---|
      | Backup and recovery strategy | Periodic offline backups, test restoration |
      | Endpoint protection | EDR with behavioural detection and rollback features |
      | User awareness training | Email and USB media handling education |
      | Logging coverage | Windows logs, Sysmon, file access logs, network flows |
      | IOC and threat feed subscriptions | Include ransomware-specific indicators |

      ### 2. Detection and Analysis

      | Step | Action |
      |---|---|
      | Confirm ransomware activity | EDR alert, presence of ransom note, encrypted file extensions |
      | Isolate affected host | Disconnect from the network or use EDR containment |
      | Identify ransomware strain | Based on ransom note, file hash or filename pattern |
      | Analyse logs and behaviour | Track source of execution, lateral movement, suspicious scheduled tasks or services |
      | MITRE ATT&CK mapping | T1486 (Data Encrypted for Impact), T1059 (Command Execution), T1021.002 (SMB Lateral Movement) |

      ### 3. Containment

      | Step | Action |
      |---|---|
      | Isolate affected systems | Block at switch, firewall or via EDR |
      | Disable infected accounts | Especially if used for lateral movement |
      | Block external communication | Prevent C2 and key exchange over the internet |
      | Snapshot impacted systems | For forensic analysis (if required) |

      ### 4. Eradication

      | Step | Action |
      |---|---|
      | Remove malware artifacts | Delete ransomware files, scripts, scheduled tasks |
      | Patch vulnerabilities | Address exploited attack vectors such as RDP, SMB, outdated software |
      | Perform full antivirus/EDR scan | Across all hosts within affected VLAN/subnet |
      | Validate removal | Ensure no persistence mechanisms remain (registry keys, startup items, services) |

      ### 5. Recovery

      | Step | Action |
      |---|---|
      | Restore from clean backup | Confirm backups are unaffected before restoration |
      | Rebuild systems if needed | For systems without clean backups |
      | Monitor restored systems | Use SIEM and EDR to ensure no reinfection occurs |
      | Reset passwords | Particularly for privileged and affected users |

      ### 6. Lessons Learned and Reporting

      | Step | Action |
      |---|---|
      | Conduct post-incident review | Analyse root cause, initial access method and response efficiency |
      | Update detection rules | Enhance SIEM and EDR correlation rules and triggers |
      | Document findings | Include indicators, affected systems and timeline |
      | Share IOCs | Internally and with threat intel communities if allowed |

      ## Tools Typically Involved
      - SIEM (e.g., Splunk, QRadar, Sentinel)
      - EDR/XDR (e.g., CrowdStrike, Cortex XDR, SentinelOne)
      - Forensics tools (e.g., FTK, Velociraptor, KAPE)
      - Network logs (e.g., Zeek, Suricata, NetFlow)
      - Backup systems (e.g., Veeam, Rubrik, Commvault)

      ## Success Metrics

      | Metric | Target |
      |---|---|
      | Detection Time | <10 minutes from encryption onset |
      | Isolation Time | <15 minutes after detection |
      | Recovery Time | Depends on backup availability, ideally <24 hours |
      | Containment Scope | No lateral movement outside original VLAN |
      `,
        checklist: [
          "Declarer incident majeur et activer cellule de crise",
          "Isoler immediatement machines suspectes (reseau/EDR)",
          "Identifier vecteur initial et etendue laterale",
          "Bloquer IOCs (hash/IP/domaines) dans tous les controles",
          "Preserver evidences forensiques (memoire, disque, logs)",
          "Verifier integrite et disponibilite des sauvegardes",
          "Restaurer systemes prioritaires selon ordre de criticite",
          "Surveiller rechute pendant 72h apres remise en production",
          "Produire rapport final + plan d'actions correctives",
        ],
        detection: [
          "Pic operations de renommage/chiffrement fichiers",
          "Execution processus outillage chiffrement connu",
          "Suppression shadow copies ou commandes backup anormales",
        ],
        mitigation: [
          "Segmentation reseau et blocage SMB lateral",
          "MFA admin + PAM + principe du moindre privilege",
          "Sauvegardes offline/immutables et tests de restauration",
        ],
        procedures: [
          "Prioriser containment avant toute tentative de nettoyage",
          "Eviter redemarrage non controle des hotes compromis",
          "Coordonner IT, juridique, communication et direction",
        ],
        elkQueries: [
          {
            description: "Commandes suppression sauvegardes",
            query: "process.command_line:(*vssadmin* OR *wbadmin* OR *bcdedit*)",
          },
          {
            description: "Extensions de fichiers chiffrees anormales",
            query: "file.extension:(*.locked OR *.encrypted OR *.crypt)",
          },
        ],
        examples: [
          {
            title: "Chiffrement massif sur partage fichiers",
            description: "Propagation laterale depuis compte admin compromis.",
            conclusion: "TRUE_POSITIVE",
            actions: [
              "Isolation VLAN urgence",
              "Reset comptes privilegies",
              "Restauration NAS depuis backup immuable",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "nist-playbook-data-exfiltration" },
      update: {},
      create: {
        title: "NIST Playbook - Reponse Exfiltration de Donnees",
        slug: "nist-playbook-data-exfiltration",
        category: "Playbook NIST",
        status: "PUBLISHED",
        severity: "CRITICAL",
        estimatedTime: "45-180 min",
        alertTypes: ["DATA_EXFIL", "LARGE_UPLOAD", "DNS_TUNNEL"],
        mitreTactics: ["TA0010", "TA0011", "TA0012"],
        mitreTechniques: ["T1041", "T1048", "T1567", "T1071.004"],
        dataSources: ["Proxy Logs", "Firewall", "DNS Logs", "DLP", "Cloud Audit Logs"],
        contentMarkdown: `# SOC Incident Response Playbook 3: Data Exfiltration

      ## Scenario
      Abnormal outbound transfers suggest sensitive data exfiltration through web, cloud storage, DNS tunneling, or encrypted channels.

      ## Incident Classification

      | Category | Details |
      |---|---|
      | Incident Type | Data Exfiltration |
      | Severity | Critical |
      | Priority | Critical |
      | Detection Sources | SIEM, DLP, Firewall, Proxy, DNS, CASB |

      ## Phases and Actions

      ### 1. Preparation (Pre-Incident Setup)

      | Task | Tool/Action |
      |---|---|
      | Data classification | Label critical and regulated datasets |
      | Egress controls | DLP policies, proxy restrictions, DNS controls |
      | Logging coverage | Network egress, IAM, endpoint, cloud audit |
      | Threat intel | Exfil domains/IP watchlists |

      ### 2. Detection and Analysis

      | Step | Action |
      |---|---|
      | Confirm exfil pattern | Validate unusual volume, destination, protocol |
      | Scope impact | Determine data type, volume, systems and users |
      | Trace initial access | Correlate with identity compromise or malware |
      | MITRE ATT&CK mapping | T1041 (Exfiltration Over C2 Channel), T1048 (Exfiltration Over Alternative Protocol), T1567 (Exfiltration to Cloud Storage), T1071.004 (DNS) |

      ### 3. Containment

      | Step | Action |
      |---|---|
      | Block outbound channels | Firewall/proxy/DNS/CASB policy enforcement |
      | Restrict accounts | Disable or reduce privileges for suspicious users |
      | Isolate hosts | Contain endpoints involved in transfer |
      | Preserve evidence | Capture logs, packet metadata, forensic snapshots |

      ### 4. Eradication

      | Step | Action |
      |---|---|
      | Remove attacker foothold | Delete persistence and unauthorized tools |
      | Revoke abusive access | Tokens, API keys, OAuth grants, stale sessions |
      | Patch root vectors | Misconfigurations and vulnerable services |
      | Validate cleanup | Confirm no active egress anomalies remain |

      ### 5. Recovery

      | Step | Action |
      |---|---|
      | Restore trusted operations | Re-enable approved data workflows |
      | Monitor for relapse | Enhanced alerting for 72 hours+ |
      | Compliance workflow | Trigger legal/privacy notifications as required |
      | Strengthen controls | Tighten data egress and segmentation policies |

      ### 6. Lessons Learned and Reporting

      | Step | Action |
      |---|---|
      | Incident review | Capture root cause and control failures |
      | Improve detection | Tune DLP and SIEM exfil analytics |
      | Document impact | Affected data classes, scope and timeline |
      | Share IOCs | Internal SOC and approved external partners |

      ## Tools Typically Involved
      - SIEM + UEBA
      - DLP + CASB
      - Firewall/Proxy/DNS telemetry
      - Cloud audit logs
      - Network forensics tools

      ## Success Metrics

      | Metric | Target |
      |---|---|
      | Detection Time | <15 minutes after anomalous transfer |
      | Containment Time | <20 minutes from confirmation |
      | Data Loss Scope | Minimized to initial source set |
      | Notification SLA | Within regulatory deadlines |
      `,
        checklist: [
          "Identifier donnees concernees (PII, secrets, proprietaire)",
          "Estimer volume et fenetre temporelle de fuite",
          "Bloquer canaux d'exfiltration identifies",
          "Suspendre ou limiter comptes suspects",
          "Conserver preuves pour forensique et legal",
          "Notifier DPO/juridique/RSSI selon criticite",
          "Verifier absence de backdoor residuelle",
          "Mettre en place monitoring renforce post-incident",
        ],
        detection: [
          "Anomalies de volume sortant vers destinations rares",
          "Requetes DNS volumineuses encodees",
          "Upload cloud inhabituel hors horaires",
        ],
        mitigation: [
          "DLP egress blocking et classification donnees",
          "Zero Trust pour acces aux actifs sensibles",
          "Tokenisation/chiffrement donnees critiques",
        ],
        procedures: [
          "Consolider timeline complete des transferts",
          "Confronter logs reseau + endpoint + IAM",
          "Declencher workflow notification reglementaire si requis",
        ],
        elkQueries: [
          {
            description: "Flux sortants volumineux inhabituels",
            query: "network.direction:egress AND network.bytes:>50000000",
          },
          {
            description: "DNS tunneling potentiel",
            query: "dns.question.name:* AND dns.question.name_length:>50",
          },
        ],
        examples: [
          {
            title: "Exfiltration via stockage cloud personnel",
            description: "Upload massif de fichiers sensibles depuis poste utilisateur.",
            conclusion: "TRUE_POSITIVE",
            actions: [
              "Blocage service cloud non autorise",
              "Suspension compte + investigation RH",
              "Notification conformite et direction",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
    db.sOP.upsert({
      where: { slug: "nist-playbook-compromission-compte" },
      update: {},
      create: {
        title: "NIST Playbook - Reponse Compromission de Compte",
        slug: "nist-playbook-compromission-compte",
        category: "Playbook NIST",
        status: "PUBLISHED",
        severity: "HIGH",
        estimatedTime: "20-90 min",
        alertTypes: ["ACCOUNT_COMPROMISE", "IMPOSSIBLE_TRAVEL", "MFA_BYPASS"],
        mitreTactics: ["TA0001", "TA0006", "TA0003", "TA0004"],
        mitreTechniques: ["T1110", "T1078", "T1556", "T1098"],
        dataSources: ["Identity Provider Logs", "Authentication Logs", "EDR/XDR", "Cloud Audit Logs"],
        contentMarkdown: `# SOC Incident Response Playbook 4: Account Compromise

      ## Scenario
      A user or privileged account is suspected compromised due to abnormal logins, impossible travel, MFA abuse, mailbox manipulation, or unauthorized privilege changes.

      ## Incident Classification

      | Category | Details |
      |---|---|
      | Incident Type | Identity Compromise |
      | Severity | High |
      | Priority | High/Critical for privileged accounts |
      | Detection Sources | IAM logs, SIEM, EDR/XDR, User reports |

      ## Phases and Actions

      ### 1. Preparation (Pre-Incident Setup)

      | Task | Tool/Action |
      |---|---|
      | IAM hardening | Conditional access, MFA, risk-based policies |
      | Privileged account controls | PAM/JIT, break-glass governance |
      | Logging coverage | Auth events, token activity, admin actions |
      | Playbook readiness | Incident runbooks and escalation matrix |

      ### 2. Detection and Analysis

      | Step | Action |
      |---|---|
      | Confirm compromise indicators | Impossible travel, suspicious device/IP, MFA anomalies |
      | Evaluate blast radius | Accessed systems, data and privileges |
      | Detect persistence | OAuth apps, forwarding rules, delegated access |
      | MITRE ATT&CK mapping | T1110 (Brute Force), T1078 (Valid Accounts), T1556 (Modify Authentication Process), T1098 (Account Manipulation) |

      ### 3. Containment

      | Step | Action |
      |---|---|
      | Invalidate sessions | Force global sign-out |
      | Lock or limit account | Temporary suspension if active abuse |
      | Revoke risky grants | Tokens, app consent, delegated permissions |
      | Protect privileged assets | Emergency ACL and admin account review |

      ### 4. Eradication

      | Step | Action |
      |---|---|
      | Remove persistence | Delete mailbox rules, rogue apps, unauthorized keys |
      | Rotate credentials | Passwords, API secrets, service keys |
      | Patch root causes | Misconfigurations and weak policy controls |
      | Validate cleanup | No anomalous auth activity after remediation |

      ### 5. Recovery

      | Step | Action |
      |---|---|
      | Restore user access | Controlled reactivation with strong auth |
      | Increase monitoring | Risk alerts and high-sensitivity detections |
      | User support | Guidance on secure account usage |
      | Privileged review | Confirm privileged group memberships are clean |

      ### 6. Lessons Learned and Reporting

      | Step | Action |
      |---|---|
      | Incident retrospective | Root cause and control gap review |
      | Improve detections | Tune IAM/SIEM correlation and alerts |
      | Policy hardening | Update MFA and privilege management standards |
      | Share indicators | Internal SOC lessons and approved CTI sharing |

      ## Tools Typically Involved
      - IAM platform (Azure AD, Okta, Keycloak)
      - SIEM and UEBA
      - EDR/XDR
      - Mail security and audit tooling
      - PAM solutions

      ## Success Metrics

      | Metric | Target |
      |---|---|
      | Detection Time | <10 minutes from risky auth signal |
      | Session Revocation Time | <10 minutes from confirmation |
      | Privileged Exposure Window | <15 minutes |
      | Recurrence Rate | 0 repeat compromise for same account |
      `,
        checklist: [
          "Confirmer indicateurs de compromission (IoC/IoA IAM)",
          "Invalider toutes les sessions actives",
          "Reinitialiser mot de passe + secrets applicatifs",
          "Verifier et retirer applications OAuth suspectes",
          "Auditer regles de messagerie et delegations",
          "Verifier elevation de privilege non autorisee",
          "Activer surveillance renforcee 7 jours",
          "Communiquer au proprietaire du compte et management",
        ],
        detection: [
          "Impossible travel ou authentification pays atypique",
          "Multiples echecs MFA puis succes suspect",
          "Creation de regles mail forwarding externes",
        ],
        mitigation: [
          "Conditional Access par risque et contexte",
          "Phishing-resistant MFA pour comptes privilegies",
          "Revue periodique des comptes et permissions",
        ],
        procedures: [
          "Associer evenement IAM avec activites endpoint",
          "Verifier chaines de delegation et consentements",
          "Escalader au lead si compte privilegie impacte",
        ],
        elkQueries: [
          {
            description: "Impossible travel authentification",
            query: "event.category:authentication AND risk.level:(high OR critical)",
          },
          {
            description: "Ajout suspect de regle mail",
            query: "event.action:(mailbox_rule_created OR inbox_rule_added)",
          },
        ],
        examples: [
          {
            title: "Compte finance compromis par credential stuffing",
            description: "Connexion depuis geoloc anormale et creation de regles d'exfiltration mail.",
            conclusion: "TRUE_POSITIVE",
            actions: [
              "Invalidation sessions globales",
              "Reset identifiants + MFA reset",
              "Suppression regles malveillantes",
            ],
          },
        ],
        createdById: users[0].id,
      },
    }),
  ]);

  console.log("✅ SOPs created");

  // Create Alerts
  const alerts = await Promise.all([
    db.alert.create({
      data: {
        title: "SSH Brute Force depuis 185.234.xx.xx",
        description: "1247 tentatives de connexion SSH échouées en 30 minutes",
        severity: "HIGH",
        status: "NEW",
        source: "SURICATA",
        sourceIp: "185.234.219.47",
        destIp: "192.168.1.10",
        destPort: 22,
        protocol: "TCP",
        ruleName: "ET COMPROMISED Host Traffic",
        ruleId: "2024897",
        enrichmentData: {
          abuseipdb: { score: 92, country: "RU", reports: 156 },
          virustotal: { detected: true, engines: 8 },
        },
      },
    }),
    db.alert.create({
      data: {
        title: "Connexion DNS vers domaine DGA détecté",
        description: "Requêtes DNS vers xkj7h2m9.xyz avec haute entropie",
        severity: "CRITICAL",
        status: "NEW",
        source: "ZEEK",
        sourceIp: "192.168.1.45",
        destIp: "8.8.8.8",
        destPort: 53,
        protocol: "UDP",
        ruleName: "DNS_DGA_DETECTED",
        enrichmentData: {
          entropy: 4.2,
          domain: "xkj7h2m9.xyz",
          virustotal: { malicious: 12 },
        },
      },
    }),
    db.alert.create({
      data: {
        title: "Tentative de scan de ports",
        description: "Scan SYN détecté depuis IP externe",
        severity: "MEDIUM",
        status: "INVESTIGATING",
        source: "SURICATA",
        sourceIp: "45.227.252.87",
        destIp: "192.168.1.0/24",
        protocol: "TCP",
        ruleName: "ET SCAN Potential SYN Scan",
        assignedToId: users[2].id,
      },
    }),
    db.alert.create({
      data: {
        title: "Téléchargement fichier executable suspect",
        description: "PE32 téléchargé depuis domaine suspect",
        severity: "HIGH",
        status: "ESCALATED",
        source: "ZEEK",
        sourceIp: "192.168.1.89",
        destIp: "104.21.45.123",
        destPort: 443,
        protocol: "TCP",
        enrichmentData: {
          filename: "update.exe",
          sha256: "a7b9c3d4e5f6...",
          virustotal: { detected: true, engines: 42 },
        },
        assignedToId: users[1].id,
      },
    }),
    db.alert.create({
      data: {
        title: "Authentification Windows suspecte",
        description: "Pass-the-Hash détecté sur contrôleur de domaine",
        severity: "CRITICAL",
        status: "NEW",
        source: "ELASTIC",
        sourceIp: "192.168.1.78",
        destIp: "192.168.1.5",
        destPort: 445,
        protocol: "SMB",
        ruleName: "Windows PtH Attack",
      },
    }),
  ]);

  console.log("✅ Alerts created");

  // Create some metrics for leaderboard
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const user of users.slice(0, 3)) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      await db.analystMetric.upsert({
        where: {
          analystId_date: {
            analystId: user.id,
            date,
          },
        },
        update: {},
        create: {
          analystId: user.id,
          date,
          alertsProcessed: Math.floor(Math.random() * 15) + 5,
          truePositives: Math.floor(Math.random() * 5),
          falsePositives: Math.floor(Math.random() * 8),
          escalations: Math.floor(Math.random() * 2),
          avgResolutionTimeMin: Math.floor(Math.random() * 20) + 5,
        },
      });
    }
  }

  console.log("✅ Metrics created");

  // Assign badges to users
  await db.userBadge.createMany({
    data: [
      { userId: users[0].id, badgeId: badges[0].id },
      { userId: users[0].id, badgeId: badges[2].id },
      { userId: users[0].id, badgeId: badges[3].id },
      { userId: users[1].id, badgeId: badges[0].id },
      { userId: users[1].id, badgeId: badges[1].id },
      { userId: users[2].id, badgeId: badges[0].id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ User badges assigned");
  console.log("\n🎉 Database seeded successfully!");
  console.log("\nDemo accounts:");
  console.log("  - lead@morakib.local (Lead)");
  console.log("  - senior@morakib.local (Senior Analyst)");
  console.log("  - analyst1@morakib.local (Junior Analyst)");
  console.log("  - analyst2@morakib.local (Junior Analyst)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
