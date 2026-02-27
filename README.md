# 🛡️ Morakib - مُراقِب

**SOC Analyst Assistant Platform** - Plateforme d'assistance aux analystes SOC N1

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://docker.com/)

> **Morakib** (مُراقِب) signifie "celui qui surveille" en arabe - parfait pour une plateforme SOC!

---

## 🎯 Fonctionnalités

### Pour les Analystes N1

- **📊 Dashboard temps réel** - Vue d'ensemble des alertes et KPIs
- **🚨 Gestion des Alertes** - Queue priorisée avec investigation guidée
- **📋 Centre SOP** - Bibliothèque de procédures opérationnelles
- **🎓 Mode Guidé** - Assistance contextuelle avec exemples pratiques
- **📈 Analytics** - Métriques de performance personnalisées
- **🏆 Gamification** - Badges et classements pour motiver l'équipe

### Intégrations SOC-in-a-Box

- **Elasticsearch** - Récupération des alertes Suricata/Zeek
- **IRIS DFIR** - Création automatique d'incidents
- **n8n** - Workflows d'automatisation SOAR
- **Keycloak** - Authentification SSO

---

## 🚀 Quick Start

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- SOC-in-a-Box running (optionnel pour dev)

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/YOUR_USERNAME/morakib.git
cd morakib

# 2. Installer les dépendances
npm install

# 3. Copier la configuration
cp .env.example .env

# 4. Démarrer la base de données
docker-compose up -d postgres

# 5. Initialiser la base de données
npx prisma migrate dev

# 6. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur http://localhost:3000

### Avec Docker (Production)

```bash
# Démarrer tous les services
docker-compose up -d --build

# Voir les logs
docker-compose logs -f morakib
```

---

## 📦 Structure du Projet

```
morakib/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── alerts/            # Module Alertes
│   │   ├── sops/              # Module SOPs
│   │   ├── guide/             # Mode Guidé
│   │   ├── analytics/         # Analytics
│   │   └── profile/           # Profil utilisateur
│   ├── components/            # Composants React
│   │   ├── alerts/           # Composants alertes
│   │   ├── dashboard/        # Composants dashboard
│   │   ├── layout/           # Layout (sidebar, header)
│   │   └── sops/             # Composants SOPs
│   ├── lib/                   # Utilitaires
│   └── types/                 # Types TypeScript
├── prisma/                    # Schéma Prisma
├── docker-compose.yml         # Configuration Docker
└── Dockerfile                 # Build production
```

---

## 🔧 Configuration

### Variables d'Environnement

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://morakib:...` |
| `NEXTAUTH_SECRET` | Secret NextAuth | - |
| `ELASTICSEARCH_URL` | URL Elasticsearch | `http://localhost:9200` |
| `ELASTICSEARCH_PASSWORD` | Mot de passe Elastic | `LabSoc2026!` |
| `KEYCLOAK_ISSUER` | URL Keycloak | `http://localhost:8180/realms/labsoc` |

### Intégration SOC-in-a-Box

Pour connecter Morakib à votre installation SOC-in-a-Box:

```bash
# 1. Assurez-vous que SOC-in-a-Box est démarré
cd ~/labsoc-home
docker-compose up -d

# 2. Morakib se connectera automatiquement via le réseau Docker
```

---

## 📊 Schéma de Base de Données

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │       │   Alerts    │       │    SOPs     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │──┐    │ id          │
│ email       │  │    │ title       │  │    │ title       │
│ role        │  │    │ severity    │  │    │ category    │
│ team_id     │  │    │ status      │  │    │ checklist   │
└─────────────┘  │    │ assigned_to │──┘    │ examples    │
                 │    └─────────────┘       └─────────────┘
                 │           │                     │
                 │    ┌──────┴──────┐             │
                 │    ▼             ▼             │
                 │ ┌─────────────────────────┐    │
                 └─│    Investigations       │────┘
                   ├─────────────────────────┤
                   │ id                      │
                   │ alert_id                │
                   │ analyst_id              │
                   │ sop_id                  │
                   │ findings                │
                   │ conclusion              │
                   └─────────────────────────┘
```

---

## 🛣️ Roadmap

- [x] **Phase 1** - MVP (Dashboard, Alertes, Base)
- [ ] **Phase 2** - Investigation guidée complète, SOPs
- [ ] **Phase 3** - Analytics, Gamification
- [ ] **Phase 4** - Suggestions IA, Mode guidé avancé
- [ ] **Phase 5** - Tests, Documentation, Déploiement

---

## 🤝 Contribution

Les contributions sont les bienvenues! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les détails.

---

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour les détails.

---

## 🔗 Liens

- **SOC-in-a-Box**: [github.com/wezjob/soc-in-a-box](https://github.com/wezjob/soc-in-a-box)
- **Documentation**: [docs/](docs/)
- **Cahier des charges**: [docs/CAHIER_DES_CHARGES.md](docs/CAHIER_DES_CHARGES.md)

---

<p align="center">
  <strong>🛡️ Morakib - Empowering SOC Analysts</strong><br>
  <em>Built with ❤️ for the security community</em>
</p>
