import { FileText, Plus, Search } from "lucide-react";
import { SOPCard } from "@/components/sops/sop-card";

// Demo data
const sops = [
  {
    id: "1",
    title: "SSH Brute Force Response",
    slug: "ssh-brute-force",
    category: "Authentification",
    code: "SOP-AUTH-001",
    description: "Procédure de réponse aux tentatives de brute force SSH détectées par Suricata.",
    alertTypes: ["SSH Brute Force", "Failed SSH Login"],
    version: 3,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    author: "Jean Dupont",
  },
  {
    id: "2",
    title: "DNS Tunneling Investigation",
    slug: "dns-tunneling",
    category: "Réseau",
    code: "SOP-NET-001",
    description: "Guide d'investigation pour les alertes de DNS tunneling et exfiltration de données via DNS.",
    alertTypes: ["DNS Tunneling", "Suspicious DNS Query"],
    version: 2,
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    author: "Marie Laurent",
  },
  {
    id: "3",
    title: "Data Exfiltration Response",
    slug: "data-exfiltration",
    category: "Réseau",
    code: "SOP-NET-002",
    description: "Procédure de réponse aux transferts de données suspects vers l'extérieur.",
    alertTypes: ["Large Outbound Transfer", "Data Exfil"],
    version: 1,
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    author: "Ahmed Khalil",
  },
  {
    id: "4",
    title: "Suspicious Port Connection",
    slug: "suspicious-port",
    category: "Malware",
    code: "SOP-MAL-001",
    description: "Investigation des connexions vers des ports suspects (4444, 5555, 31337, etc.).",
    alertTypes: ["Suspicious Port", "C2 Communication"],
    version: 4,
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    author: "Sophie Martin",
  },
  {
    id: "5",
    title: "TOR Network Detection",
    slug: "tor-detection",
    category: "Réseau",
    code: "SOP-NET-003",
    description: "Procédure de gestion des connexions TOR détectées sur le réseau.",
    alertTypes: ["TOR Traffic", "Anonymous Proxy"],
    version: 2,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    author: "Jean Dupont",
  },
  {
    id: "6",
    title: "Crypto Mining Detection",
    slug: "crypto-mining",
    category: "Malware",
    code: "SOP-MAL-002",
    description: "Investigation et réponse aux activités de minage de cryptomonnaie.",
    alertTypes: ["Crypto Mining", "Stratum Protocol"],
    version: 1,
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    author: "Marie Laurent",
  },
];

const categories = ["Toutes", "Authentification", "Réseau", "Malware", "Web", "Endpoint"];

export default function SOPsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">
              Procédures Opérationnelles (SOPs)
            </h1>
          </div>
          <p className="text-slate-400 mt-1">
            Bibliothèque des procédures standard pour l&apos;analyse et la réponse aux incidents
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          <Plus className="h-4 w-4" />
          Nouvelle SOP
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une SOP..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                cat === "Toutes"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SOPs Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sops.map((sop) => (
          <SOPCard key={sop.id} sop={sop} />
        ))}
      </div>
    </div>
  );
}
