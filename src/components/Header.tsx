import React, { useEffect, useState } from "react";
import { Cpu, Wifi, ShieldCheck, Zap, Server, Award, ArrowRight } from "lucide-react";

interface HeaderProps {
  stressLevel: string;
  isScanning: boolean;
  score: number;
  isPro: boolean;
  subscriptionTier: "FREE" | "PRO" | "ULTRA";
  onUpgrade: () => void;
  onTriggerExit: () => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
}

export default function Header({ 
  stressLevel, 
  isScanning, 
  score, 
  isPro, 
  subscriptionTier, 
  onUpgrade,
  onTriggerExit,
  onToggleNotifications,
  unreadNotificationsCount
}: HeaderProps) {
  const [deviceSpec, setDeviceSpec] = useState({
    cpuCores: "8 Logical Threads",
    platform: "Linux/Android Core",
    latency: "Calculating...",
    connectionType: "Core Node",
  });

  const [aiStatus, setAiStatus] = useState("Checking Engine...");

  useEffect(() => {
    // 1. Core Specs
    if (navigator.hardwareConcurrency) {
      setDeviceSpec(prev => ({
        ...prev,
        cpuCores: `${navigator.hardwareConcurrency} Virtual Cores`
      }));
    }
    
    // 2. Platform Detection
    const ua = navigator.userAgent;
    let platformName = "Unix Core Node";
    if (ua.includes("Android")) platformName = "AOSP Core (Android)";
    else if (ua.includes("iPhone") || ua.includes("iPad")) platformName = "Darwin Core (iOS)";
    else if (ua.includes("Windows")) platformName = "NT Core (Windows)";
    else if (ua.includes("Macintosh")) platformName = "Darwin Core (macOS)";
    else if (ua.includes("Linux")) platformName = "Linux Standard Core";
    
    setDeviceSpec(prev => ({
      ...prev,
      platform: platformName
    }));

    // 3. Network Latency Simulation / Real measurement
    if ((navigator as any).connection) {
      const conn = (navigator as any).connection;
      const type = conn.effectiveType || "4G";
      const rtt = conn.rtt ? `${conn.rtt}ms` : "15ms";
      setDeviceSpec(prev => ({
        ...prev,
        latency: rtt,
        connectionType: `${type.toUpperCase()} Link`
      }));
    } else {
      setDeviceSpec(prev => ({
        ...prev,
        latency: "12ms",
        connectionType: "Fiber Intranet"
      }));
    }

    // Connect to AI Health Status Endpoint
    fetch("/api/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          setAiStatus(data.aiEnabled ? "GEMINI FLASHER ACTIVED" : "OFFLINE COGNITION ACTIVE");
        } else {
          setAiStatus("COGNITIVE OFFLINE");
        }
      })
      .catch(() => {
        setAiStatus("COGNITIVE COOLDOWN");
      });
  }, []);

  return (
    <header className="border-b border-neon-blue/20 bg-[#03070d] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none relative overflow-hidden">
      {/* Laser Sweep Grid line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-80" />

      {/* Brand Icon and Name */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border border-neon-blue rounded-md flex items-center justify-center bg-neon-blue/5 glow-blue">
            <Cpu className="w-5 h-5 text-neon-blue animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-cyber-bg flex items-center justify-center animate-ping" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-cyber-bg" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-wider text-white">
            DEVICEPULSE <span className="text-neon-blue">AI</span>
          </h1>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue inline-block animate-pulse" />
            Phone Health & Repair Marketplace Network
          </p>
        </div>
      </div>

      {/* Real Hardware Spec Badges */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-300 w-full md:w-auto">
        {/* Core specs node */}
        <div className="bg-cyber-card/70 border border-neon-blue/10 px-3 py-1.5 rounded flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-neon-blue" />
          <div>
            <span className="text-gray-500 uppercase block text-[8px]">Processor Architecture</span>
            <span className="text-white font-medium">{deviceSpec.cpuCores} ({deviceSpec.platform})</span>
          </div>
        </div>

        {/* Latency link node */}
        <div className="bg-cyber-card/70 border border-neon-blue/10 px-3 py-1.5 rounded flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-neon-green" />
          <div>
            <span className="text-gray-500 uppercase block text-[8px]">Network Ping</span>
            <span className="text-neon-green font-medium">{deviceSpec.connectionType} ({deviceSpec.latency})</span>
          </div>
        </div>

        {/* AI core logic status */}
        <div className={`border px-3 py-1.5 rounded flex items-center gap-2 ${
          aiStatus.includes("ACTIVE") || aiStatus.includes("ACTIVED")
            ? "border-neon-green/30 bg-neon-green/5 text-neon-green" 
            : "border-neon-yellow/30 bg-neon-yellow/5 text-neon-yellow"
        }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          <div>
            <span className="text-gray-500 uppercase block text-[8px]">Maintenance Engine</span>
            <span className="font-bold tracking-wider text-[10px]">{aiStatus}</span>
          </div>
        </div>

        {/* Subscription Tier Badge */}
        <button
          onClick={onUpgrade}
          className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all group ${
            subscriptionTier === "FREE" 
              ? "border-neon-blue/40 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/20" 
              : subscriptionTier === "PRO"
                ? "border-neon-purple/50 bg-neon-purple/10 text-neon-purple shadow-[0_0_15px_rgba(157,0,255,0.2)]"
                : "border-neon-yellow/50 bg-neon-yellow/10 text-neon-yellow shadow-[0_0_15px_rgba(255,200,0,0.2)]"
          }`}
        >
          <Award className={`w-4 h-4 ${subscriptionTier !== "FREE" ? "animate-bounce" : "group-hover:rotate-12 transition-transform"}`} />
          <div className="text-left">
            <span className="text-gray-500 uppercase block text-[7px] font-black leading-none">Account Status</span>
            <span className="font-black text-xs tracking-tighter uppercase">{subscriptionTier}</span>
          </div>
          {subscriptionTier === "FREE" && <ArrowRight className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />}
        </button>
        {/* Advanced Notifications (Only active for Pro/Ultra) */}
        <button
          onClick={onToggleNotifications}
          className={`relative p-2 rounded-lg border transition-all ${
            subscriptionTier === "FREE"
              ? "border-gray-800 bg-gray-900/50 text-gray-600 opacity-50 cursor-not-allowed" 
              : "border-neon-purple/40 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:scale-105"
          }`}
          title={subscriptionTier === "FREE" ? "Upgrade to access Advanced Network Notifications" : "View Advanced Network Alerts"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {subscriptionTier !== "FREE" && unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-neon-purple items-center justify-center text-[9px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            </span>
          )}
        </button>

        {/* Exit App Button */}
        <button
          onClick={onTriggerExit}
          className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all hover:scale-105"
          title="Exit Application"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
