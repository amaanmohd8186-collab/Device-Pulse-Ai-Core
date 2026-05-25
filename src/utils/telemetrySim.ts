import { TelemetryState, SmartAlert, TelemetryHistoryPoint } from "../types";

export const DEFAULT_TELEMETRY: TelemetryState = {
  batteryScore: 94,
  batteryTemp: 34.2,
  chargingState: "Charging",
  chargeType: "Wireless Core",
  voltageStability: 4.12,
  batteryCapacityMAh: 4800,
  chargeCycles: 142,

  thermalScore: 88,
  cpuTemp: 41.5,
  thermalSpikes: 2,
  heatAccumulationIndex: 31.4,

  perfScore: 92,
  cpuUsage: 18,
  ramPressure: 45,
  lagSpikes: 0,
  estimatedFPS: 60,

  storageScore: 96,
  storageUsed: 62.4,
  writeLatency: 12.8,
  corruptRisk: 2,
  sectorsScanned: 180240,

  timestamp: new Date().toISOString(),
  stressLevel: "Normal",
};

export function calculateWeightedHealthScore(state: TelemetryState): number {
  // Weighted sum as requested by instructions:
  // Battery: 30%, Thermal: 30%, Performance: 20%, Storage: 20%
  const score = Math.round(
    state.batteryScore * 0.3 +
    state.thermalScore * 0.3 +
    state.perfScore * 0.2 +
    state.storageScore * 0.2
  );
  return Math.max(0, Math.min(100, score));
}

/**
 * Attempts to enrich simulation data with real browser telemetry where permitted by security sandbox.
 */
export async function getRealBrowserTelemetry(currentState: TelemetryState): Promise<Partial<TelemetryState>> {
  const updates: Partial<TelemetryState> = {};

  try {
    // 1. Battery Data (Real API)
    if ("getBattery" in navigator) {
      const battery: any = await (navigator as any).getBattery();
      updates.batteryScore = Math.floor(battery.level * 100);
      updates.chargingState = battery.charging ? "Charging" : "Discharging";
      // We simulate temperature based on charging state if real temp is unavailable
      if (battery.charging) {
        updates.batteryTemp = 36.5 + Math.random() * 2;
      } else {
        updates.batteryTemp = 31.0 + Math.random() * 3;
      }
    }

    // 2. Storage Data (Real API)
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        updates.storageUsed = Math.min(100, Math.round((estimate.usage / estimate.quota) * 1000) / 10);
        updates.storageScore = Math.max(50, 100 - (updates.storageUsed * 0.2));
      }
    }

    // 3. Performance / Memory (Non-standard Chrome API)
    const perf: any = window.performance;
    if (perf && perf.memory) {
      const used = perf.memory.usedJSHeapSize;
      const total = perf.memory.jsHeapSizeLimit;
      updates.ramPressure = Math.round((used / total) * 100);
      updates.perfScore = Math.max(40, 100 - (updates.ramPressure * 0.6));
    }

    // 4. CPU Concurrency (Informative)
    // No direct CPU temp in browser, so we simulate based on concurrency and load
    const cores = navigator.hardwareConcurrency || 4;
    updates.cpuUsage = Math.min(95, 10 + Math.random() * 30);
    updates.cpuTemp = 35 + (updates.cpuUsage * 0.5);

  } catch (err) {
    console.error("Failed to capture deep hardware signals:", err);
  }

  return updates;
}

// Custom simulated 7-day medical/engineering telemetry history
export function generateHistoryPoints(currentScore: number): TelemetryHistoryPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, idx) => {
    // Generate slight variations trending down or stable depending on index
    const dev = (idx - 6) * 0.8; // subtle curve
    return {
      day,
      healthScore: Math.round(Math.min(100, Math.max(0, currentScore + dev + Math.sin(idx) * 2))),
      batteryScore: Math.round(Math.min(100, Math.max(0, currentScore * 0.98 + dev * 0.5 + Math.cos(idx)))),
      thermalScore: Math.round(Math.min(100, Math.max(0, currentScore * 1.02 - Math.sin(idx) * 4))),
      perfScore: Math.round(Math.min(100, Math.max(0, currentScore * 0.95 + Math.sin(idx) * 3))),
      storageScore: Math.round(Math.min(100, Math.max(0, currentScore * 1.01 - idx * 0.2))),
    };
  });
}

