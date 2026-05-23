"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, ChevronRight, Copy, Check, Loader2, X } from "lucide-react";
import { sandboxCommands, SandboxCommand } from "@/data/sandbox-logs";

interface SandboxTerminalProps {
  labId: string;
  onCommandExecuted?: (command: string, output: string) => void;
}

export function SandboxTerminal({ labId, onCommandExecuted }: SandboxTerminalProps) {
  const [history, setHistory] = useState<{ command: string; output: string; isError?: boolean }[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SandboxCommand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const availableCommands = sandboxCommands[labId] || [];

  useEffect(() => {
    // Scroll to bottom when history changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsExecuting(true);
    setShowSuggestions(false);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Find matching command
    const matchedCommand = availableCommands.find(
      c => c.command.toLowerCase() === cmd.toLowerCase() ||
           cmd.toLowerCase().includes(c.command.toLowerCase().split(" ")[0])
    );

    if (matchedCommand) {
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, matchedCommand.delay || 500));
      
      setHistory(prev => [...prev, { 
        command: cmd, 
        output: matchedCommand.output 
      }]);
      
      onCommandExecuted?.(cmd, matchedCommand.output);
    } else if (cmd.toLowerCase() === "help") {
      const helpOutput = `Available commands for this lab:
${"-".repeat(50)}
${availableCommands.map(c => `• ${c.command}\n  → ${c.description}`).join("\n\n")}

Type a command or use Tab for autocomplete.`;
      
      setHistory(prev => [...prev, { command: cmd, output: helpOutput }]);
    } else if (cmd.toLowerCase() === "clear") {
      setHistory([]);
    } else {
      // Command not found - suggest similar
      const similar = availableCommands.filter(c => 
        c.command.toLowerCase().includes(cmd.toLowerCase().split(" ")[0]) ||
        c.description.toLowerCase().includes(cmd.toLowerCase())
      );

      let errorOutput = `Command not found: ${cmd}`;
      if (similar.length > 0) {
        errorOutput += `\n\nDid you mean:\n${similar.map(c => `  • ${c.command}`).join("\n")}`;
      }
      errorOutput += `\n\nType 'help' to see available commands.`;

      setHistory(prev => [...prev, { 
        command: cmd, 
        output: errorOutput,
        isError: true
      }]);
    }

    setCurrentCommand("");
    setIsExecuting(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isExecuting) {
      executeCommand(currentCommand);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Autocomplete
      const matches = availableCommands.filter(c =>
        c.command.toLowerCase().startsWith(currentCommand.toLowerCase())
      );
      if (matches.length === 1) {
        setCurrentCommand(matches[0].command);
        setShowSuggestions(false);
      } else if (matches.length > 1) {
        setSuggestions(matches);
        setShowSuggestions(true);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setCurrentCommand(value);
    
    // Show suggestions as user types
    if (value.length > 2) {
      const matches = availableCommands.filter(c =>
        c.command.toLowerCase().includes(value.toLowerCase()) ||
        c.description.toLowerCase().includes(value.toLowerCase())
      );
      if (matches.length > 0 && matches.length <= 5) {
        setSuggestions(matches);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (cmd: SandboxCommand) => {
    setCurrentCommand(cmd.command);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Sandbox Terminal</span>
          <span className="text-xs text-slate-500">({availableCommands.length} commands available)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="text-xs text-slate-500 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => executeCommand("help")}
            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
          >
            Help
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        className="h-80 overflow-y-auto p-4 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Welcome message */}
        {history.length === 0 && (
          <div className="text-slate-500 mb-4">
            <p>🔬 Sandbox SOC Lab - Environment isolated</p>
            <p>Type <span className="text-emerald-400">'help'</span> to see available commands</p>
            <p>Use <span className="text-emerald-400">Tab</span> for autocomplete, <span className="text-emerald-400">↑/↓</span> for history</p>
            <p className="mt-2 text-slate-600">─────────────────────────────────────</p>
          </div>
        )}

        {/* Command history */}
        {history.map((entry, idx) => (
          <div key={idx} className="mb-4">
            {/* Command */}
            <div className="flex items-center gap-2 text-emerald-400">
              <ChevronRight className="h-4 w-4" />
              <span>{entry.command}</span>
            </div>
            
            {/* Output */}
            <div className={`mt-2 pl-6 whitespace-pre-wrap ${
              entry.isError ? "text-red-400" : "text-slate-300"
            }`}>
              {entry.output}
            </div>
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-center gap-2 relative">
          <ChevronRight className={`h-4 w-4 ${isExecuting ? "text-yellow-400" : "text-emerald-400"}`} />
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-emerald-400 placeholder-slate-600 outline-none disabled:opacity-50"
            autoFocus
          />
          {isExecuting && (
            <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute mt-1 ml-6 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-w-xl">
            <div className="flex items-center justify-between px-3 py-1 border-b border-slate-700">
              <span className="text-xs text-slate-500">Suggestions</span>
              <button 
                onClick={() => setShowSuggestions(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {suggestions.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(cmd)}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors flex items-start gap-2"
              >
                <ChevronRight className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-emerald-400 font-mono">{cmd.command}</p>
                  <p className="text-xs text-slate-500">{cmd.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Command Buttons Component
interface QuickCommandsProps {
  labId: string;
  onExecute: (command: string) => void;
}

export function QuickCommands({ labId, onExecute }: QuickCommandsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const commands = sandboxCommands[labId] || [];

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(null), 2000);
  };

  if (commands.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-emerald-400" />
        Commandes Disponibles
      </h4>
      <div className="space-y-2">
        {commands.map((cmd, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800 group"
          >
            <div className="flex-1 min-w-0">
              <code className="text-xs text-emerald-400 block truncate">{cmd.command}</code>
              <p className="text-xs text-slate-500 truncate">{cmd.description}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => copyCommand(cmd.command)}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Copier"
              >
                {copied === cmd.command ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => onExecute(cmd.command)}
                className="p-1.5 rounded hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Exécuter"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
