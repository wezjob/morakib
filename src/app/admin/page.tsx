"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersManagement } from "@/components/admin/users-management";
import { Users, Settings, Shield, Database } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/20">
          <Settings className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Administration Technique</h1>
          <p className="text-slate-400">
            Gestion des utilisateurs, rôles et paramètres système
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Shield className="h-4 w-4 mr-2" />
            Rôles & Permissions
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <UsersManagement />
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Rôles & Permissions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configuration des permissions par rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* ADMIN Role */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        ADMIN
                      </span>
                      <span className="text-white font-medium">Administrateur</span>
                    </div>
                    <span className="text-emerald-400 text-sm">Tous les droits</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Accès complet à toutes les fonctionnalités, gestion des utilisateurs et configuration système.
                  </p>
                </div>

                {/* LEAD Role */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                        LEAD
                      </span>
                      <span className="text-white font-medium">Team Lead</span>
                    </div>
                    <span className="text-yellow-400 text-sm">Droits étendus</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Gestion d'équipe, validation des investigations, accès aux analytics avancés.
                  </p>
                </div>

                {/* ANALYST_SENIOR Role */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                        ANALYST_SENIOR
                      </span>
                      <span className="text-white font-medium">Analyste Senior</span>
                    </div>
                    <span className="text-blue-400 text-sm">Droits avancés</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Traitement des alertes critiques, création de SOPs, mentorat des juniors.
                  </p>
                </div>

                {/* ANALYST_JUNIOR Role */}
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        ANALYST_JUNIOR
                      </span>
                      <span className="text-white font-medium">Analyste Junior</span>
                    </div>
                    <span className="text-slate-400 text-sm">Droits de base</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Consultation des alertes, suivi des SOPs, accès au guide de formation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-500" />
                Paramètres Système
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configuration des intégrations et paramètres généraux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Elasticsearch</h4>
                      <p className="text-sm text-slate-400">Connexion SIEM</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      Connecté
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">PostgreSQL</h4>
                      <p className="text-sm text-slate-400">Base de données</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      Connecté
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">MITRE ATT&CK</h4>
                      <p className="text-sm text-slate-400">Framework de référence</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      Chargé
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
