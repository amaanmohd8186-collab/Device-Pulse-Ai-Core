import React, { useState } from "react";
import { 
  Award, 
  TrendingUp, 
  BookOpen, 
  DollarSign, 
  Users, 
  Wrench, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  PieChart,
  BarChart4,
  CheckCircle2,
  Lock,
  MessageSquare
} from "lucide-react";

interface Slide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string[];
  metrics?: { label: string; val: string }[];
}

export function PitchDeckScreen() {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  
  // Revenue Simulator States
  const [proUsers, setProUsers] = useState<number>(12000); // 12,000 active pro subscribers
  const [activeShops, setActiveShops] = useState<number>(250); // 250 shops paying monthly
  const [monthlyBookings, setMonthlyBookings] = useState<number>(1800); // 1,800 transactions
  const [commissionRate, setCommissionRate] = useState<number>(10); // 10% average commission
  const [averageRepairTicket, setAverageRepairTicket] = useState<number>(2200); // ₹2200 average invoice

  // Live Calculations
  const proRevenue = Math.round(proUsers * 49); // ₹49 per subscriber
  const saasRevenue = Math.round(activeShops * 999); // ₹999 per partner shop SaaS
  const transactionVolume = Math.round(monthlyBookings * averageRepairTicket);
  const commissionRevenue = Math.round(transactionVolume * (commissionRate / 100));
  const totalMonthlyMRR = proRevenue + saasRevenue + commissionRevenue;
  const annualAcl = totalMonthlyMRR * 12;

  // Shop SaaS Live Simulator Active Toggles state
  const [shopSimulatorPremiumListing, setShopSimulatorPremiumListing] = useState<boolean>(true);
  const [selectedShopTab, setSelectedShopTab] = useState<"pending" | "subscribers" | "leads">("pending");

  const slides: Slide[] = [
    {
      title: "DevicePulse AI: Phone Health & Repair",
      subtitle: "The Next-Generation Smartphone Intelligence & Indian Repair Marketplace",
      icon: <Briefcase className="w-8 h-8 text-neon-cyan" />,
      content: [
        "Unifying real-time hardware level telemetry (battery, CPU silicon thermals, storage blocks) with Indian brick-and-mortar mobile retail.",
        "A complete device diagnostic operating system designed for the 700M+ smartphone users in India.",
        "Providing instant technical guidance, voice-based AI hardware analysis, and predictable, vetted local repair access."
      ],
      metrics: [
        { label: "India Smartphone Users", val: "700M+" },
        { label: "Repair Volatility Rate", val: "84% Anomaly" },
        { label: "Target Market Share", val: "5% Year 3" }
      ]
    },
    {
      title: "The Problem",
      subtitle: "Silent Smartphone Decay & High-Volatility Repair Environments",
      icon: <ShieldAlert className="w-8 h-8 text-neon-red" />,
      content: [
        "Hardware degradation behaves in non-linear ways. Standard phone batteries decline suddenly and thermals throttle performance without warning context.",
        "Indian repair shops charge highly volatile rates (screen replacements range from ₹1500 to ₹12000 randomly with no baseline logic).",
        "No continuous remote physical assessment models exist — leaving users vulnerable to catastrophic permanent failures (boot-loops, thermal melting)."
      ],
      metrics: [
        { label: "Annual Screen Brokes", val: "38M in India" },
        { label: "Merchant Markup Variance", val: "300%+ Unvetted" },
        { label: "Pre-mature Scrap waste", val: "₹18,000Cr Area" }
      ]
    },
    {
      title: "The Solution",
      subtitle: "Continuously Monitored AI Cores + Direct Verified Shop Integration",
      icon: <CheckCircle2 className="w-8 h-8 text-neon-green" />,
      content: [
        "DevicePulse continuous baseline calculations analyze voltage stability ratings, write delays, and active heating spikes to compute lifespan metrics.",
        "Multilingual Gemini engineering assistant communicates technical status simply in Hinglish, Hindi, Tamil, Telugu, and Bengali.",
        "Vetted, localized repair partner shops commit to standardized hardware rates, eliminating invoice fraud for good."
      ],
      metrics: [
        { label: "Predictive Precision", val: "91% Accuracy" },
        { label: "Cost Standardisation", val: "100% Locked" },
        { label: "Customer Trust Rating", val: "4.9 ★ Average" }
      ]
    },
    {
      title: "Interactive Revenue Streams",
      subtitle: "Multi-Pronged Hybrid Monetisation Strategy",
      icon: <DollarSign className="w-8 h-8 text-neon-yellow" />,
      content: [
        "Freemium Consumer App: basic health indexes are free. Premium PDF diagnostic reporting and unlimited monitoring charts cost ₹49/month or ₹299/year.",
        "B2B Merchant SaaS Subscription: Indian local repair dealers subscribe to the DevicePulse CRM at ₹999/month for priority leads and diagnostic telemetry integration.",
        "Transactional Commissions: 5% - 15% booking fees processed securely for every screen, battery, or board swap facilitated on the app."
      ],
      metrics: [
        { label: "Pro Subscription", val: "₹49 / M" },
        { label: "Shop SaaS Fee", val: "₹999 / M" },
        { label: "Average Commission", val: "10% Range" }
      ]
    },
    {
      title: "Go-To-Market and Growth Loop",
      subtitle: "Continuous Referral Networks and Organic Diagnostics",
      icon: <TrendingUp className="w-8 h-8 text-[#a855f7]" />,
      content: [
        "Viral 'Phone Health Score' referral loop: users invite contacts to compare Silicon junction temperatures and Battery stress ratings.",
        "Strategic offline onboarding nodes: placing QR-code material at local accessory merchants and partner retail stores across India tier 1-3 cities.",
        "AI diagnostic index reports utilized directly as proof-of-condition certifications when selling used smartphones on secondary markets."
      ],
      metrics: [
        { label: "Viral CAC Estimate", val: "₹14 per user" },
        { label: "Second-hand Sync Price", val: "₹49 Per PDF" },
        { label: "Merchant Referral Index", val: "1.8x Growth" }
      ]
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="space-y-6 text-gray-200" id="pitch-deck-screen">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 select-none">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-neon-yellow" />
            💼 Startup Investor Pitch Deck & Revenue Modeler
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Pitch slides combined with real-time interactive business commission computations.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow px-2 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">
            PITCH DECK PRESENTATION ONBOARD
          </span>
        </div>
      </div>

      {/* Slide and interactive modeler grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Slide Carousel */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#070b14] to-[#0d1627] border border-slate-800 rounded-xl p-6 relative flex flex-col justify-between min-h-[360px]">
          
          <div className="absolute top-2 right-3 font-mono text-[9px] text-gray-500">
            SLIDE {activeSlide + 1} OF {slides.length}
          </div>

          <div className="space-y-4">
            {/* Header section */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                {slides[activeSlide].icon}
              </div>
              <div>
                <span className="text-[9px] font-mono text-neon-yellow uppercase tracking-widest block font-bold">
                  DevicePulse Pitch Deck
                </span>
                <h4 className="text-white font-display font-medium text-base mt-0.5">
                  {slides[activeSlide].title}
                </h4>
                <p className="text-xs text-neon-cyan font-mono mt-0.5 leading-snug">
                  {slides[activeSlide].subtitle}
                </p>
              </div>
            </div>

            {/* Bullets content */}
            <div className="space-y-2 pt-2">
              {slides[activeSlide].content.map((bullet, index) => (
                <div key={index} className="flex gap-2 items-start text-xs leading-relaxed text-gray-300 font-sans select-text">
                  <span className="text-neon-cyan mt-1.5 shrink-0 font-mono text-[8px]">&bull;</span>
                  <p>{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics section */}
          {slides[activeSlide].metrics && (
            <div className="grid grid-cols-3 gap-3 border-t border-slate-850/60 pt-4 mt-4 font-mono text-[11px] select-none">
              {slides[activeSlide].metrics.map((m, idx) => (
                <div key={idx} className="bg-[#03070d]/80 border border-slate-850 p-2 rounded text-center">
                  <span className="text-gray-500 text-[8px] block uppercase tracking-wide leading-none">{m.label}</span>
                  <span className="text-neon-cyan font-bold block mt-1 text-xs">{m.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Carousel Buttons navigation */}
          <div className="flex items-center justify-between border-t border-slate-850/60 pt-4 mt-4 select-none">
            <button
              onClick={prevSlide}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-gray-400 hover:text-white rounded text-xs font-mono tracking-tighter flex items-center gap-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              PREVIOUS
            </button>
            
            <div className="flex gap-1">
              {slides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setActiveSlide(dotIdx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeSlide === dotIdx ? "bg-neon-cyan px-2" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="px-3 py-1.5 bg-neon-cyan text-black hover:opacity-90 font-bold rounded text-xs font-mono tracking-tighter flex items-center gap-1 transition-all"
            >
              NEXT SLIDE
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Live Revenue Calculator */}
        <div className="lg:col-span-6 bg-[#081120]/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-3">
              <BarChart4 className="w-4 h-4 text-neon-cyan animate-pulse" />
              Live MRR Computation Generator
            </h4>

            {/* Computation inputs controls */}
            <div className="space-y-3.5 font-mono text-[11px]">
              
              {/* Pro Subscribers slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Paid Pro Users (₹49/M):</span>
                  <span className="text-white font-extrabold">{proUsers.toLocaleString()} accounts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={proUsers}
                  onChange={(e) => setProUsers(parseInt(e.target.value))}
                  className="w-full accent-neon-cyan bg-slate-800 h-1 rounded"
                />
              </div>

              {/* CRM SaaS shops slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Partner Repair Outlets SaaS (₹999/M):</span>
                  <span className="text-white font-extrabold">{activeShops.toLocaleString()} stores</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={activeShops}
                  onChange={(e) => setActiveShops(parseInt(e.target.value))}
                  className="w-full accent-neon-cyan bg-slate-800 h-1 rounded"
                />
              </div>

              {/* Transactions counts slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Processed Monthly Bookings:</span>
                  <span className="text-white font-extrabold">{monthlyBookings.toLocaleString()} transactions</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="200"
                  value={monthlyBookings}
                  onChange={(e) => setMonthlyBookings(parseInt(e.target.value))}
                  className="w-full accent-neon-cyan bg-slate-800 h-1 rounded"
                />
              </div>

              {/* Commission Rate / Avg bill grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-2.5 rounded border border-slate-850 select-none">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500 text-[10px]">COMMISSION %</span>
                    <span className="text-neon-cyan font-bold">{commissionRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    step="1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseInt(e.target.value))}
                    className="w-full accent-neon-cyan bg-slate-800 h-1 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500 text-[10px]">AVG TICKET BIAS</span>
                    <span className="text-[#a855f7] font-bold">₹{averageRepairTicket}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="8000"
                    step="100"
                    value={averageRepairTicket}
                    onChange={(e) => setAverageRepairTicket(parseInt(e.target.value))}
                    className="w-full accent-neon-cyan bg-slate-800 h-1 rounded text-purple-600"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 mt-2">
            
            {/* Computed MRR readouts */}
            <div className="bg-[#03070d] border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                  TOTAL ESTIMATED RECURRING REVENUE (MRR)
                </span>
                <span className="text-2xl font-display font-extrabold text-[#00f5ff] flex items-center">
                  ₹{totalMonthlyMRR.toLocaleString()}
                  <span className="text-xs font-mono text-gray-400 ml-1.5 font-normal">/ month block</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 block">
                  Projected ARR: <strong>₹{annualAcl.toLocaleString()}</strong> (~ 2.5x growth model)
                </span>
              </div>
              
              <div className="bg-[#091120] border border-slate-800/80 p-2.5 rounded font-mono text-[10px] text-gray-400 space-y-1 sm:text-right">
                <div className="flex justify-between gap-4 sm:justify-end">
                  <span>Pro Subscriptions:</span>
                  <strong className="text-white">₹{proRevenue.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between gap-4 sm:justify-end">
                  <span>Shop Corporate SaaS:</span>
                  <strong className="text-[#a855f7]">₹{saasRevenue.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between gap-4 sm:justify-end">
                  <span>Repair Commissions:</span>
                  <strong className="text-neon-cyan">₹{commissionRevenue.toLocaleString()}</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SHOP SAAS LIVE WORKSPACE ENVIRONMENT BLOCK */}
      <div className="bg-[#050a12]/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3 mb-4 select-none">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-neon-yellow" />
            <h4 className="text-sm font-display font-medium text-white uppercase tracking-wider">
              B2B Partner Shop Control Console (Enterprise Portal Preview)
            </h4>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedShopTab("pending")}
              className={`px-3 py-1 text-[10px] rounded font-mono transition-all ${
                selectedShopTab === "pending" ? "bg-neon-yellow/20 border border-neon-yellow text-white font-bold" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📥 PENDING JOBS (3)
            </button>
            <button
              onClick={() => setSelectedShopTab("subscribers")}
              className={`px-3 py-1 text-[10px] rounded font-mono transition-all ${
                selectedShopTab === "subscribers" ? "bg-neon-yellow/20 border border-neon-yellow text-white font-bold" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              👥 PORTAL SUBSCRIBERS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
          
          {/* Shop detail specs */}
          <div className="md:col-span-4 space-y-3 p-4 bg-slate-900/60 rounded-lg border border-slate-850/80">
            <h5 className="font-bold text-white uppercase border-b border-slate-800 pb-1 text-[11px] tracking-wide">
              Selected Retailer Core Config
            </h5>
            
            <div className="space-y-2 text-[11px] text-gray-400">
              <div className="flex justify-between items-center">
                <span>Shop Premium Placement:</span>
                <button
                  onClick={() => setShopSimulatorPremiumListing(!shopSimulatorPremiumListing)}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    shopSimulatorPremiumListing ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "bg-slate-800 text-gray-500"
                  }`}
                >
                  {shopSimulatorPremiumListing ? "ACTIVE CAROUSEL" : "BASIC LOCAL"}
                </button>
              </div>
              <div className="flex justify-between">
                <span>Monthly SaaS Rate:</span>
                <span className="text-white">₹999 / month</span>
              </div>
              <div className="flex justify-between">
                <span>SaaS Feature License:</span>
                <span className="text-neon-green font-bold">GOLD MULTI-PORT</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug pt-1">
                Shops paying the recurring ₹999 SaaS fee gain automated diagnostic telemetry uploads from custom clients to optimize repair velocity times.
              </p>
            </div>
          </div>

          {/* Pending Leads data simulator */}
          <div className="md:col-span-8 bg-[#03070d]/90 border border-slate-850 p-4 rounded-lg flex flex-col justify-between">
            
            {selectedShopTab === "pending" ? (
              <div className="space-y-2.5">
                
                {/* Lead 1 */}
                <div className="p-2 bg-slate-900 border border-slate-805 rounded flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold block">Amaan Mohd (Koramangala, BLR)</span>
                    <span className="text-[9px] text-neon-orange font-semibold">Diagnosis: CPU Thermal Load High (#89)</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="text-gray-500">iPhone 15 Pro</span>
                    <span className="text-neon-green">₹1,850 - Screen</span>
                  </div>
                </div>

                {/* Lead 2 */}
                <div className="p-2 bg-slate-900 border border-slate-805 rounded flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold block">Rajesh Kumar (Dwarka, Delhi)</span>
                    <span className="text-[9px] text-neon-blue">Diagnosis: Battery wear index extreme (Anode 52%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="text-gray-500">Mi 11 Ultra</span>
                    <span className="text-neon-cyan">₹750 - Cells</span>
                  </div>
                </div>

                {/* Lead 3 */}
                <div className="p-2 bg-slate-900 border border-slate-805 rounded flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold block">Priya S. (Bandra West, Mumbai)</span>
                    <span className="text-[9px] text-neon-red font-bold">Diagnosis: Corrupt Memory sectors & bad risk block</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 select-none">
                    <span className="text-gray-500">OnePlus 11</span>
                    <span className="text-white">₹3,100 - Logic</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-[11px] leading-relaxed">
                👥 DevicePulse enterprise portal links to 2,500+ premium diagnostic subscribers across partner loops. Daily engagement rating: 94.2%.
              </div>
            )}

            <p className="text-[9px] text-gray-500 text-right pt-2 border-t border-slate-850/60 mt-2 select-none">
              Secured under Enterprise TLS Key: DP_METRIC_PORTAL_SECURE_ACTIVE_V10
            </p>

          </div>

        </div>
      </div>

    </div>
  );
}
