import React, { useState, useEffect } from "react";
import { Wifi, Activity, Signal, Download, Upload, Network, Radio } from "lucide-react";
import { motion } from "motion/react";

export function NetworkAnalyzerScreen() {
  const [isTesting, setIsTesting] = useState(false);
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [ping, setPing] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0);
  const [testStage, setTestStage] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle");

  const runSpeedTest = () => {
    setIsTesting(true);
    setTestStage("ping");
    setDownload(0);
    setUpload(0);
    setPing(0);
    setPacketLoss(0);

    // Mock ping
    setTimeout(() => {
      setPing(Math.floor(Math.random() * 20) + 8);
      setPacketLoss(Math.random() > 0.8 ? 0.05 : 0);
      setTestStage("download");
      
      // Mock download
      let dl = 0;
      const dlInterval = setInterval(() => {
        dl += Math.random() * 25;
        setDownload(dl);
        if (dl > 150) {
          clearInterval(dlInterval);
          setTestStage("upload");
          
          // Mock upload
          let ul = 0;
          const ulInterval = setInterval(() => {
            ul += Math.random() * 10;
            setUpload(ul);
            if (ul > 45) {
              clearInterval(ulInterval);
              setTestStage("complete");
              setIsTesting(false);
            }
          }, 100);
        }
      }, 100);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900/40 to-blue-900/10 border border-sky-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">Network & Cellular Analyzer</h2>
            <p className="text-xs text-sky-400 uppercase tracking-widest font-mono">Real-time Connection Intelligence</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 max-w-2xl mt-4 leading-relaxed">
          Monitor Wi-Fi spectrum crowding, real-time 5G/LTE signal strength (dBm), packet loss topology, and execution speeds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Signal Strength Widget */}
        <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Signal className="w-4 h-4 text-emerald-400" />
              Signal (Cellular)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">5G NS</span>
          </div>
          
          <div className="flex items-end justify-between">
            <div className="flex gap-1 items-end h-16">
              {[1, 2, 3, 4, 5].map((bars, i) => (
                <div key={i} className={`w-3 rounded-t-sm transition-all duration-1000 bg-emerald-400 ${i === 4 ? 'opacity-30' : 'opacity-100 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} style={{ height: `${(i + 1) * 20}%` }} />
              ))}
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-white">-78</div>
              <div className="text-xs text-emerald-400 font-mono tracking-widest uppercase">dBm Excellent</div>
            </div>
          </div>
        </div>

        {/* WiFi Widget */}
        <div className="bg-[#050b14]/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Wifi className="w-4 h-4 text-sky-400" />
              Wi-Fi Topology
            </h4>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Wi-Fi 6E Connected</span>
          </div>
          
          <div className="flex justify-between gap-4">
            <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-800/80">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">SSID</div>
              <div className="text-sm font-medium text-white truncate">GUEST_NET_5G</div>
            </div>
            <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-800/80">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Channel</div>
              <div className="text-sm font-medium text-white flex items-center gap-2">149 <span className="text-[9px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.5 rounded uppercase">Low Crowding</span></div>
            </div>
            <div className="flex-1 bg-slate-900/50 rounded-lg p-3 border border-slate-800/80">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Frequency</div>
              <div className="text-sm font-mono text-blue-300">5.8 GHz</div>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Test */}
      <div className="bg-[#050b14]/90 border border-slate-800 rounded-2xl p-8 relative overflow-hidden text-center shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
         <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm pointer-events-none">
           <Network className="w-64 h-64 text-sky-500" />
         </div>

         <div className="relative z-10 flex flex-col items-center">
            
            <div className="flex justify-center gap-12 w-full mb-10 text-left">
               <div className="flex-1 flex flex-col items-center border-r border-slate-800/80 pr-12">
                 <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-teal-400"/> Ping</span>
                 <div className="text-3xl font-mono font-bold text-white mb-1">{testStage === 'ping' || testStage === 'idle' && ping === 0 ? "--" : ping}<span className="text-sm text-gray-500 ml-1">ms</span></div>
                 <div className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">Loss: {packetLoss.toFixed(1)}%</div>
               </div>
               <div className="flex-1 flex flex-col items-center border-r border-slate-800/80 pr-12">
                 <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Download className="w-4 h-4 text-sky-400"/> Download</span>
                 <div className={`text-4xl font-mono font-bold ${testStage === 'download' ? 'text-sky-400 animate-pulse' : 'text-white'}`}>{download === 0 && testStage === 'idle' ? "--" : download.toFixed(1)}</div>
                 <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Mbps</div>
               </div>
               <div className="flex-1 flex flex-col items-center">
                 <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Upload className="w-4 h-4 text-fuchsia-400"/> Upload</span>
                 <div className={`text-4xl font-mono font-bold ${testStage === 'upload' ? 'text-fuchsia-400 animate-pulse' : 'text-white'}`}>{upload === 0 && testStage === 'idle' ? "--" : upload.toFixed(1)}</div>
                 <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Mbps</div>
               </div>
            </div>

            <button 
              onClick={runSpeedTest}
              disabled={isTesting}
              className={`px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg ${
                isTesting 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-sky-600 text-white hover:bg-sky-500 hover:shadow-[0_0_25px_rgba(2,132,199,0.4)] hover:scale-105"
              }`}
            >
              {isTesting ? `Testing ${testStage.toUpperCase()}...` : (testStage === "complete" ? "Restart Test" : "Go")}
            </button>
         </div>
      </div>
    </div>
  );
}
