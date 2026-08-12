import type { AppUser } from "@/types";

export type Access = "LOADING" | "NO_CONFIG" | "SIGNED_OUT" | "PENDING" | "BLOCKED" | "ACTIVE";

export const authzService = {
  accessFor(user: AppUser | null): Access {
    if (!user) return "SIGNED_OUT";
    if (user.status === "ACTIVE") return "ACTIVE";
    if (user.status === "BLOCKED") return "BLOCKED";
    return "PENDING";
  },
  isAdmin(user: AppUser | null): boolean {
    return !!user && user.status === "ACTIVE" && user.role === "ADMIN";
  },
  canManageUsers(user: AppUser | null): boolean {
    return this.isAdmin(user);
  },
  canWriteTransactions(user: AppUser | null): boolean {
    return !!user && user.status === "ACTIVE";
  },
};
