import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { adminDb } from "./server/firebase-admin";

dotenv.config();

const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const app = express();
const PORT = 3000;

async function startServer() {
  // Use raw body for Razorpay webhook verification
  app.use("/api/razorpay/webhook", express.raw({ type: 'application/json' }));
  app.use(express.json());

  // Initialize Razorpay
  let rzp: any = null;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    rzp = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  // --- RAZORPAY ROUTES ---

  // Check subscription status
  app.get("/api/subscription/status", async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) return res.status(400).json({ error: "UID required" });

      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return res.json({ status: "FREE" });
      }

      const data = userDoc.data();
      // Check if expired
      if (data?.expiryDate) {
        const expiry = new Date(data.expiryDate).getTime();
        const now = Date.now();
        if (now > expiry && data.subscriptionStatus !== "FREE") {
          // Auto-expire
          await adminDb.collection("users").doc(uid).update({
            subscriptionStatus: "FREE"
          });
          return res.json({ status: "FREE", expired: true });
        }
      }

      res.json({ 
        status: data?.subscriptionStatus || "FREE",
        expiryDate: data?.expiryDate,
        planId: data?.planId
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Webhook handler
  app.post("/api/razorpay/webhook", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"] as string;
    
    if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).send("No signature or secret");
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) 
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    // Handle subscription events
    try {
      if (event.event === "subscription.charged") {
        const subscription = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        
        // Find user by subscription ID
        const usersRef = adminDb.collection("users");
        const snapshot = await usersRef.where("subscriptionId", "==", subscription.id).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: "PRO",
            expiryDate: new Date(subscription.current_end * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else if (event.event === "subscription.cancelled" || event.event === "subscription.expired") {
        const subscription = event.payload.subscription.entity;
        const snapshot = await adminDb.collection("users").where("subscriptionId", "==", subscription.id).get();
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: "FREE",
            updatedAt: new Date().toISOString()
          });
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Internal Error");
    }
  });

  // Manual trigger to associate subscription ID (called from frontend after checkout opens)
  app.post("/api/subscription/associate", async (req, res) => {
    const { uid, subscriptionId, planId, status } = req.body;
    if (!uid || !subscriptionId) return res.status(400).json({ error: "Missing fields" });

    try {
      let finalStatus: "FREE" | "PRO" | "ULTRA" = "FREE";
      if (status === "ULTRA" || status === "ultra") {
        finalStatus = "ULTRA";
      } else if (status === "PRO" || status === "pro" || status === "ACTIVE" || status === "active") {
        finalStatus = "PRO";
      }

      await adminDb.collection("users").doc(uid).set({
        uid,
        subscriptionId,
        planId,
        subscriptionStatus: finalStatus, 
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days active
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, status: finalStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamically create a subscription ID for a clean checkout session
  app.post("/api/subscription/create", async (req, res) => {
    try {
      const { planId, uid } = req.body;
      const targetPlanId = planId || "plan_StVujNG2NZOltP";

      if (rzp) {
        const subscription = await rzp.subscriptions.create({
          plan_id: targetPlanId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1,
        });
        res.json({ subscriptionId: subscription.id });
      } else {
        const fallbackId = "sub_" + Math.random().toString(36).substring(2, 17);
        res.json({ subscriptionId: fallbackId, simulated: true });
      }
    } catch (err: any) {
      console.warn("Razorpay SDK subscription failed, using simulated fallback:", err);
      const fallbackId = "sub_" + Math.random().toString(36).substring(2, 17);
      res.json({ subscriptionId: fallbackId, simulated: true });
    }
  });

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      aiEnabled: !!ai,
      hasKeyEnv: !!process.env.GEMINI_API_KEY
    });
  });

  // Voice Diagnostic & Real-time Language Engine Endpoint
  app.post("/api/gemini/voice-engineer", async (req, res) => {
    try {
      const { userMessage, language, telemetry } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "User spoken input is required." });
      }

      if (!ai) {
        // Return simulated rule-based voice engineer responses if Gemini isn't available
        // to keep the app 100% functional and interactive.
        const msg = (userMessage || "").toLowerCase();
        let answer = "";
        let intent = "device_health_summary";
        let delta = null;

        if (msg.includes("garam") || msg.includes("heat") || msg.includes("temp") || msg.includes("cool")) {
          intent = "thermal_status";
          if (language === "Hindi") {
            answer = `तापमान ${telemetry.cpuTemp || 41}°C पर दर्ज हुआ है। सिलिकॉन कोर थर्मल्स को ठंडा करने के लिए कूलिंग प्रोटोकॉल की सलाह दी जाती है।`;
          } else if (language === "Hinglish") {
            answer = `CPU temperature abhi ${telemetry.cpuTemp || 41}°C ho raha hai. Is thermal stress ko optimize karne ke liye immediate throttling protocol chalana chahiye.`;
          } else if (language === "Tamil") {
            answer = `வெப்பநிலை ${telemetry.cpuTemp || 41}°C ஆக உள்ளது. CPU-வை குளிர்விக்க மேம்படுத்தல் தேவைப்படுகிறது.`;
          } else if (language === "Telugu") {
            answer = `ఉష్ణోగ్రత ${telemetry.cpuTemp || 41}°C కి చేరింది. సిలికాన్ కోర్ హీట్ తగ్గించడానికి కూలింగ్ మోడ్ రన్ చేయండి.`;
          } else if (language === "Bengali") {
            answer = `তাপমাত্রা ${telemetry.cpuTemp || 41}°C চিহ্নিত হয়েছে। সিপিইউ কুলিং প্রোটোকল অ্যাক্টিভেট করার পরামর্শ দেওয়া হচ্ছে।`;
          } else if (language === "Urdu") {
            answer = `درجہ حرارت ${telemetry.cpuTemp || 41}°C ہے۔ تھرمل لوڈ کم کرنے کے لیے کولنگ سسٹم کو چالو کریں۔`;
          } else {
            answer = `Junction core temperature is at ${telemetry.cpuTemp || 41}°C indicating high thermal retention load. Recommend starting safety thermal cooldown.`;
          }
          if (msg.includes("optimize") || msg.includes("tik") || msg.includes("theek") || msg.includes("cool") || msg.includes("thanda")) {
            delta = { action: "cool" };
          }
        } else if (msg.includes("battery") || msg.includes("charge") || msg.includes("current")) {
          intent = "battery_status";
          if (language === "Hindi") {
            answer = `बैटरी हेल्थ ${telemetry.batteryScore}% पर संरेखित है। बैटरी तापमान ${telemetry.batteryTemp}°C है। GaN चार्जर हीट का विशेष ध्यान रखें।`;
          } else if (language === "Hinglish") {
            answer = `Battery health status ${telemetry.batteryScore}% hai. Cells fully safe hain par battery temperature ${telemetry.batteryTemp}°C hone par wireless charger se bachein.`;
          } else if (language === "Tamil") {
            answer = `பேட்டரி ஆயுள் ${telemetry.batteryScore}% ஆக உள்ளது. பேட்டரி வெப்பநிலை ${telemetry.batteryTemp}°C ஆக பதிவாகியுள்ளது.`;
          } else if (language === "Telugu") {
            answer = `బ్యాటరీ హెల్త్ ${telemetry.batteryScore}% గా ఉంది. బ్యాటరీ ఉష్ణోగ్రత ${telemetry.batteryTemp}°C వద్ద ఉండటం వల్ల చార్జింగ్ పై అవగాహన అవసరం.`;
          } else if (language === "Bengali") {
            answer = `ব্যাটারি লাইফ ${telemetry.batteryScore}% এবং ব্যাটারির তাপমাত্রা ${telemetry.batteryTemp}°C রেকর্ড করা হয়েছে।`;
          } else if (language === "Urdu") {
            answer = `بیٹری کی صحت ${telemetry.batteryScore}% ہے۔ بیٹری کا درجہ حرارت ${telemetry.batteryTemp}°C ریکارڈ کیا گیا ہے۔`;
          } else {
            answer = `Anode battery core status is aligned at ${telemetry.batteryScore}% health with a voltage stability rating of ${telemetry.voltageStability}V.`;
          }
        } else if (msg.includes("optimize") || msg.includes("clean") || msg.includes("speed") || msg.includes("slow") || msg.includes("lag") || msg.includes("theek") || msg.includes("saaf")) {
          intent = "optimization_suggestion";
          delta = { action: "ram" };
          if (language === "Hindi") {
            answer = `सिस्टम कोर मेमोरी को अभी संकुचित कर दिया हूँ। रेम पर अनपेक्षित बैकग्राउंड लोड 40% कम कर दिया गया है।`;
          } else if (language === "Hinglish") {
            answer = `Application performance optimization system activate kar diya gaya hai. Memory leak blocks successfully flush ho gaye hain.`;
          } else if (language === "Tamil") {
            answer = `ரேம் சேமிப்பு மேம்படுத்தப்பட்டுள்ளது. பின்னணி செயல்கள் நிறுத்தப்பட்டு வேகம் அதிகரிக்கப்பட்டுள்ளது.`;
          } else if (language === "Telugu") {
            answer = `మెమరీ ఆప్టిమైజేషన్ విజయవంతంగా పూర్తయింది. బ్యాక్‌గ్రౌండ్ యాప్స్ క్లోజ్ చేయబడ్డాయి.`;
          } else if (language === "Bengali") {
            answer = `মেমরি অপ্টিমাইজেশন সম্পন্ন হয়েছে। র‍্যামের চাপ সফলভাবে হ্রাস করা হয়েছে।`;
          } else if (language === "Urdu") {
            answer = `سسٹم میموری کو بہتر بنا دیا گیا ہے۔ غیر ضروری پس منظر ایپس کو بند کر دیا گیا ہے۔`;
          } else {
            answer = `Governor optimization suite triggered. Reclaimed active swap blocks, restoring logical performance flow.`;
          }
        } else {
          if (language === "Hindi") {
            answer = `नमस्ते! मैं डिवाइसपल्स वॉइस इंजीनियर हूँ। कुल हेल्थ स्कोर ${telemetry.batteryScore}% है। मैं बैटरी, सिलिकॉन तापीय स्थिति और स्टोरेज की जांच कर सकता हूँ।`;
          } else if (language === "Hinglish") {
            answer = `DevicePulse System check complete. Overall score is ${telemetry.perfScore}%. Aap phone thermal load ya battery health ke baare me pooch sakte hain.`;
          } else if (language === "Tamil") {
            answer = `வணக்கம்! நான் உங்கள் சாதன பொறியாளர். மொத்த ஆரோக்கிய மதிப்பீடு ${telemetry.perfScore}% ஆகும்.`;
          } else if (language === "Telugu") {
            answer = `నమస్కారం! నేను డివైస్‌పల్స్ వాయిస్ ఇంజనీర్‌ని. మొత్తం హెల్త్ స్కోర్ ${telemetry.perfScore}% గా ఉంది.`;
          } else if (language === "Bengali") {
            answer = `হ্যালো! আমি আপনার ডিভাইসপলস ভয়েস ইঞ্জিনিয়ার। সামগ্রিক স্বাস্থ্য স্কোর ${telemetry.perfScore}%।`;
          } else if (language === "Urdu") {
            answer = `ہیلو! میں آپ کا ڈیوائس پلس وائس انجینئر ہوں۔ مجموعی ہیلتھ اسکور ${telemetry.perfScore}% ہے۔`;
          } else {
            answer = `Hello! I am your DevicePulse audio hardware engineer diagnosing node statuses. Overall score is optimal at ${telemetry.perfScore}%. Give a parameter to scan.`;
          }
        }

        return res.json({
          responseText: answer,
          speechReadyText: answer,
          intentDetected: intent,
          telemetryDelta: delta
        });
      }

      // If Gemini IS available, get high fidelity diagnostic responses in target languages!
      const currentTelemetrySummary = `
- System Overall Health Weighted: ${Math.round(telemetry.batteryScore * 0.3 + telemetry.thermalScore * 0.3 + telemetry.perfScore * 0.2 + telemetry.storageScore * 0.2)}%
- Battery Score: ${telemetry.batteryScore}%, Temp: ${telemetry.batteryTemp}°C, Voltage: ${telemetry.voltageStability}V
- CPU Temp: ${telemetry.cpuTemp}°C, Thermal Spikes: ${telemetry.thermalSpikes} spikes
- Ram Pressure: ${telemetry.ramPressure}%, cpu usage: ${telemetry.cpuUsage}%
- Storage Score: ${telemetry.storageScore}%, Sectors: ${telemetry.sectorsScanned}
- Current Level Profile: ${telemetry.stressLevel || 'Normal'}
`;

      const prompt = `
You are the DevicePulse Voice Engineer, an expert hardware maintenance diagnostics AI. Your tone is highly professional, authoritative, analytical, and respectful. Use correct device engineering and physics terminology.

The user spoken input is: "${userMessage}".
The requested output language is: "${language}".

Here is the active live hardware telemetry:
${currentTelemetrySummary}

Determine the user's intent. The valid intents are:
- battery_status (user inquiry or complaint about battery health, cycle, charging)
- thermal_status (user inquiry about heat, temperature, phone getting hot)
- performance_check (user asking if phone is slow, has lag, RAM usage)
- storage_health (user asking about capacity, directories, bad blocks, latency)
- device_health_summary (general check of overall hardware)
- optimization_suggestion (asking to optimize, clean, clear, speed up)

Generate a JSON object containing the exact response in the target language. Preserve the requested voice style:
- English: Professional, scientific, and succinct.
- Hindi: Written in Devanagari script. Use clear hardware engineering terms combined with natural Hindi syntax.
- Hinglish: Written in Latin alphabet, a fluid, popular mix of Hindi syntax and English tech nouns (e.g. "Heat levels thode high hain, thermal throttling prevent karne ke liye system optimized kiya hai"). Perfect for technical conversational voice.
- Bengali: Written in Bengali script. Genuine diagnostic insight.
- Tamil: Written in Tamil script. Authentic technical Tamil terminology.
- Telugu: Written in Telugu script. Authoritative, helpful Telugu engineering tone.
- Urdu: Written in Nastaliq/Urdu script or clean Urdu text. Elegant, respectful and logical Urdu.

If the user asked to optimize, cool, clear, or fix things, include a non-null "telemetryDelta" action in the JSON: {"action": "cool"} for heat questions, {"action": "ram"} for performance/cleaning, {"action": "storage"} for memory scan issues.

Return ONLY a perfectly formatted JSON containing exactly this schema (No markdown, no wrapper):
{
  "responseText": "Detailed engineering diagnosis response in the absolute target language.",
  "speechReadyText": "Slightly shorter, punchy audio-friendly rendering of the response.",
  "intentDetected": "one of the core intents listed above",
  "telemetryDelta": null or {"action": "cool" | "ram" | "storage"}
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const payload = JSON.parse(cleaned);
      return res.json(payload);
    } catch (err: any) {
      console.error("Voice diagnosis error:", err);
      // Fallback
      return res.json({
        responseText: "Diagnostic engine logic timed out. Let's run manual local diagnostics.",
        speechReadyText: "Diagnostic engine offline. Initiating automated local diagnostics.",
        intentDetected: "device_health_summary",
        telemetryDelta: null
      });
    }
  });

  // Interactive Chat Assistant with Device Telemetry Context
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { userMessage, telemetry, history = [] } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "Message input is required." });
      }

      const currentTelemetrySummary = telemetry 
        ? `
- Model Info: ${telemetry.modelName || 'Device Node'}
- Overall Health Index: ${telemetry.batteryScore}%
- Battery: Score ${telemetry.batteryScore}%, Temp ${telemetry.batteryTemp}°C, Voltage ${telemetry.voltageStability}V, State: ${telemetry.chargingState}
- Thermal System: Current CPU ${telemetry.cpuTemp}°C, Spikes ${telemetry.thermalSpikes}
- System Logic: RAM Used ${telemetry.ramPressure}%, CPU Used ${telemetry.cpuUsage}%, Lag Spikes ${telemetry.lagSpikes}/min
- SSD Storage: Score ${telemetry.storageScore}%, Used ${telemetry.storageUsed}%
- Stress State Profile: ${telemetry.stressLevel || 'Standard'}
`
        : "Standard offline device defaults.";

      const chatHistoryText = history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join("\n");

      let reply = "";
      if (ai) {
        const prompt = `
You are the DevicePulse AI Device Brain, a highly advanced, empathetic, and expert device diagnostic, maintenance, and optimization AI.
You have direct real-time access to the user's active device hardware telemetry and performance registers.

User is asking: "${userMessage}"

The current real-time system telemetry state is:
${currentTelemetrySummary}

Past conversation:
${chatHistoryText}

Respond clearly, explaining the mechanical or systemic reason behind their query (e.g. why battery drains under thermal stress, why RAM allocation causes lag, what GaN chargers do, etc.).
Keep it conversational, helpful, and scientific yet accessible. Use bullet points if offering actionable self-repair or optimization advice.
If user asks in Hindi/Hinglish, reply in Hinglish/Hindi or English as suitable.
Return raw conversational text as plain text or light markdown (with bullet points). Keep your response under 160 words.
Do NOT use flowery language. Direct and helpful, as a device intelligence agent.
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        reply = response.text || "Diagnostic query processed. Keep silicon structures optimal.";
      } else {
        // High fidelity offline rule-based response
        const msg = userMessage.toLowerCase();
        const baseTemp = telemetry?.cpuTemp || 39;
        const ramUsed = telemetry?.ramPressure || 68;
        const batScore = telemetry?.batteryScore || 88;

        if (msg.includes("heat") || msg.includes("hot") || msg.includes("garam") || msg.includes("temp")) {
          reply = `Core CPU junction is reporting an active ${baseTemp}°C. Silicone dies dissipation speeds are bottlenecked by high multi-threaded activity or heavy physical environment parameters.
          
**Recommendations:**
- Actively trigger **AI Boost Device** inside the Control panel to throttle idle clock speeds.
- Remove physical plastic bumpers/covers to increase heat radiation.
- Limit high-performance gaming mode or heavy Wi-Fi syncing.`;
        } else if (msg.includes("battery") || msg.includes("drain") || msg.includes("charge") || msg.includes("charging")) {
          reply = `Active battery health is ${batScore}%. High anode crystal wear or battery temperature (${telemetry?.batteryTemp || 36}°C) can cause rapid power drop. 
          
**Recommendations:**
- Disable continuous background location tracking.
- Avoid using the phone while plugged into hot/fast GaN power adapters.
- Select the **Battery Cool Mode** under presets to regulate cell charge speeds.`;
        } else if (msg.includes("lag") || msg.includes("slow") || msg.includes("speed") || msg.includes("hang") || msg.includes("ram")) {
          reply = `RAM pressure index is sitting at ${ramUsed}%, meaning some memory pages have swap block wait times. CPU core is currently operating at ${telemetry?.cpuUsage || 28}% load.
          
**Recommendations:**
- Use the **One-Tap AI Fix** button on the Home tab to flush dead cached modules instantly.
- Restrict auto-start background services.
- Reboot the core logic system once every 72 hours for clean cache registers.`;
        } else {
          reply = `DevicePulse AI Core online. All telemetry segments (Battery: ${batScore}%, CPU Temp: ${baseTemp}°C, RAM: ${ramUsed}%) are currently stable.
          
How can I assist you in optimizing your physical smartphone or inspecting repair/warranty profiles? You can ask me questions like:
- *"Why is my phone heating up right now?"*
- *"Explain the current battery wear timeline."*
- *"How to optimize logical thread execution speed?"*`;
        }
      }

      return res.json({ reply });
    } catch (err: any) {
      console.error("AI Assistant Chat error:", err);
      return res.status(500).json({ error: err.message || "Cognitive Chat model sync timeout." });
    }
  });

  // Hardware Analysis Endpoint using Gemini
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({ 
          error: "AI diagnostic engine is not activated. Set GEMINI_API_KEY in Secrets." 
        });
      }

      const { telemetry } = req.body;
      if (!telemetry) {
        return res.status(400).json({ error: "Telemetry core data is required." });
      }

      const prompt = `
You are the DevicePulse AI Predictive Maintenance Core, an advanced monitoring system designed to analyze telemetry and predict hardware degradation and failure risks.
Analyze the following telemetry snapshot and generate a predictive hardware maintenance report in JSON format.

CURRENT TELEMETRY SNAPSHOT:
- System Mode: ${telemetry.stressLevel || 'Normal Telemetry'}
- Battery Health Integrity: ${telemetry.batteryScore}%
- Battery Temperature: ${telemetry.batteryTemp}°C
- Charging Status: ${telemetry.chargingState} (${telemetry.chargeType || 'USB Power Node'})
- Battery Voltage Level: ${telemetry.voltageStability}V
- Thermal Risk Assessment: ${telemetry.thermalScore}%
- Current CPU Temperature: ${telemetry.cpuTemp}°C
- Thermal Trajectory Over Last 60s: ${telemetry.thermalSpikes} spikes detected
- Performance Stability: ${telemetry.perfScore}%
- CPU Cycle Load Estimation: ${telemetry.cpuUsage}%
- RAM Pressure Allocation: ${telemetry.ramPressure}%
- Intermittent Lag Spike Rate: ${telemetry.lagSpikes} per min
- Solid-State Storage Health: ${telemetry.storageScore}%
- Partition Data Volume Occupancy: ${telemetry.storageUsed}%
- Memory Write Cycle Latency: ${telemetry.writeLatency}ms
- Custom Flash Sector Wear Estimate: ${telemetry.corruptRisk}%

Generate your hardware assessment. You must return a valid, parsable, and single JSON object conforming strictly to the following schema structure. Avoid pre-text, post-text or markdown wrapper (return clean JSON raw text):
{
  "generalDiagnostics": {
    "statusSummary": "Give a highly specific, scientific engineering diagnosis summary of the overall hardware status based on these inputs.",
    "overallHealthImpact": "High-fidelity insight on how the parameters are correlating to affect components longevity.",
    "daysToPredictedFailure": "Number of days (e.g. 15, 30, 90, 720) as an estimated lifespan or 'Indefinite' if fully optimal and normal.",
    "failurePrimaryCause": "Name of the sub-system or node most vulnerable to cascading failure (e.g. 'Lithium-Ion Degradation Node', 'CPU Thermal Throttling Path', 'Flash Memory Storage Block', or 'None' if secure)."
  },
  "subsystemDiagnostics": {
    "battery": {
      "insight": "Detailed diagnostic commentary about the battery charging physics, voltage stability, and predicted remaining lifespan.",
      "lifespanWeeks": 120
    },
    "thermal": {
      "insight": "Critical analysis of current heat radiation profiles, potential throttling indicators, and stress impacts.",
      "throttlingIndexPct": 15
    },
    "performance": {
      "insight": "RAM and peak usage stability analysis detailing if lag spikes are temporary software spikes or permanent degradation symptoms.",
      "stabilityRating": "Excellent | Stable | Warning | Throttled"
    },
    "storage": {
      "insight": "Write cycle breakdown and Boot-Loop prediction score based on latency and block warnings.",
      "bootLoopRisk": "Very Low | Low | Medium | High | Critical"
    }
  },
  "actionableList": [
    {
      "priority": "Critical" | "Warning" | "Optimization",
      "systemModule": "Battery" | "Thermal" | "Performance" | "Storage",
      "alertTitle": "Title of prompt core issue",
      "actionDesc": "Detailed engineering steps for safe recovery or mitigation of the failure threat."
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedReport = JSON.parse(cleaned);
      
      return res.json({ report: parsedReport });
    } catch (err: any) {
      console.error("Gemini hardware analysis failed:", err);
      return res.status(500).json({ error: err.message || "An error occurred during diagnostic analysis." });
    }
  });

  // --- PERSISTENT STATE TABLES FOR INDIA MARKETPLACE ---
  let activeJobs = [
    {
      id: "job-08",
      customer: "Mohammed Amaan",
      phone: "+91 98124 55110",
      model: "OnePlus 12 Ultra",
      issue: "Battery Replacement",
      status: "In Progress",
      timer: 450,
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
  ];

  let newRequests = [
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
  ];

  let completedJobsCount = 18;
  let dailyRevenue = 14850;

  let merchantAlerts = [
    "System Diagnostics calibrated for Bengaluru CyberCell Labs Node.",
    "Notification: Automatic payout of ₹11,340 processed on 2026-05-23."
  ];

  // Retrieve current active marketplace dashboard state
  app.get("/api/marketplace/state", (req, res) => {
    res.json({
      newRequests,
      activeJobs,
      completedJobsCount,
      dailyRevenue,
      merchantAlerts
    });
  });

  // Submit a customer booking slot to the marketplace
  app.post("/api/marketplace/book", (req, res) => {
    try {
      const { customer, phone, model, issue, estimatedCost } = req.body;
      if (!customer || !phone) {
        return res.status(400).json({ error: "Customer and phone variables are mandatory." });
      }

      const newId = `req-${Math.floor(200 + Math.random() * 800)}`;
      const incomingJobObj = {
        id: newId,
        customer,
        phone: phone.startsWith("+91") ? phone : `+91 ${phone}`,
        model: model || "Generic Smartphone",
        issue: issue || "Screen Repair",
        distance: `${(Math.random() * 2.8 + 0.5).toFixed(1)} km`,
        estimatedCost: estimatedCost || 1500,
        timestamp: "Just now",
        aiDiagnostics: {
          batteryHealth: Math.floor(Math.random() * 30 + 55),
          tempCel: Math.floor(Math.random() * 20 + 31),
          riskScore: Math.floor(Math.random() * 50 + 25),
          wearFactor: "Dispatched from high-density online telemetry validation suite.",
          solution: `Calibrate ${issue || "Screen"} PMIC registers & perform logical trace alignment.`
        }
      };

      newRequests.unshift(incomingJobObj);
      merchantAlerts.unshift(`New Booking request received from ${customer} for ${model}!`);
      
      return res.json({ 
        success: true, 
        newRequests, 
        merchantAlerts,
        bookedTicket: {
          ticketId: `DP-REP-${Math.floor(Math.random() * 89999 + 10000)}`,
          customer,
          phone,
          model,
          issue,
          cost: estimatedCost,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });
    } catch (err: any) {
      console.error("Booking failed:", err);
      return res.status(500).json({ error: "Failed to allocate standard reservation." });
    }
  });

  // Action update handler for accepting/rejecting/moving booking slots
  app.post("/api/marketplace/action", async (req, res) => {
    try {
      const { action, id, extra } = req.body;
      
      if (action === "accept") {
        const reqIndex = newRequests.findIndex(r => r.id === id);
        if (reqIndex !== -1) {
          const originalReq = newRequests[reqIndex];
          const acceptedJob = {
            id: `job-${Math.floor(10 + Math.random() * 89)}`,
            customer: originalReq.customer,
            phone: originalReq.phone,
            model: originalReq.model,
            issue: originalReq.issue,
            status: "In Progress",
            timer: 0,
            cost: originalReq.estimatedCost,
            notes: "Request accepted from real-time customer locator. Calibrating...",
            historyLogs: ["Job Accepted", "Initiated logic terminal diagnostic check"],
            aiDiagnostics: originalReq.aiDiagnostics
          };
          activeJobs.unshift(acceptedJob);
          newRequests.splice(reqIndex, 1);
          merchantAlerts.unshift(`Job request for ${originalReq.customer} accepted successfully!`);
          
          return res.json({ 
            success: true, 
            newRequests,
            activeJobs,
            merchantAlerts
          });
        } else {
          return res.status(404).json({ error: "Booking request not found on server state." });
        }
      } 
      
      if (action === "reject") {
        newRequests = newRequests.filter(r => r.id !== id);
        merchantAlerts.unshift("Job request dismissed.");
        return res.json({ 
          success: true, 
          newRequests,
          merchantAlerts
        });
      }

      if (action === "status") {
        const { status } = extra;
        const job = activeJobs.find(j => j.id === id);
        if (job) {
          const oldStatus = job.status;
          job.status = status;
          job.historyLogs.push(`Status altered: ${status}`);
          
          if ((status === "Completed" || status === "Delivered") && oldStatus !== "Completed" && oldStatus !== "Delivered") {
            completedJobsCount += 1;
            dailyRevenue += job.cost;
            merchantAlerts.unshift(`Job ${job.id} completed! Earned ₹${job.cost}`);
          }
          return res.json({ 
            success: true, 
            activeJobs,
            completedJobsCount,
            dailyRevenue,
            merchantAlerts
          });
        }
      }

      if (action === "add-note") {
        const { note } = extra;
        const job = activeJobs.find(j => j.id === id);
        if (job) {
          job.notes = note;
          job.historyLogs.push(`Technical audit note: "${note}"`);
          return res.json({ success: true, activeJobs });
        }
      }

      if (action === "add-part") {
        const { part } = extra;
        const job = activeJobs.find(j => j.id === id);
        if (job) {
          job.historyLogs.push(`Swapped component cluster: ${part}`);
          return res.json({ success: true, activeJobs });
        }
      }

      res.status(400).json({ error: "Unsupported service center action signature." });
    } catch (err: any) {
      console.error("Action handler failed:", err);
      res.status(500).json({ error: "Internal processing error." });
    }
  });

  // Dialog Chat interactive responder powered by Gemini
  app.post("/api/marketplace/chat", async (req, res) => {
    try {
      const { message, customerName, problemType, modelName } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message input is required." });
      }

      let reply = "";
      if (ai) {
        // Query Gemini to act as a highly realistic, technical or anxious Indian customer querying the service center
        const prompt = `
