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
  Monitor,
  Wifi,
  Ghost,
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
  Cloud,
  MessageSquare,
  Power,
  Play,
  FileText,
  MessageCircle,
  Heart,
  QrCode,
  Coffee,
  Coins
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
import { SecurityPrivacyScreen } from "./components/SecurityPrivacyScreen";
import { DataBackupScreen } from "./components/DataBackupScreen";
import { AppCleanerScreen } from "./components/AppCleanerScreen";
import { HardwareDiagnosticsScreen } from "./components/HardwareDiagnosticsScreen";
import { NetworkAnalyzerScreen } from "./components/NetworkAnalyzerScreen";
import { PhantomDrainTrackerScreen } from "./components/PhantomDrainTrackerScreen";
import { SubscriptionPaymentModal } from "./components/SubscriptionPaymentModal";
import { App as CapacitorApp } from '@capacitor/app';
import SystemLogs from "./components/SystemLogs";
import Footer from "./components/Footer";
import { TelemetryState, SmartAlert, GeminiDiagnosticReport, TelemetryHistoryPoint } from "./types";
import { DEFAULT_TELEMETRY, PRESETS, calculateWeightedHealthScore, scanTelemetryForRuleAlerts, generateHistoryPoints, getRealBrowserTelemetry } from "./utils/telemetrySim";

// Helper to generate or retrieve a unique device pulse profile guest ID
const getGuestUid = () => {
  let gid = localStorage.getItem("devicepulse_guest_uid");
  if (!gid) {
    gid = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("devicepulse_guest_uid", gid);
  }
  return gid;
};

// Tactical dynamic UI audio synth feedback
const playBeep = (freq = 440, duration = 80, type: OscillatorType = "sine") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Suppressed if audiostream blocked by browser sandbox
  }
};

