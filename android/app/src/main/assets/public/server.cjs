var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_razorpay = __toESM(require("razorpay"), 1);
var import_crypto = __toESM(require("crypto"), 1);

// server/firebase-admin.ts
var import_firebase_admin = __toESM(require("firebase-admin"), 1);

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "thugs-of-sultan-3cb83",
  appId: "1:569804689508:web:a40e8f9c217caf8eeecf71",
  apiKey: "AIzaSyDPw1JScBo4K6YO2ptQAFBCwhm2H3S8VQk",
  authDomain: "thugs-of-sultan-3cb83.firebaseapp.com",
  storageBucket: "thugs-of-sultan-3cb83.firebasestorage.app",
  messagingSenderId: "569804689508",
  measurementId: ""
};

// server/firebase-admin.ts
if (!import_firebase_admin.default.apps.length) {
  import_firebase_admin.default.initializeApp({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminDb = import_firebase_admin.default.firestore();
var adminAuth = import_firebase_admin.default.auth();

// server.ts
import_dotenv.default.config();
var RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID;
var RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
var RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use("/api/razorpay/webhook", import_express.default.raw({ type: "application/json" }));
  app.use(import_express.default.json());
  let rzp = null;
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    rzp = new import_razorpay.default({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
  }
  app.get("/api/subscription/status", async (req, res) => {
    try {
      const uid = req.query.uid;
      if (!uid) return res.status(400).json({ error: "UID required" });
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return res.json({ status: "FREE" });
      }
      const data = userDoc.data();
      if (data?.expiryDate) {
        const expiry = new Date(data.expiryDate).getTime();
        const now = Date.now();
        if (now > expiry && data.subscriptionStatus !== "FREE") {
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
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/razorpay/webhook", async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature || !RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).send("No signature or secret");
    }
    const expectedSignature = import_crypto.default.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(req.body).digest("hex");
    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }
    const event = JSON.parse(req.body.toString());
    try {
      if (event.event === "subscription.charged") {
        const subscription = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        const usersRef = adminDb.collection("users");
        const snapshot = await usersRef.where("subscriptionId", "==", subscription.id).get();
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: "PRO",
            expiryDate: new Date(subscription.current_end * 1e3).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } else if (event.event === "subscription.cancelled" || event.event === "subscription.expired") {
        const subscription = event.payload.subscription.entity;
        const snapshot = await adminDb.collection("users").where("subscriptionId", "==", subscription.id).get();
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: "FREE",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Internal Error");
    }
  });
  app.post("/api/subscription/associate", async (req, res) => {
    const { uid, subscriptionId, planId, status } = req.body;
    if (!uid || !subscriptionId) return res.status(400).json({ error: "Missing fields" });
    try {
      const isPro = status === "PRO" || status === "ACTIVE";
      await adminDb.collection("users").doc(uid).set({
        uid,
        subscriptionId,
        planId,
        subscriptionStatus: isPro ? "PRO" : "FREE",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        // 30 days active
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
      res.json({ success: true, status: isPro ? "PRO" : "FREE" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/subscription/create", async (req, res) => {
    try {
      const { planId, uid } = req.body;
      const targetPlanId = planId || "plan_StVujNG2NZOltP";
      if (rzp) {
        const subscription = await rzp.subscriptions.create({
          plan_id: targetPlanId,
          total_count: 12,
          quantity: 1,
          customer_notify: 1
        });
        res.json({ subscriptionId: subscription.id });
      } else {
        const fallbackId = "sub_" + Math.random().toString(36).substring(2, 17);
        res.json({ subscriptionId: fallbackId, simulated: true });
      }
    } catch (err) {
      console.warn("Razorpay SDK subscription failed, using simulated fallback:", err);
      const fallbackId = "sub_" + Math.random().toString(36).substring(2, 17);
      res.json({ subscriptionId: fallbackId, simulated: true });
    }
  });
  const apiKey = process.env.GEMINI_API_KEY;
  let ai = null;
  if (apiKey) {
    ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiEnabled: !!ai,
      hasKeyEnv: !!process.env.GEMINI_API_KEY
    });
  });
  app.post("/api/gemini/voice-engineer", async (req, res) => {
    try {
      const { userMessage, language, telemetry } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "User spoken input is required." });
      }
      if (!ai) {
        const msg = (userMessage || "").toLowerCase();
        let answer = "";
        let intent = "device_health_summary";
        let delta = null;
        if (msg.includes("garam") || msg.includes("heat") || msg.includes("temp") || msg.includes("cool")) {
          intent = "thermal_status";
          if (language === "Hindi") {
            answer = `\u0924\u093E\u092A\u092E\u093E\u0928 ${telemetry.cpuTemp || 41}\xB0C \u092A\u0930 \u0926\u0930\u094D\u091C \u0939\u0941\u0906 \u0939\u0948\u0964 \u0938\u093F\u0932\u093F\u0915\u0949\u0928 \u0915\u094B\u0930 \u0925\u0930\u094D\u092E\u0932\u094D\u0938 \u0915\u094B \u0920\u0902\u0921\u093E \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u0942\u0932\u093F\u0902\u0917 \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0915\u0940 \u0938\u0932\u093E\u0939 \u0926\u0940 \u091C\u093E\u0924\u0940 \u0939\u0948\u0964`;
          } else if (language === "Hinglish") {
            answer = `CPU temperature abhi ${telemetry.cpuTemp || 41}\xB0C ho raha hai. Is thermal stress ko optimize karne ke liye immediate throttling protocol chalana chahiye.`;
          } else if (language === "Tamil") {
            answer = `\u0BB5\u0BC6\u0BAA\u0BCD\u0BAA\u0BA8\u0BBF\u0BB2\u0BC8 ${telemetry.cpuTemp || 41}\xB0C \u0B86\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. CPU-\u0BB5\u0BC8 \u0B95\u0BC1\u0BB3\u0BBF\u0BB0\u0BCD\u0BB5\u0BBF\u0B95\u0BCD\u0B95 \u0BAE\u0BC7\u0BAE\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BCD \u0BA4\u0BC7\u0BB5\u0BC8\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1.`;
          } else if (language === "Telugu") {
            answer = `\u0C09\u0C37\u0C4D\u0C23\u0C4B\u0C17\u0C4D\u0C30\u0C24 ${telemetry.cpuTemp || 41}\xB0C \u0C15\u0C3F \u0C1A\u0C47\u0C30\u0C3F\u0C02\u0C26\u0C3F. \u0C38\u0C3F\u0C32\u0C3F\u0C15\u0C3E\u0C28\u0C4D \u0C15\u0C4B\u0C30\u0C4D \u0C39\u0C40\u0C1F\u0C4D \u0C24\u0C17\u0C4D\u0C17\u0C3F\u0C02\u0C1A\u0C21\u0C3E\u0C28\u0C3F\u0C15\u0C3F \u0C15\u0C42\u0C32\u0C3F\u0C02\u0C17\u0C4D \u0C2E\u0C4B\u0C21\u0C4D \u0C30\u0C28\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F.`;
          } else if (language === "Bengali") {
            answer = `\u09A4\u09BE\u09AA\u09AE\u09BE\u09A4\u09CD\u09B0\u09BE ${telemetry.cpuTemp || 41}\xB0C \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09B8\u09BF\u09AA\u09BF\u0987\u0989 \u0995\u09C1\u09B2\u09BF\u0982 \u09AA\u09CD\u09B0\u09CB\u099F\u09CB\u0995\u09B2 \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD\u09C7\u099F \u0995\u09B0\u09BE\u09B0 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u099A\u09CD\u099B\u09C7\u0964`;
          } else if (language === "Urdu") {
            answer = `\u062F\u0631\u062C\u06C1 \u062D\u0631\u0627\u0631\u062A ${telemetry.cpuTemp || 41}\xB0C \u06C1\u06D2\u06D4 \u062A\u06BE\u0631\u0645\u0644 \u0644\u0648\u0688 \u06A9\u0645 \u06A9\u0631\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u06A9\u0648\u0644\u0646\u06AF \u0633\u0633\u0679\u0645 \u06A9\u0648 \u0686\u0627\u0644\u0648 \u06A9\u0631\u06CC\u06BA\u06D4`;
          } else {
            answer = `Junction core temperature is at ${telemetry.cpuTemp || 41}\xB0C indicating high thermal retention load. Recommend starting safety thermal cooldown.`;
          }
          if (msg.includes("optimize") || msg.includes("tik") || msg.includes("theek") || msg.includes("cool") || msg.includes("thanda")) {
            delta = { action: "cool" };
          }
        } else if (msg.includes("battery") || msg.includes("charge") || msg.includes("current")) {
          intent = "battery_status";
          if (language === "Hindi") {
            answer = `\u092C\u0948\u091F\u0930\u0940 \u0939\u0947\u0932\u094D\u0925 ${telemetry.batteryScore}% \u092A\u0930 \u0938\u0902\u0930\u0947\u0916\u093F\u0924 \u0939\u0948\u0964 \u092C\u0948\u091F\u0930\u0940 \u0924\u093E\u092A\u092E\u093E\u0928 ${telemetry.batteryTemp}\xB0C \u0939\u0948\u0964 GaN \u091A\u093E\u0930\u094D\u091C\u0930 \u0939\u0940\u091F \u0915\u093E \u0935\u093F\u0936\u0947\u0937 \u0927\u094D\u092F\u093E\u0928 \u0930\u0916\u0947\u0902\u0964`;
          } else if (language === "Hinglish") {
            answer = `Battery health status ${telemetry.batteryScore}% hai. Cells fully safe hain par battery temperature ${telemetry.batteryTemp}\xB0C hone par wireless charger se bachein.`;
          } else if (language === "Tamil") {
            answer = `\u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BB0\u0BBF \u0B86\u0BAF\u0BC1\u0BB3\u0BCD ${telemetry.batteryScore}% \u0B86\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BB0\u0BBF \u0BB5\u0BC6\u0BAA\u0BCD\u0BAA\u0BA8\u0BBF\u0BB2\u0BC8 ${telemetry.batteryTemp}\xB0C \u0B86\u0B95 \u0BAA\u0BA4\u0BBF\u0BB5\u0BBE\u0B95\u0BBF\u0BAF\u0BC1\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1.`;
          } else if (language === "Telugu") {
            answer = `\u0C2C\u0C4D\u0C2F\u0C3E\u0C1F\u0C30\u0C40 \u0C39\u0C46\u0C32\u0C4D\u0C24\u0C4D ${telemetry.batteryScore}% \u0C17\u0C3E \u0C09\u0C02\u0C26\u0C3F. \u0C2C\u0C4D\u0C2F\u0C3E\u0C1F\u0C30\u0C40 \u0C09\u0C37\u0C4D\u0C23\u0C4B\u0C17\u0C4D\u0C30\u0C24 ${telemetry.batteryTemp}\xB0C \u0C35\u0C26\u0C4D\u0C26 \u0C09\u0C02\u0C21\u0C1F\u0C02 \u0C35\u0C32\u0C4D\u0C32 \u0C1A\u0C3E\u0C30\u0C4D\u0C1C\u0C3F\u0C02\u0C17\u0C4D \u0C2A\u0C48 \u0C05\u0C35\u0C17\u0C3E\u0C39\u0C28 \u0C05\u0C35\u0C38\u0C30\u0C02.`;
          } else if (language === "Bengali") {
            answer = `\u09AC\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09BF \u09B2\u09BE\u0987\u09AB ${telemetry.batteryScore}% \u098F\u09AC\u0982 \u09AC\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09BF\u09B0 \u09A4\u09BE\u09AA\u09AE\u09BE\u09A4\u09CD\u09B0\u09BE ${telemetry.batteryTemp}\xB0C \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`;
          } else if (language === "Urdu") {
            answer = `\u0628\u06CC\u0679\u0631\u06CC \u06A9\u06CC \u0635\u062D\u062A ${telemetry.batteryScore}% \u06C1\u06D2\u06D4 \u0628\u06CC\u0679\u0631\u06CC \u06A9\u0627 \u062F\u0631\u062C\u06C1 \u062D\u0631\u0627\u0631\u062A ${telemetry.batteryTemp}\xB0C \u0631\u06CC\u06A9\u0627\u0631\u0688 \u06A9\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4`;
          } else {
            answer = `Anode battery core status is aligned at ${telemetry.batteryScore}% health with a voltage stability rating of ${telemetry.voltageStability}V.`;
          }
        } else if (msg.includes("optimize") || msg.includes("clean") || msg.includes("speed") || msg.includes("slow") || msg.includes("lag") || msg.includes("theek") || msg.includes("saaf")) {
          intent = "optimization_suggestion";
          delta = { action: "ram" };
          if (language === "Hindi") {
            answer = `\u0938\u093F\u0938\u094D\u091F\u092E \u0915\u094B\u0930 \u092E\u0947\u092E\u094B\u0930\u0940 \u0915\u094B \u0905\u092D\u0940 \u0938\u0902\u0915\u0941\u091A\u093F\u0924 \u0915\u0930 \u0926\u093F\u092F\u093E \u0939\u0942\u0901\u0964 \u0930\u0947\u092E \u092A\u0930 \u0905\u0928\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u092C\u0948\u0915\u0917\u094D\u0930\u093E\u0909\u0902\u0921 \u0932\u094B\u0921 40% \u0915\u092E \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964`;
          } else if (language === "Hinglish") {
            answer = `Application performance optimization system activate kar diya gaya hai. Memory leak blocks successfully flush ho gaye hain.`;
          } else if (language === "Tamil") {
            answer = `\u0BB0\u0BC7\u0BAE\u0BCD \u0B9A\u0BC7\u0BAE\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1 \u0BAE\u0BC7\u0BAE\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BC1\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0BAA\u0BBF\u0BA9\u0BCD\u0BA9\u0BA3\u0BBF \u0B9A\u0BC6\u0BAF\u0BB2\u0BCD\u0B95\u0BB3\u0BCD \u0BA8\u0BBF\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BC1 \u0BB5\u0BC7\u0B95\u0BAE\u0BCD \u0B85\u0BA4\u0BBF\u0B95\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BC1\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1.`;
          } else if (language === "Telugu") {
            answer = `\u0C2E\u0C46\u0C2E\u0C30\u0C40 \u0C06\u0C2A\u0C4D\u0C1F\u0C3F\u0C2E\u0C48\u0C1C\u0C47\u0C37\u0C28\u0C4D \u0C35\u0C3F\u0C1C\u0C2F\u0C35\u0C02\u0C24\u0C02\u0C17\u0C3E \u0C2A\u0C42\u0C30\u0C4D\u0C24\u0C2F\u0C3F\u0C02\u0C26\u0C3F. \u0C2C\u0C4D\u0C2F\u0C3E\u0C15\u0C4D\u200C\u0C17\u0C4D\u0C30\u0C4C\u0C02\u0C21\u0C4D \u0C2F\u0C3E\u0C2A\u0C4D\u0C38\u0C4D \u0C15\u0C4D\u0C32\u0C4B\u0C1C\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C4D\u0C21\u0C3E\u0C2F\u0C3F.`;
          } else if (language === "Bengali") {
            answer = `\u09AE\u09C7\u09AE\u09B0\u09BF \u0985\u09AA\u09CD\u099F\u09BF\u09AE\u09BE\u0987\u099C\u09C7\u09B6\u09A8 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09B0\u200D\u09CD\u09AF\u09BE\u09AE\u09C7\u09B0 \u099A\u09BE\u09AA \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09B9\u09CD\u09B0\u09BE\u09B8 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`;
          } else if (language === "Urdu") {
            answer = `\u0633\u0633\u0679\u0645 \u0645\u06CC\u0645\u0648\u0631\u06CC \u06A9\u0648 \u0628\u06C1\u062A\u0631 \u0628\u0646\u0627 \u062F\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4 \u063A\u06CC\u0631 \u0636\u0631\u0648\u0631\u06CC \u067E\u0633 \u0645\u0646\u0638\u0631 \u0627\u06CC\u067E\u0633 \u06A9\u0648 \u0628\u0646\u062F \u06A9\u0631 \u062F\u06CC\u0627 \u06AF\u06CC\u0627 \u06C1\u06D2\u06D4`;
          } else {
            answer = `Governor optimization suite triggered. Reclaimed active swap blocks, restoring logical performance flow.`;
          }
        } else {
          if (language === "Hindi") {
            answer = `\u0928\u092E\u0938\u094D\u0924\u0947! \u092E\u0948\u0902 \u0921\u093F\u0935\u093E\u0907\u0938\u092A\u0932\u094D\u0938 \u0935\u0949\u0907\u0938 \u0907\u0902\u091C\u0940\u0928\u093F\u092F\u0930 \u0939\u0942\u0901\u0964 \u0915\u0941\u0932 \u0939\u0947\u0932\u094D\u0925 \u0938\u094D\u0915\u094B\u0930 ${telemetry.batteryScore}% \u0939\u0948\u0964 \u092E\u0948\u0902 \u092C\u0948\u091F\u0930\u0940, \u0938\u093F\u0932\u093F\u0915\u0949\u0928 \u0924\u093E\u092A\u0940\u092F \u0938\u094D\u0925\u093F\u0924\u093F \u0914\u0930 \u0938\u094D\u091F\u094B\u0930\u0947\u091C \u0915\u0940 \u091C\u093E\u0902\u091A \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901\u0964`;
          } else if (language === "Hinglish") {
            answer = `DevicePulse System check complete. Overall score is ${telemetry.perfScore}%. Aap phone thermal load ya battery health ke baare me pooch sakte hain.`;
          } else if (language === "Tamil") {
            answer = `\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD! \u0BA8\u0BBE\u0BA9\u0BCD \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B9A\u0BBE\u0BA4\u0BA9 \u0BAA\u0BCA\u0BB1\u0BBF\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD. \u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B86\u0BB0\u0BCB\u0B95\u0BCD\u0B95\u0BBF\u0BAF \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1 ${telemetry.perfScore}% \u0B86\u0B95\u0BC1\u0BAE\u0BCD.`;
          } else if (language === "Telugu") {
            answer = `\u0C28\u0C2E\u0C38\u0C4D\u0C15\u0C3E\u0C30\u0C02! \u0C28\u0C47\u0C28\u0C41 \u0C21\u0C3F\u0C35\u0C48\u0C38\u0C4D\u200C\u0C2A\u0C32\u0C4D\u0C38\u0C4D \u0C35\u0C3E\u0C2F\u0C3F\u0C38\u0C4D \u0C07\u0C02\u0C1C\u0C28\u0C40\u0C30\u0C4D\u200C\u0C28\u0C3F. \u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02 \u0C39\u0C46\u0C32\u0C4D\u0C24\u0C4D \u0C38\u0C4D\u0C15\u0C4B\u0C30\u0C4D ${telemetry.perfScore}% \u0C17\u0C3E \u0C09\u0C02\u0C26\u0C3F.`;
          } else if (language === "Bengali") {
            answer = `\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09A1\u09BF\u09AD\u09BE\u0987\u09B8\u09AA\u09B2\u09B8 \u09AD\u09AF\u09BC\u09C7\u09B8 \u0987\u099E\u09CD\u099C\u09BF\u09A8\u09BF\u09AF\u09BC\u09BE\u09B0\u0964 \u09B8\u09BE\u09AE\u0997\u09CD\u09B0\u09BF\u0995 \u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF \u09B8\u09CD\u0995\u09CB\u09B0 ${telemetry.perfScore}%\u0964`;
          } else if (language === "Urdu") {
            answer = `\u06C1\u06CC\u0644\u0648! \u0645\u06CC\u06BA \u0622\u067E \u06A9\u0627 \u0688\u06CC\u0648\u0627\u0626\u0633 \u067E\u0644\u0633 \u0648\u0627\u0626\u0633 \u0627\u0646\u062C\u06CC\u0646\u0626\u0631 \u06C1\u0648\u06BA\u06D4 \u0645\u062C\u0645\u0648\u0639\u06CC \u06C1\u06CC\u0644\u062A\u06BE \u0627\u0633\u06A9\u0648\u0631 ${telemetry.perfScore}% \u06C1\u06D2\u06D4`;
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
      const currentTelemetrySummary = `
- System Overall Health Weighted: ${Math.round(telemetry.batteryScore * 0.3 + telemetry.thermalScore * 0.3 + telemetry.perfScore * 0.2 + telemetry.storageScore * 0.2)}%
- Battery Score: ${telemetry.batteryScore}%, Temp: ${telemetry.batteryTemp}\xB0C, Voltage: ${telemetry.voltageStability}V
- CPU Temp: ${telemetry.cpuTemp}\xB0C, Thermal Spikes: ${telemetry.thermalSpikes} spikes
- Ram Pressure: ${telemetry.ramPressure}%, cpu usage: ${telemetry.cpuUsage}%
- Storage Score: ${telemetry.storageScore}%, Sectors: ${telemetry.sectorsScanned}
- Current Level Profile: ${telemetry.stressLevel || "Normal"}
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
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "{}";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const payload = JSON.parse(cleaned);
      return res.json(payload);
    } catch (err) {
      console.error("Voice diagnosis error:", err);
      return res.json({
        responseText: "Diagnostic engine logic timed out. Let's run manual local diagnostics.",
        speechReadyText: "Diagnostic engine offline. Initiating automated local diagnostics.",
        intentDetected: "device_health_summary",
        telemetryDelta: null
      });
    }
  });
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { userMessage, telemetry, history = [] } = req.body;
      if (!userMessage) {
        return res.status(400).json({ error: "Message input is required." });
      }
      const currentTelemetrySummary = telemetry ? `
- Model Info: ${telemetry.modelName || "Device Node"}
- Overall Health Index: ${telemetry.batteryScore}%
- Battery: Score ${telemetry.batteryScore}%, Temp ${telemetry.batteryTemp}\xB0C, Voltage ${telemetry.voltageStability}V, State: ${telemetry.chargingState}
- Thermal System: Current CPU ${telemetry.cpuTemp}\xB0C, Spikes ${telemetry.thermalSpikes}
- System Logic: RAM Used ${telemetry.ramPressure}%, CPU Used ${telemetry.cpuUsage}%, Lag Spikes ${telemetry.lagSpikes}/min
- SSD Storage: Score ${telemetry.storageScore}%, Used ${telemetry.storageUsed}%
- Stress State Profile: ${telemetry.stressLevel || "Standard"}
` : "Standard offline device defaults.";
      const chatHistoryText = history.map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n");
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
          contents: prompt
        });
        reply = response.text || "Diagnostic query processed. Keep silicon structures optimal.";
      } else {
        const msg = userMessage.toLowerCase();
        const baseTemp = telemetry?.cpuTemp || 39;
        const ramUsed = telemetry?.ramPressure || 68;
        const batScore = telemetry?.batteryScore || 88;
        if (msg.includes("heat") || msg.includes("hot") || msg.includes("garam") || msg.includes("temp")) {
          reply = `Core CPU junction is reporting an active ${baseTemp}\xB0C. Silicone dies dissipation speeds are bottlenecked by high multi-threaded activity or heavy physical environment parameters.
          
**Recommendations:**
- Actively trigger **AI Boost Device** inside the Control panel to throttle idle clock speeds.
- Remove physical plastic bumpers/covers to increase heat radiation.
- Limit high-performance gaming mode or heavy Wi-Fi syncing.`;
        } else if (msg.includes("battery") || msg.includes("drain") || msg.includes("charge") || msg.includes("charging")) {
          reply = `Active battery health is ${batScore}%. High anode crystal wear or battery temperature (${telemetry?.batteryTemp || 36}\xB0C) can cause rapid power drop. 
          
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
          reply = `DevicePulse AI Core online. All telemetry segments (Battery: ${batScore}%, CPU Temp: ${baseTemp}\xB0C, RAM: ${ramUsed}%) are currently stable.
          
How can I assist you in optimizing your physical smartphone or inspecting repair/warranty profiles? You can ask me questions like:
- *"Why is my phone heating up right now?"*
- *"Explain the current battery wear timeline."*
- *"How to optimize logical thread execution speed?"*`;
        }
      }
      return res.json({ reply });
    } catch (err) {
      console.error("AI Assistant Chat error:", err);
      return res.status(500).json({ error: err.message || "Cognitive Chat model sync timeout." });
    }
  });
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
- System Mode: ${telemetry.stressLevel || "Normal Telemetry"}
- Battery Health Integrity: ${telemetry.batteryScore}%
- Battery Temperature: ${telemetry.batteryTemp}\xB0C
- Charging Status: ${telemetry.chargingState} (${telemetry.chargeType || "USB Power Node"})
- Battery Voltage Level: ${telemetry.voltageStability}V
- Thermal Risk Assessment: ${telemetry.thermalScore}%
- Current CPU Temperature: ${telemetry.cpuTemp}\xB0C
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
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedReport = JSON.parse(cleaned);
      return res.json({ report: parsedReport });
    } catch (err) {
      console.error("Gemini hardware analysis failed:", err);
      return res.status(500).json({ error: err.message || "An error occurred during diagnostic analysis." });
    }
  });
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
    "Notification: Automatic payout of \u20B911,340 processed on 2026-05-23."
  ];
  app.get("/api/marketplace/state", (req, res) => {
    res.json({
      newRequests,
      activeJobs,
      completedJobsCount,
      dailyRevenue,
      merchantAlerts
    });
  });
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
          ticketId: `DP-REP-${Math.floor(Math.random() * 89999 + 1e4)}`,
          customer,
          phone,
          model,
          issue,
          cost: estimatedCost,
          date: (/* @__PURE__ */ new Date()).toLocaleDateString(),
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      });
    } catch (err) {
      console.error("Booking failed:", err);
      return res.status(500).json({ error: "Failed to allocate standard reservation." });
    }
  });
  app.post("/api/marketplace/action", async (req, res) => {
    try {
      const { action, id, extra } = req.body;
      if (action === "accept") {
        const reqIndex = newRequests.findIndex((r) => r.id === id);
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
        newRequests = newRequests.filter((r) => r.id !== id);
        merchantAlerts.unshift("Job request dismissed.");
        return res.json({
          success: true,
          newRequests,
          merchantAlerts
        });
      }
      if (action === "status") {
        const { status } = extra;
        const job = activeJobs.find((j) => j.id === id);
        if (job) {
          const oldStatus = job.status;
          job.status = status;
          job.historyLogs.push(`Status altered: ${status}`);
          if ((status === "Completed" || status === "Delivered") && oldStatus !== "Completed" && oldStatus !== "Delivered") {
            completedJobsCount += 1;
            dailyRevenue += job.cost;
            merchantAlerts.unshift(`Job ${job.id} completed! Earned \u20B9${job.cost}`);
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
        const job = activeJobs.find((j) => j.id === id);
        if (job) {
          job.notes = note;
          job.historyLogs.push(`Technical audit note: "${note}"`);
          return res.json({ success: true, activeJobs });
        }
      }
      if (action === "add-part") {
        const { part } = extra;
        const job = activeJobs.find((j) => j.id === id);
        if (job) {
          job.historyLogs.push(`Swapped component cluster: ${part}`);
          return res.json({ success: true, activeJobs });
        }
      }
      res.status(400).json({ error: "Unsupported service center action signature." });
    } catch (err) {
      console.error("Action handler failed:", err);
      res.status(500).json({ error: "Internal processing error." });
    }
  });
  app.post("/api/marketplace/chat", async (req, res) => {
    try {
      const { message, customerName, problemType, modelName } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message input is required." });
      }
      let reply = "";
      if (ai) {
        const prompt = `
You are an Indian customer named "${customerName || "Amaan Mohd"}" who has given their phone "${modelName || "OnePlus 12"}" to the service center for repair because of "${problemType || "Battery Replacement"}".
The operator has asked/notified you: "${message}".

Generate a natural, short dynamic reply. Your persona is polite, slightly tech-aware, and typical of an Indian consumer. You can mix English with typical friendly Hinglish expressions (e.g. "Arre sir, timing barabar rahegi?", "Tension to nahi haina isme?").
Keep it to exactly 1 or 2 small sentences, making it extremely human and spontaneous. No extra comments, return just the plain text.
`;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt
        });
        reply = response.text || "Acha okay sir, let me know when it gets solved.";
      } else {
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
