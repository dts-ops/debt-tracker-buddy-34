import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const CONFIG_KEY = "cn.firebase.config";

const envConfig: Partial<FirebaseOptions> = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"],
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"],
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"],
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"],
  appId: import.meta.env["VITE_FIREBASE_APP_ID"],
};

export function getFirebaseConfig(): FirebaseOptions | null {
  if (envConfig.apiKey && envConfig.projectId && envConfig.appId) {
    return envConfig as FirebaseOptions;
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirebaseOptions;
    if (parsed.apiKey && parsed.projectId && parsed.appId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(cfg: FirebaseOptions) {
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (app) return app;
  const cfg = getFirebaseConfig();
  if (!cfg) return null;
  app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  return app;
}

export function getFirebaseAuth(): Auth {
  const a = getFirebaseApp();
  if (!a) throw new Error("Firebase chưa được cấu hình");
  return getAuth(a);
}

export function getDb(): Firestore {
  const a = getFirebaseApp();
  if (!a) throw new Error("Firebase chưa được cấu hình");
  return getFirestore(a);
}
