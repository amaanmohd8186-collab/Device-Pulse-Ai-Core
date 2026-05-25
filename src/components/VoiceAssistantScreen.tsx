import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Globe, 
  Cpu, 
  Zap, 
  Flame, 
  HardDrive, 
  Sparkles, 
  Settings, 
  Info,
  Shield,
  Award,
  TrendingUp,
  RotateCcw,
  ZapOff,
  Terminal,
  Compass,
  CornerDownRight,
  ChevronRight,
  LayoutGrid,
  Share2,
  Copy,
  Check,
  Download,
  Send,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TelemetryState } from "../types";

interface VoiceAssistantProps {
  telemetry: TelemetryState;
  isPro: boolean;
  onUpgrade: () => void;
  updateMetric: (key: keyof TelemetryState, value: any) => void;
  runActiveCoolingMode: () => void;
  runActiveRamFlush: () => void;
  runStorageVacuum: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "English", name: "English", flag: "🇺🇸", placeholder: "Ask: 'Check battery degradation rate'" },
  { code: "Hindi", name: "Hindi (हिन्दी)", flag: "🇮🇳", placeholder: "पूछें: 'बैटरी हेल्थ क्या है?'" },
  { code: "Hinglish", name: "Hinglish (Phonetic)", flag: "🔥", placeholder: "Ask: 'Mera phone garam ho raha hai'" },
  { code: "Urdu", name: "Urdu (اردو)", flag: "🇵🇰", placeholder: "Ask: 'کیا فون سلو ہو رہا ہے؟'" },
  { code: "Bengali", name: "Bengali (বাংলা)", flag: "🇧🇩", placeholder: "জিজ্ঞেস করুন: 'স্টোরেজ খালি করো'" },
  { code: "Tamil", name: "Tamil (தமிழ்)", flag: "🇮🇳", placeholder: "கேளுங்கள்: 'பேட்டரி நிலை என்ன?'" },
  { code: "Telugu", name: "Telugu (తెలుగు)", flag: "🇮🇳", placeholder: "అడగండి: 'ఫోన్ వేడెక్కుతోంది'" }
];

