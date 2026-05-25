import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Search, 
  Wrench, 
  Battery, 
  Cpu, 
  Droplet, 
  Sparkles, 
  IndianRupee, 
  Star, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  MessageSquare, 
  X,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldAlert,
  Activity,
  Bell,
  Play,
  Check,
  CheckSquare,
  Layers,
  Settings,
  UserCheck,
  Map,
  User,
  Plus,
  Send,
  Lock,
  ExternalLink
} from "lucide-react";

interface Shop {
  id: string;
  name: string;
  city: string;
  distance: number; // km
  rating: number;
  featured: boolean;
  services: string[];
  basePrices: { [key: string]: number };
  phone: string;
  address: string;
  verified: boolean;
  coords: { x: number; y: number }; // Percentage coordinates for SVG map
}

const INDIAN_CITIES = [
  "New Delhi",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Kolkata"
];

const REPAIR_SHOPS: Shop[] = [
  {
    id: "shop-delhi-1",
    name: "Delhi NanoPulse Repairs",
    city: "New Delhi",
    distance: 1.2,
    rating: 4.8,
    featured: true,
    services: ["Screen Repair", "Battery Replacement", "Motherboard Repair"],
    basePrices: { "Screen Repair": 1650, "Battery Replacement": 750, "Motherboard Repair": 2200 },
    phone: "+91 98123 45678",
    address: "B-42, Connaught Place, Next to Metro Gate 3, New Delhi",
    verified: true,
    coords: { x: 45, y: 35 }
  },
  {
    id: "shop-delhi-2",
    name: "Coring Glass & Silicon Labs",
    city: "New Delhi",
    distance: 2.8,
    rating: 4.6,
    featured: false,
    services: ["Screen Repair", "Water Damage Repair"],
    basePrices: { "Screen Repair": 1490, "Water Damage Repair": 950 },
    phone: "+91 98765 43210",
    address: "Sector 7, Dwarka, Near Petrol Pump, New Delhi",
    verified: true,
    coords: { x: 30, y: 60 }
  },
  {
    id: "shop-mumbai-1",
    name: "Mumbai Silicon & Anode Matrix",
    city: "Mumbai",
    distance: 0.8,
    rating: 4.9,
    featured: true,
    services: ["Screen Repair", "Battery Replacement", "Motherboard Repair", "Water Damage Repair"],
    basePrices: { "Screen Repair": 2100, "Battery Replacement": 990, "Motherboard Repair": 3100, "Water Damage Repair": 1150 },
    phone: "+91 99223 34455",
    address: "Shop 12, Link Road, Bandra West, Mumbai",
    verified: true,
    coords: { x: 20, y: 70 }
  },
  {
    id: "shop-mumbai-2",
    name: "ElectroFix Junction",
    city: "Mumbai",
    distance: 3.5,
    rating: 4.3,
    featured: false,
    services: ["Battery Replacement", "Screen Repair"],
    basePrices: { "Screen Repair": 1550, "Battery Replacement": 600 },
    phone: "+91 91122 33445",
    address: "Mahim West, Near Station, Mumbai",
    verified: false,
    coords: { x: 60, y: 40 }
  },
  {
    id: "shop-blr-1",
    name: "Bengaluru CyberCell Labs",
    city: "Bengaluru",
    distance: 1.4,
    rating: 4.9,
    featured: true,
    services: ["Screen Repair", "Battery Replacement", "Motherboard Repair", "Water Damage Repair"],
    basePrices: { "Screen Repair": 1850, "Battery Replacement": 850, "Motherboard Repair": 2800, "Water Damage Repair": 1300 },
    phone: "+91 93456 78901",
    address: "80 Feet Road, Indiranagar, Opp. Starbucks, Bengaluru",
    verified: true,
    coords: { x: 55, y: 45 }
  },
  {
    id: "shop-blr-2",
    name: "Indiranagar TechPulse Hub",
    city: "Bengaluru",
    distance: 4.1,
    rating: 4.5,
    featured: false,
    services: ["Screen Repair", "Battery Replacement"],
    basePrices: { "Screen Repair": 1590, "Battery Replacement": 700 },
    phone: "+91 92233 44556",
    address: "Koramangala 5th Block, near Jyoti Nivas College, Bengaluru",
    verified: true,
    coords: { x: 40, y: 65 }
  },
  {
    id: "shop-chennai-1",
    name: "Chennai Silicon Repair Node",
    city: "Chennai",
    distance: 2.1,
    rating: 4.7,
    featured: true,
    services: ["Screen Repair", "Battery Replacement", "Water Damage Repair"],
    basePrices: { "Screen Repair": 1450, "Battery Replacement": 680, "Water Damage Repair": 1050 },
    phone: "+91 94440 12345",
    address: "Mount Road, Anna Salai, Chennai",
    verified: true,
    coords: { x: 65, y: 80 }
  },
  {
    id: "shop-hyd-1",
    name: "Hyderabad GigaFix & Motherboard Core",
    city: "Hyderabad",
    distance: 1.9,
    rating: 4.8,
    featured: true,
    services: ["Motherboard Repair", "Screen Repair", "Battery Replacement"],
    basePrices: { "Screen Repair": 1900, "Battery Replacement": 800, "Motherboard Repair": 2500 },
    phone: "+91 98850 11223",
    address: "Hitech City, Near Cyber Towers, Hyderabad",
    verified: true,
    coords: { x: 45, y: 60 }
  },
  {
    id: "shop-kolkata-1",
    name: "Kolkata ElectroWaves & MicroChip Solutions",
    city: "Kolkata",
    distance: 3.1,
    rating: 4.6,
    featured: true,
    services: ["Screen Repair", "Battery Replacement", "Motherboard Repair"],
    basePrices: { "Screen Repair": 1400, "Battery Replacement": 650, "Motherboard Repair": 2100 },
    phone: "+91 98300 55667",
    address: "Salt Lake Sector V, Near Wipro Crossing, Kolkata",
    verified: true,
    coords: { x: 80, y: 55 }
  }
];

