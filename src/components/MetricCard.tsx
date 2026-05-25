import React from "react";
import { Battery, Flame, Activity, HardDrive, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { TelemetryState } from "../types";

interface MetricCardProps {
  systemKey: "battery" | "thermal" | "performance" | "storage";
  state: TelemetryState;
  onNavigateTab: () => void;
}

export default function MetricCard({ systemKey, state, onNavigateTab }: MetricCardProps) {
  // Determine color status based on thresholds
  let score = 100;
  let statusColor = "text-neon-green border-neon-green/30 bg-neon-green/5";
  let statusDot = "bg-neon-green";
  let statusLabel = "NOMINAL";
  let icon = <Battery className="w-5 h-5" />;
  let title = "Battery";
  
  // Custom mini charts values (simulated array based on readings)
  let sparkValues: number[] = [];

  if (systemKey === "battery") {
    score = state.batteryScore;
    icon = <Battery className="w-5 h-5 text-neon-blue" />;
    title = "Battery Core Node";
    // Sparks relative to temp / level
    sparkValues = [44, 42, 45, 41, 40, state.voltageStability * 10];
  } else if (systemKey === "thermal") {
    score = state.thermalScore;
    icon = <Flame className="w-5 h-5 text-neon-orange" />;
    title = "Thermal Profiler";
    sparkValues = [35, 38, 42, 40, 41, state.cpuTemp * 0.8];
  } else if (systemKey === "performance") {
    score = state.perfScore;
    icon = <Activity className="w-5 h-5 text-neon-purple" />;
    title = "Logic Flow Stability";
    sparkValues = [14, 25, 12, 18, 11, state.cpuUsage];
  } else if (systemKey === "storage") {
    score = state.storageScore;
    icon = <HardDrive className="w-5 h-5 text-[#398fff]" />;
    title = "Flash Core Blocks";
    sparkValues = [61, 62, 62, 61, 62, state.storageUsed];
  }

  // Scoring assessment
  if (score < 60) {
    statusColor = "text-neon-red border-neon-red/30 bg-neon-red/5 glow-red";
    statusDot = "bg-neon-red";
    statusLabel = "CRITICAL DEGRADATION";
  } else if (score < 85) {
    statusColor = "text-neon-yellow border-neon-yellow/30 bg-neon-yellow/5 glow-yellow";
    statusDot = "bg-neon-yellow";
    statusLabel = "ELEVATED RISK";
  }

  return (
    <div className="bg-[#081120]/80 border border-slate-700/50 hover:border-neon-blue/40 rounded-xl p-5 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between select-none">
      {/* Dynamic tech status label */}
      <div className="absolute top-0 right-0 py-1 px-3 border-l border-b border-slate-700 font-mono text-[8px] tracking-widest text-[#00f0ff]/70 bg-[#040811]">
        SEC_NODE: {systemKey.toUpperCase()}_01
      </div>

      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 border border-slate-700 rounded bg-[#03070d]/60 flex items-center justify-center relative">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 block">HW SUB SYSTEM</span>
            <span className="text-sm font-display font-medium text-white group-hover:text-neon-blue transition-colors">
              {title}
            </span>
          </div>
        </div>

        {/* Health Score Progress Circle */}
        <div className="flex items-center gap-5 my-3 bg-[#03070d]/30 border border-slate-700/20 p-3.5 rounded-lg">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-[#101e33]"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className={`transition-all duration-500 ${
                  score < 60 ? "stroke-neon-red" : score < 85 ? "stroke-neon-yellow" : "stroke-neon-blue"
                }`}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="150"
                strokeDashoffset={150 - (150 * score) / 100}
              />
            </svg>
            <div className="absolute font-mono text-sm font-bold text-white">
              {score}%
            </div>
          </div>
          
          <div>
            <div className={`px-2 py-0.5 rounded border text-[8px] font-mono font-bold tracking-wider inline-flex items-center gap-1 ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot} animate-pulse`} />
              {statusLabel}
            </div>
            <p className="text-gray-400 font-mono text-[11px] mt-1.5">
              {systemKey === "battery" && `Degradation Index: ${100 - score}%`}
              {systemKey === "thermal" && `Radiation Drift: ${state.heatAccumulationIndex.toFixed(1)} Wh`}
              {systemKey === "performance" && `Load Allocation: ${state.cpuUsage}% CPU`}
              {systemKey === "storage" && `SSD Read/Write: ${state.writeLatency} ms`}
            </p>
          </div>
        </div>

        {/* System Specific Telemetry Parameters */}
        <div className="mt-4 space-y-2.5 font-mono text-xs text-gray-300">
          {systemKey === "battery" && (
            <>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Core Temp</span>
                <span className={state.batteryTemp > 40 ? "text-neon-orange" : "text-white"}>{state.batteryTemp.toFixed(1)} °C</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Fast-Charging Link</span>
                <span className="text-white font-medium">{state.chargingState} {state.chargeType !== "None" && `(${state.chargeType})`}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Cell Voltage Levels</span>
                <span className="text-neon-blue font-semibold">{state.voltageStability.toFixed(2)} Volts</span>
              </div>
            </>
          )}

          {systemKey === "thermal" && (
            <>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Cores Real Temp</span>
                <span className={state.cpuTemp > 75 ? "text-neon-red font-bold" : "text-white"}>{state.cpuTemp.toFixed(1)} °C</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Governor Throttle</span>
                <span className="text-neon-blue font-medium">{state.cpuTemp > 65 ? "25% ACTIVE" : "STABLE IDLE"}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Minute Thermal spikes</span>
                <span className="text-white font-semibold">{state.thermalSpikes} Scored</span>
              </div>
            </>
          )}

          {systemKey === "performance" && (
            <>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Active RAM Occupancy</span>
                <span className="text-white">{state.ramPressure}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Dispatch lag events</span>
                <span className={state.lagSpikes > 5 ? "text-neon-red animate-pulse font-bold" : "text-white"}>{state.lagSpikes} events/m</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Frame Dispatch Integrity</span>
                <span className="text-neon-blue font-semibold">{state.estimatedFPS} FPS Mean</span>
              </div>
            </>
          )}

          {systemKey === "storage" && (
            <>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">SSD Storage Allocated</span>
                <span className="text-white">{state.storageUsed}% of 256GB</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-gray-500">Bad Sectors Heuristic</span>
                <span className={state.corruptRisk > 10 ? "text-neon-yellow" : "text-white"}>{state.corruptRisk}% Block Risk</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Boot-loop Risk probability</span>
                <span className={`font-semibold ${
                  state.corruptRisk > 20 || state.writeLatency > 150 ? "text-neon-red animate-pulse" : "text-neon-green"
                }`}>
                  {state.corruptRisk > 25 ? "ELEVATED" : state.corruptRisk > 10 ? "MED" : "SECURE"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation action / Micro-chart */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        {/* Dynamic Micro sparkline SVG */}
        <div className="h-6 w-24 flex items-end">
          <svg className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkValues
                .map((val, idx) => `${(idx / (sparkValues.length - 1)) * 96},${24 - Math.max(2, Math.min(22, (val / 100) * 18))}`)
                .join(" ")}
              className="stroke-neon-blue drop-shadow-[0_0_3px_#00f0ff]"
            />
          </svg>
        </div>

        <button
          onClick={onNavigateTab}
          className="text-[10px] font-mono text-neon-blue hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all"
        >
          ANALYZE BLOCK &rarr;
        </button>
      </div>
    </div>
  );
}
