import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { getDb } from "@/lib/firebase";
import type { AppUser, UserRole, UserStatus } from "@/types";

const BOOTSTRAP_ADMIN_EMAIL = "tsnqaa@gmail.com";

function toUser(id: string, d: Record<string, unknown>): AppUser {
  return {
    id,
    googleUid: (d["googleUid"] as string) ?? id,
    email: (d["email"] as string) ?? "",
    name: (d["name"] as string) ?? "",
    avatar: (d["avatar"] as string) ?? "",
    role: (d["role"] as UserRole) ?? "USER",
    status: (d["status"] as UserStatus) ?? "PENDING",
    createdAt: Number(d["createdAt"] ?? 0),
    updatedAt: Number(d["updatedAt"] ?? 0),
  };
}

export const userService = {
  /** Ensure a user document exists for the signed-in Google account. */
  async ensureProfile(fbUser: FirebaseUser): Promise<AppUser> {
    const db = getDb();
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);
    const now = Date.now();

    if (!snap.exists()) {
      const isBootstrapAdmin =
        (fbUser.email ?? "").toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
      const payload = {
        googleUid: fbUser.uid,
        email: fbUser.email ?? "",
        name: fbUser.displayName ?? fbUser.email ?? "Người dùng",
        avatar: fbUser.photoURL ?? "",
        role: (isBootstrapAdmin ? "ADMIN" : "USER") as UserRole,
        status: (isBootstrapAdmin ? "ACTIVE" : "PENDING") as UserStatus,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, payload);
      return toUser(fbUser.uid, payload);
    }

    const data = snap.data();
    // Keep Google profile fields fresh (role/status are never touched here).
    const patch: Record<string, unknown> = {};
    if (data["email"] !== fbUser.email) patch["email"] = fbUser.email ?? "";
    if (fbUser.displayName && data["name"] !== fbUser.displayName)
      patch["name"] = fbUser.displayName;
    if (fbUser.photoURL && data["avatar"] !== fbUser.photoURL)
      patch["avatar"] = fbUser.photoURL;
    if (Object.keys(patch).length) {
      patch["updatedAt"] = Date.now();
      await updateDoc(ref, patch).catch(() => undefined);
    }
    return toUser(snap.id, { ...data, ...patch });
  },

  subscribeProfile(uid: string, cb: (u: AppUser | null) => void) {
    return onSnapshot(
      doc(getDb(), "users", uid),
      (snap) => cb(snap.exists() ? toUser(snap.id, snap.data()) : null),
      () => cb(null),
    );
  },

  subscribeAll(cb: (users: AppUser[]) => void, onError?: (e: unknown) => void) {
    return onSnapshot(
      collection(getDb(), "users"),
      (snap) => cb(snap.docs.map((d) => toUser(d.id, d.data()))),
      (e) => onError?.(e),
    );
  },

  async setStatus(userId: string, status: UserStatus) {
    await updateDoc(doc(getDb(), "users", userId), {
      status,
      updatedAt: Date.now(),
      touchedAt: serverTimestamp(),
    });
  },

  async setRole(userId: string, role: UserRole) {
    await updateDoc(doc(getDb(), "users", userId), {
      role,
      updatedAt: Date.now(),
      touchedAt: serverTimestamp(),
    });
  },
};
