import React from "react";
import { Shield, FileText, ExternalLink, HelpCircle, Layers, Coins } from "lucide-react";

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenDonate: () => void;
  cpuCores?: string;
  osPlatform?: string;
  timestamp: string;
}

export default function Footer({ onOpenPrivacy, onOpenTerms, onOpenDonate, cpuCores = "8 Core", osPlatform = "Intel / DevicePulse Core", timestamp }: FooterProps) {
  return (
    <footer className="w-full bg-[#040811]/92 border-t border-slate-900/90 py-4.5 px-6 md:px-8 mt-12 flex flex-col md:flex-row items-center justify-between font-mono text-[9px] text-gray-400 select-none relative z-30 gap-4 backdrop-blur-md">
      
      {/* Visual cyber separation accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/15 to-transparent pointer-events-none" />

      {/* Corporate Metadata & Lead Developer Credits */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
        <div className="flex flex-col">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold uppercase text-white tracking-widest text-[9.5px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
            DEVICEPULSE AI CORE
          </div>
          <span className="text-[8px] text-gray-500 mt-0.5 text-center sm:text-left">EST. © 2026 GENERAL LABS</span>
        </div>
        <div className="hidden sm:block text-slate-800 font-extrabold">|</div>
        <div className="text-center sm:text-left">
          <div className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">
            Lead Developer: <span className="text-neon-blue font-black underline decoration-neon-blue/30">Amaan Siddiqui</span>
          </div>
          <a 
            href="mailto:amaanmohd8681@gmail.com?subject=DevicePulse%20Developer%20Handshake"
            className="text-slate-500 hover:text-[#00f0ff] transition-colors block text-[8px] tracking-tight hover:underline flex items-center justify-center sm:justify-start gap-1 mt-0.5"
            onClick={(e) => {
              // Beep sound
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              } catch (err) {}
            }}
          >
            amaanmohd8681@gmail.com
            <ExternalLink className="w-2.5 h-2.5 text-gray-600 inline" />
          </a>
        </div>
      </div>

      {/* Navigation action links with Donate option */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
        <button 
          onClick={onOpenPrivacy}
          className="hover:text-[#00f0ff] uppercase font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Shield className="w-3 h-3 text-[#00f0ff]/70" />
          Privacy Policy
        </button>
        
        <span className="text-slate-700 font-black">&bull;</span>
        
        <button 
          onClick={onOpenTerms}
          className="hover:text-purple-400 uppercase font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Layers className="w-3 h-3 text-purple-400/70" />
          Terms of Service
        </button>

        <span className="text-slate-700 font-black">&bull;</span>

        <button 
          onClick={onOpenDonate}
          className="px-3.5 py-1.5 bg-neon-purple/15 text-neon-purple border border-neon-purple/45 hover:border-neon-purple hover:bg-neon-purple hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(157,0,255,0.45)]"
        >
          <Coins className="w-4 h-4 text-neon-purple animate-bounce" />
          DONATE
        </button>

        <span className="text-slate-700 font-black">&bull;</span>

        <a 
          href="mailto:amaanmohd8681@gmail.com?subject=DevicePulse%20Support%20Handshake"
          className="hover:text-white uppercase font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3 h-3 text-emerald-400" />
          Support
          <ExternalLink className="w-2 h-2 opacity-50" />
        </a>
      </div>

      {/* ISO regulatory compliance info and India status */}
      <div className="text-center md:text-right text-[8px] text-slate-500 flex flex-col items-center md:items-end leading-normal">
        <span className="tracking-wider uppercase font-semibold text-slate-400">
          COMPLIANT WITH SECURE INDIA ACT &bull; RESIDENCY REGISTERED
        </span>
        <span className="text-slate-600 tracking-tighter uppercase mt-0.5">
          {osPlatform} ({cpuCores}) &bull; ENCRYPTED DEV GATEWAY HANDSHAKE: LIVE
        </span>
      </div>

    </footer>
  );
}
