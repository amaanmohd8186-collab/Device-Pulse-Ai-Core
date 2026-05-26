import React, { useState } from "react";
import { Trash2, Cpu, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, Waves, FileArchive, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AppCleanerScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [cleanComplete, setCleanComplete] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [junkAmount, setJunkAmount] = useState(0);

  const startScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setCleanComplete(false);
    setProgress(0);
    setJunkAmount(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 12;
      setProgress(currentProgress);
      
      const currentJunk = (currentProgress / 100) * 2.4; // up to 2.4 GB
      setJunkAmount(currentJunk);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setJunkAmount(2.47);
        setTimeout(() => {
          setIsScanning(false);
          setScanComplete(true);
        }, 500);
      }
    }, 300);
  };

  const startClean = () => {
    setIsCleaning(true);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20;
      setProgress(currentProgress);
      
      const currentJunk = 2.47 - ((currentProgress / 100) * 2.47);
      setJunkAmount(Math.max(0, currentJunk));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setJunkAmount(0);
        setTimeout(() => {
          setIsCleaning(false);
          setScanComplete(false);
          setCleanComplete(true);
        }, 500);
      }
    }, 250);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-900/40 to-pink-900/10 border border-fuchsia-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-400 shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Deep System Purge</h2>
            <p className="text-xs text-fuchsia-400 uppercase tracking-widest font-mono">Residual File Cleaner</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Eradicate ghost caches, dormant application fragments, and tracking residue to optimize flash storage and memory cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visualizer */}
        <div className="bg-[#050b14]/90 border border-fuchsia-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative shadow-[0_8px_30px_rgba(217,70,239,0.05)]">
          <div className="relative mb-6">
             <div className={`w-40 h-40 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-700 ${
               cleanComplete 
                 ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-500/5' 
                 : scanComplete
                   ? 'border-fuchsia-500 shadow-[0_0_40px_rgba(217,70,239,0.3)] bg-fuchsia-500/10'
                   : 'border-slate-800 bg-[#050b14]'
             }`}>
               
               {isScanning || isCleaning ? (
                 <>
                   <Waves className={`w-12 h-12 mb-2 ${isCleaning ? 'text-emerald-400 animate-bounce' : 'text-fuchsia-400 animate-pulse'}`} />
                   <span className={`text-xl font-bold font-mono ${isCleaning ? 'text-emerald-400' : 'text-fuchsia-400'}`}>
                     {Math.round(progress)}%
                   </span>
                 </>
               ) : cleanComplete ? (
                 <>
                   <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                   <span className="text-xs font-bold uppercase text-emerald-400 tracking-widest">Optimized</span>
                 </>
               ) : (
                 <>
                   <div className="text-3xl font-bold text-white font-mono">{junkAmount.toFixed(2)}</div>
                   <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">GB Junk</span>
                 </>
               )}
               
             </div>

             {/* Ring animations */}
             {(isScanning || isCleaning) && (
               <div className="absolute inset-0 rounded-full border-2 border-t-fuchsia-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: isScanning ? '1s' : '0.5s' }} />
             )}
          </div>
          
          <h3 className="text-lg font-display text-white mb-2">
            {isScanning ? "Scanning Matrix..." : isCleaning ? "Purging Files..." : cleanComplete ? "System Clean" : scanComplete ? "Junk Found" : "System Analysis Ready"}
          </h3>
          <p className="text-xs text-gray-500 font-mono mb-8 max-w-[200px] leading-relaxed">
            {scanComplete ? `${junkAmount.toFixed(2)} GB of temporary cache and obsolete APK files detected.` : cleanComplete ? `Removed 2.47 GB of unnecessary bloat.` : "Scan internal storage for hidden residual fragments."}
          </p>

          {!scanComplete && !cleanComplete && !isScanning && (
            <button 
              onClick={startScan}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all border border-gray-700 focus:outline-none"
            >
              Analyze Storage
            </button>
          )}

          {scanComplete && !isCleaning && (
            <button 
              onClick={startClean}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm bg-fuchsia-600 text-white hover:bg-fuchsia-500 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all animate-pulse focus:outline-none"
            >
              Purge {junkAmount.toFixed(2)} GB
            </button>
          )}

          {cleanComplete && (
            <button 
              onClick={startScan}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all focus:outline-none"
            >
              Rescan System
            </button>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-5 mb-2">
             <div className="flex justify-between items-end mb-4">
               <div>
                 <h4 className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                   <HardDrive className="w-4 h-4 text-gray-400" />
                   Storage Impact
                 </h4>
                 <div className="text-2xl font-bold font-mono text-white">42.2<span className="text-sm text-gray-500"> / 128 GB</span></div>
               </div>
               <div className="text-right">
                 <div className="text-xs text-emerald-400 font-mono tracking-widest">FREE SPACE</div>
                 <div className="text-xl font-bold text-emerald-400">85.8 GB</div>
               </div>
             </div>
             <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
               <div className={`h-full bg-blue-500 transition-all duration-1000 ${cleanComplete ? 'w-[30%]' : 'w-[30%]'}`} />
               <div className={`h-full bg-orange-500 transition-all duration-1000 ${cleanComplete ? 'w-[5%]' : 'w-[5%]'}`} />
               <div className={`h-full bg-fuchsia-500 transition-all duration-1000 ${cleanComplete ? 'w-[0%]' : 'w-[10%]'}`} />
             </div>
          </div>

          <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/30">
               <h4 className="text-xs text-gray-400 uppercase tracking-widest">Fragment Breakdown</h4>
            </div>
            <div className="divide-y divide-slate-800/50">
               {[
                 { name: "App Cache", size: "1.2 GB", icon: FileArchive, color: "text-blue-400", bg: "bg-blue-400/10" },
                 { name: "Obsolete APKs", size: "0.85 GB", icon: FileArchive, color: "text-orange-400", bg: "bg-orange-400/10" },
                 { name: "System Traces", size: "0.42 GB", icon: Cpu, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10" }
               ].map((item, i) => (
                 <div key={i} className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} ${item.color}`}>
                       <item.icon className="w-4 h-4" />
                     </div>
                     <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                   </div>
                   <span className="text-xs font-mono text-gray-400">{cleanComplete ? '0.00 GB' : item.size}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