export default function App() {
  const [guestUid] = useState<string>(getGuestUid);
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
  const [activeTab, setActiveTab] = useState<"home" | "battery" | "thermal" | "performance" | "storage" | "ai-predictions" | "voice-assistant" | "repair-network" | "pitch-deck" | "security-scan" | "data-backup" | "app-cleaner" | "hardware" | "network" | "phantom">("home");

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

  // Device Boot / Synced Initial Registrations
  useEffect(() => {
    syncSubscription(guestUid);
  }, [guestUid]);

  // Privacy Policy and Terms of Service dialogue states
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  
  // Advanced Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [advancedNotifications, setAdvancedNotifications] = useState([
    { id: 1, title: "Kernel Process Anomaly", description: "Background process 'android.vold' consuming high I/O randomly. Recommended: Clean cache.", severity: "high", time: "12 mins ago", read: false },
    { id: 2, title: "Battery Cycle Warning", description: "Charge cycle crossed 420. Estimated 12% total capacity degraded relative to 2026 baseline.", severity: "medium", time: "2 hours ago", read: false },
    { id: 3, title: "Network Telemetry", description: "Average latency to closest edge node stabilized at 12ms over the last week. No dropped packets.", severity: "low", time: "5 hours ago", read: false }
  ]);

  const unreadCount = advancedNotifications.filter(n => !n.read).length;

  const handleExitApp = async () => {
    try {
      if (typeof CapacitorApp !== 'undefined') {
        await CapacitorApp.exitApp();
      }
    } catch (e) {
      console.log("Exit app only supported on native devices.");
    }
  };

  const markAllAsRead = () => {
    setAdvancedNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // High intensity 3D Mouse Parallax Coordinates
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Scale mouse coordinates normalized from -1 to 1 based on screen size
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Sync URL query state dynamically to handle /privacy deep linking
  useEffect(() => {
    const syncUrlState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      if (
        searchParams.get("privacy") === "true" || 
        searchParams.get("page") === "privacy" || 
        hash === "#privacy" || 
        hash === "#privacy-policy"
      ) {
        setIsPrivacyOpen(true);
      }
      if (
        searchParams.get("terms") === "true" || 
        searchParams.get("page") === "terms" || 
        hash === "#terms" || 
        hash === "#terms-of-service"
      ) {
        setIsTermsOpen(true);
      }
      if (
        searchParams.get("donate") === "true" || 
        searchParams.get("page") === "donate" || 
        hash === "#donate"
      ) {
        setIsDonateOpen(true);
      }
    };

    // check on initial mount
    syncUrlState();

    // listen for popstate, hashchange
    window.addEventListener("popstate", syncUrlState);
    window.addEventListener("hashchange", syncUrlState);
    return () => {
      window.removeEventListener("popstate", syncUrlState);
      window.removeEventListener("hashchange", syncUrlState);
    };
  }, []);

  const handleOpenPrivacy = () => {
    playBeep(220, 80, "sine");
    window.history.pushState(null, "", "?privacy=true");
    setIsPrivacyOpen(true);
  };

  const handleClosePrivacy = () => {
    window.history.pushState(null, "", window.location.pathname);
    setIsPrivacyOpen(false);
  };

  const handleOpenTerms = () => {
    playBeep(260, 80, "sine");
    window.history.pushState(null, "", "?terms=true");
    setIsTermsOpen(true);
  };

  const handleCloseTerms = () => {
    window.history.pushState(null, "", window.location.pathname);
    setIsTermsOpen(false);
  };

  const handleOpenDonate = () => {
    playBeep(280, 80, "sawtooth");
    window.history.pushState(null, "", "?donate=true");
    setIsDonateOpen(true);
  };

  const handleCloseDonate = () => {
    playBeep(230, 85, "sine");
    window.history.pushState(null, "", window.location.pathname);
    setIsDonateOpen(false);
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

  // Ultra 3D Parallax Calibration States
  const [isUltra3dMode, setIsUltra3dMode] = useState(true);
  const [tiltIntensity, setTiltIntensity] = useState(1.2);

  // Dynamic 3D Transform generator based on real-time mouse coordinates and light vectoring shadows
  const get3dStyle = (intensityFactor = 1) => {
    if (!isUltra3dMode) return {};
    const rx = mousePosition.y * -14 * intensityFactor * tiltIntensity;
    const ry = mousePosition.x * 14 * intensityFactor * tiltIntensity;
    return {
      transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      transition: "transform 0.1s ease-out, box-shadow 0.15s ease-out",
      boxShadow: `${mousePosition.x * -16}px ${mousePosition.y * -16}px 32px rgba(0, 240, 255, ${0.08 + Math.abs(mousePosition.x) * 0.18})`
    };
  };

  // Real-time live system monitoring states
  const [liveMetrics, setLiveMetrics] = useState({
    fps: 60,
    temp: 38.5,
    ramUsed: 4.8,
    charWatts: 18,
    tempHistory: [38, 38.2, 38.8, 38.5, 39, 39.2, 38.5] as number[]
  });

  // AI Boost dynamic optimizing sequence
  const [isAiBoosting, setIsAiBoosting] = useState(false);
  const [aiBoostStep, setAiBoostStep] = useState(0);
  const [aiBoostLogs, setAiBoostLogs] = useState<string[]>([]);

  // AI Device Assistant Chat states
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hello! I am your DevicePulse AI Device Brain. I have direct access to your real-time hardware telemetry registers. Ask me anything about why your device is heating, lagging, or draining battery!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Real-time live indicators automatic fluctuate simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        // Calculate dynamic real FPS (higher in normal/optimal, throttled/lagging in stress/load)
        let targetFps = telemetry.stressLevel === "Hyper-Load" ? Math.floor(45 + Math.random() * 8) : Math.floor(95 + Math.random() * 25);
        if (telemetry.stressLevel === "Thermal Stress") targetFps = Math.floor(52 + Math.random() * 8);
        if (telemetry.stressLevel === "Battery Fault") targetFps = Math.floor(58 + Math.random() * 5);

        // CPU temperature with light jitter based on telemetry.cpuTemp
        const baseTemp = telemetry.cpuTemp;
        const currentTemp = parseFloat((baseTemp + (Math.random() * 1.2 - 0.6)).toFixed(1));

        // RAM used based on telemetry.ramPressure
        const totalRam = 8.0;
        const baseRamPct = telemetry.ramPressure / 100;
        const currentRamUsed = parseFloat((totalRam * baseRamPct + (Math.random() * 0.15 - 0.075)).toFixed(2));

        // Charging speed watts (express vs usb normal charging)
        let watts = 0;
        if (telemetry.chargingState === "Charging" || telemetry.chargingState === "Plugged") {
          watts = telemetry.chargeType === "Wall GaN Charger" ? Math.floor(45 + Math.random() * 6) : Math.floor(15 + Math.random() * 4);
        } else {
          watts = 0; // discharging
        }

        // Maintain 7 temperature trend points
        const updatedHistory = [...prev.tempHistory.slice(1), currentTemp];

        return {
          fps: targetFps,
          temp: currentTemp,
          ramUsed: currentRamUsed,
          charWatts: watts,
          tempHistory: updatedHistory
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [telemetry]);

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
  const handleTriggerAiBoost = () => {
    setIsAiBoosting(true);
    setAiBoostStep(0);
    setAiBoostLogs(["[STAGE 1] INITIATING DYNAMIC ACCELERATION BRIDGE..."]);
    playBeep(440, 880, "square");

    const runStep = (step: number) => {
      setTimeout(() => {
        setAiBoostStep(step);
        playBeep(300 + step * 100, 350, "sine");

        if (step === 1) {
          setAiBoostLogs(prev => [...prev, "[STAGE 2] SCANNING KERNEL MEMORY SWAP BLOCKS..."]);
        } else if (step === 2) {
          setAiBoostLogs(prev => [...prev, "[STAGE 3] RECLAIMING DETECTED MEMORY LEAK CHANNELS..."]);
        } else if (step === 3) {
          setAiBoostLogs(prev => [...prev, "[STAGE 4] DISPATCHING THERMAL JUNCTION SHUNT SIGNAL..."]);
        } else if (step === 4) {
          setAiBoostLogs(prev => [...prev, "[STAGE 5] LOCKING IDLE BACKGROUND CPU THROTTLES..."]);
        } else if (step === 5) {
          setTelemetry(prev => {
            return {
              ...prev,
              cpuTemp: 34,
              batteryTemp: 29,
              cpuUsage: 12,
              ramPressure: 38,
              estimatedFPS: 120,
              thermalSpikes: 0,
              lagSpikes: 0,
              stressLevel: "Normal",
              perfScore: 99,
              batteryScore: Math.min(100, prev.batteryScore + 5),
              thermalScore: 98,
              storageScore: Math.min(100, prev.storageScore + 3)
            };
          });
          setAiBoostLogs(prev => [...prev, "✔ CORE SYSTEM SUITE SUCCESSFULLY BOOSTED TO 99% HIGH INTEGRITY SPEED!"]);
          playBeep(880, 1760, "sine");
          setTimeout(() => {
            setIsAiBoosting(false);
          }, 3500);
        }
      }, 750 * step);
    };

    for (let i = 1; i <= 5; i++) {
      runStep(i);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsgText = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsgText }]);
    setIsChatLoading(true);
    playBeep(440, 550, "sine");

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMsgText,
          telemetry: telemetry,
          history: chatMessages.slice(-5)
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed context analysis.");
      }
      setChatMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
      playBeep(520, 1040, "sine");
    } catch (err: any) {
      console.error("AI chat failed:", err);
      let localReply = "I was unable to synchronize with the DevicePulse deep cognitive networks. ";
      const msg = userMsgText.toLowerCase();
      if (msg.includes("heat") || msg.includes("temp") || msg.includes("warm") || msg.includes("garam")) {
        localReply += `However, analyzing your local registers: CPU is at ${telemetry.cpuTemp}°C. I suggest disabling any active GPS overlays or triggering an 'AI Boost Device' optimization sequence to instantly drop temperatures.`;
      } else if (msg.includes("batt") || msg.includes("drain") || msg.includes("charg")) {
        localReply += `However, looking at your battery score: it is currently ${telemetry.batteryScore}%. We are observing high chemical resistance. Ensure you are using standard certified power nodes and not charging during heavy high-fidelity gaming processing.`;
      } else {
        localReply += "All device telemetry registers (Sensors, Chips, Storage) are calibrated properly. Let me know if you would like me to trigger an automatic logic performance flush.";
      }
      setChatMessages(prev => [...prev, { role: "assistant", text: localReply }]);
    } finally {
      setIsChatLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#03070d] text-gray-100 flex flex-col font-sans selection:bg-neon-blue selection:text-black relative pb-24 overflow-x-hidden">
      
      {/* Ultra 3D Animated perspective grid and floating auroras */}
      <div className="perspective-container">
        <div 
          className="perspective-grid-3d" 
          style={{
            transform: `rotateX(${70 + mousePosition.y * -4 * tiltIntensity}deg) rotateY(${mousePosition.x * 6 * tiltIntensity}deg) translateY(${mousePosition.y * -22 * tiltIntensity}px)`,
            filter: "drop-shadow(0 0 15px rgba(0, 240, 255, 0.22))",
            opacity: 0.95
          }}
        />
        <div className="depth-fog" />
        <div className="ambient-aurora-3d-1" />
        <div className="ambient-aurora-3d-2" />
      </div>

      {/* Futuristic Header top element */}
      <Header 
        stressLevel={telemetry.stressLevel} 
        isScanning={isScanning} 
        score={overallHealthScore}
        isPro={isProUnlocked}
        subscriptionTier={subscriptionStatus}
        onUpgrade={() => setIsPayModalOpen(true)}
        onTriggerExit={handleExitApp}
        onToggleNotifications={() => {
          if (isProUnlocked) setShowNotifications(prev => !prev);
          else setIsPayModalOpen(true);
        }}
        unreadNotificationsCount={unreadCount}
      />

      {/* Advanced Notifications Panel */}
      <AnimatePresence>
        {showNotifications && isProUnlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-[#03070d]/95 border border-neon-purple/40 rounded-xl shadow-[0_10px_40px_rgba(157,0,255,0.2)] backdrop-blur-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-neon-purple/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-display font-medium text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-neon-purple" />
                Advanced Network Alerts
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={markAllAsRead} className="text-[10px] uppercase tracking-wider text-neon-purple hover:text-white transition-colors">
                  Mark all read
                </button>
                <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto cyber-scrollbar">
              {advancedNotifications.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500 font-mono">No advanced notifications.</div>
              )}
              {advancedNotifications.map(notification => (
                <div key={notification.id} className={`p-4 border-b border-gray-800/50 transition-colors ${!notification.read ? 'bg-neon-purple/5 relative' : ''}`}>
                  {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-purple" />}
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <h4 className="text-sm font-medium text-gray-200">
                      {notification.title}
                    </h4>
                    <span className={`shrink-0 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      notification.severity === 'high' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
                      notification.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500' :
                      'bg-green-500/10 border border-green-500/30 text-green-400'
                    }`}>
                      {notification.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                    {notification.description}
                  </p>
                  <div className="text-[9px] text-gray-600 font-mono">
                    {notification.time}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Core */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 relative pb-28">
        <AnimatePresence mode="wait">
        
        {/* TAB 1: 🏠 AI CORE SUMMARY (CLEAN - CLUTTER FREE HOME SCREEN) */}
        {activeTab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full"
          >
            
            {/* Giant Central 3D Core Health Orb */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div 
                style={get3dStyle(0.85)}
                className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center select-none text-center"
              >
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

              {/* 🔮 ULTRA 3D HYPER-COGNITION CALIBRATION VALVE */}
              <div 
                style={get3dStyle(0.9)}
                className="bg-gradient-to-b from-[#091b2e] to-[#040912] border border-neon-cyan/45 rounded-2xl p-5 relative overflow-hidden text-left shadow-[0_10px_30px_rgba(0,240,255,0.15)] select-none"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neon-cyan/15 to-transparent rounded-full filter blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan animate-pulse">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-xs tracking-wide">ULTRA 3D HUD DEVICE MATRIX</h4>
                      <span className="text-[7.5px] font-mono text-neon-cyan uppercase tracking-widest block leading-none">REAL-TIME RENDER VALVE</span>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isUltra3dMode} 
                      onChange={(e) => {
                        setIsUltra3dMode(e.target.checked);
                        if (typeof playBeep === 'function') {
                          playBeep(600, 100, "sine");
                        }
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-cyan" />
                  </label>
                </div>

                <p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-4">
                  Gyroscopic parallax calculations actively tilt interface segments based on cursor coordinate inputs for a true simulated holographic depth.
                </p>

                {isUltra3dMode && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-gray-400 uppercase">Tilt Amplitude Scale:</span>
                      <span className="text-neon-cyan font-bold">{tiltIntensity.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="2.5" 
                      step="0.1"
                      value={tiltIntensity} 
                      onChange={(e) => {
                        setTiltIntensity(parseFloat(e.target.value));
                        if (typeof playBeep === 'function') {
                          playBeep(400 + tiltIntensity * 100, 50, "sine");
                        }
                      }}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-neon-cyan" 
                    />
                    
                    <div className="grid grid-cols-2 gap-1.5 pt-2">
                      <div className="bg-[#030611] p-2 rounded-lg border border-slate-800/60 text-center">
                        <span className="text-[8px] text-gray-500 uppercase block">Rotation Axis X</span>
                        <span className="text-[10px] text-white font-mono font-bold">{(mousePosition.y * -14 * tiltIntensity).toFixed(1)}°</span>
                      </div>
                      <div className="bg-[#030611] p-2 rounded-lg border border-slate-800/60 text-center">
                        <span className="text-[8px] text-gray-500 uppercase block">Rotation Axis Y</span>
                        <span className="text-[10px] text-white font-mono font-bold">{(mousePosition.x * 14 * tiltIntensity).toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 🚀 SMART OPTIMIZER: ONE-TAP AI BOOST DEVICE */}
              <div 
                style={get3dStyle(0.95)}
                className="bg-gradient-to-b from-[#110729] to-[#04010a] border border-neon-purple/40 rounded-2xl p-5 relative overflow-hidden text-left shadow-[0_4px_20px_rgba(157,0,255,0.15)] select-none"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neon-purple/10 to-transparent rounded-full filter blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center text-neon-purple animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-display font-bold text-xs tracking-wide">SMART OPTIMIZER MODE</h4>
                    <span className="text-[8px] font-mono text-neon-purple uppercase tracking-widest block leading-none">ONE-TAP AI BOOST VALVE</span>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-4">
                  Runs extreme background process garbage collection, lowers multi-threaded clock temperatures and optimizes lag throttles instantly.
                </p>

                <button
                  onClick={handleTriggerAiBoost}
                  className="w-full bg-neon-purple hover:bg-opacity-90 text-white font-mono text-xs uppercase font-extrabold tracking-widest py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(157,0,255,0.35)] cursor-pointer hover:shadow-[0_0_25px_rgba(157,0,255,0.5)]"
                >
                  <Sparkles className="w-4 h-4" />
                  LAUNCH 1-TAP AI BOOST
                </button>
              </div>

              {/* CYBER COMPLIANCE & ACCREDITATION BOARD */}
              <div 
                style={get3dStyle(0.8)}
                className="bg-[#081120]/95 border border-neon-blue/15 rounded-2xl p-4.5 relative overflow-hidden select-none text-left shadow-[0_4px_24px_rgba(3,7,12,0.9)] backdrop-blur-md"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neon-blue/10 to-transparent rounded-full filter blur-xl pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center text-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-display font-bold text-xs tracking-wide">SECURE LEGAL PORTAL</h4>
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block leading-none">ISO 27001 & IT ACT COMPLIANT</span>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-4">
                  Fully verified under standard hardware diagnostics guidelines. Privacy protection protocols and customer diagnostics usage agreements are live and secured.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenPrivacy}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neon-blue/10 hover:bg-neon-blue/25 border border-neon-blue/20 hover:border-neon-blue text-neon-blue rounded-lg text-[9px] font-mono tracking-wider transition-all uppercase cursor-pointer hover:shadow-[0_0_12px_rgba(0,240,255,0.15)]"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Privacy Policy
                  </button>
                  <button
                    onClick={handleOpenTerms}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neon-purple/10 hover:bg-neon-purple/25 border border-neon-purple/20 hover:border-neon-purple text-neon-purple rounded-lg text-[9px] font-mono tracking-wider transition-all uppercase cursor-pointer hover:shadow-[0_0_12px_rgba(157,0,255,0.15)]"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Terms of Use
                  </button>
                </div>
              </div>

            </div>

            {/* Right side Dashboard: SVG heartbeats, diagnostic summaries, fast repair access, alerts stack */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Daily system heartbeat graph preview widget */}
              <div 
                style={get3dStyle(0.85)}
                className="bg-[#081120]/90 border border-slate-800 rounded-2xl p-5 select-none relative overflow-hidden"
              >
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

              {/* ⚡ REAL-TIME HIGH-FREQUENCY TELEMETRY LAYER */}
              <div 
                id="real-time-live-system" 
                style={get3dStyle(0.95)}
                className="bg-[#050b14]/95 border border-neon-cyan/25 rounded-2xl p-5 text-left relative overflow-hidden shadow-[0_4px_20px_rgba(0,240,255,0.1)]"
              >
                {/* Visual sci-fi scanner bar */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-pulse" />
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[8px] font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/25 uppercase tracking-widest font-bold">
                      HYPER-FREQUENCY CORE
                    </span>
                    <h4 className="text-white font-display font-medium text-sm flex items-center gap-1.5 mt-1.5">
                      <Zap className="w-4 h-4 text-neon-cyan animate-pulse" />
                      Live Real-Time Hardware Signal Layer
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-neon-green bg-neon-green/10 px-2 py-1 rounded border border-neon-green/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block animate-ping" />
                    1.5s POLLING ACTIVE
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Gauge 1: Live FPS */}
                  <div className="bg-[#03060c] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-1 right-2 font-mono text-[8px] text-gray-650">FPS</div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">Gaming Rate</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-mono tracking-tight animate-pulse">
                        {liveMetrics.fps}
                      </span>
                      <span className="text-[10px] text-neon-cyan font-mono font-bold">Hz</span>
                    </div>
                    {/* Tiny micro graphic indicator */}
                    <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-neon-cyan h-full transition-all duration-300"
                        style={{ width: `${(liveMetrics.fps / 144) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Gauge 2: Real-time Silicon Junction Temp */}
                  <div className="bg-[#03060c] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-1 right-2 font-mono text-[8px] text-gray-650">TEMP</div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">Silicon Junction</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {liveMetrics.temp}°
                      </span>
                      <span className="text-[10px] text-neon-orange font-mono font-bold">C</span>
                    </div>
                    {/* Tiny micro graphic indicator */}
                    <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-neon-orange h-full transition-all duration-300"
                        style={{ width: `${(liveMetrics.temp / 100) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Gauge 3: Dynamic RAM Pressure */}
                  <div className="bg-[#03060c] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-1 right-2 font-mono text-[8px] text-gray-650">RAM</div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">Memory Load</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {liveMetrics.ramUsed}
                      </span>
                      <span className="text-[10px] text-neon-purple font-mono font-bold">GB</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-neon-purple h-full transition-all duration-300"
                        style={{ width: `${(liveMetrics.ramUsed / 8.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Gauge 4: Watt Detection */}
                  <div className="bg-[#03060c] border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-1 right-2 font-mono text-[8px] text-gray-650">POWER</div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">Charging Speed</span>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-mono tracking-tight">
                        {liveMetrics.charWatts}
                      </span>
                      <span className="text-[10px] text-neon-green font-mono font-bold">W</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-neon-green h-full transition-all duration-300"
                        style={{ width: `${(liveMetrics.charWatts / 67.5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Micro mini-temperature chart trend */}
                <div className="mt-4 bg-[#020408] border border-slate-900 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neon-orange animate-pulse" />
                    <div>
                      <span className="text-gray-400 block font-bold text-[10px]">SILICON TREND JUNCTION (60s)</span>
                      <span className="text-[10px] text-gray-500">Live moving frequency average spikes</span>
                    </div>
                  </div>
                  
                  <div className="flex items-end gap-1 h-8">
                    {liveMetrics.tempHistory.map((t, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                          className="w-2.5 rounded-sm bg-neon-orange/85 hover:bg-neon-orange transition-all duration-300" 
                          style={{ height: `${Math.max(4, Math.min(32, (t - 20) * 0.9))}px` }}
                          title={`${t}°C`}
                        />
                      </div>
                    ))}
                    <span className="text-[10px] text-neon-orange font-bold ml-1">{liveMetrics.temp}°C</span>
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

              {/* DYNAMIC TELEMETRY REAL-TIME CONSOLE FEED */}
              <SystemLogs />

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

          </motion.div>
        )}

        {/* TAB 2: 🔋 DETATED BATTERY SCREEN MODULE */}
        {activeTab === "battery" && (
          <motion.div
            key="battery"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left font-mono text-xs w-full"
          >
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

          </motion.div>
        )}

        {/* TAB 3: 🌡️ DETAILED THERMAL SCREEN MODULE */}
        {activeTab === "thermal" && (
          <motion.div
            key="thermal"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left font-mono text-xs w-full"
          >
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

          </motion.div>
        )}

        {/* TAB 4: ⚙️ DETAILED PERFORMANCE LOGIC SCREEN MODULE */}
        {activeTab === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left font-mono text-xs w-full"
          >
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

          </motion.div>
        )}

        {/* TAB 5: 💾 DETAILED FLASH STORAGE SCREEN MODULE */}
        {activeTab === "storage" && (
          <motion.div
            key="storage"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#081120]/90 border border-slate-800 rounded-3xl p-6 space-y-6 text-left font-mono text-xs w-full"
          >
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

          </motion.div>
        )}

        {/* TAB 6: 🤖 AI FAILURES PREDICTIVE DIAGNOSTIC REPORT REVEAL */}
        {activeTab === "ai-predictions" && (
          <motion.div
            key="ai-predictions"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-6 text-left select-none font-mono text-xs w-full"
          >
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

            {/* 3D ULTRA DEVICE HEALTH CHANNELS & PREDICTION ENGINE (ALWAYS ON PRO HUD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Next 7 Days Subsystem Risk */}
              <div className="bg-[#090e17]/95 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden text-left shadow-lg">
                <div className="absolute top-2 right-3 px-2 py-0.5 bg-neon-red/10 rounded border border-neon-red/30 text-[#ff3b3b] text-[8px] font-bold tracking-widest uppercase">
                  ACTIVE CRITICAL RANGE
                </div>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Risk Evaluation Model</span>
                <h4 className="text-white font-display font-medium text-sm mt-1">7-Day Risk Coefficient</h4>
                
                <div className="my-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white font-mono tracking-tight animate-pulse">
                      {telemetry.stressLevel === "Hyper-Load" || telemetry.cpuTemp >= 70 ? "76.4%" : "18.8%"}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">Calculated Silicon Wear Risk</span>
                  </div>
                  {/* Circular progress with SVG */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-800 fill-transparent" strokeWidth="4" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        className={`fill-transparent transition-all duration-1000 ${
                          telemetry.stressLevel === "Hyper-Load" || telemetry.cpuTemp >= 70 ? "stroke-neon-red" : "stroke-neon-cyan"
                        }`} 
                        strokeWidth="4" 
                        strokeDasharray="176"
                        strokeDashoffset={176 - (176 * (telemetry.stressLevel === "Hyper-Load" || telemetry.cpuTemp >= 70 ? 76.4 : 18.8)) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-white font-bold">
                      {telemetry.stressLevel === "Hyper-Load" || telemetry.cpuTemp >= 70 ? "HIGH" : "SAFE"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900/40 pt-2.5 font-mono text-[9.5px] text-gray-400">
                  <span className="text-neon-cyan font-bold block">★ AI LOG PREDICTION</span>
                  Predicted crash node vector identified under heavy GPS/3D rendering tasks.
                </div>
              </div>

              {/* Card 2: Battery Death Probability */}
              <div className="bg-[#090e17]/95 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden text-left shadow-lg">
                <div className="absolute top-2 right-3 px-2 py-0.5 bg-neon-cyan/10 rounded border border-neon-cyan/30 text-neon-cyan text-[8px] font-bold tracking-widest uppercase">
                  COGNITIVE CORE
                </div>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Chemical Cell Wear</span>
                <h4 className="text-white font-display font-medium text-sm mt-1">Anode Death Probability</h4>

                <div className="my-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      {telemetry.stressLevel === "Battery Fault" ? "68.2%" : "4.9%"}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">Cell impedance threshold</span>
                  </div>
                  
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-800 fill-transparent" strokeWidth="4" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        className={`fill-transparent transition-all duration-1000 ${
                          telemetry.stressLevel === "Battery Fault" ? "stroke-neon-orange" : "stroke-neon-green"
                        }`} 
                        strokeWidth="4" 
                        strokeDasharray="176"
                        strokeDashoffset={176 - (176 * (telemetry.stressLevel === "Battery Fault" ? 68.2 : 4.9)) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-white font-bold">
                      {telemetry.stressLevel === "Battery Fault" ? "WARN" : "STABLE"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900/40 pt-2.5 font-mono text-[9.5px] text-gray-400">
                  <span className="text-neon-green font-bold block">★ AGING HORIZON (180 DAYS)</span>
                  Battery is structurally resilient. Voltage maintains stable discharge thresholds.
                </div>
              </div>

              {/* Card 3: Overheating Probability Curve */}
              <div className="bg-[#090e17]/95 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden text-left shadow-lg">
                <div className="absolute top-2 right-3 px-2 py-0.5 bg-neon-orange/10 rounded border border-neon-orange/30 text-neon-orange text-[8px] font-bold tracking-widest uppercase">
                  THERMAL OVERRUN
                </div>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Silicon Junction Alert</span>
                <h4 className="text-white font-display font-medium text-sm mt-1">Overheating Chance</h4>

                <div className="my-5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      {telemetry.cpuTemp >= 70 ? `${Math.round(telemetry.cpuTemp * 0.95)}%` : "12.4%"}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">T junction thermal overrun</span>
                  </div>
                  
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-800 fill-transparent" strokeWidth="4" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        className={`fill-transparent transition-all duration-1000 ${
                          telemetry.cpuTemp >= 72 ? "stroke-neon-red animate-pulse" : "stroke-neon-orange"
                        }`} 
                        strokeWidth="4" 
                        strokeDasharray="176"
                        strokeDashoffset={176 - (176 * (telemetry.cpuTemp >= 70 ? Math.round(telemetry.cpuTemp * 0.95) : 12.4)) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-white font-bold">
                      {telemetry.cpuTemp >= 70 ? "CRITICAL" : "COOL"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900/40 pt-2.5 font-mono text-[9.5px] text-gray-400">
                  <span className="text-neon-orange font-bold block">★ JUNCTION RECTIFICATION</span>
                  Throttling governor active. Subsystem is safe from physical hardware melt.
                </div>
              </div>
            </div>

            {/* 📉 INTERACTIVE COMPONENT DEGRADATION TIMELINE FORECAST CHANNELS */}
            <div className="bg-[#050b14]/95 border border-slate-800 rounded-2xl p-5 text-left relative overflow-hidden shadow-2xl">
              <h4 className="text-xs font-mono text-neon-cyan uppercase tracking-widest block mb-4 border-b border-slate-800 pb-2.5 font-bold">
                📉 Interactive Component Degradation Timeline & Aging Forecast (6 Months Chart)
              </h4>
              <p className="text-[10.5px] text-gray-400 font-mono leading-relaxed mb-5">
                Calculates silicon transistor erosion rates and chemical cell corrosion to map memory write speeds and maximum capacity curves over 180 simulated days.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Curve A: Battery Capacity Degradation */}
                <div className="bg-[#03060c] border border-slate-900 p-4 rounded-xl">
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-bold select-none text-left">
                    Max Charge Capacity Weakening (mAh)
                  </span>
                  
                  <div className="h-32 w-full mt-3 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: "Day 0", capacity: telemetry.batteryScore, speed: 100 },
                          { name: "Day 30", capacity: telemetry.batteryScore - 1.2, speed: 98 },
                          { name: "Day 60", capacity: telemetry.batteryScore - 2.5, speed: 95 },
                          { name: "Day 90", capacity: telemetry.batteryScore - 4.1, speed: 92 },
                          { name: "Day 120", capacity: telemetry.batteryScore - 6.0, speed: 88 },
                          { name: "Day 150", capacity: telemetry.batteryScore - 8.2, speed: 84 },
                          { name: "Day 180", capacity: telemetry.batteryScore - 11.5, speed: 80 }
                        ]}
                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                      >
                        <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 8 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#4b5563', fontSize: 8 }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', fontSize: 10 }} />
                        <Area type="monotone" dataKey="capacity" stroke="#00ff85" fillOpacity={0.15} fill="url(#colorCapacity)" />
                        <defs>
                          <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff85" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#00ff85" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-2">
                    <span>* Linear chemical deterioration</span>
                    <span className="text-neon-green font-bold">180 Days Estimate: {telemetry.batteryScore - 11.5}% capacity</span>
                  </div>
                </div>

                {/* Curve B: Flash Memory Slowdown Latency curve */}
                <div className="bg-[#03060c] border border-slate-900 p-4 rounded-xl">
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-bold select-none text-left">
                    Silicon Flash Write Throttling Engine Latency
                  </span>
                  
                  <div className="h-32 w-full mt-3 select-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: "Day 0", speed: 96, latency: 12 },
                          { name: "Day 30", speed: 92, latency: 15 },
                          { name: "Day 60", speed: 88, latency: 19 },
                          { name: "Day 90", speed: 82, latency: 26 },
                          { name: "Day 120", speed: 76, latency: 34 },
                          { name: "Day 150", speed: 68, latency: 45 },
                          { name: "Day 180", speed: 55, latency: 62 }
                        ]}
                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                      >
                        <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 8 }} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 8 }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', fontSize: 10 }} />
                        <Area type="monotone" dataKey="latency" stroke="#00f6ff" fillOpacity={0.15} fill="url(#colorLatency)" />
                        <defs>
                          <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f6ff" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#00f6ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-2">
                    <span>* Block write friction accumulation</span>
                    <span className="text-neon-cyan font-bold">180 Days Estimate: +62ms latency</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Anomaly alert notifications box */}
            <div className="bg-[#0b0c10]/95 border border-amber-500/25 rounded-2xl p-5 text-left relative overflow-hidden shadow-lg">
              <h4 className="text-xs font-mono text-amber-500 uppercase tracking-widest block mb-3 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                Smart AI Anomaly Watchdog Registers
              </h4>
              <div className="space-y-2">
                {telemetry.cpuUsage >= 70 && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <div>
                      <span className="text-red-400 font-bold block bg-red-950/30 font-mono text-[10px]">⚠️ [UNUSUAL CPU SPIKE DETECTED]</span>
                      <span className="text-[10px] text-gray-400">Core chipset load registers spike at {telemetry.cpuUsage}%. Extreme thermals possible!</span>
                    </div>
                  </div>
                )}
                {telemetry.cpuTemp >= 60 && (
                  <div className="flex items-center gap-2.5 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-amber-400 font-bold block font-mono text-[10px]">⚠️ [BACKGROUND APP CAUSING EXHAUST HEAT]</span>
                      <span className="text-[10px] text-gray-400">Excess heat observed. A background sweep is advised to avoid hardware throttling.</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5 p-3 bg-emerald-950/10 border border-emerald-500/20 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <span className="text-emerald-400 font-bold block font-mono text-[10px]">✔ [ANODE CHEMICAL BALANCE STABLE]</span>
                    <span className="text-[10px] text-gray-400">Stable lithium-ion charge flow registers standard current voltages.</span>
                  </div>
                </div>
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
          </motion.div>
        )}

        {/* TAB 7: 🎙️ VOICE ASSISTANT ENGINEER PANEL (PRO FEATURE) */}
        {activeTab === "voice-assistant" && (
          <motion.div
            key="voice-assistant"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-left relative flex-1 flex flex-col min-h-[500px] w-full"
          >
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
          </motion.div>
        )}

        {/* TAB 8: 🛠️ REPAIR NETWORK LOCATOR (INDIA FIRST SERVICE) */}
        {activeTab === "repair-network" && (
          <motion.div
            key="repair-network"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-left w-full"
          >
            <RepairNetworkScreen />
          </motion.div>
        )}

        {/* TAB 9: 💼 PITCH DECK SLIDER & COMPUTERS */}
        {activeTab === "pitch-deck" && (
          <motion.div
            key="pitch-deck"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-left w-full"
          >
            <PitchDeckScreen />
          </motion.div>
        )}

        {/* TAB 10: SECURE SCANNER */}
        {activeTab === "security-scan" && (
          <motion.div
            key="security-scan"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Security Scanner Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA to activate Quantum Grade Privacy Scanner and real-time deep packet inspection.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-teal-500 text-teal-950 font-bold uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all">
                    Unlock Security
                  </button>
                </div>
              </div>
            )}
            <SecurityPrivacyScreen />
          </motion.div>
        )}

        {/* TAB 11: DATA BACKUP */}
        {activeTab === "data-backup" && (
          <motion.div
            key="data-backup"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                    <Cloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Cloud Backup Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA to secure your contacts, media, and encryption keys to the decentralized system.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all">
                    Unlock Backup
                  </button>
                </div>
              </div>
            )}
            <DataBackupScreen />
          </motion.div>
        )}

        {/* TAB 12: APP CLEANER */}
        {activeTab === "app-cleaner" && (
          <motion.div
            key="app-cleaner"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mx-auto">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">System Cleaner Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA to eradicate ghost caches, dormant apps, and free up gigabytes of dead storage.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all">
                    Unlock Cleaner
                  </button>
                </div>
              </div>
            )}
            <AppCleanerScreen />
          </motion.div>
        )}

        {/* TAB 13: HARDWARE DIAGNOSTICS */}
        {activeTab === "hardware" && (
          <motion.div
            key="hardware"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
                    <Monitor className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Hardware Diag Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA to access sensor and actuator testing modules.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-orange-500 text-orange-950 font-bold uppercase tracking-widest rounded-xl transition-all">
                    Unlock Diagnostics
                  </button>
                </div>
              </div>
            )}
            <HardwareDiagnosticsScreen />
          </motion.div>
        )}

        {/* TAB 14: NETWORK ANALYZER */}
        {activeTab === "network" && (
          <motion.div
            key="network"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
                    <Wifi className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Network Analyzer Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA for live cellular dBm tracking and Wi-Fi spectrum topology analysis.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-sky-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all">
                    Unlock Analyzer
                  </button>
                </div>
              </div>
            )}
            <NetworkAnalyzerScreen />
          </motion.div>
        )}

        {/* TAB 15: PHANTOM DRAIN TRACKER */}
        {activeTab === "phantom" && (
          <motion.div
            key="phantom"
            initial={{ opacity: 0, scale: 0.99, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`text-left w-full relative min-h-[500px] ${!isProUnlocked ? "overflow-hidden" : ""}`}
          >
            {!isProUnlocked && (
              <div className="absolute inset-0 bg-[#03070d]/80 backdrop-blur-md z-20 flex items-center justify-center p-6 text-center rounded-3xl overflow-hidden border border-slate-800">
                <div className="max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
                    <Ghost className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Phantom Drain Locked</h3>
                  <p className="text-sm text-gray-400">Upgrade to PRO or ULTRA to uncover hidden background wakelocks and app hijacking.</p>
                  <button onClick={() => setIsPayModalOpen(true)} className="w-full py-3 bg-red-600 text-white font-bold uppercase tracking-widest rounded-xl transition-all">
                    Unlock Tracker
                  </button>
                </div>
              </div>
            )}
            <PhantomDrainTrackerScreen />
          </motion.div>
        )}

        </AnimatePresence>
      </main>

      {/* FLOATING HOLOGRAPHIC BOTTOM NAVIGATION DOCK (YOUTUBE STYLE) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl bg-[#081120]/90 border border-neon-blue/20 p-2 rounded-2xl flex items-center gap-1 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-40 backdrop-blur-md select-none overflow-x-auto cyber-scrollbar [&::-webkit-scrollbar]:hidden">
        
        {/* Holographic scanning line traversing button items */}
        <div className="absolute inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20 pointer-events-none" style={{ top: "1px" }} />

        {/* HOME (AI Core Dashboard) */}
        <button
          onClick={() => setActiveTab("home")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
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
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "pitch-deck" ? "bg-[#252514] text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <DollarSign className={`w-4 h-4 transition-transform ${activeTab === "pitch-deck" ? "scale-110 text-neon-yellow font-bold" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase font-medium">Pitch</span>
          {activeTab === "pitch-deck" && <span className="absolute bottom-1 w-1 h-1 bg-neon-yellow rounded-full animate-pulse" />}
        </button>

        {/* SECURITY SCANNER */}
        <button
          onClick={() => setActiveTab("security-scan")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "security-scan" ? "bg-teal-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <ShieldAlert className={`w-4 h-4 transition-transform ${activeTab === "security-scan" ? "scale-110 text-teal-400 font-bold drop-shadow-[0_0_5px_rgba(20,184,166,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Security</span>
          {activeTab === "security-scan" && <span className="absolute bottom-1 w-1 h-1 bg-teal-400 rounded-full animate-pulse" />}
        </button>

        {/* CLEANER */}
        <button
          onClick={() => setActiveTab("app-cleaner")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "app-cleaner" ? "bg-fuchsia-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Trash2 className={`w-4 h-4 transition-transform ${activeTab === "app-cleaner" ? "scale-110 text-fuchsia-400 font-bold drop-shadow-[0_0_5px_rgba(217,70,239,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Cleaner</span>
          {activeTab === "app-cleaner" && <span className="absolute bottom-1 w-1 h-1 bg-fuchsia-400 rounded-full animate-pulse" />}
        </button>

        {/* BACKUP */}
        <button
          onClick={() => setActiveTab("data-backup")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "data-backup" ? "bg-indigo-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Cloud className={`w-4 h-4 transition-transform ${activeTab === "data-backup" ? "scale-110 text-indigo-400 font-bold drop-shadow-[0_0_5px_rgba(99,102,241,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Backup</span>
          {activeTab === "data-backup" && <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full animate-pulse" />}
        </button>

        {/* HARDWARE DIAGNOSTICS */}
        <button
          onClick={() => setActiveTab("hardware")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "hardware" ? "bg-orange-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Monitor className={`w-4 h-4 transition-transform ${activeTab === "hardware" ? "scale-110 text-orange-400 font-bold drop-shadow-[0_0_5px_rgba(249,115,22,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Hardware</span>
          {activeTab === "hardware" && <span className="absolute bottom-1 w-1 h-1 bg-orange-400 rounded-full animate-pulse" />}
        </button>

        {/* NETWORK ANALYZER */}
        <button
          onClick={() => setActiveTab("network")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "network" ? "bg-sky-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Wifi className={`w-4 h-4 transition-transform ${activeTab === "network" ? "scale-110 text-sky-400 font-bold drop-shadow-[0_0_5px_rgba(14,165,233,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Network</span>
          {activeTab === "network" && <span className="absolute bottom-1 w-1 h-1 bg-sky-400 rounded-full animate-pulse" />}
        </button>

        {/* PHANTOM DRAIN */}
        <button
          onClick={() => setActiveTab("phantom")}
          className={`shrink-0 min-w-[68px] flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all relative ${
            activeTab === "phantom" ? "bg-red-500/10 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Ghost className={`w-4 h-4 transition-transform ${activeTab === "phantom" ? "scale-110 text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]" : "scale-95"}`} />
          <span className="text-[8.5px] font-mono mt-1 scale-90 font-medium tracking-tighter uppercase">Phantom</span>
          {activeTab === "phantom" && <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full animate-pulse" />}
        </button>

      </nav>

      {/* Redesigned compact professional legal and support compliance footer */}
      <Footer 
        onOpenPrivacy={handleOpenPrivacy}
        onOpenTerms={handleOpenTerms}
        onOpenDonate={handleOpenDonate}
        timestamp={telemetry.timestamp}
      />

      <SubscriptionPaymentModal 
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onUnlockPro={(tier) => {
          setIsProUnlocked(true);
          localStorage.setItem("devicepulse_pro_unlocked", "true");
          setSubscriptionStatus(tier);
        }}
      />

      {/* Interactive Developer Handshake & Donation Portal (Indian Secure UPI & Global Crypto simulation) */}
      <AnimatePresence>
        {isDonateOpen && (
          <div className="fixed inset-0 bg-[#03070d]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[#081120] border border-neon-purple/35 w-full max-w-lg rounded-2xl overflow-hidden p-6 relative flex flex-col max-h-[90vh] z-50 shadow-[0_0_50px_rgba(157,0,255,0.25)] text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="text-left">
                  <h2 className="text-md font-display font-black text-white tracking-wider flex items-center gap-2">
                    <Heart className="w-5 h-5 text-neon-purple animate-pulse" />
                    DEVELOPER HANDSHAKE PORTAL
                  </h2>
                  <p className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-widest mt-1">DIRECT TRIBUTE TO THE AUTHOR</p>
                </div>
                <button 
                  onClick={handleCloseDonate}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-neon-red/10 border border-white/10 hover:border-neon-red/30 text-gray-400 hover:text-neon-red flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Contributor credentials display */}
              <div className="bg-[#050b14]/55 border border-slate-800/80 p-3.5 rounded-xl space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">LEAD SYSTEMS SCIENTIST:</span>
                  <span className="text-xs text-white font-black tracking-wide font-mono">AMAAN SIDDIQUI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">DEVELOPER EMAIL:</span>
                  <a href="mailto:amaanmohd8681@gmail.com" className="text-xs text-[#00f0ff] underline font-bold hover:text-white transition-colors font-mono">amaanmohd8681@gmail.com</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">SECURE TRANSIT NODES:</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-black border border-emerald-500/20 uppercase">UPI / CRYPTO ENVELOPE</span>
                </div>
              </div>

              {/* Dynamic Interactive Tiers Selector */}
              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 mb-4">
                <p className="text-[10px] text-slate-300 font-mono leading-relaxed mb-1 text-center">
                  Support further cognitive development upgrades & premium nodes deployment. Choose an envelope tribute below:
                </p>

                {/* Preset tiers */}
                {[
                  { id: "coolant", label: "Buy Liquid Nitrogen Coolant Package", priceUsd: 5, priceInr: 399, desc: "Keeps silicon junction core from thermal throttling.", color: "border-[#00f0ff]/30 text-[#00f0ff]", hover: "hover:border-[#00f0ff] bg-[#00f0ff]/5" },
                  { id: "hosting", label: "Quantum Neural Mesh Extension", priceUsd: 15, priceInr: 1199, desc: "Provides high probability compute parameters to nodes.", color: "border-neon-purple/30 text-neon-purple", hover: "hover:border-neon-purple bg-neon-purple/5" },
                  { id: "cloud", label: "Establish Dedicated Cloud Node cluster", priceUsd: 30, priceInr: 2499, desc: "Unrestricted bandwidth proxy to continuous AI telemetry.", color: "border-neon-yellow/30 text-neon-yellow", hover: "hover:border-neon-yellow bg-neon-yellow/5" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => {
                      playBeep(320, 80, "sawtooth");
                      alert(`INITIATED SECURE TRIBUTE HANDSHAKE:\n\nLead Recipient: Amaan Siddiqui (amaanmohd8681@gmail.com)\nTribute: ${tier.label}\nValue: ₹${tier.priceInr} / $${tier.priceUsd}\n\n[SIMULATION]: Click confirm to authorize node telemetry. Direct tributes can be sent via BHIM UPI or PayPal directly to amaanmohd8681@gmail.com!`);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${tier.color} ${tier.hover} block cursor-pointer hover:scale-[1.01]`}
                  >
                    <div className="flex items-center justify-between mb-1 font-mono">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{tier.label}</span>
                      <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded">₹{tier.priceInr} / ${tier.priceUsd}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-mono">{tier.desc}</p>
                  </button>
                ))}

                {/* Secure custom donation handshakes */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[9.5px] text-gray-400 block font-bold mb-2 uppercase tracking-wide font-mono">CUSTOM SECURE TRIBUTE</span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-gray-500 font-mono">₹</span>
                      <input 
                        type="number" 
                        placeholder="Amount in INR" 
                        defaultValue="500"
                        id="custom-donation-amount"
                        className="w-full bg-[#081120] border border-slate-700/80 rounded-lg py-1.5 pl-5 pr-2 w-full text-white font-mono text-[11px] focus:outline-none focus:border-neon-purple"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const amount = (document.getElementById("custom-donation-amount") as HTMLInputElement)?.value || "500";
                        playBeep(380, 100, "sine");
                        alert(`INITIATING CUSTOM TRIBUTE SECURE PROTOCOL:\n\nLead Recipient: Amaan Siddiqui\nEmail: amaanmohd8681@gmail.com\nValue: ₹${amount} INR\n\nThank you for supporting Amaan Siddiqui! Please contact the author for custom systems configurations.`);
                      }}
                      className="px-4 py-1.5 bg-neon-purple text-black font-black uppercase text-[10px] tracking-wider rounded-lg transition-all hover:bg-purple-400 cursor-pointer font-mono"
                    >
                      SEND TRIBUTE
                    </button>
                  </div>
                </div>

                {/* Direct QR scan simulation box */}
                <div className="border border-slate-800 bg-[#050b14]/90 p-3 rounded-xl flex items-center gap-3.5">
                  <div className="bg-white p-1 rounded">
                    <div className="w-16 h-16 bg-slate-900 flex items-center justify-center p-1 text-white relative">
                      <QrCode className="w-14 h-14 text-white" />
                      <div className="absolute inset-0 bg-neon-purple/15 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-left space-y-1 flex-1">
                    <span className="text-[9.5px] text-[#0cf35a] bg-[#0cf35a]/10 px-1.5 py-0.2 rounded border border-[#0cf35a]/20 font-black tracking-widest uppercase font-mono">UPI_GATEWAY: READY</span>
                    <p className="text-[9px] text-slate-400 font-mono tracking-tight leading-tight">
                      Scan BHIM UPI, GPay, Paytm or PhonePe to issue secure developer tributes to <strong className="text-white">Amaan Siddiqui</strong>.
                    </p>
                  </div>
                </div>

              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center bg-[#050b15] -mx-6 -mb-6 p-4">
                <span className="text-[10px] text-slate-500 font-mono">SECURE BY DESIGN &bull; ENCRYPTED DEV SSL</span>
                <button 
                  onClick={handleCloseDonate}
                  className="px-5 py-2 bg-neon-purple hover:bg-purple-500 text-white font-black uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer font-mono"
                >
                  DISMISS SECURE PANEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Privacy Policy Modal (Cyberpunk Glassmorphism) */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 bg-[#03070d]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 15 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 15 }}
               transition={{ duration: 0.25, ease: "easeOut" }}
               className="bg-[#081120] border border-neon-blue/30 w-full max-w-2xl rounded-2xl overflow-hidden p-6 relative flex flex-col max-h-[85vh] z-50 shadow-[0_0_50px_rgba(0,240,255,0.15)]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-blue to-transparent" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="text-left">
                  <h2 className="text-lg font-display font-black text-white tracking-wider flex items-center gap-2">
                    <Shield className="w-5 h-5 text-neon-blue" />
                    PRIVACY POLICY & COGNITIVE SECURITY
                  </h2>
                  <p className="text-[10px] font-mono text-gray-400">LAST UPDATED: 2026-05-27 (REGULATORY REVISION)</p>
                </div>
                <button 
                  onClick={handleClosePrivacy}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-neon-red/10 border border-white/10 hover:border-neon-red/30 text-gray-400 hover:text-neon-red flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Policy scroll area */}
              <div className="flex-1 overflow-y-auto text-left font-mono text-[11px] text-gray-300 space-y-4 pr-1 leading-relaxed custom-scrollbar">
                <div className="bg-neon-blue/5 border border-neon-blue/15 p-3 rounded-lg text-neon-blue text-[10px]">
                  <strong>🇮🇳 INDIAN DPDP ACT & GDPR COMPLIANCE DECREE:</strong> All metrics, network packets, hardware diagnostics, and device parameters processed by DevicePulse AI Core are anchored within Indian local browser buffers. No sensitive telemetry or personal information leaves this state grid without explicit consent.
                </div>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">1. Scope & Consent</h3>
                  <p>
                    By activating our terminal diagnostics, you grant consent to process local browser device configuration parameters (including active battery cycle rates, real-time CPU states, memory usage clusters, cellular signal levels, and thermal profile loops). This data is processed purely to present active interactive health metrics.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">2. Diagnostics & Telemetry Harvesting</h3>
                  <p>
                    We leverage secure, sandboxed browser metrics to populate diagnostic channels. Touch verification digitizers, audio frequencies, and accelerometer grids run entirely client-side. No peripheral recordings, visual media, or device screen interactions are stored or recorded on any server.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">3. Gemini Cognitive Diagnostics Anonymization</h3>
                  <p>
                    When activating AI core predictions, our proxy server filters all data requests to strip out any unique browser cookies, system tags, IP addresses, or personal network coordinates. The Gemini model analyzes strictly non-personally identifiable numbers (such as storage rates, temperatures, and battery voltages) to yield failure-rate summaries.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">4. Financial Transactions & Razorpay Protocol</h3>
                  <p>
                    Billing subscriptions (both PRO and ULTRA plan versions) are processed using state-of-the-art PCI-DSS compliant payment tunnels powered by Razorpay. DevicePulse does not capture, store, or transmit your raw card numbers, Netbanking passwords, or UPI PIN credentials. Only an anonymous transaction token is mapped to verify authorization.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">5. Data Retention, Purging, & Erasure</h3>
                  <p>
                    Under user rights granted by GDPR and the Indian DPDP Act 2023, you maintain complete ownership of your device tokens. Clearing your client-side browser cache instantly deletes all local storage tracking files, manual synchronization statuses, and active session histories, ensuring absolute deletion of all local parameters instantly.
                  </p>
                </section>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex justify-between items-center bg-[#050b15] -mx-6 -mb-6 p-4">
                <span className="text-[10px] text-gray-500 font-mono">SECURE BY DESIGN &bull; ZERO THIRD-PARTY TRACKERS</span>
                <button 
                  onClick={handleClosePrivacy}
                  className="px-5 py-2 bg-neon-blue hover:bg-[#00e0ef] text-black font-black uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  ACKNOWLEDGE SECURITIES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Terms of Service Modal (Cyberpunk Glassmorphic) */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 bg-[#03070d]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[#081120] border border-neon-blue/30 w-full max-w-2xl rounded-2xl overflow-hidden p-6 relative flex flex-col max-h-[85vh] z-50 shadow-[0_0_50px_rgba(157,0,255,0.15)]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="text-left">
                  <h2 className="text-lg font-display font-black text-white tracking-wider flex items-center gap-2">
                    <Layers className="w-5 h-5 text-neon-purple" />
                    TERMS OF SERVICE PROTOCOL
                  </h2>
                  <p className="text-[10px] font-mono text-gray-400">VERSION CODE: v1.12_PROTOC (IND-SPECIFIC)</p>
                </div>
                <button 
                  onClick={handleCloseTerms}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-neon-red/10 border border-white/10 hover:border-neon-red/30 text-gray-400 hover:text-neon-red flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Terms scroll area */}
              <div className="flex-1 overflow-y-auto text-left font-mono text-[11px] text-gray-300 space-y-4 pr-1 leading-relaxed custom-scrollbar">
                <div className="bg-neon-purple/5 border border-neon-purple/20 p-3 rounded-lg text-neon-purple text-[10px]">
                  <strong>⚡ ACTIVE LEGAL ENGAGEMENT WARNING:</strong> Enrolling into the DevicePulse platform confirms full acceptance of this software operation protocol.
                </div>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">1. Algorithmic Diagnostic Precision</h3>
                  <p>
                    All diagnostics issued by DevicePulse AI, including failure predictions, thermal spikes, battery depletion forecasts, and emergency safe modes are mathematical approximations. While generated via state-of-the-art cognitive models, they cannot replace manual physical equipment diagnostics by accredited engineers.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">2. Fair Use Limits on Intelligent Synthesis</h3>
                  <p>
                    Intelligent synthesis (Gemini core prompts, custom Voice AI diagnostics) is restricted to your individual registered local device profile. Automated script-bypassing, query extraction, or harvesting our diagnostic frameworks is strictly interdicted.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">3. Subscription Billing & Razorpay Integration</h3>
                  <p>
                    All subscriptions (Pro, Ultra Tiers) offer recurring digital asset access. Subscriptions can be canceled at any time. Purchases are safely authenticated using payment credentials powered by Razorpay gateways.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wide">4. Limitation of Repair Liability</h3>
                  <p>
                    Our Verified Repair Network lists external provider estimates for repair convenience. DevicePulse AI acts as a digital matching registry and does not bear direct liability for any mechanical servicing, part replacement, or physical restoration executed by independent third-party shops.
                  </p>
                </section>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex justify-between items-center bg-[#050b15] -mx-6 -mb-6 p-4">
                <span className="text-[10px] text-gray-500 font-mono">COMPLIANT WITH THE IT ACT 2000 (INDIA)</span>
                <button 
                  onClick={handleCloseTerms}
                  className="px-5 py-2 bg-neon-purple hover:bg-purple-500 text-white font-black uppercase tracking-wider text-[10px] rounded-lg transition-colors cursor-pointer"
                >
                  I ACCEPT TERMS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TRIGGER Button: Ask Device AI Brain */}
      <div className="fixed bottom-20 right-6 z-45 sm:bottom-6">
        <button
          onClick={() => {
            setIsChatDrawerOpen(!isChatDrawerOpen);
            if (typeof playBeep === 'function') {
              playBeep(440, 660, "sine");
            }
          }}
          className="relative bg-gradient-to-r from-neon-purple to-neon-cyan text-white px-5 py-3.5 rounded-full font-mono text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2.5 shadow-[0_12px_40px_rgba(157,0,255,0.4)] hover:shadow-[0_0_25px_rgba(0,245,255,0.6)] cursor-pointer hover:scale-105 active:scale-95 group"
          id="ask-device-ai-floater"
        >
          <Sparkles className="w-4 h-4 text-white group-hover:animate-spin" />
          <span>Ask Device AI</span>
          <span className="w-2.5 h-2.5 rounded-full bg-neon-green inline-block animate-ping" />
        </button>
      </div>

      {/* 🔮 3D SLIDE-OVER GLASSMORPHIC AI DEVICE CHAT DRAWERS */}
      <AnimatePresence>
        {isChatDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop slide click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#040812]/95 border-l border-slate-800 h-full flex flex-col shadow-2xl z-20 backdrop-blur-md"
            >
              {/* Core scanning border indicator */}
              <div className="absolute top-0 bottom-0 left-0 w-[1.5px] bg-gradient-to-b from-neon-purple via-neon-cyan to-transparent animate-pulse" />

              {/* Chat Header */}
              <div className="p-4.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-neon-cyan/15 border border-neon-cyan/35 flex items-center justify-center text-neon-cyan">
                    <MessageSquare className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-left font-mono">
                    <h3 className="text-sm font-bold text-white tracking-widest uppercase">DEVICE COGNITION AI</h3>
                    <span className="text-[8px] text-neon-cyan uppercase tracking-widest">LIVE REGISTER TUNER PORT</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsChatDrawerOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-neon-red/10 border border-white/10 hover:border-neon-red/30 text-gray-400 hover:text-neon-red flex items-center justify-center text-sm font-black transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Telemetry Micro Status Strip */}
              <div className="bg-[#0c1424] px-4.5 py-2 border-b border-white/5 flex items-center justify-between font-mono text-[9px] text-gray-400 select-none">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-neon-cyan" />
                  CPU Temp: <strong className="text-white">{telemetry.cpuTemp}°C</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-neon-green" />
                  Battery: <strong className="text-white">{telemetry.batteryScore}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-neon-purple" />
                  System Health: <strong className="text-neon-cyan">{overallHealthScore}%</strong>
                </span>
              </div>

              {/* Chat Message Scrollport */}
              <div className="flex-1 overflow-y-auto p-4.5 space-y-4 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] font-mono text-xs ${
                      msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[8px] text-gray-500 mb-1 select-none">
                      {msg.role === "user" ? "SYSTEM REGISTER INQUIRY" : "DEVICE COGNITIVE ASSISTANT"}
                    </span>
                    <div
                      className={`p-3 rounded-2xl text-left border leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-neon-purple/20 border-neon-purple/40 text-white rounded-tr-none"
                          : "bg-slate-900/90 border-slate-800 text-gray-200 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex flex-col max-w-[80%] items-start font-mono text-xs mr-auto">
                    <span className="text-[8px] text-gray-500 mb-1">AI IS READING HARDWARE REGISTERS...</span>
                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Preset Sample Help Chips to click */}
              <div className="p-3 bg-slate-950/80 border-t border-white/5 select-none text-left">
                <span className="text-[8px] font-mono text-gray-500 uppercase block mb-1.5 font-bold">Suggested Quick Diagnostics</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {[
                    "Why is my device heating?",
                    "Why is battery draining fast?",
                    "Is there background ram pressure?",
                    "Explain my 180-day hardware risk roadmap"
                  ].map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setChatInput(preset);
                        if (typeof playBeep === 'function') {
                          playBeep(330, 440, "sine");
                        }
                      }}
                      className="px-2 py-1 text-[9px] font-mono text-gray-400 bg-white/5 hover:bg-neon-cyan/15 hover:text-white border border-slate-800 hover:border-neon-cyan/40 rounded transition-all cursor-pointer"
                    >
                      💡 {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Chat Box */}
              <form onSubmit={handleSendChatMessage} className="p-4 bg-slate-950 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Device AI about registers..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-gray-100 placeholder-gray-500 rounded-xl font-mono text-xs focus:outline-none focus:border-neon-cyan"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2.5 rounded-xl bg-neon-cyan hover:bg-opacity-80 disabled:opacity-50 text-black font-bold transition-all flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(0,240,255,0.25)]"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 HIGH-TECH AI BOOST OPTIMIZING FULLSCREEN PORTAL OVERLAY */}
      <AnimatePresence>
        {isAiBoosting && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#00040a] opacity-90 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(157,0,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(157,0,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Glowing cosmic portals and particles */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "linear"
              }}
              className="relative w-48 h-48 rounded-full border border-dashed border-neon-purple/50 flex items-center justify-center shadow-[0_0_80px_rgba(157,0,255,0.25)]"
            >
              <div className="absolute inset-6 rounded-full border border-dotted border-neon-cyan/50 animate-spin duration-700" />
              <div className="absolute inset-10 rounded-full bg-radial from-[#9d00ff]/20 to-transparent animate-pulse" />
              <Sparkles className="w-14 h-14 text-white animate-bounce" />
            </motion.div>

            <div className="max-w-md text-center mt-10 font-mono space-y-4">
              <h1 className="text-lg font-black font-display text-white tracking-widest uppercase animate-pulse">
                DEVICEPULSE AI DEEP ACCELERATOR ACTIVE
              </h1>
              
              <div className="w-64 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-[1px] mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full transition-all duration-300"
                  style={{ width: `${(aiBoostStep / 5) * 100}%` }}
                />
              </div>

              <div className="bg-[#03060c] border border-slate-850 p-4 rounded-xl min-h-[140px] text-left text-[11px] text-gray-300 space-y-1.5 font-mono select-none overflow-y-auto max-h-48 custom-scrollbar">
                {aiBoostLogs.map((log, idx) => (
                  <div key={idx} className={idx === aiBoostLogs.length - 1 ? "text-neon-cyan font-bold" : "text-gray-400"}>
                    {idx === aiBoostLogs.length - 1 && "➜ "} {log}
                  </div>
                ))}
              </div>

              <span className="block text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">
                DO NOT DISCONNECT OR SWITCH FROM THIS PORTAL DURING TUNING SECTOR SHUNTS
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