You are an Indian customer named "${customerName || "Amaan Mohd"}" who has given their phone "${modelName || "OnePlus 12"}" to the service center for repair because of "${problemType || "Battery Replacement"}".
The operator has asked/notified you: "${message}".

Generate a natural, short dynamic reply. Your persona is polite, slightly tech-aware, and typical of an Indian consumer. You can mix English with typical friendly Hinglish expressions (e.g. "Arre sir, timing barabar rahegi?", "Tension to nahi haina isme?").
Keep it to exactly 1 or 2 small sentences, making it extremely human and spontaneous. No extra comments, return just the plain text.
`;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        reply = response.text || "Acha okay sir, let me know when it gets solved.";
      } else {
        // High fidelity rules reply
        const msg = message.toLowerCase();
        if (msg.includes("cost") || msg.includes("charge") || msg.includes("price") || msg.includes("money") || msg.includes("rupee") || msg.includes("inr")) {
          reply = "The quoted price looks genuine as verified by DevicePulse indicators. Sir, please use only high-integrity spare parts for motherboard circuits!";
        } else if (msg.includes("time") || msg.includes("ready") || msg.includes("hour") || msg.includes("when")) {
          reply = "Perfect sir! Please verify is the thermal dissipation fully tuned. Let me know when standard pickup is unlocked.";
        } else if (msg.includes("part") || msg.includes("component") || msg.includes("swap") || msg.includes("screws")) {
          reply = "Ji sir, please double check if the glass or liquid safety sealant is calibrated properly.";
        } else {
          reply = "Sounds optimal! Ready to test and proceed with standard DevicePulse validation sequence. Thanks for the quick update!";
        }
      }

      return res.json({ reply });
    } catch (err) {
      return res.json({ reply: "Acha sir. Let me know when all automated diagnostic sequences complete!" });
    }
  });

  // Vite middleware setup
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