// Generate smart alerts based on statistical levels (Rule-Based Engine)
export function scanTelemetryForRuleAlerts(state: TelemetryState): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const timestamp = new Date().toLocaleTimeString();

  // Battery checks
  if (state.batteryTemp > 45) {
    alerts.push({
      id: "b-temp-critical",
      timestamp,
      type: "Critical",
      systemModule: "Battery",
      title: "Battery Thermal Overrun",
      desc: `Battery core temperature is dangerous at ${state.batteryTemp}°C. Chemical expansion node risk elevated.`,
      acknowledged: false,
    });
  } else if (state.batteryTemp > 39) {
    alerts.push({
      id: "b-temp-warning",
      timestamp,
      type: "Warning",
      systemModule: "Battery",
      title: "High Charger Discharging Heat",
      desc: `Battery cell operating outside normal range at ${state.batteryTemp}°C. Degradation cycle rate quadrupled.`,
      acknowledged: false,
    });
  }

  if (state.voltageStability < 3.5 || state.voltageStability > 4.4) {
    alerts.push({
      id: "b-volt-emergency",
      timestamp,
      type: "Emergency",
      systemModule: "Battery",
      title: "Cell Voltage Impairment",
      desc: `Unstable anode voltage detected (${state.voltageStability}V). Immediate risk of unpredictable shutdown.`,
      acknowledged: false,
    });
  }

  // Thermal checks
  if (state.cpuTemp > 85) {
    alerts.push({
      id: "t-cpu-emergency",
      timestamp,
      type: "Emergency",
      systemModule: "Thermal",
      title: "Silicon Core Thermal Leakage",
      desc: `CPU junction temperature is critical at ${state.cpuTemp}°C. Critical hardware throttling override is active.`,
      acknowledged: false,
    });
  } else if (state.cpuTemp > 70) {
    alerts.push({
      id: "t-cpu-critical",
      timestamp,
      type: "Critical",
      systemModule: "Thermal",
      title: "Subsystem Throttling Engage",
      desc: `High CPU core heat (${state.cpuTemp}°C) inducing performance governor rollbacks. Hot apps list warning flag set.`,
      acknowledged: false,
    });
  }

  // Performance Checks
  if (state.ramPressure > 90) {
    alerts.push({
      id: "p-ram-critical",
      timestamp,
      type: "Critical",
      systemModule: "Performance",
      title: "Extreme Swap Pressure",
      desc: `Physical RAM occupancy is at ${state.ramPressure}%. Immediate risk of OOM daemon task eviction.`,
      acknowledged: false,
    });
  }

  if (state.lagSpikes > 8) {
    alerts.push({
      id: "p-lag-warning",
      timestamp,
      type: "Warning",
      systemModule: "Performance",
      title: "Frame Dispatch Lag",
      desc: `Suboptimal frame dispatch noticed with ${state.lagSpikes} hardware lag failures in current window.`,
      acknowledged: false,
    });
  }

  // Storage checks
  if (state.corruptRisk > 20) {
    alerts.push({
      id: "s-corruption-critical",
      timestamp,
      type: "Critical",
      systemModule: "Storage",
      title: "Sector Integrity Deterioration",
      desc: `Bad block heuristic scan found ${state.corruptRisk}% corrupt index risk. Solid state SSD cell wear is high.`,
      acknowledged: false,
    });
  }
  
  if (state.writeLatency > 150) {
    alerts.push({
      id: "s-latency-warning",
      timestamp,
      type: "Warning",
      systemModule: "Storage",
      title: "Write Stall Spike",
      desc: `Mean write controller response is slow at ${state.writeLatency}ms. Boot-loop index risk multiplier: 3x.`,
      acknowledged: false,
    });
  }

  return alerts;
}

// Preset Telemetry Configurations for simulation scenarios
export const PRESETS: Record<string, Partial<TelemetryState>> = {
  Normal: {
    batteryScore: 94,
    batteryTemp: 32.5,
    chargingState: "Charging",
    chargeType: "Wireless Core",
    voltageStability: 4.15,
    cpuTemp: 38.2,
    thermalScore: 95,
    thermalSpikes: 1,
    perfScore: 94,
    cpuUsage: 12,
    ramPressure: 42,
    lagSpikes: 0,
    storageScore: 97,
    writeLatency: 11.2,
    corruptRisk: 1,
    stressLevel: "Normal"
  },
  "Hyper-Load": {
    batteryScore: 82,
    batteryTemp: 41.8,
    chargingState: "Discharging",
    chargeType: "None",
    voltageStability: 3.82,
    cpuTemp: 78.4,
    thermalScore: 64,
    thermalSpikes: 14,
    perfScore: 58,
    cpuUsage: 94,
    ramPressure: 88,
    lagSpikes: 12,
    storageScore: 88,
    writeLatency: 48.5,
    corruptRisk: 4,
    stressLevel: "Hyper-Load"
  },
  "Thermal Stress": {
    batteryScore: 71,
    batteryTemp: 48.2,
    chargingState: "Charging",
    chargeType: "SuperVOOC GaN",
    voltageStability: 4.38,
    cpuTemp: 89.2,
    thermalScore: 24,
    thermalSpikes: 28,
    perfScore: 42,
    cpuUsage: 88,
    ramPressure: 72,
    lagSpikes: 18,
    storageScore: 92,
    writeLatency: 28.1,
    corruptRisk: 3,
    stressLevel: "Thermal Stress"
  },
  "Battery Fault": {
    batteryScore: 48,
    batteryTemp: 43.5,
    chargingState: "Discharging",
    chargeType: "None",
    voltageStability: 3.42,
    cpuTemp: 42.1,
    thermalScore: 78,
    thermalSpikes: 3,
    perfScore: 82,
    cpuUsage: 25,
    ramPressure: 55,
    lagSpikes: 1,
    storageScore: 94,
    writeLatency: 14.5,
    corruptRisk: 2,
    stressLevel: "Battery Fault"
  },
  "Optimal Sync": {
    batteryScore: 100,
    batteryTemp: 28.5,
    chargingState: "Idle",
    chargeType: "None",
    voltageStability: 4.20,
    cpuTemp: 31.2,
    thermalScore: 100,
    thermalSpikes: 0,
    perfScore: 98,
    cpuUsage: 4,
    ramPressure: 28,
    lagSpikes: 0,
    storageScore: 99,
    writeLatency: 8.4,
    corruptRisk: 0,
    stressLevel: "Optimal Sync"
  }
};
