#!/bin/bash
# Create test alerts in Elasticsearch for Morakib SIEM testing

ES_URL="http://localhost:9200"
ES_USER="elastic"
ES_PASS="LabSoc2026!"
INDEX="labsoc-alerts"

echo "Creating test alerts in Elasticsearch..."

# Alert 1 - Cobalt Strike C2 (CRITICAL)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:15:00Z",
    "event.severity": "4",
    "rule.name": "ET TROJAN Cobalt Strike Beacon C2",
    "source.ip": "192.168.1.50",
    "destination.ip": "185.143.223.100",
    "mitre.tactic": "command-and-control",
    "mitre.technique": "T1071",
    "labsoc.source": "suricata"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 1 sent"

# Alert 2 - SSH Brute Force (HIGH)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:16:30Z",
    "event.severity": "3",
    "rule.name": "SSH Brute Force Attack Detected",
    "source.ip": "10.0.0.99",
    "destination.ip": "192.168.1.10",
    "mitre.tactic": "credential-access",
    "mitre.technique": "T1110",
    "labsoc.source": "suricata"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 2 sent"

# Alert 3 - DNS Tunneling (HIGH)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:17:45Z",
    "event.severity": "3",
    "rule.name": "DNS Tunneling via TXT Records",
    "source.ip": "192.168.1.75",
    "destination.ip": "8.8.8.8",
    "mitre.tactic": "exfiltration",
    "mitre.technique": "T1048",
    "labsoc.source": "zeek"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 3 sent"

# Alert 4 - Port Scan (MEDIUM)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:18:20Z",
    "event.severity": "2",
    "rule.name": "Port Scan Detected - Multiple Ports",
    "source.ip": "172.16.0.55",
    "destination.ip": "192.168.1.0",
    "mitre.tactic": "discovery",
    "mitre.technique": "T1046",
    "labsoc.source": "suricata"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 4 sent"

# Alert 5 - Mimikatz (CRITICAL)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:19:00Z",
    "event.severity": "4",
    "rule.name": "Mimikatz Activity Detected",
    "source.ip": "192.168.1.120",
    "destination.ip": "192.168.1.5",
    "mitre.tactic": "credential-access",
    "mitre.technique": "T1003",
    "labsoc.source": "elastic"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 5 sent"

# Alert 6 - Ransomware (CRITICAL)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:20:00Z",
    "event.severity": "4",
    "rule.name": "Ransomware File Encryption Behavior",
    "source.ip": "192.168.1.88",
    "destination.ip": "192.168.1.200",
    "mitre.tactic": "impact",
    "mitre.technique": "T1486",
    "labsoc.source": "elastic"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 6 sent"

# Alert 7 - Lateral Movement (HIGH)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:21:15Z",
    "event.severity": "3",
    "rule.name": "SMB Lateral Movement Detected",
    "source.ip": "192.168.1.45",
    "destination.ip": "192.168.1.100",
    "mitre.tactic": "lateral-movement",
    "mitre.technique": "T1021.002",
    "labsoc.source": "zeek"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 7 sent"

# Alert 8 - Cryptominer (MEDIUM)
curl -s -u "$ES_USER:$ES_PASS" -X POST "$ES_URL/$INDEX/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-03-03T10:22:30Z",
    "event.severity": "2",
    "rule.name": "Cryptocurrency Mining Pool Connection",
    "source.ip": "192.168.1.155",
    "destination.ip": "94.130.12.27",
    "mitre.tactic": "impact",
    "mitre.technique": "T1496",
    "labsoc.source": "suricata"
  }' | jq -r '.result // .error.type' 2>/dev/null || echo "Alert 8 sent"

echo ""
echo "Done! Checking count..."
curl -s -u "$ES_USER:$ES_PASS" "$ES_URL/$INDEX/_count" | jq '.count'
