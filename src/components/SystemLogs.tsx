import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, RefreshCw, AlertTriangle, CheckCircle, Play, Pause, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  subsystem: "SYS" | "BATT" | "TEMP" | "MEM" | "NET" | "SEC";
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  message: string;
}

const TEMPLATES: { subsystem: LogEntry["subsystem"]; severity: LogEntry["severity"]; messages: string[] }[] = [
  {
    subsystem: "TEMP",
    severity: "INFO",
    messages: [
      "Silicon thermal junction sensor 0 calibrated successfully.",
      "Anode active cooling fan dynamic PWM rate altered: 2100 RPM.",
      "Primary heat spread dissipation delta established within safe range (+1.2°C/sec).",
      "Junction temperature stabilized under active compute load simulation."
    ]
  },
  {
    subsystem: "BATT",
    severity: "SUCCESS",
    messages: [
      "Lithium-ion stability matrix updated: Anode impedance index rated excellent.",
      "Dynamic charger handshake negotiated at 4.25 Volts.",
      "Active bypass grid active: Cathode energy drain safely minimized.",
      "Battery safety isolation switch passed secondary integrity test."
    ]
  },
  {
    subsystem: "MEM",
    severity: "WARNING",
    messages: [
      "Garbage collector signal triggered: Transient buffer accumulation exceeded 85%.",
      "Cache paging memory swapping frames to local browser virtual storage.",
      "Memory leak scan completed: 4 micro-gaps isolated in background telemetry loop.",
      "Heap fragmentation index: 24% - Optimization recommended."
    ]
  },
  {
    subsystem: "NET",
    severity: "INFO",
    messages: [
      "Diagnostic handshake established with APAC-MUMBAI Gateway.",
      "Telemetry proxy packet roundtrip established: 14ms latency.",
      "Dynamic data encryption layer set to TLS 1.3 cryptographic protocols.",
      "Sensor registry handshake verified with Cloud Run edge cluster node-12."
    ]
  },
  {
    subsystem: "SEC",
    severity: "CRITICAL",
    messages: [
      "Integrity check warn: Unverified simulated voltage spike logged on module 4.",
      "Cognitive reasoning anomaly detected in standard logic prediction buffer.",
      "Battery thermistor tolerance mismatch (48.5°C threshold crossed).",
      "System safe mode automatic bypass protocol deactivated."
    ]
  },
  {
    subsystem: "SYS",
    severity: "SUCCESS",
    messages: [
      "Gemini AI Reasoning Matrix: Cognitive system calibrated.",
      "Hardware health model updated: Overall score computed at ideal efficiency.",
      "Device Boot Sequence records verified - Status: Safe established in local ledger.",
      "Diagnostics supervisor thread launched in separate high-priority queue."
    ]
  }
];

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"ALL" | "INFO" | "SUCCESS" | "WARNING" | "CRITICAL">("ALL");
  const [isRunning, setIsRunning] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate an initial batch of logs on load
  useEffect(() => {
    const initialLogs: LogEntry[] = [];
    const now = new Date();
    for (let i = 8; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 8000).toISOString().substring(11, 19);
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      initialLogs.push({
        id: `init-${i}-${Math.random()}`,
        timestamp: timeStr,
        subsystem: template.subsystem,
        severity: template.severity,
        message: template.messages[Math.floor(Math.random() * template.messages.length)]
      });
    }
    setLogs(initialLogs);
  }, []);

  // Periodically push fresh dynamic diagnostic telemetry logs
  useEffect(() => {
    if (!isRunning) return;

    const pushLog = () => {
      const timeStr = new Date().toISOString().substring(11, 19);
      const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const newLog: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        subsystem: template.subsystem,
        severity: template.severity,
        message: template.messages[Math.floor(Math.random() * template.messages.length)]
      };
      setLogs(prev => {
        // cap logs list to avoid UI slow down
        const next = [...prev, newLog];
        if (next.length > 100) next.shift();
        return next;
      });
    };

    const interval = setInterval(pushLog, 4000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-scroll log output container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(l => filter === "ALL" || l.severity === filter);

  const getSeverityStyle = (s: LogEntry["severity"]) => {
    switch (s) {
      case "INFO": return "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/25";
      case "SUCCESS": return "text-[#0cf35a] bg-[#0cf35a]/10 border-[#0cf35a]/25";
      case "WARNING": return "text-orange-400 bg-orange-400/10 border-orange-400/25";
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/25";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/25";
    }
  };

  const getSubsystemName = (sub: LogEntry["subsystem"]) => {
    switch (sub) {
      case "SYS": return "AI_CORE";
      case "BATT": return "CELL_ANODE";
      case "TEMP": return "THERMAL_JUNC";
      case "MEM": return "SWAP_RAM";
      case "NET": return "APAC_MUM";
      case "SEC": return "SEC_ENCLAVE";
      default: return "DEVICE";
    }
  };

  return (
    <div className="bg-[#081120]/95 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col h-full font-mono text-xs select-none relative backdrop-blur-md">
      
      {/* Visual cyber scanner lines and layout accents */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />
      
      {/* Card Header section */}
      <div className="bg-[#050b14] border-b border-slate-900 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div className="text-left font-display">
            <h4 className="text-white font-bold leading-none flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              LIVE TELEMETRY STREAM
            </h4>
            <span className="text-[8.5px] text-gray-500 uppercase tracking-widest block mt-1">REAL-TIME HARDWARE SIGNAL ANNOTATION</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`p-1.5 rounded-md border text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 hover:text-white cursor-pointer ${
              isRunning 
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-950/40" 
                : "bg-amber-950/20 text-amber-500 border-amber-500/30 hover:border-amber-500 hover:bg-amber-950/40"
            }`}
            title={isRunning ? "Pause continuous analysis logging" : "Resume live telemetry tracking"}
          >
            {isRunning ? (
              <>
                <Pause className="w-3 h-3" />
                <span className="hidden sm:inline">Stream Live</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span className="hidden sm:inline">Paused</span>
              </>
            )}
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-1.5 rounded-md bg-white/5 hover:bg-red-950/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Wipe diagnostics memory console buffer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Categories/filters toolbar */}
      <div className="bg-[#060c16]/50 border-b border-slate-900 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {(["ALL", "INFO", "SUCCESS", "WARNING", "CRITICAL"] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase border transition-all cursor-pointer ${
                filter === sev 
                  ? "bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_8px_rgba(0,240,255,0.3)]" 
                  : "bg-slate-900/60 text-gray-400 border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-[8px] text-gray-600 block bg-slate-950 px-1.5 py-0.5 rounded uppercase font-bold">
          BUFFER: {filteredLogs.length}/{logs.length} FRAMES
        </span>
      </div>

      {/* Terminal display log terminal lines */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#03070d]/90 font-mono text-[10px] min-h-[180px] h-[260px] custom-scrollbar text-left"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-10 space-y-2">
            <Shield className="w-6 h-6 text-gray-600 animate-pulse" />
            <span className="uppercase tracking-widest">No active hardware packets logged in this layer.</span>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div 
              key={log.id} 
              className="flex items-start gap-2 border-l border-slate-800 pl-2 py-0.5 hover:bg-white/[0.02] transition-colors rounded-r"
            >
              <span className="text-gray-500 select-none text-[9.5px]">{log.timestamp}</span>
              
              <span className="text-gray-400 font-extrabold uppercase text-[8.5px] tracking-tight bg-slate-900 px-1 py-0.2 rounded border border-slate-800 whitespace-nowrap">
                {getSubsystemName(log.subsystem)}
              </span>
              
              <span className={`px-1 rounded text-[8.5px] tracking-wider uppercase font-extrabold border shrink-0 ${getSeverityStyle(log.severity)}`}>
                {log.severity}
              </span>

              <span className="text-gray-300 leading-tight font-medium select-text break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Interactive Command Input Box Accent */}
      <div className="bg-[#050b14]/90 border-t border-slate-900/90 py-2 px-3 flex items-center justify-between gap-1 select-none font-mono text-[8px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 inline-block font-extrabold">&gt;_</span>
          <span>STATUS: ACCELERATING DATA PACK SYSTEM STREAMS LINKED</span>
        </div>
        <span className="text-[7.5px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 px-1.5 py-0.5 rounded leading-none">
          SYSTEM HEALTHY (100% ONLINE)
        </span>
      </div>
    </div>
  );
}
