import React, { useState } from "react";
import { Cloud, CloudUpload, HardDrive, RefreshCw, CheckCircle2, History, Shield, Smartphone, FileArchive } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function DataBackupScreen() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [lastBackup, setLastBackup] = useState("3 Days Ago");

  const filesToBackup = [
    "encryption_keys.dat",
    "contact_registry.db",
    "media_manifest_v2.json",
    "system_prefs.xml",
    "auth_tokens.aes",
    "app_data_sandbox.tar.gz"
  ];

  const startBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    let progress = 0;
    const totalFiles = filesToBackup.length;
    let fileIndex = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 8;
      
      if (progress >= (fileIndex + 1) * (100 / totalFiles) && fileIndex < totalFiles) {
        setCurrentFile(filesToBackup[fileIndex]);
        fileIndex++;
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsBackingUp(false);
          setLastBackup("Just Now");
          setCurrentFile("Sync Complete");
        }, 800);
      }
      setBackupProgress(progress);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/10 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Cloud Sync Protocol</h2>
            <p className="text-xs text-blue-400 uppercase tracking-widest font-mono">End-to-End Encrypted Storage</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Create secure, encrypted snapshots of your device state, contacts, and operational data directly to the decentralized cloud matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Console */}
        <div className="lg:col-span-2 bg-[#050b14]/90 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
          
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
            
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-[#050b14]">
                {isBackingUp ? (
                  <CloudUpload className="w-12 h-12 text-blue-400 animate-bounce" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-blue-500" />
                )}
              </div>
              {/* Progress Ring */}
              {isBackingUp && (
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="64" cy="64" r="62" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="4" 
                    strokeDasharray="389.5" 
                    strokeDashoffset={389.5 - (389.5 * backupProgress) / 100}
                    className="transition-all duration-200 ease-linear"
                  />
                </svg>
              )}
            </div>

            <div className="text-center mb-8 w-full">
               <h3 className="text-2xl font-display font-bold text-white mb-2">
                 {isBackingUp ? `${Math.round(backupProgress)}%` : "System Synced"}
               </h3>
               <div className="h-4 flex items-center justify-center">
                 {isBackingUp ? (
                   <span className="text-xs text-blue-400 font-mono tracking-wider truncate px-4">
                     Uploading: {currentFile || "initializing..."}
                   </span>
                 ) : (
                   <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                     <History className="w-3 h-3" />
                     Last Backup: {lastBackup}
                   </span>
                 )}
               </div>
            </div>

            <button 
              onClick={startBackup}
              disabled={isBackingUp}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                isBackingUp 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              }`}
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing to Cloud...
                </>
              ) : (
                "Initiate Manual Backup"
              )}
            </button>
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              Storage Allocation
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Total Capacity</span>
                  <span className="text-white font-mono">15.0 GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[45%]" />
                </div>
                <div className="flex justify-between text-[10px] mt-1 font-mono text-gray-500">
                  <span>6.75 GB Used</span>
                  <span>Free</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-5 flex-1">
            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              Backup Settings
            </h4>
            
            <div className="space-y-3">
              {[
                { name: "Auto-Sync Daily", active: true },
                { name: "Backup over Wi-Fi Only", active: true },
                { name: "Include Media Files", active: false },
                { name: "AES-256 Encryption", active: true },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={`text-xs ${setting.active ? 'text-gray-300' : 'text-gray-500'}`}>{setting.name}</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${setting.active ? 'bg-blue-500' : 'bg-slate-800'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${setting.active ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
