import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { getFirebaseConfig } from "@/lib/firebase";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { peopleService } from "@/services/people.service";
import { transactionService } from "@/services/transaction.service";
import { cacheService, CACHE_KEYS } from "@/services/cache.service";
import { authzService, type Access } from "@/services/authz.service";
import type { AppUser, Person, Txn } from "@/types";

interface AppState {
  access: Access;
  hydrated: boolean;
  firebaseUser: FirebaseUser | null;
  user: AppUser | null;
  isAdmin: boolean;
  people: Person[];
  txns: Txn[];
  syncing: boolean;
  offline: boolean;
  lastSyncAt: number | null;
  refreshConfig: () => void;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const profileUnsub = useRef<(() => void) | null>(null);

  // 1. Hydrate instantly from local cache so the UI paints immediately.
  useEffect(() => {
    setHasConfig(!!getFirebaseConfig());
    setPeople(cacheService.get<Person[]>(CACHE_KEYS.people) ?? []);
    setTxns(cacheService.get<Txn[]>(CACHE_KEYS.transactions) ?? []);
    setLastSyncAt(cacheService.getMeta(CACHE_KEYS.transactions));
    const cachedProfile = cacheService.get<AppUser>(CACHE_KEYS.profile);
    if (cachedProfile) setUser(cachedProfile);
    setHydrated(true);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // 2. Firebase auth state.
  useEffect(() => {
    if (!hydrated || !hasConfig) return;
    const unsub = authService.onChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      profileUnsub.current?.();
      profileUnsub.current = null;
      if (!fbUser) {
        setUser(null);
        cacheService.clearAll();
        setAuthResolved(true);
        return;
      }
      try {
        const profile = await userService.ensureProfile(fbUser);
        setUser(profile);
        cacheService.set(CACHE_KEYS.profile, profile);
      } catch (e) {
        console.error("ensureProfile failed", e);
      } finally {
        setAuthResolved(true);
      }
      profileUnsub.current = userService.subscribeProfile(fbUser.uid, (u) => {
        if (u) {
          setUser(u);
          cacheService.set(CACHE_KEYS.profile, u);
        }
      });
    });
    return () => {
      unsub();
      profileUnsub.current?.();
      profileUnsub.current = null;
    };
  }, [hydrated, hasConfig]);

  // 3. Realtime data — only when access is granted. Server is source of truth.
  const active = user?.status === "ACTIVE";
  useEffect(() => {
    if (!active) return;
    setSyncing(true);
    const unsubPeople = peopleService.subscribe(
      (p) => {
        setPeople(p);
        cacheService.set(CACHE_KEYS.people, p);
        setOffline(false);
      },
      () => setOffline(true),
    );
    const unsubTxns = transactionService.subscribe(
      (t) => {
        setTxns(t);
        cacheService.set(CACHE_KEYS.transactions, t.slice(0, 500));
        setLastSyncAt(Date.now());
        setSyncing(false);
        setOffline(false);
      },
      () => {
        setSyncing(false);
        setOffline(true);
      },
    );
    return () => {
      unsubPeople();
      unsubTxns();
    };
  }, [active]);

  const access: Access = useMemo(() => {
    if (!hydrated) return "LOADING";
    if (!hasConfig) return "NO_CONFIG";
    if (!authResolved) return "LOADING";
    if (!firebaseUser) return "SIGNED_OUT";
    if (!user) return "PENDING";
    return authzService.accessFor(user);
  }, [hydrated, hasConfig, authResolved, firebaseUser, user]);

  const signIn = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signOutUser = useCallback(async () => {
    cacheService.clearAll();
    await authService.signOut();
  }, []);

  const refreshConfig = useCallback(() => setHasConfig(!!getFirebaseConfig()), []);

  const value: AppState = {
    access,
    hydrated,
    firebaseUser,
    user,
    isAdmin: authzService.isAdmin(user),
    people,
    txns,
    syncing,
    offline,
    lastSyncAt,
    refreshConfig,
    signIn,
    signOutUser,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
