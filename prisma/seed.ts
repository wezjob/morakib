import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
