export type UserRole = "ADMIN" | "USER";
export type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED";

export interface AppUser {
  id: string;
  googleUid: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type TransactionType =
  | "DEBT_I_OWE"
  | "DEBT_THEY_OWE"
  | "PAYMENT_I_PAID"
  | "PAYMENT_THEY_PAID";

export type PaymentMethod = "CASH" | "TRANSFER" | "OTHER";

export interface Txn {
  id: string;
  personId: string;
  type: TransactionType;
  amount: number;
  content: string;
  paymentMethod: PaymentMethod | null;
  transactionDate: number;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  deletedBy?: string;
  deletedAt?: number;
}

export interface TxnHistory {
  id: string;
  transactionId: string;
  changedBy: string;
  changedByName: string;
  changedAt: number;
  action: "UPDATE" | "DELETE" | "RESTORE";
  changes: string[];
  previousData: Partial<Txn>;
  newData: Partial<Txn>;
}

export const TXN_LABEL: Record<TransactionType, string> = {
  DEBT_I_OWE: "Tôi nợ người này",
  DEBT_THEY_OWE: "Người này nợ tôi",
  PAYMENT_I_PAID: "Tôi trả người này",
  PAYMENT_THEY_PAID: "Người này trả tôi",
};

export const TXN_HINT: Record<TransactionType, string> = {
  DEBT_I_OWE: "Mua hàng / phát sinh nợ",
  DEBT_THEY_OWE: "Bán chịu / phát sinh khoản phải thu",
  PAYMENT_I_PAID: "Thanh toán khoản mình đang nợ",
  PAYMENT_THEY_PAID: "Thu tiền khoản họ đang nợ",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  TRANSFER: "Chuyển khoản",
  OTHER: "Khác",
};

export const isPayment = (t: TransactionType) =>
  t === "PAYMENT_I_PAID" || t === "PAYMENT_THEY_PAID";

/** Signed effect on balance. Positive = họ nợ mình, negative = mình nợ họ. */
export function signedAmount(t: TransactionType, amount: number): number {
  switch (t) {
    case "DEBT_THEY_OWE":
      return amount;
    case "PAYMENT_THEY_PAID":
      return -amount;
    case "DEBT_I_OWE":
      return -amount;
    case "PAYMENT_I_PAID":
      return amount;
  }
}
