"use client";

import { useState } from "react";
import { 
  FileText, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Code,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { LogEntry } from "@/data/sandbox-logs";

interface LogViewerProps {
  logs: LogEntry[] | string;
  title: string;
  type?: "json" | "raw" | "email-headers";
}

export function LogViewer({ logs, title, type = "json" }: LogViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const copyAll = () => {
    const content = typeof logs === "string" 
      ? logs 
      : JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500/10 border-red-500/30";
      case "error":
        return "bg-red-400/10 border-red-400/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "info":
        return "bg-blue-500/10 border-blue-500/30";
      default:
        return "bg-slate-800 border-slate-700";
    }
  };

  // Handle string logs (like email headers)
  if (typeof logs === "string") {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-white">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); copyAll(); }}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-4 pt-0">
            <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto text-sm">
              <code className="text-emerald-400 whitespace-pre-wrap">{logs}</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesText = filter === "" || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.raw?.toLowerCase().includes(filter.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    
    return matchesText && matchesLevel;
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <span className="font-medium text-white">{title}</span>
          <span className="text-xs text-slate-500">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); copyAll(); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode("pretty")}
                className={`px-3 py-2 text-sm flex items-center gap-1 ${
                  viewMode === "pretty" 
                    ? "bg-purple-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="h-4 w-4" />
                Pretty
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-3 py-2 text-sm flex items-center gap-1 ${
                  viewMode === "raw" 
                    ? "bg-purple-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Code className="h-4 w-4" />
                Raw
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No logs match your filter
              </div>
            ) : viewMode === "pretty" ? (
              filteredLogs.map((log, idx) => (
                <LogEntryCard key={idx} log={log} />
              ))
            ) : (
              <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto text-xs">
                <code className="text-slate-300">
                  {filteredLogs.map(log => log.raw || JSON.stringify(log, null, 2)).join("\n\n")}
                </code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual log entry card
function LogEntryCard({ log }: { log: LogEntry }) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLog = () => {
    navigator.clipboard.writeText(log.raw || JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case "critical":
        return "border-red-500/30 bg-red-500/5";
      case "error":
        return "border-red-400/30 bg-red-400/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "info":
        return "border-blue-500/30 bg-blue-500/5";
      default:
        return "border-slate-700 bg-slate-800";
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${getLevelBg(log.level)}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {getLevelIcon(log.level)}
          <span className="text-xs text-slate-400">{log.timestamp}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{log.source}</span>
        </div>
        <div className="flex items-center gap-1">
          {log.raw && (
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Toggle raw view"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={copyLog}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-white mt-2">{log.message}</p>

      {/* Metadata */}
      {log.metadata && !showRaw && (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(log.metadata).slice(0, 6).map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="text-slate-500">{key}: </span>
              <span className="text-emerald-400 font-mono">{String(value)}</span>
            </div>
          ))}
          {Object.keys(log.metadata).length > 6 && (
            <span className="text-xs text-slate-500">+{Object.keys(log.metadata).length - 6} more</span>
          )}
        </div>
      )}

      {/* Raw view */}
      {showRaw && log.raw && (
        <pre className="mt-2 bg-slate-950 rounded p-2 overflow-x-auto text-xs">
          <code className="text-slate-300">{log.raw}</code>
        </pre>
      )}
    </div>
  );
}