export default function VoiceAssistantScreen({
  telemetry,
  isPro,
  onUpgrade,
  updateMetric,
  runActiveCoolingMode,
  runActiveRamFlush,
  runStorageVacuum
}: VoiceAssistantProps) {
  const [selectedLang, setSelectedLang] = useState<string>("Hinglish");
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [voiceStyle, setVoiceStyle] = useState<"synthesized" | "natural" | "robotic">("synthesized");
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("Ready to monitor thermal registers. Speak to start diagnostic pipeline.");
  const [displayedResponse, setDisplayedResponse] = useState<string>("");
  const [intent, setIntent] = useState<string>("idle_diagnostics");
  const [confidence, setConfidence] = useState<number>(98);
  const [manualInputText, setManualInputText] = useState<string>("");
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Gamified elements
  const [currentXp, setCurrentXp] = useState<number>(78);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(["Juice Maximizer"]);
  const [activatedTile, setActivatedTile] = useState<string | null>(null);
  const [radialMenuOpen, setRadialMenuOpen] = useState<boolean>(false);
  
  // System metrics trackers
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [scanPulseActive, setScanPulseActive] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any | null>(null);

  // Typewriter effect for AI answers
  useEffect(() => {
    setDisplayedResponse("");
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < aiResponse.length) {
        setDisplayedResponse((prev) => prev + aiResponse.charAt(idx));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [aiResponse]);

  const [thinkingProgress, setThinkingProgress] = useState<number>(0);

  // Smooth Thinking Progress simulation
  useEffect(() => {
    if (isProcessing) {
      setThinkingProgress(4);
      const interval = setInterval(() => {
        setThinkingProgress((prev) => {
          if (prev >= 94) return 94; // cap until response resolves
          return prev + Math.random() * 6 + 1; // smooth increment
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setThinkingProgress(100);
      const timeout = setTimeout(() => {
        setThinkingProgress(0);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isProcessing]);

  // Audio synths for gaming beep sound feedback
  const playBeep = (freqStart: number, freqEnd: number, duration: number, type: OscillatorType = "sine") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Synth audio feedback blocked on frame", e);
    }
  };

  // Speaks aloud with Synthesis configuration
  const speakText = (text: string) => {
    if (isVoiceMuted) return;
    try {
      const syn = window.speechSynthesis;
      if (!syn) return;
      syn.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedLang === "Hindi" || selectedLang === "Hinglish") {
        utterance.lang = "hi-IN";
      } else if (selectedLang === "Tamil") {
        utterance.lang = "ta-IN";
      } else if (selectedLang === "Telugu") {
        utterance.lang = "te-IN";
      } else if (selectedLang === "Bengali") {
        utterance.lang = "bn-IN";
      } else if (selectedLang === "Urdu") {
        utterance.lang = "ur-PK";
      } else {
        utterance.lang = "en-US";
      }

      if (voiceStyle === "robotic") {
        utterance.pitch = 0.45;
        utterance.rate = 1.15;
      } else if (voiceStyle === "synthesized") {
        utterance.pitch = 1.3;
        utterance.rate = 1.05;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      syn.speak(utterance);
    } catch (e) {
      console.warn("TTS block:", e);
    }
  };

  // Speech Recognition API setup
  useEffect(() => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechClass) {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = true;
      
      rec.onstart = () => {
        setIsListening(true);
        playBeep(330, 660, 0.15, "sine");
        setLiveTranscript("Ready... listening live. Speak now.");
      };

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setLiveTranscript(transcript);
        
        if (autoDetect) {
          const lower = transcript.toLowerCase();
          if (lower.includes("garam") || lower.includes("chahiye") || lower.includes("hai") || lower.includes("karo") || lower.includes("slow")) {
            setSelectedLang("Hinglish");
          } else if (/\b(battery|thermal|optimize|storage|scan)\b/.test(lower)) {
            setSelectedLang("English");
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn("STT Exception:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [autoDetect, voiceStyle]);

  // Command Engine
  const handleQueryTriggerAndProcess = async (queryText: string) => {
    if (!queryText || queryText.trim() === "") return;
    
    setIsListening(false);
    setIsProcessing(true);
    setLiveTranscript(queryText);
    setScanPulseActive(true);
    
    const startTime = performance.now();
    playBeep(480, 240, 0.2, "triangle");

    try {
      const response = await fetch("/api/gemini/voice-engineer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: queryText,
          language: selectedLang,
          telemetry: telemetry
        })
      });

      const latency = Math.round(performance.now() - startTime);
      setLatencyMs(latency > 0 ? latency : 35);

      if (!response.ok) {
        throw new Error("API Node Disconnected");
      }

      const data = await response.json();
      setAiResponse(data.responseText);
      setIntent(data.intentDetected);
      setConfidence(Math.round(80 + Math.random() * 19));
      
      // Execute standard actions
      if (data.telemetryDelta && data.telemetryDelta.action) {
        if (data.telemetryDelta.action === "cool") {
          runActiveCoolingMode();
          // Level up XP representation
          setCurrentXp(prev => Math.min(100, prev + 8));
          if (!unlockedAchievements.includes("Cool Device Master")) {
            setUnlockedAchievements(p => [...p, "Cool Device Master"]);
          }
        } else if (data.telemetryDelta.action === "ram") {
          runActiveRamFlush();
          setCurrentXp(prev => Math.min(100, prev + 12));
          if (!unlockedAchievements.includes("Performance Titan")) {
            setUnlockedAchievements(p => [...p, "Performance Titan"]);
          }
        } else if (data.telemetryDelta.action === "storage") {
          runStorageVacuum();
          setCurrentXp(prev => Math.min(100, prev + 10));
        }
      }

      speakText(data.speechReadyText || data.responseText);
      playBeep(580, 1160, 0.12, "sine");

    } catch (err) {
      console.error("AI Node error:", err);
      setAiResponse("Core diagnostics nodes triggered a cloud exception. Reverting to automated hardware backup systems.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setScanPulseActive(false), 900);
    }
  };

  const toggleMicListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setLiveTranscript("");
      try {
        if (recognitionRef.current) {
          if (selectedLang === "Hindi" || selectedLang === "Hinglish") {
            recognitionRef.current.lang = "hi-IN";
          } else if (selectedLang === "English") {
            recognitionRef.current.lang = "en-US";
          } else if (selectedLang === "Tamil") {
            recognitionRef.current.lang = "ta-IN";
          } else if (selectedLang === "Telugu") {
            recognitionRef.current.lang = "te-IN";
          } else if (selectedLang === "Bengali") {
            recognitionRef.current.lang = "bn-IN";
          } else {
            recognitionRef.current.lang = "en-US";
          }
          recognitionRef.current.start();
        } else {
          const promptPlaceholder = LANGUAGES.find(l => l.code === selectedLang)?.placeholder || "Identify issue";
          const query = prompt(promptPlaceholder);
          if (query) {
            handleQueryTriggerAndProcess(query);
          }
        }
      } catch (e) {
        console.warn("STT block:", e);
      }
    }
  };

  // High quality horror-cyan Neon Horizontal wave particles physics animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 100);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 100;
      }
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{ x: number; y: number; originalY: number; speed: number; angle: number; size: number }> = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: (i / 45) * width,
        y: height / 2,
        originalY: height / 2,
        speed: (0.4 + Math.random() * 1.8) * (isListening ? 2.5 : 1),
        angle: Math.random() * Math.PI * 2,
        size: 1.2 + Math.random() * 2.5
      });
    }

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      phase += isListening ? 0.28 : isProcessing ? 0.18 : 0.06;

      // Base flat HUD axis grid lines
      ctx.strokeStyle = "rgba(10, 20, 40, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Dynamic color selection based on system conditions
      // Blue = normal, Green = processing, Orange = thermal warning (70C), Red = critical (temp >= 80C)
      let waveColor = "rgba(0, 245, 255, 0.8)"; // Neon Cyan/Blue defaults
      let shadowColor = "#00F5FF";
      
      if (isProcessing) {
        waveColor = "rgba(0, 255, 133, 0.85)"; // Neon Green
        shadowColor = "#00FF85";
      } else if (telemetry.cpuTemp >= 80) {
        waveColor = "rgba(255, 59, 59, 0.9)"; // Neon Critical Red
        shadowColor = "#FF3B3B";
      } else if (telemetry.cpuTemp >= 60) {
        waveColor = "rgba(255, 178, 0, 0.85)"; // Neon Warning Orange
        shadowColor = "#FFB200";
      }

      const wavePulse = Math.sin(phase * 1.5) * 3;
      const confidenceJitterFactor = confidence < 80 ? (80 - confidence) * 0.5 : 0;

      // Master audio waves
      ctx.beginPath();
      ctx.lineWidth = 2.8;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = isListening || isProcessing ? 18 : 6;
      ctx.strokeStyle = waveColor;

      for (let x = 0; x < width; x++) {
        const amp = isListening ? 30 : isProcessing ? 16 : 4;
        const speedMultiplier = isListening ? 1.5 : 0.7;
        const jitter = confidenceJitterFactor > 0 ? (Math.random() - 0.5) * confidenceJitterFactor : 0;
        
        const wave = Math.sin(x * 0.016 - phase * speedMultiplier) * (amp + wavePulse);
        const noise = Math.cos(x * 0.038 + phase * 0.4) * ((amp + wavePulse) * 0.3);
        const y = height / 2 + wave + noise + jitter;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mirror sub harmonic wave for 3D layout depth
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(100, 240, 255, 0.18)";
      for (let x = 0; x < width; x += 4) {
        const amp2 = isListening ? 15 : isProcessing ? 8 : 2;
        const y = height / 2 - Math.sin(x * 0.022 + phase * 0.8) * amp2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Particle physics movement
      particles.forEach((p) => {
        p.x += p.speed;
        if (p.x > width) p.x = 0;

        const waveAtX = Math.sin(p.x * 0.015 - phase) * (isListening ? 26 : 5);
        p.y = p.originalY + waveAtX + Math.sin(p.angle) * 7;
        p.angle += 0.04;

        ctx.fillStyle = isProcessing ? "rgba(0, 255, 133, 0.75)" : "rgba(0, 245, 255, 0.65)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isListening, isProcessing, confidence, telemetry.cpuTemp]);

  const executeManualQuery = (txt: string) => {
    handleQueryTriggerAndProcess(txt);
  };

  // Determine current ambient device mood report text
  const getDeviceMood = () => {
    if (telemetry.cpuTemp >= 75) return { text: "Throttled Cluster Warning", color: "text-neon-red", label: "ALERT" };
    if (telemetry.cpuTemp >= 55) return { text: "Moderate Thermal Load", color: "text-neon-orange", label: "ACTIVE" };
    if (telemetry.batteryScore < 85) return { text: "Low Chemical Charge Rate", color: "text-neon-yellow", label: "INLINE" };
    return { text: "Optimal Sub-zero Silicon Cooled", color: "text-neon-green", label: "STABLE" };
  };

  const moodState = getDeviceMood();

  // Dynamic color states based on system's confidence & system alarms
  const isCriticalSystemAlert = telemetry.cpuTemp >= 80 || confidence < 50;
  const isAnalyticalUncertainty = !isCriticalSystemAlert && confidence < 80;
  const isHighConfidenceState = !isCriticalSystemAlert && !isAnalyticalUncertainty;

  let responseCardDynamicStyle: React.CSSProperties = {};
  let responseCardDynamicBorder = "border-slate-800";
  
  if (isHighConfidenceState) {
    // Cyan for high confidence
    responseCardDynamicStyle = {
      boxShadow: "0 0 25px rgba(0, 245, 255, 0.25)",
      borderColor: "rgba(0, 245, 255, 0.4)"
    };
    responseCardDynamicBorder = "border-neon-cyan/40";
  } else if (isAnalyticalUncertainty) {
    // Orange for analytical uncertainty
    responseCardDynamicStyle = {
      boxShadow: "0 0 25px rgba(249, 115, 22, 0.25)",
      borderColor: "rgba(249, 115, 22, 0.4)"
    };
    responseCardDynamicBorder = "border-orange-500/40";
  } else if (isCriticalSystemAlert) {
    // Red for critical system alerts
    responseCardDynamicStyle = {
      boxShadow: "0 0 25px rgba(239, 68, 68, 0.25)",
      borderColor: "rgba(239, 68, 68, 0.4)"
    };
    responseCardDynamicBorder = "border-red-500/40";
  }

  return (
    <div className="w-full text-gray-200 select-none pb-12 relative h-full">
      
      {!isPro && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl p-8 text-center border-2 border-slate-800">
           <div className="w-20 h-20 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple mb-6 animate-pulse shadow-[0_0_20px_rgba(157,0,255,0.25)]">
             <Mic className="w-10 h-10" />
           </div>
           <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">VOICE AI CORE LOCKED</h3>
           <p className="text-gray-400 text-sm max-w-sm mb-8 font-mono">
             Voice-activated hardware diagnostics and real-time engineer assistance require a PRO subscription license.
           </p>
           <button
             onClick={onUpgrade}
             className="bg-neon-purple hover:bg-opacity-90 px-8 py-3 rounded-xl font-black text-white uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(157,0,255,0.35)]"
           >
             UPGRADE TO PRO TO UNLOCK
             <Award className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* 1. FUTURISTIC LIVE STATUS HEADER HUD */}
      <div className="w-full p-4 rounded-xl border border-slate-800/80 bg-linear-to-b from-[#090E17] to-[#04060B] shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden">
        
        {/* Animated matrix line sweep across HUD wrapper */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-500/2 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan relative">
            <Cpu className="w-5 h-5 animate-spin [animation-duration:10s]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-green rounded-full border border-[#04060B]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black font-mono uppercase tracking-widest text-white">
                DevicePulse HUD System
              </h1>
              <span className="text-[8px] font-mono px-2 py-0.5 bg-neon-cyan/15 rounded border border-neon-cyan/20 text-neon-cyan select-none animate-pulse">
                STABLE OVERRIDE SYNC
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider mt-0.5">
              Live device registers monitoring physical temperature core loops in real time.
            </p>
          </div>
        </div>

        {/* Live HUD Stats loop display */}
        <div className="flex items-center gap-6 font-mono text-center">
          
          {/* Animated fill meter bar for battery */}
          <div className="px-3 border-r border-slate-800/80">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Anode Cell</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-white">{telemetry.batteryScore}%</span>
              <div className="w-10 h-2 bg-slate-900 border border-slate-800 rounded-sm overflow-hidden p-[1px]">
                <div 
                  className="h-full bg-linear-to-r from-neon-green to-neon-cyan rounded-xs transition-all duration-500"
                  style={{ width: `${telemetry.batteryScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shimmer hot registers for thermals */}
          <div className="px-3 border-r border-slate-800/80">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Core Registers</span>
            <span className={`block text-xs font-bold mt-1 tracking-tight ${
              telemetry.cpuTemp >= 70 ? "text-neon-red animate-pulse" : telemetry.cpuTemp >= 55 ? "text-neon-orange" : "text-neon-cyan"
            }`}>
              {telemetry.cpuTemp}°C {telemetry.cpuTemp >= 60 && "🔥"}
            </span>
          </div>

          {/* Device level XP Score counting meters */}
          <div className="px-1 text-right">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Device Score XP</span>
            <span className="block text-xs font-black text-neon-green mt-1 tracking-widest uppercase">
              LVL {currentXp}
            </span>
          </div>

        </div>

      </div>

      {/* 2. CHIEF COCKPIT GLASS ENGINEERING PANEL */}
      <div className="relative rounded-2xl border-2 border-slate-800/90 bg-[#060A13] p-6 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col items-center">
        
        {/* Holographic matrix grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-50 z-0" />
        
        {/* Laser line sweep effect */}
        {scanPulseActive && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-transparent via-neon-cyan to-transparent animate-[laserSweep_0.8s_ease-out_infinite] z-20 pointer-events-none" />
        )}

        {/* CORNER NEON FLUID BRACKETS */}
        <div className="absolute top-0 left-0 w-14 h-[1px] bg-neon-cyan/50" />
        <div className="absolute top-0 left-0 w-[1px] h-14 bg-neon-cyan/50" />
        <div className="absolute bottom-0 right-0 w-14 h-[1px] bg-neon-cyan/50" />
        <div className="absolute bottom-0 right-0 w-[1px] h-14 bg-neon-cyan/50" />

        {/* LANG + CONTROL SWITCHERS ROW */}
        <div className="w-full flex items-center justify-between mb-8 pb-3 border-b border-slate-900/40 relative z-20 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">
              AUDIO SPECTRUM ENGAGED
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio Mute option badge */}
            <button
              onClick={() => {
                setIsVoiceMuted(!isVoiceMuted);
                playBeep(220, 110, 0.1, "sine");
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isVoiceMuted ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-slate-900 border border-slate-800 text-neon-green hover:border-slate-700"
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Language settings expand modal triggers */}
            <button
              onClick={() => {
                setShowSettingsPopover(!showSettingsPopover);
                playBeep(180, 220, 0.15, "triangle");
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
                showSettingsPopover ? "bg-neon-cyan/20 border-neon-cyan text-white" : "bg-slate-900 border-slate-800 text-neon-cyan hover:border-slate-700"
              }`}
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SETTINGS PANEL INJECT MODAL */}
        <AnimatePresence>
          {showSettingsPopover && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-16 right-6 w-80 bg-slate-950/95 border-2 border-slate-800 rounded-xl p-5 shadow-[0_15px_45px_rgba(0,0,0,0.95)] backdrop-blur-md z-30 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-850">
                <span className="text-white font-extrabold flex items-center gap-1.5 uppercase select-none">
                  <Settings className="text-neon-cyan w-3.5 h-3.5" />
                  Voice Configuration
                </span>
                <button 
                  onClick={() => setShowSettingsPopover(false)}
                  className="text-gray-400 hover:text-white font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-200">Mix Signal Switch</span>
                    <span className="block text-[9px] text-gray-500">Detects mixed languages</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDetect}
                    onChange={(e) => setAutoDetect(e.target.checked)}
                    className="accent-neon-cyan scale-110 cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest pb-1.5 font-bold">Manual Voice Dialect</span>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setAutoDetect(false);
                          playBeep(260, 310, 0.1, "sine");
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-all text-left ${
                          selectedLang === lang.code 
                            ? "bg-neon-cyan/20 border border-neon-cyan/50 text-white font-bold"
                            : "bg-slate-900 border border-transparent hover:border-slate-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span className="text-[11px]">{lang.name}</span>
                        </div>
                        {selectedLang === lang.code && <span className="text-[8px] text-neon-cyan tracking-widest">ENGAGED</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest pb-1.5 font-bold">System Voice Output</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["natural", "synthesized", "robotic"] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setVoiceStyle(style);
                          playBeep(300, 450, 0.12, "sine");
                        }}
                        className={`py-1 rounded text-[9px] font-bold uppercase border text-center transition-all cursor-pointer ${
                          voiceStyle === style 
                            ? "bg-neon-cyan/25 border-neon-cyan text-white shadow-inner" 
                            : "bg-slate-900 border-slate-850 text-gray-400 hover:border-slate-800"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. CENTER 3D FLOATING VOICE AI MIC ORB TRIGGER */}
        <div className="relative my-8 select-none flex flex-col items-center">
          
          {/* Double revolving futuristic orbiting rings for 3D simulation depth */}
          <div className={`absolute -inset-10 rounded-full border border-dashed text-stone-100 transition-all duration-1000 ${
            isListening ? "border-neon-cyan/35 scale-125 animate-spin" : "border-slate-800 scale-100 [animation-duration:25s] animate-spin"
          }`} />
          <div className={`absolute -inset-7 rounded-full border border-dotted transition-all duration-700 [animation-direction:reverse] ${
            isListening ? "border-neon-cyan/40 scale-110 animate-spin" : "border-slate-800/60 scale-95 animate-spin"
          }`} />

          {/* Glowing expanding visual ripple shadows */}
          {isListening && (
            <div className="absolute -inset-6 rounded-full bg-neon-cyan/5 animate-ping border border-neon-cyan/25 duration-1000" />
          )}

          {/* Central Orbiting Orb structure button with futuristic 3D radial gradient */}
          <button
            onClick={toggleMicListening}
            disabled={isProcessing}
            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center border-3 transition-all duration-500 cursor-pointer outline-none z-10 ${
              isListening
                ? "bg-radial from-[#00F5FF]/40 via-[#03060C]/90 to-black border-[#00F5FF] text-white shadow-[0_0_40px_rgba(0,245,255,0.45),inset_0_0_20px_rgba(0,245,255,0.3)]"
                : isProcessing
                  ? "bg-radial from-[#00FF85]/30 via-[#03060C]/90 to-black border-[#00FF85] text-neon-green shadow-[0_0_40px_rgba(0,255,133,0.45),inset_0_0_20px_rgba(0,255,133,0.3)] cursor-wait"
                  : "bg-radial from-[#10192A] via-[#04060B]/90 to-black border-slate-700 hover:border-neon-cyan text-gray-300 hover:text-white shadow-[0_12px_35px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(0,245,255,0.25)]"
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[7px] text-neon-green tracking-widest font-mono uppercase mt-1 animate-pulse">
                  SPINNING CORE
                </span>
              </div>
            ) : isListening ? (
              <div className="relative">
                <Mic className="w-10 h-10 text-neon-cyan animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
            ) : (
              <Mic className="w-10 h-10 text-slate-400 group-hover:text-neon-cyan transition-colors" />
            )}

            <span className="text-[8px] font-mono tracking-widest mt-2 uppercase font-black text-slate-400">
              {isListening ? "LISTENING" : isProcessing ? "THINKING" : "TAP & SPEAK"}
            </span>

          </button>
        </div>

        {/* Dynamic Label underneath Orb */}
        <p className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase select-none text-center pb-5 relative z-10">
          👉 {isListening ? "STREAMING WAVEFORM REGISTERS..." : "Center Focus: Tap to Speak to Device AI Engineer"}
        </p>

        {/* 4. HORIZONTAL WAVE SPECTRUM TRACKING */}
        <div className="w-full max-w-xl bg-slate-950/50 border border-slate-900 rounded-xl p-2 relative select-none mb-6">
          <canvas id="voice-canvas" ref={canvasRef} className="w-full h-16 block rounded-lg bg-[#02050B]/60" />
          <div className="absolute bottom-1.5 right-3 font-mono text-[7px] text-gray-600 uppercase tracking-widest">
            Hardware signal frequency analyzer node
          </div>
        </div>

        {/* LIVE TRANSLATION REPORT DISPLAY */}
        <div className="w-full max-w-xl mb-6 p-3 bg-[#03070E] border border-slate-900 rounded-lg font-mono text-xs flex flex-col gap-1 text-left relative z-10">
          <div className="flex items-center justify-between text-[8px] text-gray-500 tracking-wider">
            <span>LIVE INTERIM DECODED STATEMENT</span>
            <span className="text-neon-cyan uppercase">DETECTED LANG: {selectedLang}</span>
          </div>
          <p className={`text-[11px] leading-relaxed select-text mt-1 text-left min-h-[22px] ${
            isListening ? "text-neon-cyan font-bold" : "text-gray-300"
          }`}>
            {liveTranscript || "Speak to trigger diagnostics, or type command blocks down below..."}
          </p>
        </div>

        {/* 5. GLASSMORPHISM AI COGNITIVE ANSWER CARD */}
        <div 
          id="voice-ai-response-card" 
          className={`ai-response-card w-full max-w-xl bg-[#090D17]/85 backdrop-blur-lg border ${responseCardDynamicBorder} rounded-xl p-5 shadow-2xl relative select-text text-left mb-6 transition-all duration-500`}
          style={responseCardDynamicStyle}
        >
          
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-linear-to-r from-transparent via-neon-cyan/40 to-transparent pointer-events-none" />

          {/* Top Right Share Button */}
          <button
            onClick={() => {
              playBeep(600, 1000, 0.2, "sine");
              setShowShareModal(true);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 border border-slate-800 hover:border-neon-cyan/30 p-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest cursor-pointer group z-20"
            title="Generate Share Card"
            id="voice-share-btn"
          >
            <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-neon-cyan" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <div className="flex items-start gap-3.5 pr-14">
            <div className="w-10 h-10 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center shrink-0">
              <Cpu className={`w-5 h-5 ${isProcessing ? "text-neon-green animate-spin" : "text-neon-cyan"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-mono text-[9px] text-gray-500 mb-1.5 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-neon-cyan tracking-widest">ENGINEER DIAGNOSTIC RESPONSE</span>
                  {isProcessing && (
                    <span id="ai-thinking-dots" className="flex items-center gap-0.5 bg-neon-cyan/20 border border-neon-cyan/40 px-2 py-0.5 rounded text-[8px] text-neon-cyan uppercase font-bold tracking-widest animate-pulse">
                      Analyzing
                      <span className="w-1 h-1 bg-neon-cyan rounded-full animate-bounce [animation-delay:-0.3s] ml-1"></span>
                      <span className="w-1 h-1 bg-neon-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-neon-cyan rounded-full animate-bounce"></span>
                    </span>
                  )}
                </div>
                <span className="text-neon-green">
                  INTEGRITY: {confidence}%
                </span>
              </div>

              {/* Typewriter animated technical console text code */}
              <p className="font-mono text-[11.5px] text-gray-200 leading-relaxed bg-[#03060C] p-3.5 border border-slate-850 rounded-lg min-h-[60px] whitespace-pre-wrap select-text">
                {displayedResponse || "Awaiting sensor frames trigger..."}
              </p>

              {/* Confidence health progress indicators */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 bg-slate-950 border border-slate-900 h-2.5 rounded-full overflow-hidden select-none">
                  <div 
                    className="bg-linear-to-r from-neon-green to-neon-cyan h-full rounded-full transition-all duration-700" 
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest select-none bg-slate-900/50 px-2.5 py-1 rounded border border-slate-800">
                  DECIBELS: STABLE
                </span>
              </div>

            </div>
          </div>

          {/* Horizontal thinking progress bar at the bottom of the card */}
          {thinkingProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/80 rounded-b-xl overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCriticalSystemAlert 
                    ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                    : isAnalyticalUncertainty 
                      ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                      : "bg-neon-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                }`}
                style={{ width: `${thinkingProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* 6. HOLOGRAPHIC CHIPS QUICK OVERVIEW TILES */}
        <div className="w-full max-w-xl select-none mb-6">
          <span className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest text-center mb-3">
            🔮 3D Holographic Diagnostic Tiles
          </span>
          
          <div className="grid grid-cols-2 gap-3">
            
            {/* Tile: Battery check */}
            <div 
              onClick={() => {
                setActivatedTile(activatedTile === "battery" ? null : "battery");
                playBeep(260, 520, 0.15, "triangle");
                executeManualQuery("Battery health status check karo");
              }}
              className={`border rounded-xl p-3 cursor-pointer transition-all duration-300 transform relative ${
                activatedTile === "battery" 
                  ? "bg-slate-950/90 border-[#00FFF1] scale-102 shadow-[0_0_20px_rgba(0,245,255,0.15)]" 
                  : "bg-[#090D17]/50 border-slate-800 hover:border-neon-cyan/50 hover:scale-101"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <span className="text-[7px] font-mono text-gray-500 uppercase">Anode Diagnostic</span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono">Battery Scan</h4>
              <p className="text-[9px] text-gray-400 font-mono mt-1">Voltage stability & cell wear analysis logs.</p>
              
              <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-neon-cyan h-full" style={{ width: `${telemetry.batteryScore}%` }} />
              </div>

              {activatedTile === "battery" && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 font-mono text-[8px] text-gray-400 space-y-1 bg-slate-950/60 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Active Voltage:</span>
                    <span className="text-white font-bold">{telemetry.voltageStability}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temp:</span>
                    <span className="text-white font-bold">{telemetry.batteryTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className="text-neon-green font-bold">OPTIMAL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tile: Thermals check */}
            <div 
              onClick={() => {
                setActivatedTile(activatedTile === "thermals" ? null : "thermals");
                playBeep(270, 540, 0.15, "triangle");
                executeManualQuery("Mera phone garam ho raha hai");
              }}
              className={`border rounded-xl p-3 cursor-pointer transition-all duration-300 transform relative ${
                activatedTile === "thermals"
                  ? "bg-slate-950/90 border-[#00FF85] scale-102 shadow-[0_0_20px_rgba(0,255,133,0.15)]"
                  : "bg-[#090D17]/50 border-slate-800 hover:border-neon-cyan/50 hover:scale-101"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Flame className="w-4 h-4 text-neon-orange" />
                <span className="text-[7px] font-mono text-gray-500 uppercase">Silicon Junction</span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono">Thermal Check</h4>
              <p className="text-[9px] text-gray-400 font-mono mt-1">CPU core clusters dynamic throttling scan.</p>
              
              <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-neon-orange h-full" style={{ width: `${telemetry.cpuTemp}%` }} />
              </div>

              {activatedTile === "thermals" && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 font-mono text-[8px] text-gray-400 space-y-1 bg-slate-950/60 p-2 rounded">
                  <div className="flex justify-between">
                    <span>CPU temp:</span>
                    <span className="text-white font-bold">{telemetry.cpuTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thermal spikes:</span>
                    <span className="text-[#FFB200] font-bold">{telemetry.thermalSpikes} Registered</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Governor Mode:</span>
                    <span className="text-neon-cyan font-bold">HYBRID</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tile: speed up */}
            <div 
              onClick={() => {
                setActivatedTile(activatedTile === "perf" ? null : "perf");
                playBeep(280, 560, 0.15, "triangle");
                executeManualQuery("Kya mera phone slow ho raha hai?");
              }}
              className={`border rounded-xl p-3 cursor-pointer transition-all duration-300 transform relative ${
                activatedTile === "perf"
                  ? "bg-slate-950/90 border-amber-500 scale-102 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  : "bg-[#090D17]/50 border-slate-800 hover:border-neon-cyan/50 hover:scale-101"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Cpu className="w-4 h-4 text-neon-green" />
                <span className="text-[7px] font-mono text-gray-500 uppercase">Kernel swap</span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono">Performance Boost</h4>
              <p className="text-[9px] text-gray-400 font-mono mt-1">Flushes active background leaks blocks.</p>
              
              <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-neon-green h-full" style={{ width: `${telemetry.perfScore}%` }} />
              </div>

              {activatedTile === "perf" && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 font-mono text-[8px] text-gray-400 space-y-1 bg-slate-950/60 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Memory usage:</span>
                    <span className="text-white font-bold">{telemetry.ramPressure}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throttling rate:</span>
                    <span className="text-white font-bold">{telemetry.cpuUsage}% Raw</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active tasks:</span>
                    <span className="text-[#00FF85] font-bold">34 Checked</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tile: Storage checks */}
            <div 
              onClick={() => {
                setActivatedTile(activatedTile === "storage" ? null : "storage");
                playBeep(290, 580, 0.15, "triangle");
                executeManualQuery("System disk space or bad blocks diagnostic");
              }}
              className={`border rounded-xl p-3 cursor-pointer transition-all duration-300 transform relative ${
                activatedTile === "storage"
                  ? "bg-slate-950/90 border-[#A855F7] scale-102 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  : "bg-[#090D17]/50 border-slate-800 hover:border-neon-cyan/50 hover:scale-101"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-[7px] font-mono text-gray-500 uppercase">ROM Block sector</span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono">Storage Health</h4>
              <p className="text-[9px] text-gray-400 font-mono mt-1">Deep scans for fragmented file nodes.</p>
              
              <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${telemetry.storageScore}%` }} />
              </div>

              {activatedTile === "storage" && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 font-mono text-[8px] text-gray-400 space-y-1 bg-slate-950/60 p-2 rounded">
                  <div className="flex justify-between">
                    <span>Fragment limit:</span>
                    <span className="text-white font-bold">1.24% Latency</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sectors analyzed:</span>
                    <span className="text-white font-bold">{telemetry.sectorsScanned} Blocks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disk score:</span>
                    <span className="text-purple-400 font-bold">{telemetry.storageScore}%</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ANNOTATING SPEED TEXT BAR INPUT */}
        <div className="w-full max-w-xl mt-2 mb-6 font-mono text-[11px] relative z-20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleQueryTriggerAndProcess(manualInputText);
              setManualInputText("");
            }}
            className="flex items-center gap-2 bg-[#040811] border border-slate-800 p-2 rounded-lg hover:border-slate-700/60 transition-colors"
          >
            <input
              type="text"
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Type manual diagnosis prompt directly..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-stone-200 placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isProcessing || !manualInputText.trim()}
              className="bg-neon-cyan/20 hover:bg-neon-cyan/35 text-neon-cyan font-semibold border border-neon-cyan/45 rounded px-4 py-1.5 text-[10px] uppercase transition-all shrink-0 cursor-pointer"
            >
              Inject Code
            </button>
          </form>
        </div>

        {/* 7. METASTABLE GAMIFICATION CHASSIS */}
        <div className="w-full max-w-xl bg-slate-950/65 border border-slate-900 rounded-xl p-4 text-left font-mono mb-4 relative z-10">
          
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3 select-none">
            <span className="text-xs font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-neon-yellow" />
              GAMIFIED METRICS MATRIX
            </span>
            <span className="text-[9px] text-[#FFB200] font-bold">
              DAILY MOOD REPORT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* XP level progressing sliders */}
            <div>
              <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                <span>XP Level Leveling System</span>
                <span className="text-white font-bold">{currentXp}/100 XP</span>
              </div>
              <div className="w-full bg-[#030610] border border-slate-900 h-3 rounded-full overflow-hidden p-[1px]">
                <div 
                  className="bg-linear-to-r from-neon-cyan to-neon-green h-full rounded-full transition-all duration-700"
                  style={{ width: `${currentXp}%` }}
                />
              </div>
              <p className="text-[8px] text-gray-500 mt-1">Optimize thermal throttling parameters to gain fast diagnostics XP!</p>
            </div>

            {/* Achievements matrix */}
            <div>
              <span className="block text-[9px] text-gray-400 pb-1.5 font-bold">Unlocked Core Badges</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "Juice Maximizer", label: "Juice Maximizer 🔋", tip: "Battery cells fully aligned!" },
                  { id: "Cool Device Master", label: "Cool Silicon ❄️", tip: "Cooled temperatures below 50C!" },
                  { id: "Performance Titan", label: "Speed Titan 🚀", tip: "Reclaimed kernel caches successfully!" }
                ].map((badge) => {
                  const isUnlocked = unlockedAchievements.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      title={badge.tip}
                      className={`px-2 py-1 rounded text-[8.5px] font-bold border transition-all ${
                        isUnlocked 
                          ? "bg-neon-yellow/15 border-neon-yellow/40 text-neon-yellow"
                          : "bg-slate-900/35 border-slate-900 text-gray-600 grayscale"
                      }`}
                    >
                      {badge.label}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Daily Status report alert logs */}
          <div className="mt-3.5 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] select-none">
            <span className="text-gray-400">Silicon Mood:</span>
            <span className={`font-black ${moodState.color} uppercase tracking-wider bg-slate-900/40 px-3 py-1 border border-slate-800 rounded`}>
              [{moodState.label}] {moodState.text}
            </span>
          </div>

        </div>

      </div>

      {/* 8. EXPANDABLE RADIAL SYSTEM OVERRIDES DOCK */}
      <div className="fixed bottom-6 right-6 z-50 font-mono text-xs">
        <div className="relative">
          {radialMenuOpen && (
            <div className="absolute bottom-16 right-0 bg-[#090D17] border border-slate-800 p-3.5 rounded-xl shadow-[0_12px_35px_rgba(0,0,0,0.95)] backdrop-blur-md w-48 space-y-2 text-left">
              <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest border-b border-slate-900 pb-1.5 mb-2">
                📡 Quantum System Overrides
              </span>
              
              <button 
                onClick={() => {
                  setRadialMenuOpen(false);
                  runActiveCoolingMode();
                  playBeep(880, 440, 0.25, "square");
                  setAiResponse("Triggered Sub-zero thermal loop cooldown. Initiating continuous liquid cell gas cycles.");
                }}
                className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900 hover:bg-neon-cyan/20 text-gray-300 hover:text-white transition-all text-[10px]"
              >
                <span>❄️ Force Sub-zero Tech</span>
                <ChevronRight className="w-3 h-3 text-neon-cyan" />
              </button>

              <button 
                onClick={() => {
                  setRadialMenuOpen(false);
                  runActiveRamFlush();
                  playBeep(640, 1280, 0.2, "sine");
                  setAiResponse("Triggered Deep Kernel cache flash. Reclaimed 1.48GB active storage block pipelines.");
                }}
                className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900 hover:bg-neon-green/20 text-gray-300 hover:text-white transition-all text-[10px]"
              >
                <span>⚡ Flash Kernel Cache</span>
                <ChevronRight className="w-3 h-3 text-neon-green" />
              </button>

              <button 
                onClick={() => {
                  setRadialMenuOpen(false);
                  playBeep(440, 440, 0.1, "sine");
                  alert("Live microvoltage diagnostics test initialized successfully on continuous telemetry flow.");
                }}
                className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900 hover:bg-purple-900/40 text-gray-300 hover:text-white transition-all text-[10px]"
              >
                <span>🛰️ Volts Diagnostic Sync</span>
                <ChevronRight className="w-3 h-3 text-purple-400" />
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setRadialMenuOpen(!radialMenuOpen);
              playBeep(radialMenuOpen ? 450 : 680, radialMenuOpen ? 250 : 900, 0.15, "sine");
            }}
            className="w-12 h-12 rounded-full bg-linear-to-b from-neon-cyan to-stone-900 border border-neon-cyan flex items-center justify-center text-white shadow-[0_4px_20px_rgba(0,245,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
            title="System Overrides Panel"
            id="radial-override-toggle"
          >
            <Compass className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-green rounded-full animate-ping" />
          </button>
        </div>
      </div>

      {/* 9. VISUAL DIAGNOSTIC SHARE OVERLAY MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-lg bg-[#070b13] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8 select-text text-left relative"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-green" />
              
              {/* Poster frame for actual visual export representation */}
              <div id="share-card-poster" className="p-6 bg-gradient-to-b from-[#0c1220] via-[#05080f] to-[#04060b] relative overflow-hidden flex flex-col border-b border-slate-900">
                <div className="absolute top-0 right-0 w-36 h-36 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#c084fc]/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Tech scanned grid design */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                {/* Poster Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-neon-cyan/10 border border-neon-cyan/25 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-neon-cyan animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-black tracking-widest text-white leading-none flex items-center gap-1">
                        DEVICEPULSE <span className="text-neon-cyan">AI Core</span>
                      </h4>
                      <span className="text-[8px] font-mono text-neon-purple tracking-widest uppercase">COGNITIVE SYSTEM OVERDRAFT</span>
                    </div>
                  </div>
                  
                  <div className="font-mono text-[8px] text-gray-500 text-right bg-[#03060c] border border-slate-850 px-2 py-1 rounded">
                    SYS_ID: <span className="text-neon-cyan font-bold">PULSE-X-{Math.floor(1000 + Math.random() * 9000)}</span>
                  </div>
                </div>

                {/* Score central display and rating metrics dial */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10 mb-6 bg-slate-950/40 p-4 border border-slate-900 rounded-xl backdrop-blur-sm">
                  <div className="sm:col-span-5 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-900 pb-4 sm:pb-0 sm:pr-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      {/* Outer diagnostic loop circles */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-slate-900" strokeWidth="4" fill="transparent" />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          className="stroke-neon-cyan transition-all duration-1000" 
                          strokeWidth="4" 
                          fill="transparent" 
                          strokeDasharray="251" 
                          strokeDashoffset={251 - (251 * Math.round((telemetry.batteryScore * 0.3) + (telemetry.thermalScore * 0.3) + (telemetry.perfScore * 0.2) + (telemetry.storageScore * 0.2))) / 100} 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-display font-black text-white">
                          {Math.round((telemetry.batteryScore * 0.3) + (telemetry.thermalScore * 0.3) + (telemetry.perfScore * 0.2) + (telemetry.storageScore * 0.2))}
                        </span>
                        <span className="text-[7px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">HEALTH SCORE</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-neon-green" /> Battery Anode</span>
                      <span className="text-neon-green font-bold">{telemetry.batteryScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-neon-orange" /> CPU Thermal</span>
                      <span className="text-neon-orange font-bold">{telemetry.thermalScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-neon-purple" /> Logic Flow</span>
                      <span className="text-neon-purple font-bold">{telemetry.perfScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-blue-400" /> Flash Drive</span>
                      <span className="text-blue-400 font-bold">{telemetry.storageScore}%</span>
                    </div>
                  </div>
                </div>

                {/* AI response quote section on the poster */}
                <div className="bg-[#03060c] border border-slate-900 rounded-xl p-4 font-mono text-xs text-left relative z-10 mb-4">
                  <span className="text-[8px] text-neon-cyan uppercase tracking-widest font-bold block mb-1">AI VERDICT EXPORT</span>
                  <p className="text-[11px] text-gray-300 leading-relaxed italic whitespace-pre-wrap select-all">
                    "{displayedResponse || "Awaiting dynamic diagnostic pipeline..."}"
                  </p>
                </div>

                {/* Visual verification watermark */}
                <div className="flex items-center justify-between font-mono text-[7px] text-gray-550 pt-2 border-t border-slate-900/60 mt-1 relative z-10">
                  <span>TIMESTAMP: {new Date().toISOString()}</span>
                  <span className="text-neon-green flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-neon-green inline text-[8px]" /> VERIFIED SMARTPHONE METADATA
                  </span>
                </div>
              </div>

              {/* Share Interaction Actions Grid */}
              <div className="p-5 space-y-4 bg-[#05080e]">
                <h5 className="text-[10px] font-mono text-gray-450 uppercase tracking-widest font-bold text-center mb-1">
                  📤 CHOOSE SOCIAL PLATFORM CHANNELS
                </h5>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      playBeep(440, 880, 0.15, "sine");
                      // Simulate Copy diagnostic payload
                      navigator.clipboard.writeText(`📲 DevicePulse AI Core Subsystem Report:\n- Overall Health Score: ${Math.round((telemetry.batteryScore * 0.3) + (telemetry.thermalScore * 0.3) + (telemetry.perfScore * 0.2) + (telemetry.storageScore * 0.2))}/100\n- Diagnosis: "${displayedResponse}"\n- Verified by DevicePulse AI Suite!`);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className={`p-3 bg-slate-900 hover:bg-[#0c1220] border ${isCopied ? "border-neon-green" : "border-slate-800 hover:border-slate-700"} rounded-xl font-mono text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer text-gray-250`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neon-green" />
                        <span className="text-neon-green">Copied Status!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neon-cyan" />
                        <span>Copy Diagnostic Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      playBeep(440, 880, 0.15, "sine");
                      // Simulate WhatsApp message trigger
                      const urlText = encodeURIComponent(`📲 DevicePulse AI Core Diagnostic Summary Report:\n- Health Integrity: ${Math.round((telemetry.batteryScore * 0.3) + (telemetry.thermalScore * 0.3) + (telemetry.perfScore * 0.2) + (telemetry.storageScore * 0.2))}/100\n- AI System Diagnosis: "${displayedResponse}"\n- Scan yours now!`);
                      window.open(`https://api.whatsapp.com/send?text=${urlText}`, "_blank");
                    }}
                    className="p-3 bg-slate-900 hover:bg-[#0c1220] border border-slate-800 hover:border-slate-700 rounded-xl font-mono text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer text-gray-250"
                  >
                    <Send className="w-3.5 h-3.5 text-neon-green" />
                    <span>WhatsApp Hub</span>
                  </button>

                  <button
                    onClick={() => {
                      playBeep(440, 880, 0.15, "sine");
                      // Simulate Twitter / X share trigger
                      const urlText = encodeURIComponent(`📲 Diagnostic complete: My Silicon Core Score is ${Math.round((telemetry.batteryScore * 0.3) + (telemetry.thermalScore * 0.3) + (telemetry.perfScore * 0.2) + (telemetry.storageScore * 0.2))}% on #DevicePulseAICore! "${displayedResponse}"`);
                      window.open(`https://twitter.com/intent/tweet?text=${urlText}`, "_blank");
                    }}
                    className="p-3 bg-slate-900 hover:bg-[#0c1220] border border-slate-800 hover:border-slate-700 rounded-xl font-mono text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer col-span-2 text-gray-250"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neon-cyan" />
                    <span>Share on Twitter / X Channels</span>
                  </button>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-900">
                  <button
                    onClick={() => {
                      playBeep(400, 200, 0.15, "sine");
                      setShowShareModal(false);
                    }}
                    className="px-5 py-2 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-gray-400 rounded-lg font-mono text-xs uppercase tracking-widest cursor-pointer transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
