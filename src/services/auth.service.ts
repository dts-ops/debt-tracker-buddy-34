import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export const authService = {
  onChange(cb: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), cb);
  },
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(getFirebaseAuth(), provider);
    return cred.user;
  },
  async signOut() {
    await signOut(getFirebaseAuth());
  },
};
