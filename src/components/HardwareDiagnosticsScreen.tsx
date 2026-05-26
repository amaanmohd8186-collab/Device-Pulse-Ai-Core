import React, { useState, useEffect } from "react";
import { Monitor, Vibrate, MousePointerClick, Volume2, CheckCircle2, RotateCcw, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function HardwareDiagnosticsScreen() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, "pending" | "running" | "passed" | "failed">>({
    touch: "pending",
    haptics: "pending",
    sensors: "pending",
    audio: "pending"
  });

  const [touchedZones, setTouchedZones] = useState<number[]>([]);

  const startTest = (id: string) => {
    setActiveTest(id);
    setTestStatus(prev => ({ ...prev, [id]: "running" }));
    
    if (id !== "touch") { // touch needs manual interaction
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [id]: "passed" }));
        setActiveTest(null);
      }, 3000);
    } else {
      setTouchedZones([]);
    }
  };

  const handleTouchZone = (index: number) => {
    if (activeTest === "touch" && !touchedZones.includes(index)) {
      const newZones = [...touchedZones, index];
      setTouchedZones(newZones);
      if (newZones.length === 12) {
        setTestStatus(prev => ({ ...prev, touch: "passed" }));
        setTimeout(() => setActiveTest(null), 1000);
      }
    }
  };

  const cancelTest = () => {
    if (activeTest) {
      setTestStatus(prev => ({ ...prev, [activeTest]: "pending" }));
      setActiveTest(null);
    }
  };

  const tests = [
    { id: "touch", title: "Touch Digitizer", icon: MousePointerClick, desc: "Map screen for dead zones", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
    { id: "haptics", title: "Haptic Actuator", icon: Vibrate, desc: "Test vibration motor rhythm", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
    { id: "sensors", title: "Gyro/Accel", icon: Activity, desc: "Verify spatial orientation axis", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
    { id: "audio", title: "Audio Drivers", icon: Volume2, desc: "Run frequency band sweeps", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/10 border border-orange-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Hardware Matrix</h2>
            <p className="text-xs text-orange-400 uppercase tracking-widest font-mono">Sensors & Components</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Verify physical integrity. Run interactive diagnostics on touch screen digitizers, haptic feedback actuators, spatial sensors, and audio drivers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(test => (
          <div key={test.id} className="bg-[#050b14]/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
            {testStatus[test.id] === "running" && activeTest === test.id && (
              <div className={`absolute inset-0 ${test.bg} animate-pulse pointer-events-none opacity-20`} />
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${test.bg} ${test.border} border ${test.color}`}>
                <test.icon className="w-5 h-5" />
              </div>
              
              <div className="text-right">
                <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${
                  testStatus[test.id] === "passed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  testStatus[test.id] === "running" ? `${test.bg} ${test.color} animate-pulse` :
                  "bg-slate-800 text-gray-500"
                }`}>
                  {testStatus[test.id]}
                </span>
              </div>
            </div>

            <h3 className="text-white font-medium mb-1">{test.title}</h3>
            <p className="text-xs text-gray-500 mb-6">{test.desc}</p>

            {/* Test Interactive Area */}
            <AnimatePresence mode="wait">
              {activeTest === test.id && test.id === "touch" ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="grid grid-cols-4 gap-1 h-32 mb-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 p-1 cursor-crosshair">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i} 
                        onPointerDown={() => handleTouchZone(i)}
                        onPointerEnter={(e) => { if (e.buttons === 1) handleTouchZone(i); }}
                        className={`rounded-md transition-colors duration-300 ${touchedZones.includes(i) ? 'bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : activeTest === test.id ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="h-16 mb-4 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                  {test.id === "haptics" && <div className="flex gap-1 items-center justify-center w-full"><div className="w-2 h-8 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/><div className="w-2 h-12 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '100ms'}}/><div className="w-2 h-8 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}/></div>}
                  {test.id === "sensors" && <RotateCcw className="w-8 h-8 text-emerald-500 animate-spin" />}
                  {test.id === "audio" && <div className="flex gap-1 h-8 items-center overflow-hidden px-4">{Array.from({length: 20}).map((_, i) => <div key={i} className="w-1 bg-orange-500 rounded-full animate-pulse" style={{height: `${Math.random() * 100}%`, animationDelay: `${i * 50}ms`}}/>)}</div>}
                </motion.div>
              ) : testStatus[test.id] === "passed" ? (
                 <div className="h-4 mb-4 flex items-center justify-start gap-2">
                   <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                   <span className="text-xs text-emerald-400 font-mono">Hardware Verified</span>
                 </div>
              ) : <div className="h-4 mb-4" />}
            </AnimatePresence>

            <div className="flex gap-2">
              <button 
                onClick={() => startTest(test.id)}
                disabled={activeTest !== null && activeTest !== test.id}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  testStatus[test.id] === "running" ? `${test.bg} ${test.color} border border-transparent` :
                  testStatus[test.id] === "passed" ? "bg-slate-800 text-gray-300 hover:bg-slate-700" :
                  `bg-slate-800 text-white hover:bg-slate-700 hover:text-white`
                } ${activeTest !== null && activeTest !== test.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {testStatus[test.id] === "running" ? "Testing..." : testStatus[test.id] === "passed" ? "Retest" : "Run Test"}
              </button>
              {activeTest === test.id && (
                <button onClick={cancelTest} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
