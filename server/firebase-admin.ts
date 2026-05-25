import admin from "firebase-admin";
import firebaseConfig from "../firebase-applet-config.json";
import { type AppOptions } from "firebase-admin";

// We check if it's already initialized to prevent errors during HMR/reloads
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: (firebaseConfig as AppOptions).projectId,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
