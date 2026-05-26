import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Lock, Smartphone, Eye, Activity, History, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SecurityPrivacyScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [issues, setIssues] = useState([
    { id: 1, type: "malware", severity: "high", title: "Suspicious Payload Detected", desc: "com.android.vending.adware found in cache.", resolved: false },
    { id: 2, type: "privacy", severity: "medium", title: "Microphone Access Active", desc: "2 background apps are keeping mic open.", resolved: false },
    { id: 3, type: "network", severity: "low", title: "Unsecured DNS", desc: "Current network is vulnerable to DNS spoofing.", resolved: false },
  ]);
  const [resolvedCount, setResolvedCount] = useState(0);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setResolvedCount(0);
    setIssues(issues.map(i => ({ ...i, resolved: false })));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          setScanComplete(true);
        }, 500);
      }
      setScanProgress(progress);
    }, 400);
  };

  const resolveIssue = (id: number) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, resolved: true } : issue
    ));
    setResolvedCount(prev => prev + 1);
  };

  const resolveAll = () => {
    setIssues(prev => prev.map(issue => ({ ...issue, resolved: true })));
    setResolvedCount(issues.length);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900/40 to-emerald-900/10 border border-teal-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Cyber Shield</h2>
            <p className="text-xs text-teal-400 uppercase tracking-widest font-mono">Quantum Grade Privacy Scanner</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Deep packet inspection and behavioral analysis to detect malware, unauthorized permissions, and data leaks in real-time.
        </p>
      </div>

      {/* Main Scanner Module */}
      <div className="bg-[#050b14]/90 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_30px_rgba(20,184,166,0.05)]">
        
        {/* Status Display */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="#0a192f" strokeWidth="4" />
              <circle 
                cx="96" cy="96" r="88" 
                fill="none" 
                stroke={isScanning ? "#14b8a6" : scanComplete ? (resolvedCount === issues.length ? "#10b981" : "#f43f5e") : "#3b82f6"} 
                strokeWidth="4" 
                strokeDasharray="552.92" 
                strokeDashoffset={isScanning ? 552.92 - (552.92 * scanProgress) / 100 : (scanComplete ? 0 : 552.92)}
                className="transition-all duration-300 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center ${isScanning ? 'animate-pulse bg-teal-500/10' : scanComplete ? (resolvedCount === issues.length ? 'bg-emerald-500/10' : 'bg-rose-500/10') : 'bg-blue-500/10'}`}>
              {isScanning ? (
                <>
                  <Activity className="w-10 h-10 text-teal-400 mb-2" />
                  <span className="text-2xl font-bold font-mono text-teal-400">{Math.round(scanProgress)}%</span>
                </>
              ) : scanComplete ? (
                <>
                  {resolvedCount === issues.length ? (
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                  ) : (
                    <ShieldAlert className="w-12 h-12 text-rose-400 mb-2" />
                  )}
                  <span className={`text-sm font-bold uppercase tracking-wider ${resolvedCount === issues.length ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {resolvedCount === issues.length ? "Secured" : `${issues.length - resolvedCount} Issues`}
                  </span>
                </>
              ) : (
                <>
                  <Shield className="w-12 h-12 text-blue-400 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Ready</span>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={startScan}
            disabled={isScanning}
            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
              isScanning 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-teal-500 text-teal-950 hover:bg-teal-400 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-105"
            }`}
          >
            {isScanning ? "Scanning System..." : "Initialize Deep Scan"}
          </button>
        </div>

        {/* Results List */}
        <AnimatePresence>
          {scanComplete && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 border-t border-teal-500/10 pt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  Threat Isolation Log
                </h3>
                {resolvedCount < issues.length && (
                  <button 
                    onClick={resolveAll}
                    className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Resolve All
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {issues.map(issue => (
                  <motion.div 
                    layout
                    key={issue.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      issue.resolved 
                        ? 'bg-emerald-950/20 border-emerald-500/20' 
                        : issue.severity === 'high' 
                          ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                          : 'bg-orange-950/30 border-orange-500/40'
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        issue.resolved ? 'bg-emerald-500/10 text-emerald-400' :
                        issue.severity === 'high' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {issue.resolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                           <h4 className={`font-medium ${issue.resolved ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{issue.title}</h4>
                           {!issue.resolved && (
                             <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                               issue.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/20 text-orange-400'
                             }`}>
                               {issue.severity} Risk
                             </span>
                           )}
                         </div>
                         <p className="text-xs text-gray-500 font-mono">{issue.desc}</p>
                      </div>
                    </div>
                    
                    {!issue.resolved && (
                      <button 
                        onClick={() => resolveIssue(issue.id)}
                        className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                          issue.severity === 'high' 
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 hover:bg-rose-500 hover:text-white' 
                            : 'bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white'
                        }`}
                      >
                        Quarantine
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Real-time Monitor Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Eye, title: "Camera/Mic Monitor", status: "Secured", val: "Passive", color: "text-emerald-400" },
          { icon: Lock, title: "Encryption Layer", status: "AES-256", val: "Active", color: "text-blue-400" },
          { icon: Smartphone, title: "App Permissions", status: "Optimal", val: "3 Revoked", color: "text-purple-400" }
        ].map((item, i) => (
          <div key={i} className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
             <div className={`w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center ${item.color}`}>
               <item.icon className="w-5 h-5" />
             </div>
             <div>
               <h4 className="text-xs text-gray-400 uppercase tracking-widest">{item.title}</h4>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-sm font-bold text-gray-200">{item.status}</span>
                 <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[9px] text-gray-400 font-mono">{item.val}</span>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
