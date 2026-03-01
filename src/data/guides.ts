/**
 * Guides de Formation SOC - Production Ready
 * 5 guides complets pour analystes SOC N1/N2
 */

export interface GuideStep {
  id: number;
  title: string;
  content: string;
  tips?: string[];
  commands?: { description: string; command: string }[];
  checklist?: string[];
  image?: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  category: string;
  tags: string[];
  objectives: string[];
  prerequisites: string[];
  steps: GuideStep[];
  conclusion: string;
  resources: { title: string; url: string }[];
}

export const guides: Guide[] = [
  // ============================================
  // GUIDE 1: SSH Brute Force Analysis
  // ============================================
  {
    id: "ssh-brute-force",
    title: "Analyser une attaque SSH Brute Force",
    description: "Guide complet pour identifier, analyser et répondre aux tentatives de brute force SSH. Apprenez à différencier une attaque automatisée d'une tentative ciblée.",
    duration: "20 min",
    level: "Débutant",
    category: "Authentification",
    tags: ["SSH", "Brute Force", "Authentication", "Suricata", "Linux"],
    objectives: [
      "Identifier les signatures d'une attaque brute force SSH",
      "Analyser les logs pour déterminer l'origine et la cible",
      "Évaluer le risque et l'impact potentiel",
      "Documenter correctement l'investigation",
      "Appliquer les mesures de remédiation appropriées"
    ],
    prerequisites: [
      "Connaissance de base du protocole SSH",
      "Accès à Kibana/Elasticsearch",
      "Familiarité avec les commandes Linux de base"
    ],
    steps: [
      {
        id: 1,
        title: "Identification de l'alerte",
        content: `## Comprendre l'alerte SSH Brute Force

Lorsque vous recevez une alerte SSH Brute Force, les informations clés à noter sont:

- **IP Source**: L'adresse d'où provient l'attaque
- **IP Destination**: Le serveur ciblé
- **Nombre de tentatives**: Volume d'essais en un temps donné
- **Timestamp**: Heure de début et durée de l'attaque

### Critères typiques d'une alerte Brute Force

| Indicateur | Seuil typique |
|------------|---------------|
| Tentatives échouées | > 5 en 60 secondes |
| IPs sources distinctes | 1 (attaque simple) ou N (attaque distribuée) |
| Comptes ciblés | root, admin, ou comptes valides |

### Exemple de règle Suricata
\`\`\`
alert ssh any any -> $HOME_NET 22 (msg:"LABSOC SSH Brute Force Attempt"; 
  flow:to_server,established; threshold:type threshold, track by_src, 
  count 5, seconds 60; sid:1000001; rev:1;)
\`\`\``,
        tips: [
          "Une attaque brute force génère généralement des logs 'authentication failure'",
          "Vérifiez si l'IP source est connue dans votre infrastructure",
          "Notez l'heure: les attaques automatisées se produisent souvent la nuit"
        ],
        checklist: [
          "Noter l'IP source de l'alerte",
          "Noter l'IP destination (serveur ciblé)",
          "Vérifier le nombre de tentatives",
          "Identifier l'heure de l'incident"
        ]
      },
      {
        id: 2,
        title: "Collecte des logs",
        content: `## Recherche des logs associés dans Kibana

Pour avoir une vision complète de l'incident, vous devez collecter les logs suivants:

### 1. Logs SSH (auth.log / secure)

Recherchez les tentatives de connexion échouées:

\`\`\`bash
# Sur le serveur cible (si accès direct)
grep "Failed password" /var/log/auth.log | grep "IP_SOURCE"
grep "Invalid user" /var/log/auth.log | grep "IP_SOURCE"
\`\`\`

### 2. Requête Kibana KQL

\`\`\`
source.ip: "192.168.1.100" AND event.category: "authentication" 
AND event.outcome: "failure"
\`\`\`

### 3. Analyse temporelle

Utilisez une agrégation pour voir la distribution:

\`\`\`json
{
  "aggs": {
    "attempts_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1m"
      }
    }
  }
}
\`\`\``,
        commands: [
          {
            description: "Rechercher les échecs d'authentification SSH pour une IP",
            command: 'source.ip: "IP_SOURCE" AND event.action: ("ssh_failed" OR "authentication_failure")'
          },
          {
            description: "Compter les tentatives par minute",
            command: 'source.ip: "IP_SOURCE" AND destination.port: 22 | stats count() by @timestamp span=1m'
          },
          {
            description: "Lister les comptes ciblés",
            command: 'source.ip: "IP_SOURCE" AND event.category: "authentication" | stats count() by user.name'
          }
        ],
        tips: [
          "Exportez les résultats pour les garder comme preuve",
          "Vérifiez si d'autres ports sont ciblés par la même IP",
          "Regardez si des connexions ont réussi après les échecs"
        ],
        checklist: [
          "Collecter les logs auth.log/secure",
          "Exécuter la requête Kibana",
          "Noter le nombre total de tentatives",
          "Identifier les comptes ciblés"
        ]
      },
      {
        id: 3,
        title: "Enrichissement des IOCs",
        content: `## Enrichir l'IP source avec des sources externes

### 1. AbuseIPDB
Vérifiez la réputation de l'IP:

- **Score > 75%**: IP malveillante connue
- **Reports > 10**: Signalements multiples
- **Pays d'origine**: Peut indiquer le type d'attaque

### 2. VirusTotal
Recherchez l'IP pour voir:
- Détections par moteurs de sécurité
- Domaines associés
- Historique d'activité

### 3. Shodan
Identifiez le profil de l'attaquant:
- Services exposés
- Système d'exploitation
- Potentiellement un serveur compromis

### 4. Whois
Obtenez les informations d'enregistrement:

\`\`\`bash
whois 192.168.1.100
\`\`\`

### Tableau de décision

| AbuseIPDB Score | VirusTotal | Action recommandée |
|-----------------|------------|-------------------|
| > 90% | Malicious | Bloquer immédiatement |
| 50-90% | Suspicious | Bloquer + Escalader |
| < 50% | Clean | Investiguer IP légitime? |
| 0% | Unknown | Vérifier contexte interne |`,
        commands: [
          {
            description: "Requête AbuseIPDB (API)",
            command: 'curl -G "https://api.abuseipdb.com/api/v2/check" -d "ipAddress=IP_SOURCE" -H "Key: YOUR_API_KEY"'
          },
          {
            description: "Whois rapide",
            command: "whois IP_SOURCE | grep -E 'OrgName|Country|NetRange'"
          }
        ],
        tips: [
          "Documentez toutes les sources consultées",
          "Un score AbuseIPDB de 0 peut signifier une nouvelle IP malveillante",
          "Vérifiez si l'IP appartient à un hébergeur cloud (AWS, GCP, etc.)"
        ],
        checklist: [
          "Vérifier AbuseIPDB",
          "Rechercher sur VirusTotal",
          "Consulter Shodan si pertinent",
          "Documenter les résultats d'enrichissement"
        ]
      },
      {
        id: 4,
        title: "Analyse de l'impact",
        content: `## Évaluer l'impact et le succès de l'attaque

### Questions critiques à répondre:

1. **L'attaque a-t-elle réussi?**
   - Y a-t-il eu des connexions réussies après les échecs?
   - Des sessions SSH établies depuis l'IP source?

2. **Quels comptes ont été ciblés?**
   - Comptes génériques (root, admin)?
   - Comptes utilisateurs valides? (plus inquiétant)

3. **Le serveur est-il critique?**
   - Serveur de production?
   - Accès à des données sensibles?

### Requête pour vérifier les succès

\`\`\`
source.ip: "IP_SOURCE" AND destination.port: 22 
AND event.outcome: "success"
\`\`\`

### Scénarios possibles

| Scénario | Impact | Action |
|----------|--------|--------|
| Échecs uniquement | Faible | Bloquer IP |
| 1 succès, déconnexion rapide | Moyen | Vérifier compte, changer mdp |
| Succès + sessions longues | Critique | Incident majeur, contenir |
| Comptes valides ciblés | Élevé | Possible reconnaissance préalable |

### Vérification de compromission

Si une connexion a réussi, vérifiez sur le serveur:

\`\`\`bash
# Dernières connexions
last -a | grep "IP_SOURCE"

# Processus suspects
ps auxww | grep -E 'wget|curl|nc|\./'

# Fichiers récemment modifiés
find /tmp /var/tmp -type f -mmin -60

# Crontabs modifiées
ls -la /var/spool/cron/
\`\`\``,
        tips: [
          "Un succès après de nombreux échecs indique que le mot de passe a été trouvé",
          "Vérifiez les logs de commandes (bash_history) si possible",
          "Recherchez des indicateurs de persistence (crontab, services)"
        ],
        checklist: [
          "Vérifier s'il y a eu des connexions réussies",
          "Identifier les comptes compromis éventuels",
          "Évaluer la criticité du serveur",
          "Documenter le niveau d'impact"
        ]
      },
      {
        id: 5,
        title: "Remédiation",
        content: `## Actions de remédiation

### 1. Blocage immédiat de l'IP

\`\`\`bash
# Avec iptables
sudo iptables -A INPUT -s IP_SOURCE -j DROP

# Avec ufw
sudo ufw deny from IP_SOURCE

# Avec fail2ban (recommandé)
sudo fail2ban-client set sshd banip IP_SOURCE
\`\`\`

### 2. Si compromission détectée

\`\`\`bash
# Forcer la déconnexion de l'attaquant
pkill -u <compromised_user>

# Désactiver le compte temporairement
sudo usermod -L <compromised_user>

# Changer le mot de passe
sudo passwd <compromised_user>

# Révoquer les clés SSH
rm /home/<user>/.ssh/authorized_keys
\`\`\`

### 3. Renforcement à long terme

| Action | Priorité | Difficulté |
|--------|----------|------------|
| Activer fail2ban | Haute | Faible |
| Désactiver root SSH | Haute | Faible |
| Clés SSH uniquement | Haute | Moyenne |
| Port SSH non-standard | Moyenne | Faible |
| 2FA (Google Auth) | Haute | Moyenne |

### Configuration fail2ban recommandée

\`\`\`ini
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
\`\`\``,
        commands: [
          {
            description: "Bloquer l'IP avec iptables",
            command: "sudo iptables -A INPUT -s IP_SOURCE -j DROP"
          },
          {
            description: "Bannir avec fail2ban",
            command: "sudo fail2ban-client set sshd banip IP_SOURCE"
          },
          {
            description: "Vérifier les IPs bannies",
            command: "sudo fail2ban-client status sshd"
          }
        ],
        tips: [
          "Documentez toutes les actions de remédiation",
          "Informez l'équipe infrastructure des changements",
          "Planifiez un audit de sécurité post-incident"
        ],
        checklist: [
          "Bloquer l'IP source",
          "Changer les mots de passe si nécessaire",
          "Activer/configurer fail2ban",
          "Documenter les actions prises"
        ]
      },
      {
        id: 6,
        title: "Documentation et clôture",
        content: `## Documenter l'investigation

### Rapport d'incident - Structure

1. **Résumé exécutif**
   - Type d'incident: Brute Force SSH
   - Date/Heure: [TIMESTAMP]
   - Statut: Résolu / En cours
   - Impact: Aucun / Compromission détectée

2. **Chronologie**
   - Heure de détection
   - Heure de début de l'attaque
   - Durée totale
   - Actions prises avec timestamps

3. **Indicateurs de compromission (IOCs)**
   - IP Source: X.X.X.X
   - Port: 22
   - Comptes ciblés: [liste]
   - Résultat: Échec / Succès

4. **Actions prises**
   - Blocage IP: [timestamp]
   - Changement mdp: [si applicable]
   - Renforcement: [mesures]

5. **Recommandations**
   - Court terme: [actions]
   - Long terme: [améliorations]

### Template de ticket

\`\`\`
Titre: [INCIDENT] SSH Brute Force - IP X.X.X.X vers SERVEUR

Sévérité: MEDIUM/HIGH
Statut: RESOLVED

RÉSUMÉ:
Tentative de brute force SSH détectée de X.X.X.X vers [serveur].
[N] tentatives en [durée]. Aucune connexion réussie.

IOCs:
- Source IP: X.X.X.X (AbuseIPDB: XX%)
- Target: [serveur]:22
- Accounts: root, admin

ACTIONS:
- [HH:MM] IP bloquée via fail2ban
- [HH:MM] Logs exportés comme preuve

RECOMMANDATIONS:
- Activer 2FA sur les serveurs critiques
- Audit des accès SSH
\`\`\``,
        tips: [
          "Gardez une copie des logs comme preuve",
          "Partagez les IOCs avec l'équipe pour enrichir les règles",
          "Mettez à jour les playbooks si nécessaire"
        ],
        checklist: [
          "Remplir le rapport d'incident",
          "Exporter et archiver les preuves",
          "Mettre à jour le ticket/case",
          "Partager les IOCs si pertinent",
          "Clôturer l'alerte dans le SIEM"
        ]
      }
    ],
    conclusion: `## Félicitations! 🎉

Vous avez complété l'analyse d'une attaque SSH Brute Force. Vous savez maintenant:

- Identifier les signatures d'une attaque brute force
- Collecter et analyser les logs pertinents
- Enrichir les IOCs avec des sources externes
- Évaluer l'impact et détecter une compromission
- Appliquer les mesures de remédiation
- Documenter correctement l'incident

### Points clés à retenir

1. La majorité des brute force SSH sont automatisés et non ciblés
2. Un succès après de nombreux échecs = mot de passe trouvé
3. fail2ban est votre ami pour la protection automatique
4. Documentez TOUT pour les futures investigations`,
    resources: [
      { title: "fail2ban Documentation", url: "https://fail2ban.org/wiki/index.php/Main_Page" },
      { title: "AbuseIPDB", url: "https://www.abuseipdb.com/" },
      { title: "SSH Hardening Guide", url: "https://www.ssh.com/academy/ssh/security" }
    ]
  },

  // ============================================
  // GUIDE 2: DNS Tunneling Detection
  // ============================================
  {
    id: "dns-tunneling",
    title: "Détecter l'exfiltration par DNS Tunneling",
    description: "Apprenez à identifier les tentatives d'exfiltration de données utilisant le protocole DNS comme canal caché. Techniques d'analyse des requêtes DNS suspectes.",
    duration: "30 min",
    level: "Intermédiaire",
    category: "Exfiltration",
    tags: ["DNS", "Exfiltration", "Tunneling", "Zeek", "Data Loss"],
    objectives: [
      "Comprendre le fonctionnement du DNS tunneling",
      "Identifier les patterns suspects dans les requêtes DNS",
      "Analyser les logs Zeek/DNS pour détecter l'exfiltration",
      "Calculer les métriques d'entropie et de volume",
      "Bloquer et remédier aux tentatives détectées"
    ],
    prerequisites: [
      "Connaissance du protocole DNS",
      "Accès aux logs Zeek/PassiveDNS",
      "Compréhension de base de l'encodage Base64"
    ],
    steps: [
      {
        id: 1,
        title: "Comprendre le DNS Tunneling",
        content: `## Qu'est-ce que le DNS Tunneling?

Le DNS Tunneling est une technique d'exfiltration qui utilise les requêtes DNS pour transférer des données. Les attaquants profitent du fait que le DNS est rarement bloqué ou inspecté.

### Fonctionnement

\`\`\`
Attaquant                       Serveur DNS Malveillant
    |                                    |
    |-- Données encodées en Base64 ----> |
    |   (sous-domaine de evil.com)       |
    |                                    |
    |<-- Réponse avec commandes -------- |
    |   (encodées dans TXT/CNAME)        |
\`\`\`

### Exemple de requête suspecte

\`\`\`
SGVsbG8gV29ybGQh.data.evil-domain.com
^^^^^^^^^^^^^^
Données encodées en Base64 = "Hello World!"
\`\`\`

### Outils de tunneling connus

| Outil | Caractéristiques |
|-------|-----------------|
| iodine | Subdomains très longs, TXT records |
| dnscat2 | Communication bidirectionnelle |
| DNSExfiltrator | Exfiltration pure, pas de C2 |
| Cobalt Strike | DNS Beacon mode |

### Indicateurs typiques

- Requêtes vers des domaines non résolus publiquement
- Subdomains très longs (> 50 caractères)
- Volume de requêtes DNS anormalement élevé
- Requêtes TXT inhabituelles
- Entropie élevée dans les subdomains`,
        tips: [
          "Le DNS tunneling est lent mais très difficile à détecter sans analyse approfondie",
          "Les outils légitimes (VPN DNS) existent - contexte important",
          "Recherchez les pics de requêtes DNS depuis un seul hôte"
        ]
      },
      {
        id: 2,
        title: "Identifier les indicateurs suspects",
        content: `## Métriques de détection

### 1. Longueur des subdomains

Les subdomains normaux font rarement plus de 20 caractères. Le tunneling utilise souvent la longueur maximale (63 chars).

\`\`\`
# Normal
www.google.com           (3 chars subdomain)
mail.example.com         (4 chars subdomain)

# Suspect
aGVsbG8gd29ybGQgdGhpcyBpcyBhIG1lc3NhZ2U.tunnel.evil.com (43 chars)
\`\`\`

### 2. Entropie Shannon

L'entropie mesure le "désordre" d'une chaîne. Les données encodées ont une entropie plus élevée que le texte normal.

| Type | Entropie typique |
|------|-----------------|
| Texte anglais | 3.5 - 4.5 |
| Subdomain normal | 2.0 - 3.5 |
| Base64 (tunneling) | 4.5 - 6.0 |
| Données aléatoires | > 5.5 |

### 3. Volume de requêtes

\`\`\`
# Requête Kibana - Comptage par domaine parent
dns.question.name: *
| stats count() by dns.question.registered_domain
| sort count desc
\`\`\`

### 4. Types de records suspects

- **TXT**: Souvent utilisé pour les réponses (plus de données)
- **NULL**: Peut contenir des données arbitraires
- **CNAME**: Utilisé pour l'encodage de retour`,
        commands: [
          {
            description: "Trouver les requêtes avec longs subdomains",
            command: 'dns.question.name: /[a-z0-9]{50,}\\.[a-z]+\\.[a-z]+/'
          },
          {
            description: "Requêtes TXT inhabituelles",
            command: 'dns.question.type: "TXT" AND NOT dns.question.name: (*._domainkey* OR *._dmarc*)'
          },
          {
            description: "Top domaines par volume",
            command: 'event.category: "dns" | stats count() by dns.question.registered_domain | sort count desc | head 20'
          }
        ],
        tips: [
          "Les CDN et analytics génèrent beaucoup de DNS - filtrez-les",
          "Cherchez les domaines enregistrés récemment (< 30 jours)",
          "Le tunneling génère des requêtes même quand l'utilisateur est inactif"
        ],
        checklist: [
          "Analyser la longueur des subdomains",
          "Calculer l'entropie si possible",
          "Vérifier les types de records (TXT, NULL)",
          "Mesurer le volume par domaine"
        ]
      },
      {
        id: 3,
        title: "Analyse des logs Zeek",
        content: `## Analyse avec les logs Zeek DNS

### Structure des logs Zeek DNS

\`\`\`
#fields ts      uid     id.orig_h       id.orig_p       id.resp_h       id.resp_p       proto   trans_id        rtt     query   qclass  qclass_name     qtype   qtype_name      rcode   rcode_name      AA      TC      RD      RA      Z       answers TTLs    rejected
\`\`\`

### Script Zeek pour détecter le tunneling

\`\`\`zeek
@load base/frameworks/notice

module DNSTunnel;

export {
    const suspicious_entropy_threshold = 4.0;
    const suspicious_length_threshold = 40;
}

event dns_request(c: connection, msg: dns_msg, query: string, qtype: count, qclass: count)
{
    local labels = split_string(query, /\\./);
    
    for (i in labels)
    {
        if (|labels[i]| > suspicious_length_threshold)
        {
            NOTICE([
                $note=DNS::Tunneling_Suspected,
                $msg=fmt("Long DNS label detected: %s", query),
                $conn=c
            ]);
        }
    }
}
\`\`\`

### Requêtes Kibana pour les logs Zeek

\`\`\`
# Requêtes avec beaucoup de labels (profondeur)
zeek.dns AND dns.question.subdomain: *.*.*.*

# Requêtes sans réponse (NXDOMAIN fréquent en tunneling)
zeek.dns AND dns.response_code: "NXDOMAIN"

# Volume par source
zeek.dns | stats count() by source.ip | where count > 1000
\`\`\`

### Identifier le domaine C2

Si vous suspectez du tunneling:

1. Trouvez le domaine parent commun
2. Vérifiez son enregistrement (WHOIS)
3. Recherchez-le sur VirusTotal
4. Vérifiez l'âge du domaine`,
        commands: [
          {
            description: "Analyser les logs Zeek DNS avec zeek-cut",
            command: "cat dns.log | zeek-cut query | awk '{print length, $0}' | sort -rn | head -20"
          },
          {
            description: "Trouver les requêtes avec patterns Base64",
            command: 'grep -E "[A-Za-z0-9+/]{20,}=" dns.log'
          },
          {
            description: "Compter les requêtes uniques par domaine",
            command: "cat dns.log | zeek-cut query | rev | cut -d. -f1,2 | rev | sort | uniq -c | sort -rn"
          }
        ],
        tips: [
          "Le tunneling iodine utilise des TXT records et des patterns reconnaissables",
          "dnscat2 utilise souvent des CNAME et peut être bidirectionnel",
          "Recherchez des requêtes régulières (toutes les X secondes)"
        ],
        checklist: [
          "Examiner les logs Zeek DNS",
          "Identifier les queries suspectes",
          "Trouver le domaine C2 potentiel",
          "Vérifier l'enregistrement du domaine"
        ]
      },
      {
        id: 4,
        title: "Contexte et corrélation",
        content: `## Corréler avec d'autres sources

### 1. Identifier l'hôte source

\`\`\`
dns.question.name: "*suspicious-domain.com" 
| stats count() by source.ip, host.name
\`\`\`

### 2. Activité de l'hôte

Vérifiez ce que faisait l'hôte au moment des requêtes:

\`\`\`
# Processus actifs (si EDR disponible)
host.name: "infected-host" AND event.category: "process"

# Connexions réseau
host.name: "infected-host" AND event.category: "network"

# Fichiers créés/modifiés
host.name: "infected-host" AND event.category: "file"
\`\`\`

### 3. Timeline de l'incident

Créez une chronologie:

| Heure | Événement |
|-------|-----------|
| T-1h | Premier accès au domaine malveillant |
| T-30min | Début des requêtes DNS inhabituelles |
| T-0 | Alerte générée |

### 4. Recherche de persistence

Sur l'hôte infecté, recherchez:

\`\`\`bash
# Tâches planifiées
schtasks /query /fo LIST /v

# Services inhabituels
sc query state= all | findstr /i "running"

# Clés de registre (Windows)
reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
\`\`\``,
        tips: [
          "Le tunneling est souvent accompagné d'autres IOCs",
          "Recherchez le vecteur d'infection initial",
          "Vérifiez si d'autres hôtes communiquent avec le même domaine"
        ],
        checklist: [
          "Identifier tous les hôtes affectés",
          "Analyser l'activité de l'hôte source",
          "Créer une timeline",
          "Rechercher le vecteur d'infection"
        ]
      },
      {
        id: 5,
        title: "Blocage et remédiation",
        content: `## Actions de remédiation

### 1. Blocage DNS

**Option A: Sinkhole le domaine**
\`\`\`
# Pi-hole / pfBlockerNG
echo "0.0.0.0 evil-domain.com" >> /etc/pihole/custom.list
pihole restartdns

# Bind/Named
zone "evil-domain.com" {
    type master;
    file "sinkhole.zone";
};
\`\`\`

**Option B: Firewall**
\`\`\`bash
# Bloquer les requêtes DNS vers l'extérieur (forcer le proxy DNS)
iptables -A OUTPUT -p udp --dport 53 -j DROP
iptables -A OUTPUT -p tcp --dport 53 -j DROP

# Autoriser uniquement votre serveur DNS
iptables -I OUTPUT -p udp --dport 53 -d DNS_SERVER_IP -j ACCEPT
\`\`\`

### 2. Isolation de l'hôte infecté

\`\`\`bash
# Isoler du réseau (si capacité EDR)
# Ou désactiver la carte réseau
netsh interface set interface "Ethernet" disable
\`\`\`

### 3. Investigation forensique

- Capturer une image mémoire
- Collecter les artefacts (prefetch, logs, etc.)
- Identifier le malware/outil utilisé

### 4. Renforcement

| Action | Priorité |
|--------|----------|
| DNS over HTTPS inspection | Haute |
| Limiter les résolveurs autorisés | Haute |
| Monitoring entropie DNS | Moyenne |
| DNS RPZ (Response Policy Zones) | Moyenne |
| Baseline du trafic DNS | Haute |`,
        commands: [
          {
            description: "Ajouter le domaine au sinkhole",
            command: 'echo "0.0.0.0 evil-domain.com" >> /etc/hosts && systemctl restart dnsmasq'
          },
          {
            description: "Bloquer les requêtes DNS externes",
            command: "iptables -A OUTPUT -p udp --dport 53 ! -d DNS_SERVER -j DROP"
          }
        ],
        tips: [
          "Attention: bloquer le DNS peut impacter des services légitimes",
          "Coordonnez avec l'équipe réseau avant les changements",
          "Gardez des preuves avant de nettoyer l'hôte"
        ],
        checklist: [
          "Bloquer le domaine malveillant",
          "Isoler l'hôte compromis",
          "Collecter les preuves forensiques",
          "Appliquer les mesures de renforcement"
        ]
      },
      {
        id: 6,
        title: "Documentation et leçons",
        content: `## Rapport et amélioration continue

### Structure du rapport d'incident

\`\`\`
INCIDENT: DNS Tunneling / Exfiltration de données
SÉVÉRITÉ: HIGH
DATE: [DATE]

RÉSUMÉ:
Détection d'exfiltration de données via DNS tunneling depuis
[HOST] vers le domaine [DOMAIN]. Approximativement [X] MB de
données potentiellement exfiltrées.

TIMELINE:
- [T-Xh] Première requête vers le domaine suspect
- [T-Yh] Volume de requêtes anormal détecté
- [T-0]  Alerte générée et investigation démarrée

IOCs:
- Domaine C2: evil-domain.com
- IP résolveur: X.X.X.X
- Hôte infecté: [HOSTNAME]
- Hash malware: [SHA256]

DONNÉES POTENTIELLEMENT EXFILTRÉES:
- Volume estimé: X MB
- Type de données: [Unknown/Sensitive/etc.]
- Méthode d'encodage: Base64

ACTIONS PRISES:
1. Domaine bloqué au niveau DNS
2. Hôte isolé du réseau
3. Image forensique capturée
4. Malware identifié et supprimé

RECOMMANDATIONS:
- Implémenter le monitoring entropie DNS
- Limiter les résolveurs DNS autorisés
- Former les utilisateurs au phishing
- Mettre à jour les règles IDS/IPS
\`\`\`

### Métriques à collecter

- Temps de détection (Detection Time)
- Temps de réponse (Response Time)
- Volume de données exfiltrées
- Méthode d'infection initiale`,
        tips: [
          "Le DNS tunneling indique souvent une compromission plus profonde",
          "Recherchez l'accès initial dans les semaines précédentes",
          "Partagez les IOCs avec votre communauté de threat intel"
        ],
        checklist: [
          "Compléter le rapport d'incident",
          "Calculer les métriques de réponse",
          "Partager les IOCs",
          "Planifier les améliorations",
          "Clôturer l'incident"
        ]
      }
    ],
    conclusion: `## Résumé

Vous savez maintenant détecter et répondre au DNS Tunneling:

- Identifier les patterns suspects (longueur, entropie, volume)
- Analyser les logs DNS/Zeek efficacement
- Corréler avec d'autres sources de données
- Bloquer et remédier aux incidents
- Documenter pour amélioration continue

### Prochaines étapes

1. Configurez des alertes basées sur l'entropie DNS
2. Créez une baseline de votre trafic DNS normal
3. Testez vos détections avec des outils comme iodine (en lab!)`,
    resources: [
      { title: "SANS DNS Tunneling Detection", url: "https://www.sans.org/white-papers/dns-tunneling/" },
      { title: "Zeek Documentation", url: "https://docs.zeek.org/" },
      { title: "iodine (outil de test)", url: "https://github.com/yarrick/iodine" }
    ]
  },

  // ============================================
  // GUIDE 3: Phishing Analysis
  // ============================================
  {
    id: "phishing-analysis",
    title: "Analyser un email de phishing",
    description: "Guide complet pour l'analyse d'emails de phishing: extraction des IOCs, analyse des URLs malveillantes, et investigation des pièces jointes suspectes.",
    duration: "25 min",
    level: "Débutant",
    category: "Email Security",
    tags: ["Phishing", "Email", "Malware", "URL Analysis", "Headers"],
    objectives: [
      "Analyser les en-têtes d'email pour identifier l'origine",
      "Extraire et analyser les URLs suspectes",
      "Identifier les techniques d'évasion courantes",
      "Analyser les pièces jointes en sandbox",
      "Documenter et signaler l'incident"
    ],
    prerequisites: [
      "Compréhension de base des emails (SMTP)",
      "Accès à des outils d'analyse (VirusTotal, URLScan.io)",
      "Environnement sandbox disponible"
    ],
    steps: [
      {
        id: 1,
        title: "Réception et triage initial",
        content: `## Premier contact avec l'email suspect

### Sources de signalement

- Utilisateur signale via "Report Phishing"
- Alerte automatique du gateway email
- Découverte proactive (threat hunting)

### Informations à collecter immédiatement

| Champ | Information |
|-------|-------------|
| De | Adresse expéditeur (affichée vs réelle) |
| À | Destinataire(s) |
| Objet | Sujet du message |
| Date | Timestamp de réception |
| Attachments | Pièces jointes (nom, taille, type) |

### Questions de triage

1. **Urgence perçue?** (facture, compte bloqué, etc.)
2. **Erreurs grammaticales?**
3. **Domaine expéditeur suspect?**
4. **Pièce jointe inattendue?**
5. **Lien vers un domaine inhabituel?**

### Score de risque initial

\`\`\`
Score = (Urgence + Erreurs + Domaine_Suspect + PJ_Suspecte + URL_Suspecte) / 5
> 0.6 = Probable phishing
0.4-0.6 = Analyse approfondie requise
< 0.4 = Probablement légitime (vérifier quand même)
\`\`\``,
        tips: [
          "Ne cliquez jamais sur les liens dans l'email original",
          "Utilisez un environnement isolé pour l'analyse",
          "Prenez des screenshots comme preuves"
        ],
        checklist: [
          "Collecter les métadonnées de l'email",
          "Évaluer le score de risque initial",
          "Prendre des screenshots",
          "Ouvrir un ticket d'investigation"
        ]
      },
      {
        id: 2,
        title: "Analyse des en-têtes",
        content: `## Décoder les en-têtes d'email

### Obtenir les en-têtes complets

**Outlook:** Actions > Propriétés > Internet Headers
**Gmail:** Menu ⋮ > Afficher l'email d'origine
**Thunderbird:** Affichage > En-têtes > Complet

### Champs importants

\`\`\`
Return-Path: <real-sender@domain.com>
Received: from mail.sender.com (IP) by mail.recipient.com
From: "Display Name" <spoofed@trusted-domain.com>
Reply-To: attacker@evil-domain.com
X-Originating-IP: [X.X.X.X]
Authentication-Results: spf=fail; dkim=none; dmarc=fail
\`\`\`

### Vérifications critiques

| Check | Bon signe | Mauvais signe |
|-------|-----------|---------------|
| SPF | pass | fail, softfail |
| DKIM | pass | none, fail |
| DMARC | pass | fail, none |
| Return-Path vs From | Match | Différent |
| Reply-To | Absent ou même domaine | Domaine différent |

### Tracer l'origine (Received headers)

Les en-têtes "Received" se lisent de bas en haut:

\`\`\`
Received: from final-hop.com
Received: from intermediate.com
Received: from origin.com    <-- Origine réelle
\`\`\`

### Outils d'analyse

- **MXToolbox Header Analyzer**: https://mxtoolbox.com/EmailHeaders.aspx
- **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/messageheader/`,
        commands: [
          {
            description: "Vérifier SPF d'un domaine",
            command: 'dig +short TXT _spf.google.com | grep "v=spf1"'
          },
          {
            description: "Vérifier DKIM",
            command: "dig +short TXT selector._domainkey.domain.com"
          },
          {
            description: "Vérifier DMARC",
            command: "dig +short TXT _dmarc.domain.com"
          }
        ],
        tips: [
          "Un email légitime a généralement SPF, DKIM et DMARC qui passent",
          "Le champ Reply-To différent du From est très suspect",
          "Vérifiez l'IP d'origine sur AbuseIPDB"
        ],
        checklist: [
          "Extraire les en-têtes complets",
          "Vérifier SPF/DKIM/DMARC",
          "Identifier l'IP d'origine",
          "Analyser le chemin de routage"
        ]
      },
      {
        id: 3,
        title: "Analyse des URLs",
        content: `## Examiner les liens malveillants

### Extraction sécurisée des URLs

**IMPORTANT**: Ne cliquez jamais directement!

1. Copiez le lien (clic droit > Copier le lien)
2. Collez dans un éditeur de texte
3. Analysez la structure

### Anatomie d'une URL de phishing

\`\`\`
https://login.microsoft-account-verify.com/signin?user=victim
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        Domaine suspect (ressemble à Microsoft)

https://bit.ly/3abc123
        ^^^^^^^^^^^^^
        URL raccourcie (masque la destination)

https://legitimate.com@evil-domain.com/login
                       ^^^^^^^^^^^^^^^
        L'@ fait croire que legitimate.com est le domaine
\`\`\`

### Techniques d'évasion courantes

| Technique | Exemple |
|-----------|---------|
| Typosquatting | microsfot.com, amaz0n.com |
| Homoglyphes | microsоft.com (о cyrillique) |
| Sous-domaines | microsoft.com.evil.com |
| URL encoding | %6D%69%63%72%6F%73%6F%66%74 |
| URL shorteners | bit.ly, tinyurl.com |
| Data URI | data:text/html;base64,... |

### Analyse avec des outils

1. **URLScan.io** - Sandbox pour URLs
2. **VirusTotal** - Multi-antivirus
3. **CheckPhish.ai** - Détection ML
4. **PhishTank** - Base communautaire

### Désécurisez l'URL avant de partager

\`\`\`
https://evil.com  →  hxxps://evil[.]com
\`\`\``,
        commands: [
          {
            description: "Dérouler une URL raccourcie",
            command: 'curl -sI "https://bit.ly/xxx" | grep -i location'
          },
          {
            description: "WHOIS du domaine suspect",
            command: "whois suspicious-domain.com | grep -E 'Creation|Registrar'"
          },
          {
            description: "Vérifier l'âge du domaine",
            command: 'whois domain.com | grep "Creation Date"'
          }
        ],
        tips: [
          "Les domaines de phishing sont souvent créés récemment (< 30 jours)",
          "Utilisez URLScan.io pour voir une capture d'écran sans visiter le site",
          "Vérifiez si le domaine utilise un certificat SSL gratuit (Let's Encrypt)"
        ],
        checklist: [
          "Extraire toutes les URLs de l'email",
          "Vérifier chaque URL sur URLScan.io",
          "Analyser l'âge et l'enregistrement des domaines",
          "Documenter les IOCs (URLs défangées)"
        ]
      },
      {
        id: 4,
        title: "Analyse des pièces jointes",
        content: `## Examiner les fichiers joints en sécurité

### Types de fichiers à risque élevé

| Extension | Risque | Raison |
|-----------|--------|--------|
| .exe, .dll | Critique | Exécutable direct |
| .js, .vbs, .ps1 | Critique | Scripts |
| .docm, .xlsm | Élevé | Macros Office |
| .html, .htm | Élevé | Peut exécuter JS |
| .iso, .img | Élevé | Contourne Mark-of-Web |
| .zip, .rar | Moyen | Peut contenir malware |
| .pdf | Moyen | JavaScript embarqué possible |

### Analyse statique

\`\`\`bash
# Obtenir le hash du fichier
sha256sum suspicious_file.docx

# Identifier le type réel
file suspicious_file.docx

# Rechercher sur VirusTotal
# https://www.virustotal.com/gui/file/HASH

# Extraire les strings (Linux)
strings suspicious_file.exe | head -100

# Analyser un Office avec olevba
olevba suspicious_file.docm
\`\`\`

### Analyse dynamique (Sandbox)

**Services gratuits:**
- any.run - Sandbox interactif
- Hybrid Analysis (hybrid-analysis.com)
- Joe Sandbox (joe-sandbox.com)
- Triage (tria.ge)

**Que rechercher dans le rapport sandbox:**
- Connexions réseau sortantes
- Fichiers créés/modifiés
- Processus lancés
- Clés de registre modifiées
- Comportement de persistence

### Red Flags dans les documents Office

\`\`\`
# olevba output suspect
VBA MACRO AutoOpen          <- S'exécute à l'ouverture
VBA MACRO Document_Open     <- S'exécute à l'ouverture
Suspicious: Shell           <- Exécute commandes
Suspicious: PowerShell      <- Lance PowerShell
Suspicious: Environ("TEMP") <- Écrit dans temp
\`\`\``,
        commands: [
          {
            description: "Hash SHA256 du fichier",
            command: "sha256sum fichier.docx"
          },
          {
            description: "Analyser les macros VBA",
            command: "olevba --deobfuscate fichier.docm"
          },
          {
            description: "Extraire les métadonnées",
            command: "exiftool fichier.docx"
          }
        ],
        tips: [
          "Ne jamais ouvrir de pièce jointe sur votre machine de travail",
          "Un fichier peut avoir une extension trompeuse (invoice.pdf.exe)",
          "Les archives protégées par mot de passe sont très suspectes"
        ],
        checklist: [
          "Identifier le type de fichier réel",
          "Calculer et rechercher le hash",
          "Analyser en sandbox si nécessaire",
          "Extraire les IOCs (hashes, URLs, IPs)"
        ]
      },
      {
        id: 5,
        title: "Évaluation de l'impact",
        content: `## Déterminer qui a été affecté

### Questions à répondre

1. **Qui a reçu l'email?**
   - Un seul utilisateur?
   - Une équipe?
   - Toute l'organisation?

2. **Qui a cliqué sur le lien?**
   - Vérifier les logs du proxy web
   - Logs du gateway email

3. **Qui a ouvert la pièce jointe?**
   - Logs EDR/Antivirus
   - Alertes sandbox

4. **Qui a entré des credentials?**
   - Le plus critique à identifier!

### Requêtes de recherche

\`\`\`
# Tous les destinataires de l'email
email.message_id: "MESSAGE_ID" | stats values(email.to) by email.subject

# Qui a accédé à l'URL
url.domain: "phishing-domain.com" | stats count() by source.ip, user.name

# Connexions suspectes après le clic
event.category: "authentication" AND @timestamp > "CLICK_TIME" 
AND user.name: "AFFECTED_USER"
\`\`\`

### Matrice de risque

| Action utilisateur | Impact | Action requise |
|-------------------|--------|----------------|
| Reçu seulement | Faible | Informer |
| Ouvert l'email | Faible | Informer |
| Cliqué sur lien | Moyen | Reset mdp + scan |
| Entré credentials | Critique | Reset + investigation |
| Ouvert PJ | Critique | Isoler + forensic |

### Identifier les credentials compromis

Si des credentials ont été entrés:
1. Réinitialiser le mot de passe IMMÉDIATEMENT
2. Révoquer les sessions actives
3. Activer MFA si pas déjà fait
4. Vérifier les accès récents (emails envoyés, fichiers accédés)`,
        tips: [
          "Agissez vite si des credentials ont été compromis",
          "Vérifiez les règles de transfert email créées par l'attaquant",
          "Recherchez les emails envoyés depuis le compte compromis"
        ],
        checklist: [
          "Identifier tous les destinataires",
          "Déterminer qui a interagi avec l'email",
          "Évaluer le niveau de compromission",
          "Prioriser les actions par criticité"
        ]
      },
      {
        id: 6,
        title: "Remédiation et signalement",
        content: `## Actions de remédiation

### 1. Containment (Urgent)

\`\`\`bash
# Bloquer l'URL au niveau proxy
# Ajouter à la blocklist du gateway email
# Bloquer le domaine au niveau DNS
\`\`\`

### 2. Si credentials compromis

\`\`\`
1. Forcer le changement de mot de passe
2. Révoquer tous les tokens/sessions
3. Activer MFA
4. Vérifier les règles de messagerie créées
5. Auditer les accès récents
\`\`\`

### 3. Supprimer l'email

**Exchange/O365:**
\`\`\`powershell
# Rechercher et supprimer
Search-MailboxAuditLog -Identity user@domain.com 
  -Subject "PHISHING_SUBJECT" | Remove-MailMessage
\`\`\`

**Google Workspace:**
\`\`\`
Utilisez l'investigation tool dans Admin Console
\`\`\`

### 4. Communication

Informez les utilisateurs:

\`\`\`
Objet: [SÉCURITÉ] Tentative de phishing détectée

Nous avons détecté une campagne de phishing ciblant notre organisation.
Si vous avez reçu un email avec le sujet "[SUJET]", ne cliquez sur 
aucun lien et supprimez-le immédiatement.

Si vous avez cliqué sur le lien ou entré vos identifiants, contactez 
le helpdesk immédiatement au [NUMÉRO].
\`\`\`

### 5. Signalement externe

- **PhishTank**: https://www.phishtank.com/
- **Google Safe Browsing**: https://safebrowsing.google.com/safebrowsing/report_phish/
- **Microsoft**: https://www.microsoft.com/wdsi/filesubmission
- **CERT/CSIRT national**: Selon votre pays`,
        tips: [
          "Documentez l'heure de chaque action",
          "Gardez une copie de l'email comme preuve",
          "Mettez à jour vos règles de détection après l'incident"
        ],
        checklist: [
          "Bloquer les IOCs (URLs, domaines, IPs)",
          "Réinitialiser les credentials compromis",
          "Supprimer l'email des boîtes de réception",
          "Communiquer avec les utilisateurs",
          "Signaler aux services appropriés"
        ]
      }
    ],
    conclusion: `## Vous savez maintenant analyser un phishing!

### Compétences acquises:

- Analyse des en-têtes email
- Identification des URLs malveillantes
- Analyse sécurisée des pièces jointes
- Évaluation de l'impact
- Remédiation et signalement

### Bonnes pratiques à retenir

1. **Jamais sur votre machine**: Utilisez des sandboxes
2. **Documentez tout**: Screenshots, timestamps, IOCs
3. **Agissez vite**: Les credentials compromis sont critiques
4. **Partagez**: Vos IOCs aident la communauté

### Ressources utiles

- URLScan.io pour analyser les URLs
- VirusTotal pour les fichiers et URLs
- any.run pour l'analyse dynamique
- MXToolbox pour les en-têtes`,
    resources: [
      { title: "URLScan.io", url: "https://urlscan.io/" },
      { title: "PhishTank", url: "https://www.phishtank.com/" },
      { title: "any.run Sandbox", url: "https://any.run/" },
      { title: "SANS Phishing IR Guide", url: "https://www.sans.org/white-papers/phishing-response/" }
    ]
  },

  // ============================================
  // GUIDE 4: Log Analysis with Kibana/KQL
  // ============================================
  {
    id: "kibana-kql",
    title: "Maîtriser Kibana et KQL pour l'analyse de logs",
    description: "Apprenez à utiliser efficacement Kibana Query Language (KQL) pour rechercher, filtrer et analyser les logs de sécurité. De la requête basique aux agrégations avancées.",
    duration: "35 min",
    level: "Débutant",
    category: "Outils",
    tags: ["Kibana", "KQL", "SIEM", "Elasticsearch", "Logs"],
    objectives: [
      "Comprendre la syntaxe KQL de base",
      "Créer des requêtes efficaces pour l'investigation",
      "Utiliser les filtres et l'autocomplétion",
      "Créer des visualisations et dashboards",
      "Sauvegarder et partager vos recherches"
    ],
    prerequisites: [
      "Accès à une instance Kibana",
      "Compréhension de base des logs (structure, champs)"
    ],
    steps: [
      {
        id: 1,
        title: "Introduction à KQL",
        content: `## Kibana Query Language

KQL est le langage de requête natif de Kibana pour rechercher vos données.

### Syntaxe de base

\`\`\`
# Recherche simple dans tous les champs
error

# Recherche dans un champ spécifique
message: "authentication failed"

# Recherche exacte (avec guillemets)
user.name: "john.doe"

# Recherche partielle (wildcard)
host.name: web-server-*

# Sensible à la casse par défaut: NON
user.name: "ADMIN" équivaut à user.name: "admin"
\`\`\`

### Opérateurs logiques

\`\`\`
# AND (implicite ou explicite)
source.ip: "10.0.0.1" AND destination.port: 22
source.ip: "10.0.0.1" destination.port: 22  # Même chose

# OR
event.action: "login" OR event.action: "logout"

# NOT
NOT source.ip: "192.168.1.1"
event.type: "authentication" AND NOT event.outcome: "success"
\`\`\`

### Comparaisons numériques

\`\`\`
# Égalité
destination.port: 443

# Supérieur/Inférieur
response.bytes > 1000000
event.duration < 5000

# Plage
destination.port >= 1 AND destination.port <= 1024
\`\`\`

### Parenthèses pour grouper

\`\`\`
(source.ip: "10.0.0.1" OR source.ip: "10.0.0.2") 
AND destination.port: 22
\`\`\``,
        tips: [
          "KQL est insensible à la casse pour les valeurs textuelles",
          "Utilisez l'autocomplétion (Ctrl+Espace) pour découvrir les champs",
          "Les guillemets sont nécessaires pour les valeurs avec espaces"
        ]
      },
      {
        id: 2,
        title: "Requêtes courantes SOC",
        content: `## Requêtes essentielles pour l'analyse SOC

### Authentification

\`\`\`
# Échecs d'authentification
event.category: "authentication" AND event.outcome: "failure"

# Connexions réussies depuis une IP suspecte
event.category: "authentication" AND event.outcome: "success" 
AND source.ip: "SUSPECT_IP"

# Connexions hors heures de travail
event.category: "authentication" AND @timestamp >= "2026-01-01T22:00:00"
AND @timestamp <= "2026-01-02T06:00:00"

# Comptes verrouillés
event.action: "account-locked" OR event.code: 4740
\`\`\`

### Réseau

\`\`\`
# Connexions vers des ports inhabituels
destination.port > 1024 AND NOT destination.port: (443 OR 80 OR 8080)

# Transferts de données volumineux
network.bytes > 100000000  # >100MB

# Connexions vers des IPs externes
NOT destination.ip: (10.* OR 192.168.* OR 172.16.*)

# Requêtes DNS suspectes
dns.question.name: *.evil-domain.com
\`\`\`

### Processus (EDR/Sysmon)

\`\`\`
# PowerShell suspect
process.name: "powershell.exe" AND process.args: 
  (*-enc* OR *downloadstring* OR *bypass*)

# Exécution depuis Temp
process.executable: (*\\Temp\\* OR *\\AppData\\Local\\Temp\\*)

# Processus parents suspects
process.parent.name: ("cmd.exe" OR "powershell.exe") 
AND process.name: ("net.exe" OR "whoami.exe")
\`\`\`

### Fichiers

\`\`\`
# Fichiers exécutables créés
event.category: "file" AND event.action: "creation" 
AND file.extension: ("exe" OR "dll" OR "ps1")

# Modifications dans des répertoires sensibles
file.path: (*\\System32\\* OR *\\Windows\\*)
AND event.action: "modification"
\`\`\``,
        commands: [
          {
            description: "Toutes les connexions d'une IP",
            command: 'source.ip: "X.X.X.X" OR destination.ip: "X.X.X.X"'
          },
          {
            description: "Activité d'un utilisateur",
            command: 'user.name: "john.doe" AND event.category: ("authentication" OR "process" OR "file")'
          },
          {
            description: "Alertes Suricata",
            command: 'event.module: "suricata" AND event.kind: "alert"'
          }
        ],
        tips: [
          "Créez une bibliothèque de requêtes favorites",
          "Utilisez des variables d'environnement pour les IPs récurrentes",
          "Sauvegardez vos requêtes complexes dans des dashboards"
        ],
        checklist: [
          "Tester les requêtes d'authentification",
          "Tester les requêtes réseau",
          "Familiarisez-vous avec les champs disponibles"
        ]
      },
      {
        id: 3,
        title: "Filtres et visualisations",
        content: `## Utiliser les filtres Kibana

### Filtres rapides

Dans Discover, vous pouvez:
- **Cliquer sur une valeur** → Ajouter un filtre "is"
- **Cliquer sur le –** → Ajouter un filtre "is not"
- **Glisser une colonne** → Ajouter aux colonnes visibles

### Filtres avancés

\`\`\`json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "event.category": "authentication" } }
      ],
      "filter": [
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  }
}
\`\`\`

### Créer des visualisations

#### Bar Chart - Top 10 IPs sources
1. Visualize → Create → Vertical Bar
2. Y-axis: Count
3. X-axis: Terms → source.ip → Size: 10

#### Pie Chart - Répartition par sévérité
1. Visualize → Create → Pie
2. Slice size: Count
3. Split slices: Terms → event.severity

#### Timeline - Événements par heure
1. Visualize → Create → Line
2. Y-axis: Count
3. X-axis: Date Histogram → @timestamp → Interval: Auto

### Créer un Dashboard Investigation

Composants recommandés:
1. **Timeline** des événements
2. **Top IPs** sources et destinations
3. **Distribution** par type d'événement
4. **Tableau** des derniers événements
5. **Metrics** (total events, unique IPs)`,
        tips: [
          "Pinendez vos filtres fréquents pour les garder entre onglets",
          "Utilisez des couleurs cohérentes dans vos visualisations",
          "Créez des dashboards spécifiques par type d'investigation"
        ],
        checklist: [
          "Créer un filtre pour les dernières 24h",
          "Créer un bar chart top IPs",
          "Assembler un dashboard basique"
        ]
      },
      {
        id: 4,
        title: "Agrégations et statistiques",
        content: `## Analyser les données avec des agrégations

### Statistiques basiques

\`\`\`
# Compter les événements par source IP
event.category: "authentication" 
| stats count() by source.ip

# Compter les échecs par utilisateur
event.outcome: "failure"
| stats count() by user.name
| sort count desc

# Avec un seuil
event.outcome: "failure"
| stats count() by source.ip
| where count > 10
\`\`\`

### Agrégations temporelles

\`\`\`
# Événements par heure
event.category: "authentication"
| stats count() by @timestamp span=1h

# Détection d'anomalie (pic d'activité)
event.category: "network"
| stats count() by @timestamp span=5m
| where count > avg(count) * 2
\`\`\`

### Agrégations multiples

\`\`\`
# Combiner plusieurs statistiques
source.ip: "SUSPECT_IP"
| stats count = count(), 
        unique_ports = cardinality(destination.port),
        total_bytes = sum(network.bytes)
by destination.ip

# Timeline par type d'événement
event.category: *
| stats count() by event.category, @timestamp span=1h
\`\`\`

### Détecter les anomalies

\`\`\`
# IPs avec beaucoup de destinations uniques (scan potentiel)
event.category: "network"
| stats unique_dests = cardinality(destination.ip) by source.ip
| where unique_dests > 50

# Utilisateurs avec connexions depuis plusieurs IPs
event.category: "authentication" AND event.outcome: "success"
| stats unique_ips = cardinality(source.ip) by user.name
| where unique_ips > 3
\`\`\``,
        commands: [
          {
            description: "Top 10 des échecs par IP",
            command: 'event.outcome: "failure" | stats count() by source.ip | sort count desc | head 10'
          },
          {
            description: "Détection de scan de ports",
            command: 'event.category: "network" | stats unique_ports = cardinality(destination.port) by source.ip | where unique_ports > 20'
          },
          {
            description: "Connexions inhabituelles (hors heures)",
            command: 'event.category: "authentication" AND event.outcome: "success" | eval hour = date_hour(@timestamp) | where hour < 6 OR hour > 22'
          }
        ],
        tips: [
          "Les agrégations sont très puissantes pour le threat hunting",
          "Combinez-les avec des alertes automatiques",
          "Cherchez les valeurs au-delà de N écarts-types de la moyenne"
        ],
        checklist: [
          "Maîtriser stats count() by",
          "Utiliser cardinality() pour les valeurs uniques",
          "Créer des agrégations temporelles"
        ]
      },
      {
        id: 5,
        title: "Recherches et alertes sauvegardées",
        content: `## Sauvegarder et automatiser

### Sauvegarder une recherche

1. Effectuez votre recherche dans Discover
2. Cliquez sur "Save" en haut
3. Nommez-la clairement: "[SOC] SSH Brute Force - Last 24h"
4. Choisissez si elle doit être partagée

### Créer une alerte Kibana

1. Stack Management → Alerts and Actions
2. Create alert
3. Choisissez le type: Elasticsearch query

\`\`\`json
{
  "trigger": {
    "schedule": { "interval": "5m" }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["logs-*"],
        "body": {
          "query": {
            "bool": {
              "must": [
                { "match": { "event.category": "authentication" }},
                { "match": { "event.outcome": "failure" }}
              ],
              "filter": {
                "range": { "@timestamp": { "gte": "now-5m" }}
              }
            }
          },
          "aggs": {
            "by_ip": {
              "terms": { "field": "source.ip", "min_doc_count": 5 }
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.aggregations.by_ip.buckets": { "not_eq": [] }
    }
  },
  "actions": {
    "notify_soc": {
      "email": {
        "to": "soc@company.com",
        "subject": "Alert: Brute Force Detected"
      }
    }
  }
}
\`\`\`

### Bonnes pratiques

| Pratique | Explication |
|----------|-------------|
| Noms clairs | "[SOC] Type - Détail - Période" |
| Documentation | Ajoutez une description |
| Tags | Utilisez des tags pour catégoriser |
| Tests | Testez vos alertes avant mise en prod |
| Tuning | Ajustez les seuils pour réduire les faux positifs |`,
        tips: [
          "Créez des alertes graduées (info, warning, critical)",
          "Documentez chaque alerte avec les actions attendues",
          "Revoyez régulièrement les alertes non actionnées"
        ],
        checklist: [
          "Sauvegarder vos recherches fréquentes",
          "Créer une alerte test",
          "Documenter vos recherches et alertes"
        ]
      }
    ],
    conclusion: `## Vous maîtrisez maintenant Kibana et KQL!

### Compétences acquises:

- Syntaxe KQL: requêtes, filtres, wildcards
- Requêtes SOC courantes
- Visualisations et dashboards
- Agrégations pour l'analyse
- Alertes automatiques

### Prochaines étapes

1. Créez votre bibliothèque de requêtes
2. Construisez un dashboard d'investigation
3. Configurez des alertes pour les cas fréquents
4. Explorez Elastic Security pour des fonctionnalités avancées

### Ressources

- Documentation KQL: elastic.co/guide/en/kibana/current/kuery-query.html
- Community: discuss.elastic.co`,
    resources: [
      { title: "Kibana Query Language Documentation", url: "https://www.elastic.co/guide/en/kibana/current/kuery-query.html" },
      { title: "Elasticsearch Aggregations", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html" },
      { title: "Elastic Security", url: "https://www.elastic.co/security" }
    ]
  },

  // ============================================
  // GUIDE 5: Malware Analysis Basics
  // ============================================
  {
    id: "malware-analysis-basics",
    title: "Introduction à l'analyse de malware",
    description: "Apprenez les bases de l'analyse de malware: analyse statique, analyse dynamique en sandbox, extraction d'IOCs et triage des échantillons suspects.",
    duration: "40 min",
    level: "Intermédiaire",
    category: "Malware",
    tags: ["Malware", "Reverse Engineering", "Sandbox", "IOC", "YARA"],
    objectives: [
      "Comprendre le workflow d'analyse de malware",
      "Effectuer une analyse statique basique",
      "Utiliser des sandboxes pour l'analyse dynamique",
      "Extraire et documenter les IOCs",
      "Créer des règles de détection simples"
    ],
    prerequisites: [
      "Environnement d'analyse isolé (VM)",
      "Outils de base installés (strings, file, etc.)",
      "Connaissance des concepts de sécurité"
    ],
    steps: [
      {
        id: 1,
        title: "Préparation de l'environnement",
        content: `## Environnement d'analyse sécurisé

### RÈGLE D'OR
**NE JAMAIS analyser de malware sur votre machine de production!**

### Configuration recommandée

\`\`\`
┌─────────────────────────────────────┐
│  Hôte physique                       │
│  (Internet désactivé pendant        │
│   l'analyse dynamique)               │
│  ┌─────────────────────────────┐    │
│  │  VM d'analyse Windows        │    │
│  │  - Snapshot "clean"          │    │
│  │  - Outils installés          │    │
│  │  - Pas d'accès réseau réel   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  VM d'analyse Linux          │    │
│  │  - REMnux ou FLARE-VM        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
\`\`\`

### Distributions recommandées

| Distribution | Usage |
|--------------|-------|
| REMnux | Analyse Linux, outils forensic |
| FLARE-VM | Windows, reverse engineering |
| Commando VM | Offensive + defensive |
| Tsurugi | Forensic + malware analysis |

### Outils essentiels

**Analyse statique:**
- file, strings, hexdump
- PE-bear, PEview (Windows PE)
- olevba (Office macros)
- exiftool (métadonnées)

**Analyse dynamique:**
- Process Monitor (Sysinternals)
- Process Explorer
- Wireshark / FakeDNS
- Regshot (avant/après)

### Isolation réseau

\`\`\`bash
# Sur l'hôte, bloquer l'accès Internet de la VM
iptables -I FORWARD -s VM_IP -j DROP
iptables -I FORWARD -d VM_IP -j DROP

# Alternative: INetSim pour simuler Internet
# https://www.inetsim.org/
\`\`\``,
        tips: [
          "Créez un snapshot avant chaque analyse",
          "Utilisez INetSim pour simuler les réponses Internet",
          "Gardez vos outils à jour sur la VM d'analyse"
        ],
        checklist: [
          "VM d'analyse configurée",
          "Snapshot 'clean' créé",
          "Outils essentiels installés",
          "Réseau isolé ou simulé"
        ]
      },
      {
        id: 2,
        title: "Triage et identification",
        content: `## Premier contact avec l'échantillon

### Obtenir les hashes

Avant toute analyse, calculez les hashes pour:
1. Identifier si déjà analysé
2. Partager avec la communauté
3. Tracer dans vos rapports

\`\`\`bash
# Tous les hashes courants
md5sum sample.exe
sha1sum sample.exe
sha256sum sample.exe

# Ou avec ssdeep pour le fuzzy hash
ssdeep sample.exe
\`\`\`

### Identifier le type réel

\`\`\`bash
# Type de fichier
file sample.exe
# Output: PE32 executable (GUI) Intel 80386, for MS Windows

# Vérifier les magic bytes
xxd sample.exe | head -5

# Magic bytes courants
MZ        = Windows PE executable
PK        = ZIP archive / Office document
%PDF      = PDF document
CAFEBABE  = Java class file
7z        = 7-zip archive
\`\`\`

### Vérifier sur VirusTotal

\`\`\`bash
# Via l'API
curl -s "https://www.virustotal.com/api/v3/files/HASH" \\
  -H "x-apikey: YOUR_API_KEY"

# Ou uploadez via le site (attention: fichier partagé!)
\`\`\`

### Résultats VirusTotal à vérifier

| Métrique | Interprétation |
|----------|----------------|
| 0/70 détections | Probablement clean ou très nouveau |
| 1-5 détections | Possiblement PUP ou faux positif |
| 10+ détections | Probablement malveillant |
| 50+ détections | Malware connu |

### Attention aux faux négatifs!

Un fichier non détecté n'est PAS forcément safe:
- Malware très récent (0-day)
- Malware ciblé (APT)
- Packer/crypter sophistiqué`,
        commands: [
          {
            description: "Calculer tous les hashes",
            command: "sha256sum sample.exe && md5sum sample.exe && sha1sum sample.exe"
          },
          {
            description: "Identifier le type de fichier",
            command: "file sample.exe && xxd sample.exe | head -3"
          },
          {
            description: "Vérifier le fuzzy hash",
            command: "ssdeep -b sample.exe"
          }
        ],
        tips: [
          "Notez le hash SHA256 - c'est la référence standard",
          "Vérifiez VirusTotal AVANT d'uploader pour ne pas partager des fichiers sensibles",
          "Les fuzzy hashes aident à trouver des variantes"
        ],
        checklist: [
          "Calculer MD5, SHA1, SHA256",
          "Identifier le type réel du fichier",
          "Vérifier sur VirusTotal (hash, pas upload)",
          "Documenter les résultats initiaux"
        ]
      },
      {
        id: 3,
        title: "Analyse statique",
        content: `## Analyse sans exécution

### Extraction des strings

\`\`\`bash
# Strings ASCII
strings sample.exe | head -100

# Strings Unicode (Windows)
strings -el sample.exe

# Strings intéressantes à chercher
strings sample.exe | grep -E "(http|ftp|www|\\\\|cmd|powershell|password)"

# Avec FLOSS (string deobfuscation)
floss sample.exe
\`\`\`

### Analyse PE (Windows)

\`\`\`bash
# Avec pefile (Python)
import pefile
pe = pefile.PE("sample.exe")

# Informations de base
print(pe.FILE_HEADER.TimeDateStamp)  # Date de compilation
print(pe.OPTIONAL_HEADER.ImageBase)  # Adresse de base

# Sections
for section in pe.sections:
    print(section.Name, section.Entropy)

# Imports
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(entry.dll)
    for imp in entry.imports:
        print('  ', imp.name)
\`\`\`

### Indicateurs suspects

| Indicateur | Suspicion |
|------------|-----------|
| Entropie section > 7.0 | Probable packing/cryptage |
| Section .text modifiable | Auto-modification de code |
| Imports: VirtualAlloc + WriteProcessMemory | Injection de code |
| Imports: CreateRemoteThread | Injection de thread |
| Imports: Reg* + Run | Persistence |
| Pas d'imports | Résolution dynamique (suspect) |
| Ressources volumineuses | Payload caché |

### Analyse des imports suspects

\`\`\`
# APIs de réseau
InternetOpenUrl, HttpSendRequest, WSAConnect

# APIs de fichiers
CreateFile, WriteFile, DeleteFile

# APIs de registre
RegSetValue, RegCreateKey

# APIs de processus
CreateProcess, ShellExecute, WinExec

# APIs d'injection
VirtualAllocEx, WriteProcessMemory, CreateRemoteThread

# APIs de crypto
CryptEncrypt, CryptDecrypt
\`\`\``,
        commands: [
          {
            description: "Extraire les strings avec filtrage",
            command: 'strings sample.exe | grep -iE "(http|password|cmd|shell|exec)"'
          },
          {
            description: "Analyser les imports PE",
            command: "pefile imports sample.exe"
          },
          {
            description: "Calculer l'entropie",
            command: "python3 -c \"import pefile; pe=pefile.PE('sample.exe'); [print(s.Name, s.get_entropy()) for s in pe.sections]\""
          }
        ],
        tips: [
          "Une entropie > 7.0 indique souvent du code packé ou chiffré",
          "Les strings peuvent révéler des URLs C2, des chemins, des commandes",
          "Notez les imports inhabituels pour orienter l'analyse dynamique"
        ],
        checklist: [
          "Extraire et analyser les strings",
          "Identifier les imports suspects",
          "Vérifier l'entropie des sections",
          "Rechercher des ressources cachées"
        ]
      },
      {
        id: 4,
        title: "Analyse dynamique",
        content: `## Exécution contrôlée en sandbox

### Sandboxes en ligne

| Service | Avantages |
|---------|-----------|
| any.run | Interactif, screenshots, réseau |
| Hybrid Analysis | Gratuit, détaillé |
| Joe Sandbox | Très complet, entreprise |
| Tria.ge | Rapide, intégration API |
| VirusTotal (behavior) | Multi-sandbox |

### Sandbox locale avec monitoring

**Avant exécution:**
\`\`\`bash
# Snapshot Regshot (avant/après)
# Démarrer Wireshark
# Lancer Process Monitor avec filtres
\`\`\`

**Configuration Process Monitor:**
\`\`\`
Filter: Process Name contains sample.exe
Include: File system, Registry, Network
\`\`\`

**Exécution:**
\`\`\`bash
# Exécuter le sample
wine sample.exe        # Linux
./sample.exe           # Windows VM
timeout 120 sample.exe # Avec limite de temps
\`\`\`

### Que surveiller

| Catégorie | Indicateurs |
|-----------|-------------|
| Réseau | Connexions vers IPs/domaines |
| Fichiers | Fichiers créés/modifiés |
| Registre | Clés de persistence |
| Processus | Processus enfants créés |
| Injection | Accès à d'autres processus |

### Points de persistence courants

\`\`\`
Registre:
  HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
  HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
  HKLM\\SYSTEM\\CurrentControlSet\\Services

Fichiers:
  C:\\Users\\*\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup
  C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup

Tâches planifiées:
  schtasks /query /v
\`\`\``,
        commands: [
          {
            description: "Capturer le trafic réseau",
            command: "tcpdump -i eth0 -w capture.pcap &"
          },
          {
            description: "Lister les nouvelles connexions",
            command: "netstat -an | grep ESTABLISHED"
          },
          {
            description: "Comparer les snapshots Regshot",
            command: "diff before.txt after.txt | grep -E '(Add|Del)'"
          }
        ],
        tips: [
          "Certains malwares détectent les VMs et ne s'exécutent pas",
          "Exécutez plusieurs fois - comportement peut varier",
          "Notez le timing - certains ont des délais avant activation"
        ],
        checklist: [
          "Prendre un snapshot Regshot avant",
          "Lancer la capture réseau",
          "Exécuter avec Process Monitor actif",
          "Documenter tous les changements observés"
        ]
      },
      {
        id: 5,
        title: "Extraction des IOCs",
        content: `## Documenter les indicateurs de compromission

### Types d'IOCs

| Type | Exemple | Priorité |
|------|---------|----------|
| Hash SHA256 | abc123def... | Haute (spécifique) |
| IP C2 | 185.123.45.67 | Haute |
| Domaine C2 | evil-domain.com | Haute |
| URL | http://evil.com/payload.exe | Haute |
| Chemin fichier | C:\\Windows\\temp\\abc.exe | Moyenne |
| Clé registre | HKCU\\...\\Run\\malware | Moyenne |
| User-Agent | Mozilla/4.0 (unusual) | Basse |
| Nom de fichier | invoice_doc.exe | Basse |

### Format de documentation

\`\`\`yaml
# Rapport IOCs - [NOM_MALWARE]
# Date: 2026-03-01
# Analyst: [VOUS]

file:
  sha256: "abc123..."
  sha1: "def456..."
  md5: "789ghi..."
  filename: "invoice.exe"
  type: "PE32 executable"
  size: 125440

network:
  - type: "domain"
    value: "c2-server.evil.com"
    context: "C2 communication"
    
  - type: "ip"
    value: "185.123.45.67"
    port: 443
    context: "C2 server"
    
  - type: "url"
    value: "hxxps://evil[.]com/payload.bin"
    context: "Second stage download"

persistence:
  - type: "registry"
    key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    value: "system32update"
    data: "C:\\Windows\\Temp\\mal.exe"
    
  - type: "scheduled_task"
    name: "WindowsUpdate"
    action: "C:\\Windows\\Temp\\mal.exe"

files_created:
  - path: "C:\\Windows\\Temp\\mal.exe"
    sha256: "xyz789..."
  - path: "C:\\Users\\Public\\config.dat"
    sha256: "abc123..."
\`\`\`

### Défanger les IOCs pour le partage

\`\`\`
URLs:
  http://evil.com → hxxp://evil[.]com
  
IPs:
  192.168.1.1 → 192.168.1[.]1
  
Domaines:
  evil.com → evil[.]com
\`\`\``,
        commands: [
          {
            description: "Extraire les URLs des strings",
            command: `strings sample.exe | grep -oE "https?://[^\\"' >]+"`
          },
          {
            description: "Extraire les IPs",
            command: 'strings sample.exe | grep -oE "\\b([0-9]{1,3}\\.){3}[0-9]{1,3}\\b"'
          },
          {
            description: "Défanger une URL",
            command: "echo 'http://evil.com' | sed 's/http/hxxp/; s/\\./[.]/g'"
          }
        ],
        tips: [
          "Documentez le contexte de chaque IOC",
          "Priorisez les IOCs uniques (hashes vs noms)",
          "Partagez avec votre équipe et ISAC si applicable"
        ],
        checklist: [
          "Documenter tous les hashes",
          "Lister les IOCs réseau",
          "Documenter les mécanismes de persistence",
          "Défanger avant partage"
        ]
      },
      {
        id: 6,
        title: "Règles de détection",
        content: `## Créer des règles de détection

### Règle YARA basique

\`\`\`yara
rule Suspicious_Sample_Invoice_Malware {
    meta:
        description = "Detects invoice-themed malware based on strings and structure"
        author = "SOC Analyst"
        date = "2026-03-01"
        hash = "abc123def456..."
        
    strings:
        $s1 = "invoice" nocase
        $s2 = "payment" nocase
        $url = /https?:\\/\\/[a-z0-9\\-\\.]+\\.(xyz|top|tk)/
        $api1 = "VirtualAlloc"
        $api2 = "CreateRemoteThread"
        $hex_pattern = { 4D 5A 90 00 03 00 00 00 }
        
    condition:
        uint16(0) == 0x5A4D and    // MZ header
        filesize < 500KB and
        2 of ($s*) and
        $url and
        all of ($api*)
}
\`\`\`

### Règle Sigma (pour SIEM)

\`\`\`yaml
title: Suspicious Process Created by Invoice Malware
status: experimental
description: Detects process behavior associated with invoice-themed malware
author: SOC Team
date: 2026/03/01
references:
    - https://internal-wiki/incident/INV-2026-001
    
logsource:
    category: process_creation
    product: windows
    
detection:
    selection:
        ParentImage|endswith: '\\invoice.exe'
        Image|endswith:
            - '\\powershell.exe'
            - '\\cmd.exe'
            - '\\whoami.exe'
    condition: selection
    
falsepositives:
    - Legitimate invoice software (unlikely)
    
level: high
\`\`\`

### Règle Suricata/Snort

\`\`\`
alert http $HOME_NET any -> $EXTERNAL_NET any (
    msg:"MALWARE Invoice Malware C2 Communication";
    content:"POST"; http_method;
    content:"evil-domain.com"; http_host;
    content:"/api/beacon"; http_uri;
    sid:1000001; rev:1;
    classtype:trojan-activity;
    reference:url,internal-wiki/incident/INV-2026-001;
)
\`\`\`

### Test des règles

\`\`\`bash
# Tester règle YARA
yara -r rules/invoice_malware.yar samples/

# Valider syntaxe Sigma
sigma check rules/invoice_process.yml

# Tester Suricata
suricata -c /etc/suricata/suricata.yaml -r capture.pcap -l logs/
\`\`\``,
        commands: [
          {
            description: "Tester une règle YARA",
            command: "yara rules/my_rule.yar suspect_file.exe"
          },
          {
            description: "Compiler et tester Suricata",
            command: "suricata -T -c /etc/suricata/suricata.yaml"
          },
          {
            description: "Convertir Sigma vers Splunk",
            command: "sigmac -t splunk -c config/splunk-windows.yml rules/my_rule.yml"
          }
        ],
        tips: [
          "Testez vos règles contre des échantillons connus",
          "Évitez les règles trop génériques (faux positifs)",
          "Documentez le contexte et les références"
        ],
        checklist: [
          "Créer une règle YARA pour le fichier",
          "Créer une règle Sigma pour le comportement",
          "Tester contre des échantillons",
          "Déployer en production après validation"
        ]
      }
    ],
    conclusion: `## Vous avez les bases de l'analyse malware!

### Compétences acquises:

- Environnement d'analyse sécurisé
- Triage et identification (hashes, file type)
- Analyse statique (strings, imports, PE)
- Analyse dynamique (sandbox, monitoring)
- Extraction et documentation des IOCs
- Création de règles de détection (YARA, Sigma)

### Workflow à retenir

1. **Ne jamais exécuter sur machine de prod**
2. **Hash → VirusTotal avant tout**
3. **Analyse statique d'abord**
4. **Sandbox en ligne si risqué**
5. **Documenter tous les IOCs**
6. **Créer des règles de détection**
7. **Partager avec la communauté**

### Pour aller plus loin

- Cours SANS FOR610 (Reverse Engineering)
- OpenSecurityTraining2
- MalwareBazaar pour des samples`,
    resources: [
      { title: "REMnux Documentation", url: "https://remnux.org/" },
      { title: "VirusTotal", url: "https://www.virustotal.com/" },
      { title: "YARA Documentation", url: "https://yara.readthedocs.io/" },
      { title: "any.run Sandbox", url: "https://any.run/" },
      { title: "MalwareBazaar", url: "https://bazaar.abuse.ch/" }
    ]
  }
];

export function getGuideById(id: string): Guide | undefined {
  return guides.find(g => g.id === id);
}

export function getGuidesByCategory(category: string): Guide[] {
  return guides.filter(g => g.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(guides.map(g => g.category))];
}
