import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Battery as BatteryIcon, 
  Flame, 
  HardDrive, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Cpu, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  Sliders, 
  Terminal, 
  Sparkles,
  Award,
  BookOpen,
  DollarSign,
  Wrench,
  Compass,
  ChevronRight,
  Shield,
  Layers,
  PhoneCall,
  Globe,
  SlidersHorizontal,
  Home,
  MessageSquare,
  Power,
  Play,
  FileText,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Header from "./components/Header";
import MetricCard from "./components/MetricCard";
import VoiceAssistantScreen from "./components/VoiceAssistantScreen";
import { RepairNetworkScreen } from "./components/RepairNetworkScreen";
import { PitchDeckScreen } from "./components/PitchDeckScreen";
import GoogleChatScreen from "./components/GoogleChatScreen";
import { SubscriptionPaymentModal } from "./components/SubscriptionPaymentModal";
import { TelemetryState, SmartAlert, GeminiDiagnosticReport, TelemetryHistoryPoint } from "./types";
import { DEFAULT_TELEMETRY, PRESETS, calculateWeightedHealthScore, scanTelemetryForRuleAlerts, generateHistoryPoints, getRealBrowserTelemetry } from "./utils/telemetrySim";
import { initAuth, googleSignIn, logout } from "./lib/auth";

