export interface TelemetryState {
  // Battery status
  batteryScore: number;
  batteryTemp: number;
  chargingState: "Charging" | "Discharging" | "Idle";
  chargeType: "USB Standard" | "Wireless Core" | "SuperVOOC GaN" | "None";
  voltageStability: number; // e.g. 3.7 - 4.4V
  batteryCapacityMAh: number; // e.g. 4500
  chargeCycles: number;

  // Thermal status
  thermalScore: number;
  cpuTemp: number;
  thermalSpikes: number; // Counts over last period
  heatAccumulationIndex: number; // calculation

  // Performance status
  perfScore: number;
  cpuUsage: number;
  ramPressure: number; // RAM usage pct
  lagSpikes: number; // counts
  estimatedFPS: number;

  // Storage status
  storageScore: number;
  storageUsed: number; // capacity used pct
  writeLatency: number; // write milliseconds
  corruptRisk: number; // 0-100 heuristic
  sectorsScanned: number;

  // Global settings
  timestamp: string;
  stressLevel: "Normal" | "Hyper-Load" | "Thermal Stress" | "Battery Fault" | "Optimal Sync";
}

export interface SmartAlert {
  id: string;
  timestamp: string;
  type: "Warning" | "Critical" | "Emergency";
  systemModule: "Battery" | "Thermal" | "Performance" | "Storage" | "AI Predictive";
  title: string;
  desc: string;
  acknowledged: boolean;
}

export interface DiagnosticAction {
  priority: "Critical" | "Warning" | "Optimization";
  systemModule: "Battery" | "Thermal" | "Performance" | "Storage";
  alertTitle: string;
  actionDesc: string;
}

export interface SubsystemReport {
  insight: string;
  lifespanWeeks?: number;
  throttlingIndexPct?: number;
  stabilityRating?: string;
  bootLoopRisk?: string;
}

export interface GeminiDiagnosticReport {
  generalDiagnostics: {
    statusSummary: string;
    overallHealthImpact: string;
    daysToPredictedFailure: string | number;
    failurePrimaryCause: string;
  };
  subsystemDiagnostics: {
    battery: SubsystemReport;
    thermal: SubsystemReport;
    performance: SubsystemReport;
    storage: SubsystemReport;
  };
  actionableList: DiagnosticAction[];
}

export interface TelemetryHistoryPoint {
  day: string; // e.g., "Mon", "Tue"
  healthScore: number;
  batteryScore: number;
  thermalScore: number;
  perfScore: number;
  storageScore: number;
}
