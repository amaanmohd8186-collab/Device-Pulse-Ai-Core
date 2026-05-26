import React, { useState } from "react";
import { BatteryWarning, Cpu, Ghost, Search, PlayCircle, StopCircle, ShieldAlert, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function PhantomDrainTrackerScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  
  const [apps, setApps] = useState([
    { id: 1, name: "Social Connector", process: "com.social.sync", drain: "3.2%", severity: "high", reason: "Wakelock (High CPU Wakeup)", hidden: true, restricted: false },
    { id: 2, name: "Weather Widget", process: "app.weather.gps", drain: "1.8%", severity: "medium", reason: "Constant Location Polling", hidden: false, restricted: false },
    { id: 3, name: "News Reader", process: "org.news.bg", drain: "0.9%", severity: "low", reason: "Background Sync", hidden: true, restricted: false },
  ]);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 2000);
  };

  const toggleRestrict = (id: number) => {
    setApps(apps.map(app => app.id === id ? { ...app, restricted: !app.restricted, drain: app.restricted ? app.drain : "0.0%" } : app));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/40 to-pink-900/10 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Ghost className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Phantom Drain Tracker</h2>
            <p className="text-xs text-red-400 uppercase tracking-widest font-mono">App Permission & Battery Analysis</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Expose hidden background services that silently wake up the CPU, consume excessive battery profiles, and access sensative hardware without explicit foreground permission.
        </p>
      </div>

      <div className="bg-[#050b14]/90 border border-slate-800 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Runtime Analysis
            </h3>
            <button 
              onClick={startScan}
              disabled={isScanning}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
                isScanning ? 'bg-red-500/20 text-red-400 pointer-events-none border border-transparent' : 'bg-red-600 text-white hover:bg-red-500 shadow-lg'
              }`}
            >
              {isScanning ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deep Scanning...</>
              ) : (
                <><PlayCircle className="w-3.5 h-3.5" /> Run Diagnostics</>
              )}
            </button>
         </div>

         {!hasScanned && !isScanning && (
           <div className="py-16 text-center">
             <BatteryWarning className="w-16 h-16 text-slate-700 mx-auto mb-4" />
             <p className="text-gray-400 font-mono text-sm">System standing by. Initiate scan to reveal anomalous battery drains.</p>
           </div>
         )}

         {isScanning && (
            <div className="py-16 flex justify-center items-center">
              <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
         )}

         {hasScanned && !isScanning && (
           <div className="space-y-4">
             {apps.map(app => (
               <motion.div 
                 key={app.id}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                   app.restricted ? 'bg-slate-900/50 border-slate-800 opacity-60' :
                   app.severity === 'high' ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                   app.severity === 'medium' ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900 border-slate-800'
                 }`}
               >
                 <div className="flex gap-4 items-start">
                   <div className={`p-2.5 rounded-lg shrink-0 mt-1 ${
                     app.restricted ? 'bg-slate-800 text-slate-500' :
                     app.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                     app.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-gray-400'
                   }`}>
                     <Cpu className="w-5 h-5" />
                   </div>
                   
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-semibold text-white">{app.name}</h4>
                       {app.hidden && !app.restricted && <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold"><Ghost className="w-3 h-3"/> Ghost Process</span>}
                     </div>
                     <p className="text-xs text-gray-500 font-mono mb-2">{app.process}</p>
                     
                     {!app.restricted && (
                       <div className="flex flex-wrap gap-2">
                         <span className={`text-[10px] font-mono flex items-center gap-1 px-2 py-1 rounded bg-slate-950 border ${
                           app.severity === 'high' ? 'text-red-400 border-red-500/20' : 'text-amber-500 border-amber-500/20'
                         }`}>
                           <Zap className="w-3 h-3" /> Drain: {app.drain}/hr
                         </span>
                         <span className="text-[10px] font-mono flex items-center gap-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-gray-400">
                           <ShieldAlert className="w-3 h-3" /> {app.reason}
                         </span>
                       </div>
                     )}
                     {app.restricted && <p className="text-xs text-emerald-500 font-mono flex items-center gap-1"><StopCircle className="w-3 h-3"/> Background Execution Blocked. Zero Drain.</p>}
                   </div>
                 </div>

                 <button
                   onClick={() => toggleRestrict(app.id)}
                   className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                     app.restricted 
                       ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30' 
                       : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30'
                   }`}
                 >
                   {app.restricted ? 'Enable App' : 'Kill Background Activity'}
                 </button>
               </motion.div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}

// simple helper component added to make above work
function RefreshCw(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
}