export default function App() {
  const [user, setUser] = useState<any>(null);
  // Global Telemetry Simulation State
  const [telemetry, setTelemetry] = useState<TelemetryState>(() => {
    const saved = localStorage.getItem("devicepulse_telemetry");
    return saved ? JSON.parse(saved) : { ...DEFAULT_TELEMETRY };
  });

  // Effect to sync real hardware signals if available
  useEffect(() => {
    const syncRealData = async () => {
      const realUpdates = await getRealBrowserTelemetry(telemetry);
      setTelemetry(prev => ({ ...prev, ...realUpdates }));
    };
    
    // Initial sync
    syncRealData();
    
    // Periodic real signal polling
    const interval = setInterval(syncRealData, 10000);
    return () => clearInterval(interval);
  }, []);
  const [isScanning, setIsScanning] = useState(false);
  const [historyPoints, setHistoryPoints] = useState<TelemetryHistoryPoint[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  
  // YouTube Style 3D Tabs Management
  // Home (AI Core), Battery, Thermal, Perf, Storage, Voice Assistant, Repair Finder, Pitch Deck
  const [activeTab, setActiveTab] = useState<"home" | "battery" | "thermal" | "performance" | "storage" | "ai-predictions" | "voice-assistant" | "repair-network" | "pitch-deck" | "google-chat">("home");

  // Premium / Pro unlocked status
  const [isProUnlocked, setIsProUnlocked] = useState(() => {
    return localStorage.getItem("devicepulse_pro_unlocked") === "true";
  });
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"FREE" | "PRO" | "ULTRA">("FREE");
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  // Sync subscription status from backend
  const syncSubscription = async (uid: string) => {
    try {
      const res = await fetch(`/api/subscription/status?uid=${uid}`);
      const data = await res.json();
      if (data.status) {
        setSubscriptionStatus(data.status);
        setExpiryDate(data.expiryDate);
        setIsProUnlocked(data.status !== "FREE");
        localStorage.setItem("devicepulse_pro_unlocked", (data.status !== "FREE").toString());
      }
    } catch (err) {
      console.error("Subscription sync failed:", err);
    }
  };

  // Auth Initialization and sync
  useEffect(() => {
    const unsub = initAuth((authedUser) => {
      setUser(authedUser);
      syncSubscription(authedUser.uid);
    }, () => {
      setUser(null);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        syncSubscription(result.user.uid);
      }
    } catch (e) {
      console.error("Sign in failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setSubscriptionStatus("FREE");
      setIsProUnlocked(false);
      localStorage.setItem("devicepulse_pro_unlocked", "false");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // Gemini API prediction state
  const [report, setReport] = useState<GeminiDiagnosticReport | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiApiKeyExists, setAiApiKeyExists] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Optimization simulation feedback messages
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLog, setOptimizationLog] = useState<string[]>([]);

  // Simulation controls collapsible status on Home tab
  const [showSimHarness, setShowSimHarness] = useState(false);

  // Animated Splash Screen Booting Sequence State
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootPhase, setBootPhase] = useState("Initializing Core Core CPU channels...");

  // Auto-save telemetry every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem("devicepulse_telemetry", JSON.stringify(telemetry));
      console.log("Telemetry auto-saved to localized registers.");
    }, 30000);
    return () => clearInterval(interval);
  }, [telemetry]);

  // Sync history & state warnings
  useEffect(() => {
    const calculatedScore = calculateWeightedHealthScore(telemetry);
    setHistoryPoints(generateHistoryPoints(calculatedScore));
    
    const ruleAlerts = scanTelemetryForRuleAlerts(telemetry);
    setAlerts(ruleAlerts);
  }, [telemetry]);

  // Check backend Gemini system integration on startup
  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        setAiApiKeyExists(data.aiEnabled);
      })
      .catch(() => {
        setAiApiKeyExists(false);
      });
  }, []);

  // Simulating high-end tech startup sequence
  useEffect(() => {
    if (!isBooting) return;
    
    const interval = setInterval(() => {
      setBootProgress(prev => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBooting(false);
          }, 300);
          return 100;
        }
        
        // Dynamic loading messages
        if (next < 20) {
          setBootPhase("INITIALIZING COGNITIVE INTERFACE DRIVERS...");
        } else if (next < 40) {
          setBootPhase("CALCULATING ANODE VOLTAGE HEAT RATIOS...");
        } else if (next < 65) {
          setBootPhase("MAPPING SILICON PARTITION ANOMALIES...");
        } else if (next < 85) {
          setBootPhase("ESTABLISHING INDIA PARTNER REPAIR NODES...");
        } else {
          setBootPhase("LOADING DEVICEPULSE AI COGNITION GRID...");
        }
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isBooting]);

  // Update telemetry helper value
  const updateMetric = (key: keyof TelemetryState, value: any) => {
    setTelemetry(prev => {
      const updated = { ...prev, [key]: value };
      
      if (key === "cpuTemp") {
        updated.thermalScore = Math.max(10, Math.min(100, Math.round(100 - (value - 30) * 1.3)));
        updated.heatAccumulationIndex = parseFloat(((value * 0.6) + (updated.thermalSpikes * 1.5)).toFixed(1));
      }
      if (key === "batteryTemp") {
        updated.batteryScore = Math.max(5, Math.min(100, Math.round(98 - (value - 25) * 1.8 - (updated.chargeCycles * 0.05))));
      }
      if (key === "cpuUsage") {
        updated.perfScore = Math.max(8, Math.min(100, Math.round(100 - (value * 0.4) - (updated.ramPressure * 0.3) - (updated.lagSpikes * 3))));
        updated.estimatedFPS = Math.max(15, Math.min(60, Math.round(60 - (value * 0.3) - (updated.lagSpikes * 2))));
      }
      if (key === "ramPressure") {
        updated.perfScore = Math.max(8, Math.min(100, Math.round(100 - (updated.cpuUsage * 0.4) - (value * 0.3) - (updated.lagSpikes * 3))));
      }
      if (key === "corruptRisk" || key === "writeLatency" || key === "storageUsed") {
        const wearPenalty = updated.corruptRisk * 0.5;
        const latencyPenalty = Math.max(0, (updated.writeLatency - 10) * 0.08);
        updated.storageScore = Math.max(12, Math.min(100, Math.round(99 - (updated.storageUsed * 0.1) - wearPenalty - latencyPenalty)));
      }

      return updated;
    });
  };

  // Preset switch triggers
  const handleApplyPreset = (name: string) => {
    const preset = PRESETS[name];
    if (preset) {
      setTelemetry(prev => ({
        ...prev,
        ...preset,
        stressLevel: name as any,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Core background diagnostic scans
  const handleTriggerTelemetryScan = () => {
    setIsScanning(true);
    setTelemetry(prev => ({
      ...prev,
      sectorsScanned: prev.sectorsScanned + Math.round(Math.random() * 6000 + 4000),
      thermalSpikes: Math.max(0, prev.thermalSpikes - 1)
    }));
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  // AI Inference diagnostics
  const triggerAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    setAiError(null);
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse hardware registers.");
      }
      setReport(data.report);
      setActiveTab("ai-predictions");
    } catch (err: any) {
      setAiError(err.message || "Cognitive AI backend model is syncing parameters.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Fast Systems Optimizers
  const runActiveCoolingMode = () => {
    setIsOptimizing(true);
    setOptimizationLog([]);
    const logs = [
      "Initializing safe liquid dissipation thermal matrices...",
      "Throttling aggressive multi-threaded background process blocks...",
      "Lowering chipset clock governors...",
      "Dispatching extreme hardware core cooling signals."
    ];
    
    logs.forEach((log, i) => {
      setTimeout(() => {
        setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${log}`]);
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        cpuTemp: Math.max(34, prev.cpuTemp - 15),
        batteryTemp: Math.max(29, prev.batteryTemp - 4.2),
        thermalSpikes: 0,
        tempOptimized: true
      } as any));
      setIsOptimizing(false);
      setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - SUCCESS: Silicon temperatures stabilized within safety guard rails.`]);
    }, 3000);
  };

  const runActiveRamFlush = () => {
    setIsOptimizing(true);
    setOptimizationLog([]);
    const logs = [
      "Scanning page registers & active RAM mappings...",
      "Locating heap leak vectors in idle services...",
      "Instructing standard kernel to garbage-collect...",
      "Discarding background cached indexes."
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${log}`]);
      }, (i + 1) * 500);
    });

    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        ramPressure: Math.max(25, Math.round(prev.ramPressure * 0.4)),
        cpuUsage: Math.max(4, Math.round(prev.cpuUsage * 0.25)),
        lagSpikes: 0
      }));
      setIsOptimizing(false);
      setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - SUCCESS: RAM capacity reclaimed. Idle garbage references successfully purged.`]);
    }, 2500);
  };

  const runStorageVacuum = () => {
    setIsOptimizing(true);
    setOptimizationLog([]);
    const logs = [
      "Accessing dynamic block controllers...",
      "Sorting non-essential cache debris logs...",
      "Mapping local SSD segments...",
      "Flashing standard fstrim sector sweep."
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${log}`]);
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        storageUsed: Math.max(12, parseFloat((prev.storageUsed - 7.5).toFixed(1))),
        writeLatency: Math.max(7.5, Number((prev.writeLatency * 0.7).toFixed(1))),
        corruptRisk: Math.max(0, prev.corruptRisk - 1)
      }));
      setIsOptimizing(false);
      setOptimizationLog(prev => [...prev, `${new Date().toLocaleTimeString()} - SUCCESS: Storage sector vacuum complete. 7.5% capacity reclaimed.`]);
    }, 2800);
  };

  // Calculated variables
  const overallHealthScore = calculateWeightedHealthScore(telemetry);

  const exportDiagnosticPdf = () => {
    if (!report) return;
    
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 240, 255); // Cyan-ish
    doc.text("DEVICEPULSE AI - DIAGNOSTIC CERTIFICATE", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${timestamp}`, 14, 30);
    doc.text(`Token: PULSE-SECURE-${overallHealthScore}`, 14, 35);
    
    // Telemetry Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("1. HARDWARE TELEMETRY SNAPSHOT", 14, 48);
    
    const telemetryData = [
      ["Component", "Metric", "Status"],
      ["Battery Health", `${telemetry.batteryScore}%`, telemetry.batteryScore > 70 ? "Optimal" : "Degraded"],
      ["CPU Temperature", `${telemetry.cpuTemp}°C`, telemetry.cpuTemp < 75 ? "Cool" : "Critical"],
      ["RAM Pressure", `${telemetry.ramPressure}%`, telemetry.ramPressure < 80 ? "Stable" : "Stressed"],
      ["Storage Integrity", `${telemetry.storageScore}%`, telemetry.storageScore > 60 ? "Good" : "Risk"],
      ["Overall Health", `${overallHealthScore}/100`, "Calculated AI Score"]
    ];
    
    autoTable(doc, {
      startY: 52,
      head: [telemetryData[0]],
      body: telemetryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [0, 240, 255], textColor: [0, 0, 0] }
    });
    
    // AI Insights
    doc.setFontSize(14);
    doc.text("2. GEMINI AI COGNITIVE DIAGNOSTICS", 14, (doc as any).lastAutoTable.finalY + 15);
    
    doc.setFontSize(11);
    doc.text("Risk Assessment:", 14, (doc as any).lastAutoTable.finalY + 22);
    doc.setTextColor(255, 50, 50);
    doc.text(report.riskAssessment, 14, (doc as any).lastAutoTable.finalY + 28, { maxWidth: 180 });
    
    doc.setTextColor(0, 0, 0);
    doc.text("Technical Details:", 14, (doc as any).lastAutoTable.finalY + 45);
    doc.setFontSize(10);
    doc.text(report.diagnosticDetail.substring(0, 500) + "...", 14, (doc as any).lastAutoTable.finalY + 51, { maxWidth: 180 });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("DevicePulse AI Standard System (India) - Certified Diagnostic Report", 14, 285);
    
    doc.save(`DevicePulse_Report_${Date.now()}.pdf`);
  };

  const getHealthDescriptor = (score: number) => {
    if (score >= 90) return { label: "OPTIMAL HEALTH INTEGRITY", color: "text-neon-green", border: "border-neon-green/30", bg: "bg-neon-green/5" };
    if (score >= 70) return { label: "STABILIZED WITH MINOR WARNING", color: "text-neon-yellow", border: "border-neon-yellow/30", bg: "bg-neon-yellow/5" };
    if (score >= 50) return { label: "SIGNIFICANT HARDWARE DEGRADATION", color: "text-neon-orange", border: "border-neon-orange/30", bg: "bg-neon-orange/5" };
    return { label: "IMMINENT SUBSYSTEM RETRENCHMENT FAILING", color: "text-neon-red font-bold animate-pulse", border: "border-neon-red/40", bg: "bg-neon-red/5" };
  };

  const healthDesc = getHealthDescriptor(overallHealthScore);

  // Render 3D Boot Sequence Splash Screen
  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-[#03070d] text-gray-100 flex flex-col items-center justify-center p-6 tech-grid z-50 select-none overflow-hidden">
        {/* Radar grids of scanlines */}
        <div className="absolute inset-0 bg-linear-to-b from-neon-blue/10 via-transparent to-transparent opacity-30 pointer-events-none radar-sweep" />
        <div className="absolute top-4 left-4 font-mono text-[9px] text-gray-500 tracking-wider text-left space-y-1">
          <div>NODE_STATUS: ACCELERATING_START</div>
          <div>PROTOC: SECURE_CORE_OS_INITIALIZATION</div>
          <div>SYS_TIME: {new Date().toISOString()}</div>
        </div>

        <div className="absolute top-4 right-4 font-mono text-[9.5px] text-neon-blue bg-neon-blue/10 border border-neon-blue/30 px-2 py-0.5 rounded animate-pulse uppercase">
          BOOT INTERFACE ENGAGED
        </div>

        {/* 3D Glass Dome rotating centerpiece */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-10">
          {/* Ambient glow backdrop */}
          <div className="absolute w-44 h-44 rounded-full bg-neon-blue/15 blur-3xl animate-pulse" />
          
          {/* Outer rotating holographic segment circle */}
          <div className="absolute inset-0 border-2 border-dashed border-neon-blue/30 rounded-full animate-[spin_12s_linear_infinite]" />
          
          {/* Segmented middle dial */}
          <div className="absolute inset-4 border border-dotted border-neon-purple/50 rounded-full animate-[spin_8s_linear_infinite_reverse]" />

          {/* Central transparent glass dome orb */}
          <div className="absolute w-48 h-48 rounded-full border border-white/20 bg-linear-to-b from-white/10 to-transparent flex items-center justify-center shadow-2xl backdrop-blur-md">
            {/* Spinning core node star */}
            <div className="w-16 h-16 rounded-full bg-neon-blue/20 border border-neon-blue flex items-center justify-center animate-ping" />
            
            <div className="absolute w-28 h-28 rounded-full border border-dashed border-neon-green/30 animate-[spin_5s_linear_infinite]" />
            <div className="absolute w-12 h-12 rounded-full bg-[#03070d] shadow-[inset_0_0_12px_rgba(0,240,255,0.8)] border border-neon-blue flex items-center justify-center">
              <Cpu className="w-6 h-6 text-neon-blue animate-pulse" />
            </div>
            
            {/* Soft digital scanned lines */}
            <div className="absolute inset-0 h-[1.5px] bg-neon-blue/40 top-1/2 left-0 right-0 animate-[bounce_4s_infinite]" />
          </div>
        </div>

        {/* Brand visual displays */}
        <div className="text-center max-w-sm space-y-2 relative z-10">
          <h1 className="text-3xl font-display font-black tracking-widest text-white flex items-center justify-center gap-2">
            DEVICEPULSE <span className="text-neon-blue">AI</span>
          </h1>
          <p className="text-[10px] font-mono text-neon-purple tracking-widest uppercase">
            3D SMARTPHONE DIAGNOSTIC ARCHITECTURE
          </p>
          
          {/* Scientific progress bar */}
          <div className="w-64 mx-auto pt-6 space-y-1.5">
            <div className="flex justify-between font-mono text-[9px] text-gray-400">
              <span className="truncate max-w-[180px] text-left block">{bootPhase}</span>
              <span className="font-bold text-neon-blue">{bootProgress}%</span>
            </div>
            
            {/* Hollowed tech track */}
            <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full p-0.5 overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-100" 
                style={{ width: `${bootProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* One click bypass portal */}
        <button 
          onClick={() => setIsBooting(false)}
          className="mt-12 group bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 hover:border-neon-blue hover:text-white text-neon-blue px-5 py-2 rounded-md font-mono text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1.5"
        >
          <Play className="w-3 h-3 group-hover:scale-125 transition-transform" />
          Bypass Boot Sequence &rarr;
        </button>

        <div className="absolute bottom-4 font-mono text-[8px] text-gray-600">
          PROTOC_V1.12_BOOT_SEQUENCER_ONLINE &bull; IS_PRO_ACTIVE: {String(isProUnlocked).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col font-sans selection:bg-neon-blue selection:text-black tech-grid relative pb-24">
      
      {/* Dynamic Background Alert Glow */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[160px] opacity-10 pointer-events-none transition-all duration-700 ${
        overallHealthScore < 60 ? "bg-neon-red" : "bg-neon-blue"
      }`} />

      {/* Futuristic Header top element */}
      <Header 
        stressLevel={telemetry.stressLevel} 
        isScanning={isScanning} 
        score={overallHealthScore}
        isPro={isProUnlocked}
        subscriptionTier={subscriptionStatus}
        onUpgrade={() => setIsPayModalOpen(true)}
        user={user}
        onSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
      />

      {/* Main Container Core */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 relative">
        
        {/* TAB 1: 🏠 AI CORE SUMMARY (CLEAN - CLUTTER FREE HOME SCREEN) */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Giant Central 3D Core Health Orb */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center select-none text-center">
                {/* Visual sci-fi scanner items */}
                <div className="absolute top-3 left-4 font-mono text-[8px] text-gray-500 tracking-wider">
                  HEALTH ENGINE: LIVE
                </div>
                <div className="absolute top-3 right-4 flex items-center gap-1.5 font-mono text-[8.5px] text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue inline-block animate-ping" />
                  AI SCAN ACTIVE
                </div>

                <h3 className="text-xs font-mono text-gray-400 mt-4 tracking-widest uppercase">
                  AI Core Health Monitor
                </h3>

                {/* Main floating rotating centerpiece orb */}
                <div className="relative w-52 h-52 my-6 flex items-center justify-center">
                  {/* Outer spinning dash pattern */}
                  <div className="absolute inset-0 border border-dashed border-slate-700/50 rounded-full animate-[spin_30s_linear_infinite]" />
                  <div className="absolute inset-2 border border-slate-800/20 rounded-full" />
                  
                  {/* Gauge SVG ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="104"
                      cy="104"
                      r="86"
                      className="stroke-[#091425]"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="104"
                      cy="104"
                      r="86"
                      className={`transition-all duration-1000 ${
                        overallHealthScore < 60 
                          ? "stroke-neon-red" 
                          : overallHealthScore < 85 
                            ? "stroke-neon-yellow" 
                            : "stroke-neon-green"
                      }`}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="540"
                      strokeDashoffset={540 - (540 * overallHealthScore) / 100}
                    />
                  </svg>

                  {/* Rotating middle visual grid tracker */}
                  <div className="absolute inset-4 border border-dashed border-neon-blue/20 rounded-full animate-[spin_50s_linear_infinite_reverse]" />

                  {/* Centered large Score metrics readout */}
                  <div className="absolute flex flex-col items-center">
                    <motion.span 
                      key={overallHealthScore}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl font-display font-extrabold text-white tracking-widest"
                    >
                      {overallHealthScore}
                    </motion.span>
                    {overallHealthScore < 60 && (
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.15, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full bg-neon-red/20 blur-xl pointer-events-none"
                      />
                    )}
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                      HEALTH DEPTH
                    </span>
                    
                    {/* Level Badge indicator */}
                    <div className="mt-2 text-[10px] font-mono text-neon-blue bg-neon-blue/15 px-2.5 py-0.5 rounded-full border border-neon-blue/30">
                      XP Rank Level {Math.floor(overallHealthScore / 1.1)}
                    </div>
                  </div>
                </div>

                {/* Telemetry descriptor feedback boxes */}
                <div className={`w-full p-3 border rounded font-mono text-center ${healthDesc.border} ${healthDesc.bg}`}>
                  <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-1">REAL-TIME HARDWARE RATING</span>
                  <span className={`text-[11px] font-bold tracking-wider ${healthDesc.color}`}>
                    {healthDesc.label}
                  </span>
                </div>

                <p className="text-[10px] font-mono text-gray-500 mt-3 max-w-[240px] leading-relaxed mx-auto">
                  Weight Matrix: Battery (30%) &bull; Silicon Thermal (30%) &bull; System Logic (20%) &bull; Flash Disk Integrity (20%)
                </p>

                {/* Big scan button */}
                <button
                  onClick={handleTriggerTelemetryScan}
                  disabled={isScanning}
                  className="mt-4 w-full bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/40 text-neon-blue py-2 px-4 rounded text-xs font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 select-none"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                  {isScanning ? "RE-CALIBRATING REGISTERS..." : "FAST TELEMETRY SCAN"}
                </button>

                {/* Sub-preset mini selectors to easily set statuses */}
                <div className="mt-4 border-t border-slate-800/80 pt-3 w-full">
                  <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5 text-center">Fast Presets</span>
                  <div className="flex flex-wrap gap-1 justify-center z-13">
                    {["Normal", "Hyper-Load", "Thermal Stress", "Battery Fault"].map((name) => (
                      <button
                        key={name}
                        onClick={() => handleApplyPreset(name)}
                        className={`px-1.5 py-0.5 border text-[8.5px] font-mono rounded inline-block transition-colors ${
                          telemetry.stressLevel === name 
                            ? "bg-neon-blue/25 border-neon-blue text-white" 
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 text-gray-400"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Right side Dashboard: SVG heartbeats, diagnostic summaries, fast repair access, alerts stack */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Daily system heartbeat graph preview widget */}
              <div className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-5 select-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white font-display font-medium text-sm flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-neon-blue" />
                      Dynamic Silicon Diagnostics Stability Trend Line
                    </h4>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Monitors moving average health trends over active usage periods.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded border border-neon-blue/25">
                    HEURISTICS STABLE
                  </span>
                </div>

                {/* Custom Inline SVG Area Curve Chart */}
                <div className="h-44 bg-[#03070d]/75 rounded-xl border border-slate-850 p-4 relative flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-x-0 h-[1px] bg-slate-800/40" style={{ top: "25%" }} />
                  <div className="absolute inset-x-0 h-[1px] bg-slate-800/40" style={{ top: "50%" }} />
                  <div className="absolute inset-x-0 h-[1px] bg-slate-800/40" style={{ top: "75%" }} />

                  <div className="flex-1 relative w-full flex items-end">
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="glowG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area block fill */}
                      <path
                        d={`M 0,140 Q 90,120 180,100 T 360,110 T 540,90 T 700,70 L 700,140 L 0,140 Z`}
                        fill="url(#glowG)"
                        className="w-full h-full"
                        style={{
                          d: `path("M ${historyPoints.map((p, idx) => {
                            const x = (idx / 6) * 100;
                            const y = 140 - (p.healthScore / 100) * 110;
                            return `${x}% ${y}`;
                          }).join(" L ")} L 100% 140 L 0 140 Z")`
                        }}
                      />

                      {/* Spark line tracking */}
                      <polyline
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={historyPoints.map((p, idx) => {
                          const wCoord = (idx / 6) * 600; 
                          const hCoord = 120 - (p.healthScore / 100) * 90;
                          return `${wCoord},${hCoord}`;
                        }).join(" ")}
                        className="stroke-neon-blue drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                      />

                      {/* Interactive score node indicators */}
                      {historyPoints.map((p, idx) => {
                        const wCoord = (idx / 6) * 600;
                        const hCoord = 120 - (p.healthScore / 100) * 90;
                        return (
                          <circle
                            key={idx}
                            cx={wCoord}
                            cy={hCoord}
                            r={overallHealthScore === p.healthScore ? "5.5" : "3.5"}
                            className={overallHealthScore === p.healthScore ? "fill-neon-blue stroke-white stroke-2" : "fill-[#03070d] stroke-neon-blue stroke-2"}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex justify-between font-mono text-[9px] text-gray-400 pt-2 border-t border-slate-900 mt-2 select-none relative z-10 w-full">
                    {historyPoints.map((p, idx) => (
                      <div key={idx} className="text-center">
                        <span className="block text-gray-500 font-semibold uppercase">{p.day}</span>
                        <span className="block text-neon-blue font-bold">{p.healthScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ISOLATED MODULES QUICK-ACCESS LINK DECK */}
              <div className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-5 select-none text-left">
                <h4 className="text-xs font-mono text-neon-purple uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2 font-bold">
                  🔗 EXPLORE TELEMETRY SECTIONS (YouTube Style)
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => setActiveTab("battery")}
                    className="p-3 bg-slate-900/60 border border-slate-800 hover:border-neon-green/40 hover:bg-neon-green/5 text-left rounded-xl flex flex-col justify-between h-24 transition-all"
                  >
                    <div className="w-7 h-7 bg-neon-green/10 border border-neon-green/25 rounded-md flex items-center justify-center text-neon-green">
                      <BatteryIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block uppercase font-medium">Anode Cell</span>
                      <span className="text-xs font-display font-bold text-white uppercase block">1. Battery AI</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab("thermal")}
                    className="p-3 bg-slate-900/60 border border-slate-800 hover:border-neon-orange/40 hover:bg-neon-orange/5 text-left rounded-xl flex flex-col justify-between h-24 transition-all"
                  >
                    <div className="w-7 h-7 bg-neon-orange/10 border border-neon-orange/25 rounded-md flex items-center justify-center text-neon-orange">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block uppercase font-medium">Silicon Sensor</span>
                      <span className="text-xs font-display font-bold text-white uppercase block">2. Thermal AI</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab("performance")}
                    className="p-3 bg-slate-900/60 border border-slate-800 hover:border-neon-purple/40 hover:bg-neon-purple/5 text-left rounded-xl flex flex-col justify-between h-24 transition-all"
                  >
                    <div className="w-7 h-7 bg-neon-purple/10 border border-neon-purple/25 rounded-md flex items-center justify-center text-neon-purple">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block uppercase font-medium">Logic Flow</span>
                      <span className="text-xs font-display font-bold text-white uppercase block">3. Performance</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setActiveTab("storage")}
                    className="p-3 bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/5 text-left rounded-xl flex flex-col justify-between h-24 transition-all"
                  >
                    <div className="w-7 h-7 bg-blue-500/10 border border-blue-500/25 rounded-md flex items-center justify-center text-blue-400">
                      <HardDrive className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block uppercase font-medium">Flash Block</span>
                      <span className="text-xs font-display font-bold text-white block">4. Flash Memory</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* ACTIVE ALERTS LOOP LISTING */}
              <div className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-5 text-left select-text">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-neon-red" />
                    Live Safety Warning Signals ({alerts.length})
                  </h4>
                  <span className="font-mono text-[9px] text-[#ff1155] border border-neon-red/30 bg-neon-red/5 px-2 py-0.5 rounded animate-pulse">
                    WATCHDOG ACTIVE
                  </span>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-6 font-mono text-xs text-gray-500 select-none bg-[#03070d]/40 border border-slate-850 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-neon-green mx-auto mb-2" />
                    Physical subsystems standard constraints. All telemetry signals normal.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {alerts.map((al) => (
                      <div 
                        key={al.id}
                        className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                          al.type === "Emergency" ? "bg-neon-red/10 border-neon-red/35" : al.type === "Critical" ? "bg-neon-orange/10 border-neon-orange/35" : "bg-neon-yellow/15 border-neon-yellow/35"
                        }`}
                      >
                        <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${al.type === "Emergency" ? "text-neon-red animate-pulse" : "text-neon-orange"}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-white">[{al.type.toUpperCase()}] {al.title}</span>
                            <span className="text-[9px] text-gray-500 font-mono">{al.timestamp}</span>
                          </div>
                          <p className="text-[10.5px] font-mono text-gray-400 mt-1 leading-relaxed">{al.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COLLAPSIBLE SYSTEM CALIBRATOR DRAWER / TRAY */}
              <div className="bg-[#081120]/80 border border-slate-800 rounded-2xl p-4 text-left">
                <button 
                  onClick={() => setShowSimHarness(!showSimHarness)}
                  className="w-full flex items-center justify-between font-mono text-xs text-[#00f0ff] uppercase tracking-widest font-bold"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-neon-blue" />
                    {showSimHarness ? "Close Simulation Hardware Harness" : "Open Simulation Hardware Harness"}
                  </span>
                  <span className="px-2 py-0.5 bg-neon-blue/10 rounded border border-neon-blue/25 text-[9px] text-neon-blue font-bold">
                    {showSimHarness ? "COLLAPSE" : "ENGAGE INPUTS"}
                  </span>
                </button>

                {showSimHarness && (
                  <div className="mt-4 border-t border-slate-850 pt-4 space-y-4 font-mono text-[10.5px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Battery Sim Calibration */}
                      <div className="bg-[#03070d]/60 border border-slate-850 p-3 rounded-xl space-y-2.5">
                        <span className="text-neon-green text-[9.5px] font-bold block">1. ANODE ACCEL CONTROLLER</span>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Battery Cell Temp</span>
                            <span className="text-white font-bold">{telemetry.batteryTemp} °C</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="60"
                            step="0.5"
                            value={telemetry.batteryTemp}
                            onChange={(e) => updateMetric("batteryTemp", parseFloat(e.target.value))}
                            className="w-full accent-neon-green bg-slate-800 h-1 rounded"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Stable Anode Impedance</span>
                            <span className="text-white font-bold">{telemetry.voltageStability} V</span>
                          </div>
                          <input
                            type="range"
                            min="3.2"
                            max="4.5"
                            step="0.05"
                            value={telemetry.voltageStability}
                            onChange={(e) => updateMetric("voltageStability", parseFloat(e.target.value))}
                            className="w-full accent-neon-green bg-slate-800 h-1 rounded"
                          />
                        </div>
                      </div>

                      {/* Silicon Thermal Sim Calibration */}
                      <div className="bg-[#03070d]/60 border border-slate-850 p-3 rounded-xl space-y-2.5">
                        <span className="text-neon-orange text-[9.5px] font-bold block">2. JUNCTION SILICON CONTROL</span>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Silicon Core Temp</span>
                            <span className="text-white font-bold">{telemetry.cpuTemp} °C</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="95"
                            value={telemetry.cpuTemp}
                            onChange={(e) => updateMetric("cpuTemp", parseInt(e.target.value))}
                            className="w-full accent-neon-orange bg-slate-800 h-1 rounded"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">Silicon Micro Spikes</span>
                            <span className="text-white font-bold">{telemetry.thermalSpikes} Spikes</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="25"
                            value={telemetry.thermalSpikes}
                            onChange={(e) => updateMetric("thermalSpikes", parseInt(e.target.value))}
                            className="w-full accent-neon-orange bg-slate-800 h-1 rounded"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: 🔋 DETATED BATTERY SCREEN MODULE */}
        {activeTab === "battery" && (
          <div className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6  space-y-6 text-left animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green glow-green">
                <BatteryIcon className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white flex items-center gap-1.5">
                  🔋 Battery Intelligence Monitor
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Anode cell density, current cycles, dynamic voltage stability index.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850 hover:border-neon-green/35 transition-colors">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Anode Energy Density Rating</span>
                <span className="text-3xl mt-1 block text-white font-display font-bold">{telemetry.batteryScore}%</span>
                <span className="text-[11px] text-gray-400 block mt-2.5 leading-relaxed">Derived directly from standard chemistry calculations and anode deterioration cycles.</span>
              </div>
              
              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850 hover:border-neon-green/35 transition-colors">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Impedance Voltage Stability</span>
                <span className="text-3xl mt-1 block text-neon-green font-display font-bold">{telemetry.voltageStability.toFixed(2)} Volts</span>
                <span className="text-[11px] text-gray-400 block mt-2.5 leading-relaxed">Unbalanced chemical voltages directly accelerate internal oxide crystalline build-up.</span>
              </div>

              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850 hover:border-neon-green/35 transition-colors">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Charging Cycle Count</span>
                <span className="text-3xl mt-1 block text-white font-display font-bold">{telemetry.chargeCycles} Cycles</span>
                <span className="text-[11px] text-gray-400 block mt-2.5 leading-relaxed">Dynamically captured cycle count represents active electro-chemical stress curves over lifespan.</span>
              </div>
            </div>

            {/* Battery Health AI Analysis Graph Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6" id="battery-ai-analysis">
              <div className="border border-slate-850 p-5 rounded-2xl bg-[#03070d]/50 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1 px-3 bg-neon-green/10 text-neon-green font-mono text-[9px] rounded-bl border-l border-b border-neon-green/20">
                  30-DAY ANODE TREND
                </div>
                <h4 className="text-xs text-neon-green uppercase tracking-widest font-bold">Battery Health Efficiency Over Time</h4>
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyPoints}>
                      <defs>
                        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0cf35a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0cf35a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <YAxis 
                        hide 
                        domain={[40, 100]}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ color: '#0cf35a' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="healthScore" 
                        stroke="#0cf35a" 
                        fillOpacity={1} 
                        fill="url(#colorHealth)" 
                        strokeWidth={3}
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-slate-850 p-5 rounded-2xl bg-[#03070d]/50 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1 px-3 bg-neon-orange/10 text-neon-orange font-mono text-[9px] rounded-bl border-l border-b border-neon-orange/20">
                  STRESS CORRELATION RATIO
                </div>
                
                <h4 className="text-xs text-neon-green uppercase tracking-widest font-bold">Charge Temperature Core Stability</h4>
                <p className="text-[11.5px] text-gray-300 leading-relaxed font-mono">
                  Active charging rates ({telemetry.chargeType}) at operational ranges {telemetry.batteryTemp}°C returns a crystalline degradation index of <strong className="text-neon-orange">
                    {(telemetry.batteryTemp > 45 ? 3.8 : telemetry.batteryTemp > 38 ? 2.1 : 1.0).toFixed(1)}x
                  </strong>. Ambient heat thresholds sustained beyond 38 degrees celsius permanently deform lithium-ion molecules, diminishing safe holding limits.
                </p>

                <div className="space-y-3 pt-3">
                  <div>
                    <div className="flex justify-between mb-1.5 font-bold">
                      <span>Active Cell Voltage Range</span>
                      <span className="text-neon-green">GREEN LINE STABILIZATION</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full p-0.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-neon-green h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(12,243,90,0.5)]" 
                        style={{ width: `${Math.min(100, Math.max(15, ((telemetry.voltageStability - 3.2) / 1.3) * 100))}%` }} 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5 font-bold">
                      <span>Degradation Prediction Curve</span>
                      <span className="text-neon-orange">CALCULATING DEPletion</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full p-0.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-neon-orange h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.max(5, (100 - telemetry.batteryScore))}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Integrated Sliders Panel */}
            <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-neon-green uppercase tracking-widest font-bold block border-b border-slate-850 pb-2">
                🔧 Active Battery Calibration Sliders
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Adjust Battery Cell Core Temperature</span>
                    <span className="text-white font-bold">{telemetry.batteryTemp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="0.5"
                    value={telemetry.batteryTemp}
                    onChange={(e) => updateMetric("batteryTemp", parseFloat(e.target.value))}
                    className="w-full accent-neon-green bg-slate-850 h-1.5 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Adjust Electro-Impedance Voltage</span>
                    <span className="text-white font-bold">{telemetry.voltageStability} Volts</span>
                  </div>
                  <input
                    type="range"
                    min="3.2"
                    max="4.5"
                    step="0.05"
                    value={telemetry.voltageStability}
                    onChange={(e) => updateMetric("voltageStability", parseFloat(e.target.value))}
                    className="w-full accent-neon-green bg-slate-850 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: 🌡️ DETAILED THERMAL SCREEN MODULE */}
        {activeTab === "thermal" && (
          <div className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <div className="w-10 h-10 rounded-xl bg-neon-orange/10 border border-neon-orange/30 flex items-center justify-center text-neon-orange glow-orange">
                <Flame className="w-5 h-5 text-neon-orange" />
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white">
                  🌡️ Thermal Profile Diagnostics
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Chipset silicon junction temperatures, governor status thresholds, persistent high-draw apps threads.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#03070d] p-5 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xs text-neon-orange uppercase tracking-widest font-bold">Throttling Governor Log Parameters</h4>
                
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between border-b border-slate-900 pb-2 text-gray-400">
                    <span>72°C Safe Core Governor Limit</span>
                    <span className={telemetry.cpuTemp >= 72 ? "text-neon-orange font-bold animate-pulse" : "text-neon-green font-bold"}>
                      {telemetry.cpuTemp >= 72 ? "ENGAGED / ACTIVE" : "NOMINAL"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2 text-gray-400">
                    <span>88°C Bypass Safety Shut-down Trigger</span>
                    <span className={telemetry.cpuTemp >= 88 ? "text-neon-red font-bold animate-ping" : "text-gray-500 font-bold"}>
                      {telemetry.cpuTemp >= 88 ? "EMERGENCY TRIPPED" : "SECURED"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1 text-gray-400">
                    <span>Thermal Radiation Dispersion Index</span>
                    <span className="text-white font-bold">{(telemetry.heatAccumulationIndex).toFixed(1)} Wh</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#03070d] p-5 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xs text-neon-orange uppercase tracking-widest font-bold">Thermal Spikes & Critical Threads</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-[#081120] p-2.5 rounded-xl border border-slate-850">
                    <span className="text-gray-300">com.android.systemui:composition</span>
                    <span className="text-neon-red font-extrabold text-[11px] bg-neon-red/10 px-2 py-0.5 rounded">HIGH DEMAND (48%)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#081120] p-2.5 rounded-xl border border-slate-850">
                    <span className="text-gray-300">com.google.android.gms:cognition_sync</span>
                    <span className="text-neon-yellow font-extrabold text-[11px] bg-neon-yellow/10 px-2 py-0.5 rounded">MODERATE (22%)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#081120] p-2.5 rounded-xl border border-slate-850">
                    <span className="text-gray-300">com.spotify.music:decoder_task</span>
                    <span className="text-neon-blue font-extrabold text-[11px] bg-neon-blue/10 px-2 py-0.5 rounded">IDLE REGISTERS (5%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Calibrator Sliders */}
            <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-neon-orange uppercase tracking-widest font-bold block border-b border-slate-850 pb-2">
                🔧 Active Silicon Thermal Calibration Sliders
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Silicon CPU Core Junction Heat</span>
                    <span className="text-white font-bold">{telemetry.cpuTemp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    value={telemetry.cpuTemp}
                    onChange={(e) => updateMetric("cpuTemp", parseInt(e.target.value))}
                    className="w-full accent-neon-orange bg-slate-850 h-1.5 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Silicon Micro Thermal Spikes Rate</span>
                    <span className="text-white font-bold">{telemetry.thermalSpikes} Spikes</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={telemetry.thermalSpikes}
                    onChange={(e) => updateMetric("thermalSpikes", parseInt(e.target.value))}
                    className="w-full accent-neon-orange bg-slate-850 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ⚙️ DETAILED PERFORMANCE LOGIC SCREEN MODULE */}
        {activeTab === "performance" && (
          <div className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple glow-purple">
                <Zap className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white">
                  ⚙️ System Performance & Logic Flow
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">CPU execution load ratios, RAM buffer occupancy pressure logs, micro lag-spikes indexes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Chipset CPU Util</span>
                <span className="text-2xl mt-1 block text-white font-display font-bold">{telemetry.cpuUsage}%</span>
              </div>
              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Memory Buffer Load</span>
                <span className="text-2xl mt-1 block text-white font-display font-bold">{telemetry.ramPressure}%</span>
              </div>
              <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-850">
                <span className="text-gray-500 text-[9px] block uppercase font-bold">Render Display Rate</span>
                <span className="text-2xl mt-1 block text-neon-purple font-display font-bold">{telemetry.estimatedFPS} FPS</span>
              </div>
            </div>

            {/* Systems Safe Optimizer button decks */}
            <div className="space-y-4">
              <h4 className="text-xs text-white uppercase tracking-widest font-bold">Military-Grade Operational Optimizations</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={runActiveCoolingMode}
                  disabled={isOptimizing}
                  className="bg-[#03070d] border border-slate-850 hover:border-neon-orange/40 hover:bg-neon-orange/5 p-4 rounded-2xl text-left flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-neon-orange/15 border border-neon-orange/30 flex items-center justify-center text-neon-orange mb-3">
                      <Flame className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white uppercase group-hover:text-neon-orange transition-colors">Thermal Cooling Protocol</h5>
                    <p className="text-[10.5px] text-gray-500 mt-1 lines-clamp-2">Lowers junction thermal spikes index by 15°C immediately via clock cycle reduction.</p>
                  </div>
                  <span className="text-[9.5px] font-bold text-neon-orange mt-4 uppercase inline-block">Execute governor cooling &rarr;</span>
                </button>

                <button
                  onClick={runActiveRamFlush}
                  disabled={isOptimizing}
                  className="bg-[#03070d] border border-slate-850 hover:border-neon-purple/40 hover:bg-neon-purple/5 p-4 rounded-2xl text-left flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center text-neon-purple mb-3">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white uppercase group-hover:text-neon-purple transition-colors">Safe Memory Flush</h5>
                    <p className="text-[10.5px] text-gray-500 mt-1 lines-clamp-2">Purges memory leaks and compacts active RAM buffers instantly on standard kernels.</p>
                  </div>
                  <span className="text-[9.5px] font-bold text-neon-purple mt-4 uppercase inline-block">Flus active memory &rarr;</span>
                </button>

                <button
                  onClick={runStorageVacuum}
                  disabled={isOptimizing}
                  className="bg-[#03070d] border border-slate-850 hover:border-blue-500/40 hover:bg-blue-500/5 p-4 rounded-2xl text-left flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">Storage Block Vacuum</h5>
                    <p className="text-[10.5px] text-gray-500 mt-1 lines-clamp-2">Schedules standard sectors trim commands to compact unused flash boundaries.</p>
                  </div>
                  <span className="text-[9.5px] font-bold text-blue-400 mt-4 uppercase inline-block font-mono">Execute vacuum sweep &rarr;</span>
                </button>
              </div>
            </div>

            {/* Terminal logs outputs */}
            {optimizationLog.length > 0 && (
              <div className="bg-[#03070d] border border-slate-850 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 font-mono text-[9px] text-gray-500">
                  <span>TERMINAL OUTPUT SEQUENCE</span>
                  <span className="animate-pulse text-neon-green">ACTIVE SESSION LINK</span>
                </div>
                <div className="space-y-1 bg-black/40 p-2 rounded-lg max-h-40 overflow-y-auto">
                  {optimizationLog.map((log, index) => (
                    <p key={index} className="font-mono text-[9.5px] text-gray-300">&bull;&nbsp;{log}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Calibrator sliders */}
            <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-neon-purple uppercase tracking-widest font-bold block border-b border-slate-850 pb-2">
                🔧 Active Logic Calibration Sliders
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Adjust Processor Core Usage</span>
                    <span className="text-white font-bold">{telemetry.cpuUsage} %</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={telemetry.cpuUsage}
                    onChange={(e) => updateMetric("cpuUsage", parseInt(e.target.value))}
                    className="w-full accent-neon-purple bg-slate-850 h-1.5 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Adjust Memory Occupancy Pressure</span>
                    <span className="text-white font-bold">{telemetry.ramPressure} %</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="98"
                    value={telemetry.ramPressure}
                    onChange={(e) => updateMetric("ramPressure", parseInt(e.target.value))}
                    className="w-full accent-neon-purple bg-slate-850 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: 💾 DETAILED FLASH STORAGE SCREEN MODULE */}
        {activeTab === "storage" && (
          <div className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left animate-fade-in font-mono text-xs">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 glow-blue">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white">
                  💾 Storage Partition & Flash Health
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Physical write controller delay registers, sector corruption risk forecasts, bad logical partitions index.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
              <div className="bg-[#03070d] p-5 rounded-2xl border border-slate-855 space-y-3">
                <h4 className="text-xs text-blue-400 uppercase tracking-widest font-bold">SSD Flash Block Matrix Parameters</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-900 pb-2 text-gray-400">
                    <span>Physical Sectors Catalogued</span>
                    <span className="text-white font-bold">{telemetry.sectorsScanned.toLocaleString()} Sectors</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2 text-gray-400">
                    <span>Write Controller Latency</span>
                    <span className={telemetry.writeLatency > 90 ? "text-neon-orange font-bold" : "text-white font-bold"}>{telemetry.writeLatency} Milliseconds</span>
                  </div>
                  <div className="flex justify-between pb-1 text-gray-400">
                    <span>Corrupted Partition Logical Risk</span>
                    <span className={telemetry.corruptRisk > 12 ? "text-neon-red font-bold animate-pulse" : "text-neon-green font-bold"}>{telemetry.corruptRisk}% Block Risk</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#03070d]/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-center text-center">
                <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
                <h4 className="text-sm font-display font-medium text-white mb-2 uppercase">Core Sector Validation Node</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">Active validation ensures bad SSD partition sectors are isolated to prevent dynamic app crash sequences, boot-loops, and logical memory blocks faults.</p>
              </div>
            </div>

            {/* Dynamic Slider controls */}
            <div className="bg-[#03070d] p-4 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold block border-b border-slate-850 pb-2">
                🔧 Active Flash Controller Calibration Sliders
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>SSD Space Utilization</span>
                    <span className="text-white font-bold">{telemetry.storageUsed} %</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="99"
                    value={telemetry.storageUsed}
                    onChange={(e) => updateMetric("storageUsed", parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-850 h-1.5 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5 text-gray-400">
                    <span>Logical Sector Corrupt Index Risk</span>
                    <span className="text-white font-bold">{telemetry.corruptRisk} %</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={telemetry.corruptRisk}
                    onChange={(e) => updateMetric("corruptRisk", parseInt(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-850 h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: 🤖 AI FAILURES PREDICTIVE DIAGNOSTIC REPORT REVEAL */}
        {activeTab === "ai-predictions" && (
          <div className="space-y-6 text-left select-none animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-neon-purple/10 flex items-center justify-center text-neon-purple shadow-[0_0_10px_rgba(157,0,255,0.2)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-medium text-white">AI Hardware Failure Predictive System</h3>
                  <p className="text-xs text-gray-400">Dynamic deep telemetry cognitive risk calculation output</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isProUnlocked ? "bg-neon-green/10 border-neon-green/35 text-neon-green font-bold" : "bg-slate-900 border-slate-705 text-gray-400"
                }`}>
                  {isProUnlocked ? "PRO ENGINE ACTIVATED" : "STANDARD TRIAL"}
                </span>
                {!isProUnlocked && (
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="bg-neon-yellow/15 hover:bg-neon-yellow/25 border border-neon-yellow text-neon-yellow px-2.5 py-1 rounded text-[10px] font-mono tracking-wider font-semibold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    UPGRADE PRO
                  </button>
                )}
              </div>
            </div>

            {!report ? (
              <div className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto flex flex-col items-center">
                <div className="w-12 h-12 border border-dashed border-neon-purple rounded-full flex items-center justify-center text-neon-purple mb-4 animate-pulse">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="font-display text-sm font-semibold text-white mb-2 uppercase tracking-widest">
                  Predictive Analysis Engine
                </h4>
                <p className="text-xs text-gray-400 font-mono mb-5 leading-relaxed">
                  Analyze dynamic physical hardware registers (Anode cells speed, silicon heat indexes, storage buffer lag values) to predict component anomalies.
                </p>
                <button
                  onClick={triggerAiAnalysis}
                  disabled={isAnalyzingAi}
                  className="bg-neon-purple/20 hover:bg-neon-purple/35 border border-neon-purple text-neon-purple px-5 py-2.5 rounded text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 shadow-[0_4px_15px_rgba(157,0,255,0.2)] cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyzingAi ? "animate-spin" : ""}`} />
                  {isAnalyzingAi ? "TRANSMITTING TELEMETRY DATA ARRAYS..." : "ACTIVATE AI CRASH PREDICTOR ROADMAP"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Cognitive Diagnostics summary panel */}
                <div className="bg-[#120b1f]/80 border border-neon-purple/30 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 py-1 px-3 border-l border-b border-neon-purple/35 font-mono text-[9px] text-neon-purple bg-[#040811] rounded-bl">
                    REPORT_COGNITIVE_HASH: #818_{overallHealthScore}
                  </div>

                  <span className="text-[10px] font-mono text-neon-purple tracking-widest block uppercase mb-1">
                    AI AGENT SYSTEM RISK DIAGNOSTICS
                  </span>
                  <h4 className="text-white font-display font-medium text-lg leading-snug mb-3">
                    {report.generalDiagnostics.statusSummary}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs border-t border-slate-850 pt-4 mt-2">
                    <div>
                      <span className="text-gray-500 block text-[9px]">PRIMARY FAILURE COMPONENT HAZARD</span>
                      <span className="text-neon-orange font-bold text-sm mt-0.5 block uppercase">
                        {report.generalDiagnostics.failurePrimaryCause}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px]">PREDICTED SUBSYSTEM CRASH TIME</span>
                      <span className="text-white font-bold text-sm mt-0.5 block">
                        {report.generalDiagnostics.daysToPredictedFailure === "Indefinite" 
                          ? "Indefinite / Optimal Operations" 
                          : `${report.generalDiagnostics.daysToPredictedFailure} Hours of CPU Load Remaining`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px]">AI ACTION IMPACT ROADMAP</span>
                      <span className="text-neon-blue font-bold tracking-wider text-xs block mt-0.5">
                        {report.generalDiagnostics.overallHealthImpact}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Printable Pro Invoice Diagnostic Panel */}
                {isProUnlocked ? (
                  <div className="border border-slate-700 rounded-3xl bg-white text-slate-900 p-6 shadow-2xl space-y-5 select-text">
                    <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                      <div>
                        <span className="text-xs font-mono tracking-widest text-[#00f0ff] bg-slate-900 px-2 py-0.5 rounded font-bold">
                          PRO CERTIFIED DIAGNOSTIC
                        </span>
                        <h2 className="text-xl font-display font-extrabold tracking-wider text-slate-900 mt-2">
                          DevicePulse AI Detailed Certificate
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Synced and signed on: {new Date().toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-right font-mono text-xs text-slate-600">
                        <div>OFFLINE_VERIFICATION_TOKEN: #PULSE-{overallHealthScore}</div>
                        <div className="font-bold text-slate-800">Status ID: Indian Retail Standard</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 font-mono text-[10.5px] bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[8px] text-slate-500 block">BATTERY INDEX</span>
                        <span className="font-bold text-slate-900">{telemetry.batteryScore}%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block">SILICON TEMP</span>
                        <span className="font-bold text-slate-900">{telemetry.cpuTemp}°C</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block">CPU STRESS</span>
                        <span className="font-bold text-slate-900">{telemetry.cpuUsage}%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block">BOOT RISK</span>
                        <span className="font-bold text-slate-900">{report.subsystemDiagnostics.storage.bootLoopRisk || "MINIMAL"}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-200 pb-1">
                        Subsystem Diagnostics Breakdown Insights
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-900 block mb-1">🔋 Anode Battery Node:</span>
                          <span className="text-slate-600 block leading-relaxed">{report.subsystemDiagnostics.battery.insight}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-900 block mb-1">🌡️ Thermal Junction Node:</span>
                          <span className="text-slate-600 block leading-relaxed">{report.subsystemDiagnostics.thermal.insight}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-900 block mb-1">⚙️ Core Operational Logic Node:</span>
                          <span className="text-slate-600 block leading-relaxed">{report.subsystemDiagnostics.performance.insight}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-900 block mb-1">💾 Flash Disk Segments Node:</span>
                          <span className="text-slate-600 block leading-relaxed">{report.subsystemDiagnostics.storage.insight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-200 pb-1">
                        Actionable Engineer Recommendations List
                      </h4>
                      <div className="space-y-2">
                        {report.actionableList.map((act, index) => (
                          <div key={index} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase ${
                              act.priority === "Critical" ? "bg-red-500" : act.priority === "Warning" ? "bg-yellow-500" : "bg-blue-500"
                            }`}>
                              {act.priority}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">{act.alertTitle} ({act.systemModule})</span>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{act.actionDesc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        Digital crypt-token signature: ACCEL_PULSE_SECURE_NODE_{overallHealthScore}
                      </span>
                      <button
                        onClick={exportDiagnosticPdf}
                        className="bg-slate-900 text-white font-mono hover:bg-slate-800 px-3.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition-all select-none font-bold cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        EXPORT PDF REPORT
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="bg-[#101928] border border-slate-800 rounded-3xl p-6 text-center max-w-lg mx-auto">
                    <Award className="w-8 h-8 text-neon-yellow mx-auto mb-3" />
                    <h4 className="text-white font-display font-medium text-sm uppercase tracking-wide">
                      Unlock Pro Detailed Diagnostic Invoice
                    </h4>
                    <p className="text-xs text-gray-400 font-mono my-3 leading-relaxed">
                      PRO license unlocks printable Diagnostic PDF certificates, unlimited history averages, silicon junction anomaly details, and India certified vendor ratings signatures.
                    </p>
                    <button
                      onClick={() => setIsPayModalOpen(true)}
                      className="bg-neon-yellow/15 hover:bg-neon-yellow/25 border border-neon-yellow text-neon-yellow font-mono text-xs px-4 py-2 rounded-xl uppercase tracking-widest font-bold transition-all cursor-pointer"
                    >
                      ACTIVATE PRO LICENSE NOW
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* TAB 7: 🎙️ VOICE ASSISTANT ENGINEER PANEL (PRO FEATURE) */}
        {activeTab === "voice-assistant" && (
          <div className="animate-fade-in text-left relative flex-1 flex flex-col min-h-[500px]">
             {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center text-neon-yellow mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Premium Voice Engine Locked</h3>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Access to the DeepVoice™ real-time silicon diagnostic assistant requires a DevicePulse Pro Engine license.
                  </p>
                  <button 
                    onClick={() => setIsPayModalOpen(true)}
                    className="bg-neon-yellow text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,200,0,0.3)] cursor-pointer"
                  >
                    ACTIVATE LICENSE
                  </button>
                </div>
              </div>
            )}
            <VoiceAssistantScreen
              telemetry={telemetry}
              isPro={isProUnlocked}
              onUpgrade={() => setIsPayModalOpen(true)}
              updateMetric={updateMetric}
              runActiveCoolingMode={runActiveCoolingMode}
              runActiveRamFlush={runActiveRamFlush}
              runStorageVacuum={runStorageVacuum}
            />
          </div>
        )}

        {/* TAB 8: 🛠️ REPAIR NETWORK LOCATOR (INDIA FIRST SERVICE) */}
        {activeTab === "repair-network" && (
          <div className="animate-fade-in text-left">
            <RepairNetworkScreen />
          </div>
        )}

        {/* TAB 9: 💼 PITCH DECK SLIDER & COMPUTERS */}
        {activeTab === "pitch-deck" && (
          <div className="animate-fade-in text-left">
            <PitchDeckScreen />
          </div>
        )}

        {/* TAB 10: 💬 GOOGLE CHAT INTEGRATION */}
        {activeTab === "google-chat" && (
          <div className="animate-fade-in text-left flex-1 flex flex-col">
            <GoogleChatScreen />
          </div>
        )}

      </main>

      {/* FLOATING HOLOGRAPHIC BOTTOM NAVIGATION DOCK (YOUTUBE STYLE) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl bg-[#081120]/90 border border-neon-blue/20 p-2 rounded-2xl flex items-center justify-between gap-1 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-40 backdrop-blur-md select-none">
        
        {/* Holographic scanning line traversing button items */}
        <div className="absolute inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20 pointer-events-none" style={{ top: "1px" }} />

        {/* HOME (AI Core Dashboard) */}
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "home" ? "bg-neon-blue/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Home className={`w-4 h-4 transition-transform ${activeTab === "home" ? "scale-110 text-neon-blue font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">AI Core</span>
          {activeTab === "home" && <span className="absolute bottom-1 w-1 h-1 bg-neon-blue rounded-full animate-pulse" />}
        </button>

        {/* BATTERY tab */}
        <button
          onClick={() => setActiveTab("battery")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "battery" ? "bg-neon-green/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <BatteryIcon className={`w-4 h-4 transition-transform ${activeTab === "battery" ? "scale-110 text-neon-green font-bold drop-shadow-[0_0_5px_rgba(12,243,90,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Battery</span>
          {activeTab === "battery" && <span className="absolute bottom-1 w-1 h-1 bg-neon-green rounded-full animate-pulse" />}
        </button>

        {/* THERMAL */}
        <button
          onClick={() => setActiveTab("thermal")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "thermal" ? "bg-neon-orange/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Flame className={`w-4 h-4 transition-transform ${activeTab === "thermal" ? "scale-110 text-neon-orange font-bold drop-shadow-[0_0_5px_rgba(255,106,0,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Thermal</span>
          {activeTab === "thermal" && <span className="absolute bottom-1 w-1 h-1 bg-neon-orange rounded-full animate-pulse" />}
        </button>

        {/* PERFORMANCE */}
        <button
          onClick={() => setActiveTab("performance")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "performance" ? "bg-neon-purple/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Zap className={`w-4 h-4 transition-transform ${activeTab === "performance" ? "scale-110 text-neon-purple font-bold drop-shadow-[0_0_5px_rgba(157,0,255,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Logic</span>
          {activeTab === "performance" && <span className="absolute bottom-1 w-1 h-1 bg-neon-purple rounded-full animate-pulse" />}
        </button>

        {/* STORAGE */}
        <button
          onClick={() => setActiveTab("storage")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "storage" ? "bg-blue-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <HardDrive className={`w-4 h-4 transition-transform ${activeTab === "storage" ? "scale-110 text-blue-400 font-bold drop-shadow-[0_0_5px_rgba(59,130,246,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Storage</span>
          {activeTab === "storage" && <span className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />}
        </button>

        {/* VOICE ASSISTANT */}
        <button
          onClick={() => setActiveTab("voice-assistant")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "voice-assistant" ? "bg-neon-cyan/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Sparkles className={`w-4 h-4 transition-transform ${activeTab === "voice-assistant" ? "scale-110 text-neon-blue font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Voice AI</span>
          {activeTab === "voice-assistant" && <span className="absolute bottom-1 w-1 h-1 bg-neon-blue rounded-full animate-pulse" />}
        </button>

        {/* REPAIR locator */}
        <button
          onClick={() => setActiveTab("repair-network")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "repair-network" ? "bg-[#092233] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Wrench className={`w-4 h-4 transition-transform ${activeTab === "repair-network" ? "scale-110 text-neon-blue font-bold" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Repair</span>
          {activeTab === "repair-network" && <span className="absolute bottom-1 w-1 h-1 bg-neon-blue rounded-full animate-pulse" />}
        </button>

        {/* PITCH DECK */}
        <button
          onClick={() => setActiveTab("pitch-deck")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "pitch-deck" ? "bg-[#252514] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <DollarSign className={`w-4 h-4 transition-transform ${activeTab === "pitch-deck" ? "scale-110 text-neon-yellow font-bold" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase font-medium">Pitch</span>
          {activeTab === "pitch-deck" && <span className="absolute bottom-1 w-1 h-1 bg-neon-yellow rounded-full animate-pulse" />}
        </button>

        {/* GOOGLE CHAT */}
        <button
          onClick={() => setActiveTab("google-chat")}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "google-chat" ? "bg-neon-blue/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageCircle className={`w-4 h-4 transition-transform ${activeTab === "google-chat" ? "scale-110 text-neon-blue font-bold" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase font-medium">Chat</span>
          {activeTab === "google-chat" && <span className="absolute bottom-1 w-1 h-1 bg-neon-blue rounded-full animate-pulse" />}
        </button>

      </nav>

      {/* Futuristic technical layout border margin credits */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#040811]/90 backdrop-blur-md border-t border-slate-900 py-1 px-4 flex items-center justify-between font-mono text-[9px] text-gray-500 select-none z-30">
        <div>
          DIAGNOSTICACCELERATOR: READY (REF NODE: {telemetry.timestamp.substring(11, 19)} UTC)
        </div>
        <div>
          STATUS LINKED IN INDIA &bull; PROTOC_V1.12_ESTABLISHED
        </div>
      </footer>

      <SubscriptionPaymentModal 
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onUnlockPro={() => {
          setIsProUnlocked(true);
          localStorage.setItem("devicepulse_pro_unlocked", "true");
        }}
        user={user}
        onSignIn={handleGoogleSignIn}
      />

    </div>
  );
}
