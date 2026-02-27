import { notFound } from "next/navigation";
import { AlertDetailView } from "@/components/alerts/alert-detail-view";

// Demo data - will be replaced with API call
const alertsData: Record<string, any> = {
  "1": {
    id: "1",
    title: "SSH Brute Force Attempt",
    description: "Multiples tentatives de connexion SSH échouées détectées depuis la même IP source.",
    severity: "HIGH",
    status: "NEW",
    source: "SURICATA",
    sourceIp: "192.168.1.100",
    destIp: "10.0.0.50",
    sourcePort: 54321,
    destPort: 22,
    protocol: "TCP",
    ruleName: "LABSOC SSH Brute Force Attempt",
    ruleId: "1000001",
    detectedAt: new Date(Date.now() - 5 * 60 * 1000),
    rawLog: {
      timestamp: "2026-02-27T14:32:15.000Z",
      flow_id: 1234567890,
      src_ip: "192.168.1.100",
      src_port: 54321,
      dest_ip: "10.0.0.50",
      dest_port: 22,
      proto: "TCP",
      alert: {
        signature: "LABSOC SSH Brute Force Attempt",
        signature_id: 1000001,
        severity: 2,
        category: "Attempted Administrator Privilege Gain",
      },
      ssh: {
        client: {
          software_version: "OpenSSH_8.9",
          proto_version: "2.0",
        },
      },
    },
    enrichmentData: {
      abuseipdb: {
        score: 85,
        country: "CN",
        isp: "China Telecom",
        reports: 127,
      },
      virustotal: {
        malicious: 12,
        suspicious: 5,
        harmless: 45,
      },
    },
    suggestedSOP: {
      id: "1",
      title: "SSH Brute Force Response",
      code: "SOP-AUTH-001",
    },
  },
};

export default function AlertDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const alert = alertsData[params.id];

  if (!alert) {
    notFound();
  }

  return <AlertDetailView alert={alert} />;
}