export function RepairNetworkScreen() {
  // Navigation
  const [viewMode, setViewMode] = useState<"customer" | "merchant">("customer");
  
  // Custom Audio oscillator feedback inside iframe
  const playFeedBeep = (freq = 440, duration = 80, type: OscillatorType = "sine") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // Fail gracefully inside iframe sandboxing
    }
  };

  // --- CUSTOMER MODULE STATE ---
  const [selectedCity, setSelectedCity] = useState<string>("Bengaluru");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [activeBookingShop, setActiveBookingShop] = useState<Shop | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string>("Screen Repair");
  const [bookingDate, setBookingDate] = useState<string>("2026-05-25");
  const [bookingTime, setBookingTime] = useState<string>("11:30 AM");
  const [userModel, setUserModel] = useState<string>("OnePlus 12");
  const [clientName, setClientName] = useState<string>("Amaan Mohd");
  const [clientPhone, setClientPhone] = useState<string>("98124 55110");
  const [bookingTicket, setBookingTicket] = useState<any | null>(null);
  const [showMapView, setShowMapView] = useState<boolean>(false);
  const [hoveredShop, setHoveredShop] = useState<Shop | null>(null);

  // --- WHATSAPP CALL & REMINDER STATE ---
  const [activeWhatsAppCall, setActiveWhatsAppCall] = useState<any | null>(null);
  const [whatsAppCallStatus, setWhatsAppCallStatus] = useState<"dialing" | "connected" | "ended">("dialing");
  const [whatsAppCallTimer, setWhatsAppCallTimer] = useState<number>(0);
  const [whatsAppCallSpeakerText, setWhatsAppCallSpeakerText] = useState<string>("Ringing target technician...");

  const handleWhatsAppTriggerMessage = (phone: string, text: string) => {
    const rawNumber = phone.replace(/[^0-9]/g, "");
    const formattedNumber = rawNumber.startsWith("91") ? rawNumber : `91${rawNumber}`;
    const uri = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(text)}`;
    window.open(uri, "_blank");
  };

  useEffect(() => {
    let callInterval: any;
    if (activeWhatsAppCall && whatsAppCallStatus === "dialing") {
      let durationCount = 0;
      callInterval = setInterval(() => {
        playFeedBeep(330, 200, "sine");
        setTimeout(() => playFeedBeep(330, 200, "sine"), 300);
        durationCount += 2;
        if (durationCount >= 6) {
          setWhatsAppCallStatus("connected");
          setWhatsAppCallTimer(0);
          setWhatsAppCallSpeakerText("Namaste! Bengaluru CyberCell Labs of DevicePulse. Connecting you support desk live...");
        }
      }, 2000);
    }
    return () => clearInterval(callInterval);
  }, [activeWhatsAppCall, whatsAppCallStatus]);

  useEffect(() => {
    let runningInterval: any;
    if (activeWhatsAppCall && whatsAppCallStatus === "connected") {
      runningInterval = setInterval(() => {
        setWhatsAppCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(runningInterval);
  }, [activeWhatsAppCall, whatsAppCallStatus]);

  // --- MERCHANT MODULE STATE ---
  const [merchantTab, setMerchantTab] = useState<"dashboard" | "new-requests" | "active-jobs" | "ledger" | "settings">("dashboard");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Dynamic alerts list for merchant notifications feed
  const [merchantAlerts, setMerchantAlerts] = useState<string[]>([
    "System Diagnostics calibrated for Bengaluru CyberCell Labs Node.",
    "Notification: Automatic payout of ₹11,340 processed on 2026-05-23."
  ]);

  // Pricing settings for merchant shop
  const [pricingLevels, setPricingLevels] = useState<{ [key: string]: number }>({
    "Screen Repair": 1850,
    "Battery Replacement": 850,
    "Motherboard Repair": 2800,
    "Water Damage Repair": 1300
  });

  // Featured Status premium listing booster
  const [isPremiumBoosted, setIsPremiumBoosted] = useState<boolean>(true);
  
  // KYC & OTP State
  const [kycStatus, setKycStatus] = useState<"Verified" | "Pending">("Verified");
  const [showOtpGate, setShowOtpGate] = useState<boolean>(false);
  const [inputOtp, setInputOtp] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Ongoing repair orders (Merchant workstation hub)
  const [activeJobs, setActiveJobs] = useState<any[]>([
    {
      id: "job-08",
      customer: "Mohammed Amaan",
      phone: "+91 98124 55110",
      model: "OnePlus 12 Ultra",
      issue: "Battery Replacement",
      status: "In Progress",
      timer: 450, // 7.5 mins elapsed
      cost: 850,
      notes: "High voltage thermal dissipation, replacing core lithium cell block.",
      historyLogs: ["Calibrated power terminal core", "Lithium cell custom solder"],
      aiDiagnostics: {
        batteryHealth: 54,
        tempCel: 46,
        riskScore: 72,
        wearFactor: "Anode crystal degradation",
        solution: "Replace Li-Po cell layer + Calibrate charger logic registers"
      }
    },
    {
      id: "job-04",
      customer: "Rajesh Kumar",
      phone: "+91 94441 23098",
      model: "Samsung S24 Ultra",
      issue: "Motherboard Repair",
      status: "Waiting for parts",
      timer: 0,
      cost: 2800,
      notes: "Waiting for micro-laminated thermal heat pipes delivery.",
      historyLogs: ["Board visual micro-crack trace complete"],
      aiDiagnostics: {
        batteryHealth: 88,
        tempCel: 61,
        riskScore: 84,
        wearFactor: "Power PMIC logic gate shunt short",
        solution: "Desolder heat shield + Bridge logic choke point node"
      }
    }
  ]);

  // Incoming job requests array (Merchant pending queue)
  const [newRequests, setNewRequests] = useState<any[]>([
    {
      id: "req-101",
      customer: "Priya Sharma",
      phone: "+91 93456 12399",
      model: "iPhone 15 Pro",
      issue: "Screen Repair",
      distance: "1.4 km",
      estimatedCost: 1850,
      timestamp: "5 mins ago",
      aiDiagnostics: {
        batteryHealth: 91,
        tempCel: 35,
        riskScore: 35,
        wearFactor: "Corning glass laminate fracture",
        solution: "High-pressure polarizer vacuole lamination"
      }
    },
    {
      id: "req-102",
      customer: "Siddharth Jain",
      phone: "+91 91100 88223",
      model: "Xiaomi 14 Pro",
      issue: "Water Damage Repair",
      distance: "3.2 km",
      estimatedCost: 1300,
      timestamp: "15 mins ago",
      aiDiagnostics: {
        batteryHealth: 41,
        tempCel: 28,
        riskScore: 92,
        wearFactor: "Chamber liquid log detected",
        solution: "Isopropyl dehydrate cycle + vacuum block clean"
      }
    }
  ]);

  // Chat/Telemetry Console
  const [activeChatNode, setActiveChatNode] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputMessage, setChatInputMessage] = useState<string>("");

  // Customer reviews feed
  const [clientReviews, setClientReviews] = useState<any[]>([
    { author: "Amaan Mohd", score: 5, date: "Yesterday", text: "Best service in Bengaluru! They used DevicePulse AI diagnostic tools and fixed my OnePlus 15% faster under standard price levels. Verified 👍" },
    { author: "Komal S.", score: 5, date: "3 days ago", text: "Fixed liquid moisture error instantly. Highly professional control tools." },
    { author: "Rahul P.", score: 4, date: "Last week", text: "Prompt response. Clear breakdown of net cost and parts tracker logs." }
  ]);

  // Earnings model counts
  const [completedJobsCount, setCompletedJobsCount] = useState<number>(18);
  const [dailyRevenue, setDailyRevenue] = useState<number>(14850);

  // Synchronize state with real Express back-end
  useEffect(() => {
    const fetchState = () => {
      fetch("/api/marketplace/state")
        .then(res => res.json())
        .then(data => {
          if (data.newRequests) setNewRequests(data.newRequests);
          if (data.activeJobs) setActiveJobs(data.activeJobs);
          if (data.completedJobsCount !== undefined) setCompletedJobsCount(data.completedJobsCount);
          if (data.dailyRevenue !== undefined) setDailyRevenue(data.dailyRevenue);
          if (data.merchantAlerts) setMerchantAlerts(data.merchantAlerts);
        })
        .catch(err => console.warn("Marketplace backend sync offline:", err));
    };
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  // Standard booking flow from Front-end Customer view
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert("Please specify customer name and phone to register slot.");
      return;
    }

    const priceAssessed = activeBookingShop ? (activeBookingShop.basePrices[selectedIssue] || 1500) : 1500;

    fetch("/api/marketplace/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: clientName,
        phone: clientPhone,
        model: userModel,
        issue: selectedIssue,
        estimatedCost: priceAssessed
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.bookedTicket) {
            setBookingTicket({
              ...data.bookedTicket,
              shopName: activeBookingShop?.name || "Bengaluru CyberCell Labs",
              shopAddress: activeBookingShop?.address || "80 Feet Road, Indiranagar, Opp. Starbucks, Bengaluru",
              shopPhone: activeBookingShop?.phone || "+91 93456 78901",
            });
          }
          if (data.newRequests) setNewRequests(data.newRequests);
          if (data.merchantAlerts) setMerchantAlerts(data.merchantAlerts);
        }
      })
      .catch(err => {
        console.error("Booking post error:", err);
        // Fallback local state if backend call experiences issues:
        const ticketId = `DP-REP-${Math.floor(Math.random() * 89999 + 10000)}`;
        const newTicket = {
          ticketId,
          shopName: activeBookingShop?.name || "Bengaluru CyberCell Labs",
          shopAddress: activeBookingShop?.address || "80 Feet Road, Indiranagar, Opp. Starbucks, Bengaluru",
          shopPhone: activeBookingShop?.phone || "+91 93456 78901",
          issue: selectedIssue,
          date: bookingDate,
          time: bookingTime,
          model: userModel,
          clientName,
          cost: priceAssessed,
        };
        setBookingTicket(newTicket);
      });

    setIsBookingModalOpen(false);
    playFeedBeep(880, 150, "sine");
  };

  const handleOpenBooking = (shop: Shop) => {
    playFeedBeep(520, 80, "sine");
    setActiveBookingShop(shop);
    if (shop.services.length > 0) {
      setSelectedIssue(shop.services[0]);
    }
    setIsBookingModalOpen(true);
  };

  const triggerSmsSimulation = (ticket: any) => {
    playFeedBeep(440, 100, "sine");
    alert(`[DevicePulse Secure SMS Gateway SIMULATION]\nMessage transmitted to target partner desk ${ticket.shopPhone}:\n\n"Hi ${ticket.shopName}, I registered slot ${ticket.ticketId} for my ${ticket.model} (${ticket.issue}) on ${ticket.date} at ${ticket.time}. AI diagnostics attached. Please acknowledge."`);
  };

  // Merchant actions
  const handleAcceptRequest = (req: any) => {
    playFeedBeep(780, 100, "sine");
    fetch("/api/marketplace/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "accept",
        id: req.id
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.newRequests) setNewRequests(data.newRequests);
          if (data.activeJobs) setActiveJobs(data.activeJobs);
          if (data.merchantAlerts) setMerchantAlerts(data.merchantAlerts);
        }
      })
      .catch(err => {
        console.error("Accept request error:", err);
        // Fallback local state if backend call fails:
        const acceptedJob = {
          id: `job-${Math.floor(10 + Math.random() * 89)}`,
          customer: req.customer,
          phone: req.phone,
          model: req.model,
          issue: req.issue,
          status: "In Progress",
          timer: 0,
          cost: req.estimatedCost,
          notes: "Request accepted from real-time customer locator feed. Calibrating...",
          historyLogs: ["Job Accepted", "Initiated logic terminal diagnostic check"],
          aiDiagnostics: req.aiDiagnostics
        };
        setActiveJobs(prev => [acceptedJob, ...prev]);
        setNewRequests(prev => prev.filter(r => r.id !== req.id));
        setMerchantAlerts(prev => [`Job request for ${req.customer} accepted successfully!`, ...prev]);
      });
  };

  const handleRejectRequest = (reqId: string) => {
    playFeedBeep(320, 100, "triangle");
    fetch("/api/marketplace/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        id: reqId
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.newRequests) setNewRequests(data.newRequests);
          if (data.merchantAlerts) setMerchantAlerts(data.merchantAlerts);
        }
      })
      .catch(err => {
        console.error("Reject request error:", err);
        setNewRequests(prev => prev.filter(r => r.id !== reqId));
        setMerchantAlerts(prev => ["Job request dismissed.", ...prev]);
      });
  };

  const handleUpdateJobStatus = (jobId: string, newStatus: string) => {
    playFeedBeep(600, 90, "sine");
    fetch("/api/marketplace/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        id: jobId,
        extra: { status: newStatus }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.activeJobs) setActiveJobs(data.activeJobs);
          if (data.completedJobsCount !== undefined) setCompletedJobsCount(data.completedJobsCount);
          if (data.dailyRevenue !== undefined) setDailyRevenue(data.dailyRevenue);
          if (data.merchantAlerts) setMerchantAlerts(data.merchantAlerts);
        }
      })
      .catch(err => {
        console.error("Update status error:", err);
        // Fallback local state if backend call fails:
        setActiveJobs(prev => prev.map(job => {
          if (job.id === jobId) {
            const logs = [...job.historyLogs];
            logs.push(`Status updated to: ${newStatus}`);
            if (newStatus === "Completed" || newStatus === "Delivered") {
              setCompletedJobsCount(c => c + 1);
              setDailyRevenue(r => r + job.cost);
              setMerchantAlerts(prevAction => [`Job ${job.id} completed! Earned ₹${job.cost}`, ...prevAction]);
            }
            return { ...job, status: newStatus, historyLogs: logs };
          }
          return job;
        }));
      });
  };

  const handleAddJobNote = (jobId: string, noteText: string) => {
    if (!noteText.trim()) return;
    playFeedBeep(500, 70, "sine");
    fetch("/api/marketplace/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-note",
        id: jobId,
        extra: { note: noteText }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activeJobs) {
          setActiveJobs(data.activeJobs);
        }
      })
      .catch(err => {
        console.error("Add note error:", err);
        // Fallback local state if backend call fails:
        setActiveJobs(prev => prev.map(job => {
          if (job.id === jobId) {
            return { ...job, notes: noteText };
          }
          return job;
        }));
      });
  };

  const handleAddPartReplacment = (jobId: string, partName: string) => {
    if (!partName.trim()) return;
    playFeedBeep(650, 70, "sine");
    fetch("/api/marketplace/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-part",
        id: jobId,
        extra: { part: partName }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activeJobs) {
          setActiveJobs(data.activeJobs);
        }
      })
      .catch(err => {
        console.error("Add part replacement error:", err);
        // Fallback local state:
        setActiveJobs(prev => prev.map(job => {
          if (job.id === jobId) {
            const updatedLogs = [...(job.partLog || []), partName];
            return { ...job, partLog: updatedLogs };
          }
          return job;
        }));
      });
  };

  const handleInitiateChat = (job: any) => {
    playFeedBeep(520, 100, "sine");
    setActiveChatNode(job);
    setChatMessages([
      { sender: "system", text: `Secure channel verified. ${job.customer} synced. OTP signature authentic.` },
      { sender: "client", text: `Hi there! Thank you for accepting my DevicePulse repair request. Do you notice any severe degradation?` }
    ]);
  };

  const handleSendChatMessage = () => {
    if (!chatInputMessage.trim()) return;
    playFeedBeep(700, 80, "sine");
    const sentMsg = { sender: "merchant", text: chatInputMessage };
    setChatMessages(prev => [...prev, sentMsg]);
    
    const messageToSend = chatInputMessage;
    setChatInputMessage("");

    // Send to real backend to receive realistic Indian consumer reply generated by Gemini/Fallback
    fetch("/api/marketplace/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageToSend,
        customerName: activeChatNode?.customer || "Amaan Mohd",
        problemType: activeChatNode?.issue || "Battery Replacement",
        modelName: activeChatNode?.model || "OnePlus 12"
      })
    })
      .then(res => res.json())
      .then(data => {
        playFeedBeep(550, 120, "sine");
        setChatMessages(prev => [...prev, { sender: "client", text: data.reply }]);
      })
      .catch(err => {
        console.error("Chat sync error:", err);
        // Fallback rule reply:
        setTimeout(() => {
          playFeedBeep(550, 120, "sine");
          let autoReplyText = "Sounds good! Please process my repair with high quality standard parts.";
          if (messageToSend.toLowerCase().includes("cost") || messageToSend.toLowerCase().includes("price")) {
            autoReplyText = "The estimated price looks fair to me. DevicePulse AI diagnostics have verified typical market costs for this region.";
          } else if (messageToSend.toLowerCase().includes("time") || messageToSend.toLowerCase().includes("ready")) {
            autoReplyText = "Awesome, let me know when I can come back to the service center to collect it!";
          }
          setChatMessages(prev => [...prev, { sender: "client", text: autoReplyText }]);
        }, 1200);
      });
  };

  // Secure KYC verification OTP triggering
  const handleTriggerBankVerify = () => {
    playFeedBeep(880, 100, "sine");
    setShowOtpGate(true);
    setVerificationError(null);
    setInputOtp("");
    alert("[DevicePulse AI Gateway] OTP Signature Code requested. SMS OTP code '1995' dispatched to standard authorized smartphone number (+91 98124 55110).");
  };

  const handleValidateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOtp === "1995") {
      playFeedBeep(980, 250, "sine");
      setKycStatus("Verified");
      setShowOtpGate(false);
      setVerificationError(null);
      alert("KYC Verification Success! Secure payout lines fully active under Level 2 security clearance.");
    } else {
      playFeedBeep(220, 200, "triangle");
      setVerificationError("Invalid secure security code signature. Try code: 1995");
    }
  };

  // Custom filter logic
  const filteredShops = REPAIR_SHOPS.filter(shop => {
    const cityMatches = shop.city.toLowerCase().includes(selectedCity.toLowerCase()) || selectedCity === "All";
    const categoryMatches = selectedCategory === "All" || shop.services.includes(selectedCategory);
    const queryMatches = searchQuery === "" || 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatches && categoryMatches && queryMatches;
  });

  return (
    <div className="space-y-6 text-gray-200" id="repair-network-screen">
      
      {/* 🔮 SYSTEM MODE SELECTOR GRID BANNER */}
      <div className="bg-[#050b16] border border-neon-blue/30 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-gray-400">Ecosystem Framework Selection:</span>
          <span className="text-white font-bold uppercase flex items-center gap-1.5">
            {viewMode === "customer" ? (
              <>
                <User className="w-3.5 h-3.5 text-neon-blue inline" />
                <span>India Marketplace (Customer)</span>
              </>
            ) : (
              <>
                <Wrench className="w-3.5 h-3.5 text-neon-green inline" />
                <span>Service Center Control Room (Partner)</span>
              </>
            )}
          </span>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              playFeedBeep(500, 80, "sine");
              setViewMode("customer");
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer ${
              viewMode === "customer" 
                ? "bg-neon-blue text-black font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]" 
                : "bg-slate-950 border border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Find Shops (Customer)
          </button>
          <button
            onClick={() => {
              playFeedBeep(650, 100, "sine");
              setViewMode("merchant");
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer ${
              viewMode === "merchant" 
                ? "bg-neon-green text-black font-extrabold shadow-[0_0_10px_rgba(12,243,90,0.4)]" 
                : "bg-[#091520] border border-slate-800 text-gray-400 hover:text-white"
            }`}
            id="merchant-mode-btn"
          >
            Partner Dashboard (Merchant)
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 📲 INTERFACE 1: CUSTOMER VIEW MODE (FIND REPAIR SHOPS) */}
      {/* ========================================== */}
      {viewMode === "customer" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4 select-none">
            <div>
              <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-neon-blue" />
                📍 DEVICEPULSE INDIA REPAIR MARKETPLACE
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Standard Indian diagnostic marketplace. Real hardware-verified smartphone mechanics nearby.
              </p>
            </div>
            
            {/* City Selection pills */}
            <div className="flex flex-wrap gap-1">
              {INDIAN_CITIES.map(c => {
                const isSelected = selectedCity === c;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      playFeedBeep(450, 70, "sine");
                      setSelectedCity(c);
                    }}
                    className={`text-[9.5px] font-mono tracking-tighter uppercase px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-neon-blue/20 border-neon-blue text-white font-bold" 
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 text-gray-400"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left side results column */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Search filter panel block */}
              <div className="flex flex-col sm:flex-row gap-3 bg-[#040811]/40 p-3 rounded-xl border border-slate-850">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search standard shops, sectors, metro crossings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#02050b]/90 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                  />
                </div>
                
                <button
                  onClick={() => setShowMapView(!showMapView)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${
                    showMapView ? "bg-neon-blue text-black border-neon-blue" : "bg-slate-900 border-slate-800 text-gray-400"
                  }`}
                >
                  {showMapView ? "List View" : "Map View"}
                </button>

                {/* Category selectors */}
                <div className="flex gap-1 overflow-x-auto pb-1 select-none">
                  {["All", "Screen Repair", "Battery Replacement", "Motherboard Repair", "Water Damage Repair"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        playFeedBeep(480, 60, "sine");
                        setSelectedCategory(cat);
                      }}
                      className={`text-[9.5px] font-mono whitespace-nowrap px-2 px-1 py-1 rounded-md border transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-slate-800 border-slate-700 text-white font-bold"
                          : "bg-slate-900/50 border-slate-850 text-gray-400 hover:text-white"
                      }`}
                    >
                      {cat === "All" ? "🔧 All" : cat.replace(" Repair", "").replace(" Replacement", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status information */}
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
                <span>Active verified shops in <strong className="text-neon-blue">{selectedCity}</strong></span>
                <span>{filteredShops.length} partners ready</span>
              </div>

              {/* Shops dynamic list or Map */}
              {showMapView ? (
                <div className="bg-[#02050b] border border-slate-800 rounded-2xl h-[500px] relative overflow-hidden animate-fade-in group shadow-inner">
                  {/* Digital Grid Backdrop */}
                  <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
                  
                  {/* SVG Map of India (Abstracted for city context) */}
                  <svg className="w-full h-full p-8" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="transparent" />
                    
                    {/* Simulated City Sector Boundaries */}
                    <path d="M 20 20 Q 50 10 80 20 T 80 80 T 20 80 Z" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.2" />

                    {/* Dynamic Shop Pins */}
                    {filteredShops.map(shop => (
                      <g 
                        key={shop.id} 
                        transform={`translate(${shop.coords.x}, ${shop.coords.y})`}
                        onMouseEnter={() => {
                          playFeedBeep(600, 30, "sine");
                          setHoveredShop(shop);
                        }}
                        onMouseLeave={() => setHoveredShop(null)}
                        onClick={() => handleOpenBooking(shop)}
                        className="cursor-pointer group/pin"
                      >
                        <circle 
                          r={shop.featured ? "4" : "3"} 
                          className={`${shop.featured ? "fill-neon-blue" : "fill-slate-700"} opacity-20 animate-ping`} 
                        />
                        <circle 
                          r="1.8" 
                          className={`${shop.featured ? "fill-neon-blue shadow-[0_0_8px_rgba(0,240,255,0.8)]" : "fill-slate-500"} transition-all group-hover/pin:r-2.5 group-hover/pin:fill-white`} 
                        />
                        <path 
                          d="M 0 0 L -1.5 -3 L 1.5 -3 Z" 
                          className={`${shop.featured ? "fill-neon-blue" : "fill-slate-500"}`} 
                          transform="translate(0, -0.5)"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Floating Map Label */}
                  <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded text-[10px] uppercase font-mono text-gray-400">
                    SATELLITE SECTOR: <strong className="text-neon-blue">{selectedCity.toUpperCase()}</strong>
                  </div>

                  {/* Hover Information Tooltip */}
                  {hoveredShop && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 border border-neon-blue/50 p-4 rounded-xl shadow-2xl animate-fade-in w-64 z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-xs font-bold text-white uppercase">{hoveredShop.name}</h5>
                        <span className="text-[9px] font-mono text-neon-yellow">★ {hoveredShop.rating}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mb-3 line-clamp-1">{hoveredShop.address}</p>
                      <button 
                        onClick={() => handleOpenBooking(hoveredShop)}
                        className="w-full bg-neon-blue text-black font-black text-[9px] py-1.5 rounded uppercase tracking-widest"
                      >
                        Quick Book Slot
                      </button>
                    </div>
                  )}

                  {/* Interactive hint */}
                  <div className="absolute bottom-4 right-4 text-[9px] font-mono text-gray-550 italic bg-black/40 px-2 py-1 rounded">
                    &bull; Hover pins for logic details &bull; Click to initiate booking
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredShops.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center">
                    <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      No active computer hardware repair shops mapped in {selectedCity} under these query strings.
                    </p>
                  </div>
                ) : (
                  filteredShops.map(shop => {
                    // Dynamically modify distance if user is "Featured" or sort appropriately
                    return (
                      <div 
                        key={shop.id}
                        className={`bg-[#060b13]/85 p-5 rounded-2xl border relative transition-all overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          shop.featured 
                            ? "border-neon-blue/40 shadow-[0_0_15px_rgba(0,240,255,0.06)] bg-linear-to-r from-[#081223] to-[#040811]" 
                            : "border-slate-800/80 hover:border-slate-750"
                        }`}
                      >
                        {shop.featured && (
                          <div className="absolute top-0 right-0 bg-neon-blue text-black font-mono font-extrabold text-[8px] tracking-widest px-2.5 py-0.5 rounded-bl uppercase animate-pulse">
                            FEATURED HIGH RANK
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 select-text">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display font-bold text-white text-sm">{shop.name}</h4>
                            {shop.verified && (
                              <span className="text-[7.5px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-1 py-0.2 rounded font-black uppercase tracking-wide">
                                VERIFIED PARTNER
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10.5px] font-mono text-gray-400 leading-snug">
                            {shop.address}
                          </p>

                          <div className="flex items-center gap-2.5 font-mono text-[9.5px] text-gray-500 select-none">
                            <span className="flex items-center gap-1 text-neon-yellow">
                              <Star className="w-3 h-3 fill-neon-yellow text-neon-yellow shrink-0 text-[9px]" />
                              <strong>{shop.rating}</strong>
                            </span>
                            <span>&bull;</span>
                            <span className="text-gray-400">📏 <strong>{shop.distance} km</strong></span>
                            <span>&bull;</span>
                            <span className="text-gray-400">{shop.phone}</span>
                          </div>

                          {/* Catalog badges */}
                          <div className="flex flex-wrap gap-1 pt-1 select-none">
                            {shop.services.map(s => (
                              <span 
                                key={s} 
                                className="text-[8.5px] font-mono bg-slate-950 border border-slate-850 text-gray-300 px-2 py-0.4 rounded-md"
                              >
                                {s} (₹{shop.basePrices[s] || 1500})
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Booking actions */}
                        <div className="sm:text-right shrink-0 font-mono space-y-2 select-none flex sm:flex-col justify-end gap-2 sm:gap-0 border-t sm:border-t-0 border-slate-850 pt-3 sm:pt-0">
                          <div className="hidden sm:block">
                            <span className="text-[9px] text-gray-500 block">STANDARD RATES EST</span>
                            <span className="text-white text-xs font-bold block">
                              ₹{Math.min(...Object.values(shop.basePrices))} - ₹{Math.max(...Object.values(shop.basePrices))}+
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleOpenBooking(shop)}
                            className="w-full bg-neon-blue text-black hover:bg-opacity-90 font-extrabold text-[10px] px-3.5 py-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Book Slot
                          </button>

                          <button
                            onClick={() => {
                              playFeedBeep(600, 100, "sine");
                              setActiveWhatsAppCall(shop);
                              setWhatsAppCallStatus("dialing");
                              setWhatsAppCallTimer(0);
                              setWhatsAppCallSpeakerText("Ringing Bengaluru telemetry support operator...");
                            }}
                            className="w-full bg-[#25D366] hover:bg-[#1ebd54] text-black font-extrabold text-[10px] px-3.5 py-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                            WhatsApp Call
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-4 space-y-5">
              
              {/* Telemetry diagnostics attachment note */}
              <div className="bg-[#050c18] border border-neon-blue/20 rounded-2xl p-4 text-left space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-4 h-4 text-neon-blue" />
                  DEVICEPULSE DIAGNOSTIC LINK
                </h4>
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                  Your current physical hardware telemetry diagnostics are automatically pre-linked to all bookings. This forces shops to adhere to honest baseline quotes based on exact component health.
                </p>
                <div className="border border-slate-800 bg-[#02050b]/80 p-3 rounded-xl font-mono text-[10px] space-y-1">
                  <div className="flex justify-between"><span className="text-gray-550">PRECISE SYSTEM PLAN:</span> <span className="text-neon-green">ACTIVE STANDARD</span></div>
                  <div className="flex justify-between"><span className="text-gray-550">TELEMETRY AUTHENTICATION:</span> <span className="text-neon-blue">SECURE-SYNC</span></div>
                </div>
              </div>

              {/* ACTIVE HOLOGRAPHIC BRUG TICKET */}
              {bookingTicket ? (
                <div className="bg-gradient-to-b from-[#0a1820] to-[#040811] border border-neon-green/40 rounded-2xl p-4 text-left relative overflow-hidden shadow-lg animate-fade-in select-text">
                  <div className="absolute top-0 right-0 bg-neon-green text-black font-mono font-bold text-[8px] px-2.5 py-0.5 rounded-bl uppercase">
                    Slot Booked
                  </div>
                  <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <CheckSquare className="w-4 h-4 text-neon-green" />
                    ACTIVE HOLOGRAPHIC RECIEPT
                  </h4>

                  <div className="space-y-2 text-[11px] font-mono text-gray-300 pb-3 border-b border-slate-800">
                    <div><span className="text-gray-500">TICKET_ID:</span> <strong className="text-white text-xs">{bookingTicket.ticketId}</strong></div>
                    <div><span className="text-gray-500">SERVICE CENTER:</span> <span className="text-neon-blue font-bold">{bookingTicket.shopName}</span></div>
                    <div><span className="text-gray-500">SELECTED TYPE:</span> <span className="text-white">{bookingTicket.issue}</span></div>
                    <div><span className="text-gray-500">DEVICE SCORED:</span> <span className="text-white font-semibold">{bookingTicket.model}</span></div>
                    <div><span className="text-gray-500">SCHEDULE DATE:</span> <span className="text-white">{bookingTicket.date} at {bookingTicket.time}</span></div>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono border-t border-slate-800 mt-2">
                    <div>
                      <span className="text-[9px] text-gray-550 block">EST NET COST</span>
                      <strong className="text-neon-green text-sm flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 inline" /> {bookingTicket.cost}
                      </strong>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => triggerSmsSimulation(bookingTicket)}
                        className="flex-1 sm:flex-none bg-[#0a1b24] hover:bg-slate-900 border border-slate-850 text-slate-300 py-1.5 px-2.5 rounded-lg text-[9.5px] font-bold uppercase transition-all cursor-pointer text-center"
                        title="Simulate Secure SMS Dispatch"
                      >
                        SMS Msg
                      </button>
                      <button
                        onClick={() => {
                          playFeedBeep(620, 100, "sine");
                          const textMsg = `Hello ${bookingTicket.shopName}! I have booked a slot on DevicePulse for my ${bookingTicket.model} (${bookingTicket.issue}). Ticket Hash: ${bookingTicket.ticketId}. Please prepare parts for the designated estimate ₹${bookingTicket.cost}. Thank you.`;
                          handleWhatsAppTriggerMessage(bookingTicket.shopPhone, textMsg);
                        }}
                        className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#1ebd54] text-black py-1.5 px-3 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(37,211,102,0.3)]"
                      >
                        <MessageSquare className="w-3 h-3 text-black" />
                        WhatsApp Remind
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 text-center select-none py-10">
                  <Wrench className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                  <span className="text-xs text-gray-500 font-mono uppercase block tracking-wider">No Active Reservation Tickets</span>
                  <p className="text-[10px] text-gray-650 font-mono mt-1 leading-snug">
                    Book a slot in nearby shops to trigger your holographic dashboard tracker ticket.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🛠️ INTERFACE 2: SERVICE CENTER PARTNER PANEL (MERCHANT) */}
      {/* ========================================== */}
      {viewMode === "merchant" && (
        <div className="space-y-6 text-left animate-fade-in" id="service-center-panel">
          
          {/* Header Dashboard section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neon-green/10 border border-neon-green/30 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-neon-green animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-display font-black text-white tracking-wider flex items-center gap-1.5">
                    DEVICEPULSE SERVICE PANEL
                  </h3>
                  <span className="text-[8px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-1.5 py-0.2 rounded font-extrabold">
                    {kycStatus === "Verified" ? "AUTHORIZED LEVEL 2 PORTAL" : "KYC PENDING"}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                  Secure shop routing backend &bull; Registered Office: <strong className="text-neon-blue">Bengaluru CyberCell Labs</strong>
                </p>
              </div>
            </div>

            {/* Merchant Online/Offline State */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-2 bg-[#02050b]/80 border border-slate-850 p-2 rounded-xl">
                <span className="text-gray-550">Availability Status:</span>
                <span className={`font-bold uppercase ${isOnline ? "text-neon-green" : "text-neon-red"}`}>
                  {isOnline ? "● ONLINE" : "■ OFFLINE"}
                </span>
                <button
                  onClick={() => {
                    playFeedBeep(500, 100, "triangle");
                    setIsOnline(!isOnline);
                    setMerchantAlerts(prev => [`Workshop toggled to ${!isOnline ? "ONLINE" : "OFFLINE"}`, ...prev]);
                  }}
                  className="ml-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-gray-400 rounded text-[10px] cursor-pointer"
                >
                  Toggle
                </button>
              </div>
            </div>
          </div>

          {/* Real-time alert notifications ticker banner */}
          {merchantAlerts.length > 0 && (
            <div className="bg-[#0d160f]/60 border border-neon-green/15 p-2.5 rounded-xl flex items-center justify-between gap-3 font-mono text-[10.5px]">
              <div className="flex items-center gap-1.5 text-neon-green shrink-0">
                <Bell className="w-3.5 h-3.5 text-neon-green animate-bounce" />
                <span>ALERT BROADCAST:</span>
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap text-gray-300 text-left">
                <span className="animate-pulse">{merchantAlerts[0]}</span>
              </div>
              <button
                onClick={() => setMerchantAlerts([])}
                className="text-gray-550 hover:text-white text-[9px] uppercase font-bold shrink-0 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* 📊 INTERFACE 3: MERCHANT HUB METRIC HIGHLIGHTS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 select-none">
            
            <div className="bg-[#050912]/95 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-gray-550 uppercase block tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neon-blue" />
                Bookings Mapped
              </span>
              <div className="mt-2.5 flex items-end justify-between">
                <strong className="text-xl font-display font-bold text-white">
                  {newRequests.length + activeJobs.length}
                </strong>
                <span className="text-[8px] font-mono text-neon-blue bg-neon-blue/10 px-1 py-0.2 rounded">
                  TODAY
                </span>
              </div>
            </div>

            <div className="bg-[#050912]/95 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-gray-550 uppercase block tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-neon-orange" />
                In Progress
              </span>
              <div className="mt-2.5 flex items-end justify-between">
                <strong className="text-xl font-display font-bold text-white">
                  {activeJobs.filter(j => j.status === "In Progress").length}
                </strong>
                <span className="text-[8px] font-mono text-neon-orange bg-neon-orange/10 px-1 py-0.2 rounded">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="bg-[#050912]/95 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-gray-550 uppercase block tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-neon-green" />
                Completed Jobs
              </span>
              <div className="mt-2.5 flex items-end justify-between">
                <strong className="text-xl font-display font-bold text-white">
                  {completedJobsCount}
                </strong>
                <span className="text-[8px] font-mono text-neon-green bg-neon-green/10 px-1 py-0.2 rounded font-bold uppercase">
                  VERIFIED
                </span>
              </div>
            </div>

            <div className="bg-[#050912]/95 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-gray-550 uppercase block tracking-wider flex items-center gap-1 flex-wrap">
                <TrendingUp className="w-3 h-3 text-neon-green" />
                Earnings Net (INR)
              </span>
              <div className="mt-2.5 flex items-end justify-between">
                <strong className="text-xl font-display font-bold text-neon-green">
                  ₹{dailyRevenue.toLocaleString()}
                </strong>
                <span className="text-[8px] font-mono text-gray-500">
                  -12% platform fee
                </span>
              </div>
            </div>

            <div className="bg-[#050912]/95 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[10px] font-mono text-gray-550 uppercase block tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 text-neon-yellow fill-neon-yellow/10" />
                Partner Rating
              </span>
              <div className="mt-2.5 flex items-end justify-between">
                <strong className="text-xl font-display font-bold text-white">4.92</strong>
                <span className="text-[8.5px] font-mono text-neon-purple font-bold">
                  TOP VERIFIED
                </span>
              </div>
            </div>

          </div>

          {/* 🎛️ PORTAL SUB-TAB NAVIGATION */}
          <div className="flex border-b border-slate-850 select-none overflow-x-auto gap-2">
            {[
              { id: "dashboard", label: "📊 Overview Hub" },
              { id: "new-requests", label: "📥 Booking Requests", count: newRequests.length },
              { id: "active-jobs", label: "🛠️ Active Workstation", count: activeJobs.length },
              { id: "ledger", label: "💰 Financial Ledger" },
              { id: "settings", label: "⚙️ Shop Preferences" }
            ].map(tab => {
              const isSelected = merchantTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                        playFeedBeep(520, 60, "sine");
                        setMerchantTab(tab.id as any);
                  }}
                  className={`py-3 px-4 font-mono text-[11px] font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    isSelected 
                      ? "border-neon-green text-neon-green bg-neon-green/5" 
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1.5 px-2 py-0.4 text-[9px] font-black rounded-full bg-neon-red text-white">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Screen Content */}
          
          {/* ========================================== */}
          {/* SUB-SCREEN 1: OVERVIEW HUB (SaaS STATS) */}
          {/* ========================================== */}
          {merchantTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Dynamic Revenue Trends Visualizer (Inline SVG lines) */}
              <div className="lg:col-span-8 bg-[#050912]/80 border border-slate-850 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-display font-extrabold text-sm uppercase flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-neon-green" />
                      Platform Performance Diagnostics
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Weekly earnings trajectory paired with customer intake parameters.
                    </p>
                  </div>
                  <div className="text-right font-mono text-[10px] text-gray-400">
                    <div>CYCLE: <strong className="text-neon-cyan">2026_MAY_ACTIVE</strong></div>
                  </div>
                </div>

                {/* Simulated Sparkline Trend chart (D3 style SVG Graph) */}
                <div className="h-44 bg-[#020409] border border-slate-855 rounded-xl relative p-4 flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-x-0 h-[1.5px] bg-slate-850/50" style={{ top: "25%" }} />
                  <div className="absolute inset-x-0 h-[1.5px] bg-slate-850/50" style={{ top: "50%" }} />
                  <div className="absolute inset-x-0 h-[1.5px] bg-slate-850/50" style={{ top: "75%" }} />
                  
                  {/* SVG paths representing revenue curves */}
                  <div className="flex-1 relative w-full flex items-end pt-3">
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0cf35a" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#0cf35a" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Line vector values: Mo, Tu, We, Th, Fr, Sa, Su */}
                      <path 
                        d="M 10,120 Q 80,90 150,110 T 290,60 T 430,70 T 570,30 L 700,30 L 700,140 L 0,140 Z" 
                        fill="url(#revenueGlow)"
                      />
                      <path 
                        d="M 10,120 Q 80,90 150,110 T 290,60 T 430,70 T 570,30" 
                        fill="none" 
                        stroke="#0cf35a" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                      />
                      
                      {/* Interactive plot points */}
                      <circle cx="10" cy="120" r="4" className="fill-neon-green" />
                      <circle cx="150" cy="110" r="4" className="fill-neon-green" />
                      <circle cx="290" cy="60" r="4" className="fill-neon-green" />
                      <circle cx="430" cy="70" r="4" className="fill-neon-green" />
                      <circle cx="570" cy="30" r="4" className="fill-neon-green animate-pulse" />
                    </svg>
                  </div>

                  <div className="flex justify-between font-mono text-[9px] text-gray-550 pt-1.5 border-t border-slate-905 mt-2">
                    <span>MON (₹8.2k)</span>
                    <span>TUE (₹11.0k)</span>
                    <span>WED (₹9.1k)</span>
                    <span>THU (₹14.8k)</span>
                    <span>FRI (₹12.2k)</span>
                    <span>SAT (₹18.4k)</span>
                    <span>SUN (TODAY)</span>
                  </div>
                </div>

                {/* Sub segments ratio visualizer */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-left">
                  <div className="bg-[#02050b] p-2 rounded-lg border border-slate-900 font-mono text-[10px]">
                    <span className="text-gray-550">SCREEN REVENUE</span>
                    <strong className="text-white block mt-0.5 font-bold">54% &bull; Featured</strong>
                  </div>
                  <div className="bg-[#02050b] p-2 rounded-lg border border-slate-900 font-mono text-[10px]">
                    <span className="text-gray-550">BATTERY SWAPPING</span>
                    <strong className="text-text block mt-0.5 font-bold">28% &bull; Solid</strong>
                  </div>
                  <div className="bg-[#02050b] p-2 rounded-lg border border-slate-900 font-mono text-[10px]">
                    <span className="text-gray-550">MOTHERBOARD CHIPS</span>
                    <strong className="text-text block mt-0.5 font-bold">18% &bull; Deep AI</strong>
                  </div>
                </div>

              </div>

              {/* MOCK GOOGLE MAP ROUTING PORTAL */}
              <div className="lg:col-span-4 bg-[#050912]/80 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-white font-display font-extrabold text-xs uppercase flex items-center gap-1 font-mono">
                    <Map className="w-4 h-4 text-neon-blue" />
                    COGNITIVE LOCATION ROADMAP
                  </h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Real-time visual route vector matrix for smartphone pickup & delivery.
                  </p>
                </div>

                {/* Abstract tech radar schematic layout portraying custom Indian neighborhood nodes */}
                <div className="my-3.5 h-36 bg-[#02050b] border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
                  
                  {/* Concentric circles */}
                  <div className="absolute w-28 h-28 rounded-full border border-neon-blue/10 animate-pulse" />
                  <div className="absolute w-16 h-16 rounded-full border border-neon-blue/5" />
                  
                  {/* Line crosshair */}
                  <div className="absolute inset-x-0 h-[1px] bg-slate-900" />
                  <div className="absolute inset-y-0 w-[1px] bg-slate-900" />

                  {/* Nodes list representing actual Bangalore localities */}
                  <div className="absolute top-8 left-12 flex flex-col items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                    <span className="text-[7.5px] font-mono text-gray-500">Koramangala Node</span>
                  </div>
                  <div className="absolute top-20 right-14 flex flex-col items-center">
                    <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-ping" />
                    <span className="w-1.5 h-1.5 bg-neon-blue rounded-full absolute" />
                    <span className="text-[7.5px] font-mono text-neon-blue font-bold">Indiranagar (HQ)</span>
                  </div>
                  <div className="absolute bottom-6 left-1/3 flex flex-col items-center">
                    <span className="w-1.5 h-1.5 bg-neon-green rounded-full" />
                    <span className="text-[7.5px] font-mono text-gray-500">BTM Node</span>
                  </div>

                  {/* Route trace line overlay */}
                  <svg className="absolute inset-0 w-full h-full">
                    <polyline 
                      points="48,32 144,80 110,118" 
                      fill="none" 
                      stroke="#00f0ff" 
                      strokeWidth="1.5" 
                      strokeDasharray="4,4" 
                      className="animate-pulse"
                    />
                  </svg>

                  <div className="absolute bottom-1.5 right-2 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider text-neon-green flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Mapped standard GPS logic
                  </div>
                </div>

                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-900 font-mono text-[9.5px] space-y-1 text-left">
                  <div className="flex justify-between"><span className="text-gray-500">OPTIMIZED DIRECT ROUTE:</span> <span className="text-white font-bold">80Ft Road Hub Trace</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">CURRENT PING RADAR:</span> <span className="text-neon-cyan">0.8km Range Active</span></div>
                </div>
              </div>

              {/* RATING & REVIEWS PORTAL */}
              <div className="lg:col-span-12 bg-[#050912]/80 border border-slate-850 p-5 rounded-2xl text-left space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-display font-extrabold text-sm uppercase flex items-center gap-1 font-mono">
                      <Star className="w-4 h-4 text-neon-yellow fill-neon-yellow/15" />
                      Customer Verified Reviews Feed
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Real feedback submitted via the DevicePulse decentralized rating engine.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {["⭐ Top Rated", "🔥 Fast Service", "🛠 Verified Partner"].map(badge => (
                      <span 
                        key={badge} 
                        className="text-[8px] font-mono text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/25 px-2 py-0.6 rounded-full font-bold"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {clientReviews.map((rev, index) => (
                    <div key={index} className="bg-[#02050b] p-3 rounded-xl border border-slate-900 font-mono text-[10.5px] flex flex-col justify-between">
                      <p className="text-gray-300 italic mb-2.5">
                        "{rev.text}"
                      </p>
                      <div className="flex justify-between items-center text-[9px] border-t border-slate-905 pt-2 mt-1">
                        <strong className="text-neon-cyan">{rev.author}</strong>
                        <span className="text-neon-yellow font-bold flex items-center gap-0.5">
                          {"★".repeat(rev.score)} ({rev.date})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* SUB-SCREEN 2: PENDING REQUISITIONS (NEW INCOMING JOB REQUESTS) */}
          {/* ========================================== */}
          {merchantTab === "new-requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono text-gray-400">
                  Awaiting Partner verification scan pipeline. Standard India diagnostic rules mapped.
                </span>
                <span className="text-xs font-mono font-bold text-neon-green">
                  {newRequests.length} REQUESTS AVAILABLE
                </span>
              </div>

              {newRequests.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-xl text-center py-16">
                  <Wrench className="w-8 h-8 text-slate-800 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    No pending booking requests. Keep the dashboard online to route next-generation requests dynamically!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="bg-[#060b13] border border-slate-850 p-5 rounded-2xl font-mono text-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-[#0cf35a]/10 text-neon-green border-b border-l border-[#0cf35a]/25 px-2.5 py-0.6 text-[8px] uppercase tracking-widest font-black">
                        {req.timestamp}
                      </div>

                      <div className="space-y-3.5 flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase block tracking-wider">CUSTOMER & MOBILE</span>
                            <strong className="text-white text-sm">{req.customer}</strong>
                            <span className="text-neon-blue block text-[11px] font-bold mt-0.5">{req.model}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-gray-500 block">COST ESTIMATED</span>
                            <span className="text-neon-green text-sm font-bold flex items-center justify-end">
                              <IndianRupee className="w-3.5 h-3.5" /> {req.estimatedCost}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-[#02050b] p-2.5 rounded-xl border border-slate-900 text-[10.5px]">
                          <div><span className="text-gray-500 block">ISSUE DIAGNOSED</span> <span className="text-white font-bold">{req.issue}</span></div>
                          <div><span className="text-gray-500 block">DISPATCH DISTANCE</span> <span className="text-white font-semibold">{req.distance} away</span></div>
                        </div>

                        {/* AI Core DIAGNOSIS PREVIEW */}
                        <div className="bg-[#0b1322]/80 border border-[#00f0ff]/25 p-3 rounded-xl">
                          <div className="flex items-center gap-1 text-neon-blue text-[10px] font-black uppercase mb-1.5 select-none text-left">
                            <Cpu className="w-3.5 h-3.5 animate-pulse text-neon-blue" />
                            <span>DevicePulse AI Diagnosis summary</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1.5 text-[9.5px] mb-2.5 pt-0.5">
                            <div><span className="text-gray-500 block uppercase text-[8px]">BATTERY WEAR</span> <strong className="text-white">{req.aiDiagnostics.batteryHealth}% Health</strong></div>
                            <div><span className="text-gray-500 block uppercase text-[8px]">THERMAL CELL</span> <strong className="text-white">{req.aiDiagnostics.tempCel}°C Hot</strong></div>
                            <div><span className="text-gray-500 block uppercase text-[8px]">FAILURE RISK</span> <strong className="text-neon-red font-bold">{req.aiDiagnostics.riskScore}% Risk</strong></div>
                          </div>

                          <div className="text-[10.5px] text-slate-300 border-t border-slate-850/50 pt-2 text-left">
                            <span className="text-gray-550 block text-[8px] uppercase font-bold text-neon-cyan leading-none mb-0.5">SUSPECTED DEFECT PARAMETER:</span>
                            "{req.aiDiagnostics.wearFactor}"
                          </div>
                        </div>
                      </div>

                      {/* Request Action operations */}
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-900 pt-3 select-none">
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-neon-red/80 py-2 rounded-lg font-bold text-[10.5px] transition-all cursor-pointer text-center"
                        >
                          Dismiss Job
                        </button>
                        <button
                          onClick={() => handleInitiateChat(req)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-neon-blue py-2 rounded-lg font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="bg-neon-green text-black hover:opacity-90 py-2 rounded-lg font-black text-[10.5px] transition-all cursor-pointer text-center uppercase tracking-wider"
                        >
                          Accept Job
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* SUB-SCREEN 3: ACTIVE REPAIRS SYSTEM WORKSTATION */}
          {/* ========================================== */}
          {merchantTab === "active-jobs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono text-gray-400">
                  Active diagnostic line tracking. Complete pending hardware calibrations promptly.
                </span>
                <span className="text-xs font-mono font-bold text-neon-orange">
                  {activeJobs.length} ONGOING REPAIRS
                </span>
              </div>

              {activeJobs.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-xl text-center py-16">
                  <CheckSquare className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    No active repair parameters to benchmark. Accept an incoming request from the pending queue!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => {
                    const isMuted = false;
                    return (
                      <div 
                        key={job.id} 
                        className="bg-[#050a12] border border-slate-850/80 p-5 rounded-2xl font-mono text-xs text-left grid grid-cols-1 lg:grid-cols-12 gap-5 relative overflow-hidden"
                      >
                        {/* Left structural Column details */}
                        <div className="lg:col-span-8 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold">REPAIR_ID: #{job.id}</span>
                            <span className="text-gray-650">&bull;</span>
                            <span className="text-neon-cyan uppercase font-bold text-[10.5px]">
                              {job.issue}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-805 pb-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div>
                                <h4 className="text-sm font-display font-bold text-white leading-none">{job.customer}</h4>
                                <span className="text-gray-400 text-[11px] block mt-1">{job.model} &bull; {job.phone}</span>
                              </div>
                              <button
                                onClick={() => {
                                  playFeedBeep(580, 80, "sine");
                                  const textVal = `Hello ${job.customer}, this is DevicePulse Partner Repair workshop updating you on your ${job.model} repair for ${job.issue}. Current Service Status is "${job.status}". Technical notes: ${job.notes}. Standard base quote remains securely synchronized!`;
                                  handleWhatsAppTriggerMessage(job.phone, textVal);
                                }}
                                className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] px-2.5 py-1 rounded text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                                title="Send Real-Time WhatsApp Direct Update"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                WhatsApp Customer
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-gray-500 block text-[9px] text-right">COMMITTED REPAIR TIMELINE</span>
                                <span className="text-white font-bold flex items-center justify-end gap-1">
                                  <Clock className="w-3.5 h-3.5 text-neon-orange animate-spin" style={{ animationDuration: '6s' }} /> 
                                  Elapsed timer
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Notes tracker & cost override sections */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 pt-1">
                            
                            <div className="space-y-1.5">
                              <label className="text-gray-550 text-[10px] block font-black uppercase">REPAIR LOG / INTERVENE NOTES</label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  placeholder="Update log notes..."
                                  className="w-full bg-[#020409] border border-slate-850 p-2 text-xs text-white rounded focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddJobNote(job.id, (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                                <span className="absolute right-2 top-2 text-[8px] text-gray-550">ENTER</span>
                              </div>
                              <p className="text-[11px] text-neon-blue italic leading-snug">
                                Current log: "{job.notes}"
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-gray-550 text-[10px] block font-bold uppercase">REPLACE PARTS LOG REGISTERS</label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  placeholder="Add part replacement serial..."
                                  className="w-full bg-[#020409] border border-slate-850 p-2 text-xs text-white rounded focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddPartReplacment(job.id, (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                                <span className="absolute right-2 top-2 text-[8px] text-gray-550">ENTER</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.partLog && job.partLog.map((p: string) => (
                                  <span key={p} className="text-[8.5px] bg-[#02050b] border border-slate-850 px-1.5 py-0.4 rounded text-gray-300">
                                    &bull; {p}
                                  </span>
                                ))}
                              </div>
                            </div>

                          </div>

                          {/* Job history diagnostic */}
                          <div className="bg-[#02050b] p-3 rounded-xl border border-slate-855 text-[10.5px]">
                            <span className="text-gray-500 uppercase block text-[8px] mb-1">AUDIT PATH TIME COGNITION LOG</span>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {job.historyLogs.map((log: string, idx: number) => (
                                <div key={idx} className="flex justify-between text-gray-300">
                                  <span>{indexToTimeString(idx)} &bull; {log}</span>
                                  <span className="text-neon-green">SUCCESS</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Right interactive Column dashboard selectors */}
                        <div className="lg:col-span-4 bg-slate-950/40 p-4 border-l lg:border-l border-slate-850/60 rounded-xl space-y-4 flex flex-col justify-between">
                          
                          {/* Cost value */}
                          <div>
                            <span className="text-gray-550 block text-[9.5px] uppercase">SERVICE INVOICE VAL (INR)</span>
                            <strong className="text-lg text-white block mt-0.5">
                              ₹{job.cost} <span className="text-[9px] text-gray-550 font-normal">Standard Match</span>
                            </strong>
                          </div>

                          {/* Interactive status select dropdown tracker */}
                          <div className="space-y-1">
                            <label className="text-gray-500 text-[10px] block font-bold uppercase">CHANGE REPAIR STATE</label>
                            <select
                              value={job.status}
                              onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                              className="w-full bg-[#02050b] border border-slate-850 p-2 rounded text-xs text-white"
                            >
                              <option value="Pending">Pending Assignment</option>
                              <option value="In Progress">In Progress (Active Solder)</option>
                              <option value="Waiting for parts">Waiting for parts (Import dispatch)</option>
                              <option value="Completed">Completed (Auto Pay trigger)</option>
                              <option value="Delivered">Delivered Service Hand-over</option>
                            </select>
                          </div>

                          {/* Side Actions list */}
                          <div className="pt-2 select-none space-y-2">
                            <button
                              onClick={() => handleInitiateChat(job)}
                              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-neon-blue py-1.5 rounded font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Open Secure Chat
                            </button>
                            
                            <button
                              onClick={() => handleUpdateJobStatus(job.id, "Completed")}
                              className="w-full bg-neon-green text-black hover:opacity-90 py-1.5 rounded font-extrabold uppercase tracking-widest text-[9.5px] text-center cursor-pointer block"
                            >
                              Mark Completed (Payout)
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* SUB-SCREEN 4: FINANCIAL LEDGER & REVENUE COMMISSION DETAIL */}
          {/* ========================================== */}
          {merchantTab === "ledger" && (
            <div className="bg-[#050912]/80 border border-slate-850 p-5 rounded-2xl text-left space-y-5 flex flex-col justify-between">
              <div>
                <h4 className="text-white font-display font-extrabold text-sm uppercase flex items-center gap-1.5 font-mono">
                  <Coins className="w-5 h-5 text-neon-green" />
                  India Partner Payouts & Commission Ledger
                </h4>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Secure routing of net profits to bank channels. Platform charges standard 10% on diagnostics mapping.
                </p>
              </div>

              {/* Grid ledger status summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                <div className="bg-[#02050b] border border-slate-900 p-3.5 rounded-xl text-left font-mono">
                  <span className="text-gray-500 uppercase block text-[9px]">Amaan Mohd Net Daily</span>
                  <strong className="text-white text-base block mt-1">₹{dailyRevenue.toLocaleString()}</strong>
                  <span className="text-[9px] text-[#0cf35a] block font-bold mt-1">Ready for Payout</span>
                </div>
                <div className="bg-[#02050b] border border-slate-900 p-3.5 rounded-xl text-left font-mono">
                  <span className="text-gray-500 uppercase block text-[9px]">Est Month Earnings</span>
                  <strong className="text-white text-base block mt-1">₹3,82,400</strong>
                  <span className="text-[9px] text-neon-blue block font-semibold mt-1">Synced with ledger node</span>
                </div>
                <div className="bg-[#02050b] border border-slate-900 p-3.5 rounded-xl text-left font-mono">
                  <span className="text-gray-500 uppercase block text-[9px]">Commission Deducted (10%)</span>
                  <strong className="text-neon-red text-base block mt-1">
                    ₹{(dailyRevenue * 0.1).toFixed(0)}
                  </strong>
                  <span className="text-[9px] text-gray-550 block mt-1">DevicePulse platform share</span>
                </div>
                <div className="bg-[#02050b] border border-neon-green/20 p-3.5 rounded-xl text-left font-mono bg-linear-to-b from-slate-900/40 to-transparent">
                  <span className="text-gray-400 font-bold uppercase block text-[9px]">Net Shop Profit</span>
                  <strong className="text-[#0cf35a] text-lg block mt-1 font-black">
                    ₹{(dailyRevenue * 0.9).toFixed(0)}
                  </strong>
                  <span className="text-[8.5px] text-neon-green font-bold block mt-1">LEVEL 2 SECURITY CLEAR</span>
                </div>
              </div>

              {/* Secure verification bank card */}
              <div className="bg-[#0c1822]/40 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 font-mono text-[11px]">
                  <h5 className="text-white uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-neon-green animate-pulse" />
                    Secure Bank Ledger Authorization (OTP Gateway)
                  </h5>
                  <p className="text-gray-400">
                    Routing Bank: IND &bull; ACC TERMINAL: **********5511 &bull; Payout signature: Amaan Mohd &bull; KYC Code: level-2-auth.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={handleTriggerBankVerify}
                    className="bg-neon-green text-black hover:opacity-90 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Authorize Payout Node
                  </button>
                </div>
              </div>

              {/* OTP Input block modal drawer inline */}
              {showOtpGate && (
                <form 
                  onSubmit={handleValidateOtp}
                  className="bg-[#03070d] border border-neon-cyan p-4 rounded-xl space-y-3 font-mono animate-fade-in"
                >
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
                    <span className="text-[10px] font-black uppercase text-neon-cyan tracking-wider flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> SECURE DESTRY OPT AUTHORIZATION GATEWAY
                    </span>
                    <button
                      onClick={() => setShowOtpGate(false)}
                      className="text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-8 space-y-1.5">
                      <label className="text-gray-500 text-[10px] block">SECURITY VERIFICATION SIGNATURE OTP CODE</label>
                      <input 
                        type="password"
                        required
                        placeholder="INPUT REGISTERED PIN SECURE SIGNATURE (try code: 1995)"
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value)}
                        className="w-full bg-[#02050b] border border-slate-800 rounded p-2 text-xs text-white placeholder-gray-650"
                      />
                    </div>
                    <button
                      type="submit"
                      className="sm:col-span-4 bg-neon-cyan text-black hover:opacity-95 text-xs font-bold py-2 px-3 rounded text-center cursor-pointer uppercase tracking-wider"
                    >
                      Submit Code Signature
                    </button>
                  </div>

                  {verificationError && (
                    <p className="text-neon-red text-[11px] font-bold">
                      {verificationError}
                    </p>
                  )}
                </form>
              )}

            </div>
          )}

          {/* ========================================== */}
          {/* SUB-SCREEN 5: SHOP PREFERENCES & SETTINGS */}
          {/* ========================================== */}
          {merchantTab === "settings" && (
            <div className="bg-[#050912]/85 border border-slate-850 p-5 rounded-2xl text-left space-y-6">
              
              <div className="border-b border-slate-850 pb-4">
                <h4 className="text-white font-display font-extrabold text-sm uppercase flex items-center gap-1 font-mono">
                  <Settings className="w-4 h-4 text-neon-green" />
                  Workshop Configuration panel
                </h4>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Update your active pricing parameters, scheduling slots, and Premium booster visibility option.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                
                {/* Level 1: Pricing configuration schema */}
                <div className="space-y-4 bg-[#02050b]/80 p-4 border border-slate-900 rounded-xl text-left">
                  <h5 className="text-white font-black uppercase text-[10px] tracking-wider border-b border-slate-900 pb-2 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-neon-cyan" /> Configure Catalog Price Points
                  </h5>

                  <div className="space-y-3 text-[11px]">
                    {Object.keys(pricingLevels).map((serviceName) => (
                      <div key={serviceName} className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-905">
                        <span className="text-gray-300 font-bold">{serviceName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-550">₹</span>
                          <input 
                            type="number"
                            value={pricingLevels[serviceName]}
                            onChange={(e) => {
                              const inputVal = parseInt(e.target.value) || 0;
                              setPricingLevels(prev => ({ ...prev, [serviceName]: inputVal }));
                            }}
                            className="bg-black border border-slate-800 p-1 rounded text-right text-neon-cyan w-20 text-[11px] h-6 focus:outline-none focus:border-neon-cyan"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-500 leading-snug">
                    Price shifts update in real-time on client booking selectors.
                  </p>
                </div>

                {/* Level 2: Platform listings featured status */}
                <div className="space-y-4 bg-[#02050b]/80 p-4 border border-slate-900 rounded-xl text-left">
                  <h5 className="text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900 pb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-neon-purple animate-pulse" /> Platform Visibility Booster
                  </h5>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-905">
                      <div>
                        <span className="text-white block font-bold leading-none">PREMIUM FEATURED STATUS BOOST</span>
                        <span className="text-[9.5px] text-gray-500 font-mono mt-1 block">Pay 1.5% ad commission multiplier to stay in top searches.</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          playFeedBeep(800, 100, "sine");
                          setIsPremiumBoosted(!isPremiumBoosted);
                          setMerchantAlerts(prev => [`Featured listing setting updated to: ${!isPremiumBoosted}`, ...prev]);
                        }}
                        className={`px-3 py-1.5 rounded font-black text-[9.5px] uppercase transition-colors shrink-0 cursor-pointer ${
                          isPremiumBoosted 
                            ? "bg-neon-purple text-white shadow-[0_0_10px_rgba(157,0,255,0.45)]" 
                            : "bg-slate-900 border border-slate-800 text-gray-500"
                        }`}
                      >
                        {isPremiumBoosted ? "BOOST ACTIVE" : "BOOST INACTIVE"}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-900 p-1.5 text-[10.5px] text-gray-400 space-y-2 leading-relaxed">
                      <div><strong>Active Working Hours:</strong> 09:30 AM to 08:30 PM (Weekly Off: Sunday)</div>
                      <div><strong>Workshop Staff Count:</strong> 4 Hardware Engineers Linked</div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ========================================== */}
          {/* DIALOG POPOVER MODAL: SECURE CUSTOMER TERMINAL REAL-TIME CHAT */}
          {/* ========================================== */}
          {activeChatNode && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
              <div className="w-full max-w-md bg-[#04060b] border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left">
                
                {/* Chat popover header */}
                <div className="bg-gradient-to-b from-[#080d17] to-[#04060c] p-4 border-b border-slate-900 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-neon-blue" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-black text-white leading-none">
                        CLIENT: {activeChatNode.customer}
                      </h4>
                      <span className="text-[8px] font-mono text-neon-green tracking-wider uppercase bg-[#0d160f] px-1.5 py-0.2 rounded mt-1 inline-block border border-neon-green/25 font-bold">
                        SECURE LOG ENCRYPTED
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      playFeedBeep(400, 80, "triangle");
                      setActiveChatNode(null);
                    }}
                    className="text-gray-500 hover:text-white p-1 rounded hover:bg-slate-900/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Dialog Messages logs body */}
                <div className="p-4 flex-1 h-80 overflow-y-auto space-y-3 font-mono text-[11px] select-text bg-[#020306]/85">
                  {chatMessages.map((msg, index) => {
                    const isMerchant = msg.sender === "merchant";
                    const isSys = msg.sender === "system";
                    
                    if (isSys) {
                      return (
                        <div key={index} className="text-center text-neon-blue text-[9.5px] uppercase font-bold py-1.5 border-y border-slate-905/60 tracking-wider">
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={index} 
                        className={`flex flex-col ${isMerchant ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[7.5px] text-gray-500 uppercase tracking-widest block mb-0.5">
                          {isMerchant ? "Beng CyberCell Desk" : activeChatNode.customer}
                        </span>
                        <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                          isMerchant 
                            ? "bg-neon-green/10 text-[#0cf35a] border border-neon-green/30 rounded-tr-none text-right" 
                            : "bg-slate-900/90 text-white rounded-tl-none border border-slate-800 text-left"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message write box input */}
                <div className="p-3 border-t border-slate-900 bg-[#04060a]/95 flex items-center gap-2 select-none">
                  <input 
                    type="text"
                    placeholder="Type encrypted reply to client..."
                    value={chatInputMessage}
                    onChange={(e) => setChatInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChatMessage();
                    }}
                    className="flex-1 bg-black border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-neon-green"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    className="bg-neon-green text-black hover:opacity-90 inline-block p-2 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================== */}
      {/* DIALOG POPOVER MODAL: SECURE BOOKING FORM (CUSTOMER SLOT ACQUISITION) */}
      {/* ========================================== */}
      {isBookingModalOpen && activeBookingShop && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-[#04060a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative text-left">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green animate-pulse" />

            <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-[#070c17]">
              <div>
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <Wrench className="w-4 h-4 text-neon-blue" />
                  ACQUIRE SECURE REPAIR TICKET
                </h4>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  At: <strong className="text-white">{activeBookingShop.name}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  playFeedBeep(400, 80, "triangle");
                  setIsBookingModalOpen(false);
                }}
                className="text-gray-550 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4 font-mono text-xs text-left">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-[10px] block mb-1">USER MOBILE MODEL</label>
                  <input
                    type="text"
                    required
                    value={userModel}
                    onChange={(e) => setUserModel(e.target.value)}
                    className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] block mb-1 font-bold">SELECT CORRUPTION REASON</label>
                  <select
                    value={selectedIssue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                    className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                  >
                    {activeBookingShop.services.map(ser => (
                      <option key={ser} value={ser}>{ser} (₹{activeBookingShop.basePrices[ser] || 1500})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-[10px] block mb-1">APPOINTMENT DATE</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-[10px] block mb-1">PREFERRED HOUR</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white focus:outline-none focus:border-neon-blue"
                  >
                    <option value="10:00 AM">10:00 AM - Morning</option>
                    <option value="11:30 AM">11:30 AM - Early Lunch</option>
                    <option value="02:00 PM">02:00 PM - Afternoon</option>
                    <option value="04:30 PM">04:30 PM - Tea Hour</option>
                    <option value="06:00 PM">06:00 PM - Evening Drift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-[10px] block mb-1">CLIENT NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amaan Mohd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div>
                <label className="text-gray-500 text-[10px] block mb-1">CONTACT MOBILE NUMBER (+91)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98124 55110"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-[#03070d] border border-slate-805 rounded p-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div className="bg-[#031d24]/50 border border-neon-blue/20 p-3 rounded text-[10px] text-neon-blue flex items-start gap-2 text-left">
                <ShieldCheck className="w-4 h-4 shrink-0 text-neon-blue" />
                <span>
                  Anti-Fraud telemetry algorithm engaged. Telemetry score is pre-transmitted to match quotes accurately, preventing secondary pricing exploitation.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-neon-blue text-black hover:opacity-90 py-2.5 rounded-lg font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                >
                  ACQUIRE TICKET SIGNATURE
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DIALOG POPOVER MODAL: WHATSAPP CALL SIMULATOR */}
      {/* ========================================== */}
      {activeWhatsAppCall && (
        <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0b141a] border border-[#128C7E]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-center text-white p-6 font-mono text-xs">
            
            {/* Top decorative WhatsApp band */}
            <div className="flex justify-between items-center text-[10px] text-gray-400 mb-6">
              <span className="flex items-center gap-1 text-[#25D366]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                SECURE CALL
              </span>
              <span>WhatsApp Audio Call</span>
            </div>

            {/* Profile Avatar Container with double green pulsing rings */}
            <div className="relative mx-auto my-6 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 ${whatsAppCallStatus === "dialing" ? "animate-ping scale-110" : "scale-105"}`} style={{ animationDuration: '2.5s' }} />
              <div className={`absolute inset-0 rounded-full bg-[#25D366]/5 border border-[#25D366]/15 ${whatsAppCallStatus === "dialing" ? "animate-ping scale-150" : "scale-110"}`} style={{ animationDuration: '3.5s', animationDelay: '0.8s' }} />
              
              <div className="w-24 h-24 rounded-full bg-[#075E54] border border-[#128C7E]/45 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl z-10">
                {activeWhatsAppCall.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
            </div>

            {/* Caller ID Details */}
            <h3 className="text-base font-bold tracking-tight text-white mb-0.5">{activeWhatsAppCall.name}</h3>
            <p className="text-[11px] text-gray-400">{activeWhatsAppCall.phone}</p>
            <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">{activeWhatsAppCall.address}</p>

            {/* Call State / Subtitles */}
            <div className="my-5 min-h-[55px] p-3 rounded-xl bg-slate-950/80 border border-slate-900 flex items-center justify-center">
              {whatsAppCallStatus === "dialing" && (
                <div className="text-[10.5px] text-[#25D366] font-semibold animate-pulse flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" />
                  Ringing mobile phone line...
                </div>
              )}
              {whatsAppCallStatus === "connected" && (
                <div className="space-y-1 w-full">
                  <div className="text-[8px] text-gray-550 font-bold tracking-widest uppercase">LIVE TECHNICIAN CAPTION</div>
                  <p className="text-xs text-[#25D366] leading-relaxed italic px-2">
                    "{whatsAppCallSpeakerText}"
                  </p>
                  <p className="text-[9px] text-gray-500">
                    Call timer: {Math.floor(whatsAppCallTimer / 60)}:{(whatsAppCallTimer % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              )}
              {whatsAppCallStatus === "ended" && (
                <p className="text-[11px] text-red-400 font-bold">
                  Call Finished. Line disconnected.
                </p>
              )}
            </div>

            {/* Simulated tech voice response options */}
            {whatsAppCallStatus === "connected" && (
              <div className="space-y-2 mb-6">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">SPEAK TO MERCHANT</span>
                <div className="grid grid-cols-1 gap-2 text-left">
                  <button 
                    onClick={() => {
                      playFeedBeep(520, 80, "sine");
                      setWhatsAppCallSpeakerText(`Haanji sir! I will align genuine OnePlus parts for ${clientName}. Cost is set standard ₹850, base model standard price limits!`);
                    }}
                    className="bg-[#0e1d1f] hover:bg-[#1a383d] border border-[#128C7E]/30 p-2.5 rounded-xl text-[10.5px] text-gray-300 transition-all cursor-pointer"
                  >
                    💬 "What is the OnePlus battery repair charge?"
                  </button>
                  <button 
                    onClick={() => {
                      playFeedBeep(520, 80, "sine");
                      setWhatsAppCallSpeakerText(`Haanji Amaan, we are running automated diagnostic checks using DevicePulse API. It will take only 30 mins to align screen controller!`);
                    }}
                    className="bg-[#0e1d1f] hover:bg-[#1a383d] border border-[#128C7E]/30 p-2.5 rounded-xl text-[10.5px] text-gray-300 transition-all cursor-pointer"
                  >
                    💬 "When will my standard screen be dispatch-ready?"
                  </button>
                  <button 
                    onClick={() => {
                      playFeedBeep(520, 80, "sine");
                      setWhatsAppCallSpeakerText("Done sir! Dispatched real WhatsApp reminder details link to your target slot index right now!");
                      setTimeout(() => {
                        const messageText = `Hello! This is ${activeWhatsAppCall.name}. We confirm receipt of your priority DevicePulse repair booking. OnePlus details synced at base ₹${bookingTicket ? bookingTicket.cost : 850}. Complete checkout standard!`;
                        handleWhatsAppTriggerMessage(activeWhatsAppCall.phone, messageText);
                      }, 1850);
                    }}
                    className="bg-[#128C7E]/20 hover:bg-[#128C7E]/30 border border-[#25D366]/40 p-2.5 rounded-xl text-[11px] text-[#25D366] transition-all cursor-pointer font-black"
                  >
                    💬 "Done, send me a WhatsApp message reminder!"
                  </button>
                </div>
              </div>
            )}

            {/* Circular End Call Button */}
            <div className="flex justify-center mt-2.5">
              <button
                onClick={() => {
                  playFeedBeep(220, 250, "triangle");
                  setWhatsAppCallStatus("ended");
                  setTimeout(() => {
                    setActiveWhatsAppCall(null);
                  }, 1200);
                }}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 flex items-center justify-center transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                title="Disconnect Call"
              >
                <X className="w-7 h-7 text-white rotate-45" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Helper: Generates arbitrary hours string for history audit
function indexToTimeString(idx: number) {
  const times = ["04:15 PM", "04:18 PM", "04:35 PM", "05:02 PM", "05:10 PM", "05:22 PM", "05:40 PM"];
  return times[idx] || "Just now";
}
