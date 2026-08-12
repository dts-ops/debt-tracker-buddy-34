import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { AppUser, PaymentMethod, TransactionType, Txn, TxnHistory } from "@/types";
import { TXN_LABEL, PAYMENT_LABEL } from "@/types";
import { formatVnd, formatDate } from "@/lib/format";

function toTxn(id: string, d: Record<string, unknown>): Txn {
  return {
    id,
    personId: (d["personId"] as string) ?? "",
    type: (d["type"] as TransactionType) ?? "DEBT_I_OWE",
    amount: Number(d["amount"] ?? 0),
    content: (d["content"] as string) ?? "",
    paymentMethod: (d["paymentMethod"] as PaymentMethod | null) ?? null,
    transactionDate: Number(d["transactionDate"] ?? 0),
    createdBy: (d["createdBy"] as string) ?? "",
    createdByName: (d["createdByName"] as string) ?? "",
    createdAt: Number(d["createdAt"] ?? 0),
    updatedAt: Number(d["updatedAt"] ?? 0),
    deleted: Boolean(d["deleted"] ?? false),
    deletedBy: (d["deletedBy"] as string) ?? "",
    deletedAt: Number(d["deletedAt"] ?? 0),
  };
}

export interface TxnInput {
  personId: string;
  type: TransactionType;
  amount: number;
  content: string;
  paymentMethod: PaymentMethod | null;
  transactionDate: number;
}

function describe(field: keyof Txn, value: unknown): string {
  if (field === "amount") return formatVnd(Number(value));
  if (field === "type") return TXN_LABEL[value as TransactionType];
  if (field === "paymentMethod")
    return value ? PAYMENT_LABEL[value as PaymentMethod] : "—";
  if (field === "transactionDate") return formatDate(Number(value));
  return String(value || "—");
}

const FIELD_LABEL: Partial<Record<keyof Txn, string>> = {
  type: "Loại giao dịch",
  amount: "Số tiền",
  content: "Nội dung",
  paymentMethod: "Phương thức",
  transactionDate: "Ngày giao dịch",
};

export const transactionService = {
  subscribe(cb: (t: Txn[]) => void, onError?: (e: unknown) => void) {
    return onSnapshot(
      query(collection(getDb(), "transactions"), orderBy("transactionDate", "desc")),
      (snap) => cb(snap.docs.map((d) => toTxn(d.id, d.data()))),
      (e) => onError?.(e),
    );
  },

  async create(input: TxnInput, user: AppUser): Promise<string> {
    const now = Date.now();
    const ref = await addDoc(collection(getDb(), "transactions"), {
      ...input,
      content: input.content.trim(),
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    });
    return ref.id;
  },

  async update(prev: Txn, input: TxnInput, user: AppUser) {
    const fields: (keyof Txn)[] = [
      "type",
      "amount",
      "content",
      "paymentMethod",
      "transactionDate",
    ];
    const changes: string[] = [];
    const previousData: Partial<Txn> = {};
    const newData: Partial<Txn> = {};

    for (const f of fields) {
      const before = prev[f] ?? null;
      const after = (input as unknown as Record<string, unknown>)[f] ?? null;
      if (before !== after) {
        changes.push(
          `${FIELD_LABEL[f]}: ${describe(f, before)} → ${describe(f, after)}`,
        );
        (previousData as Record<string, unknown>)[f] = before;
        (newData as Record<string, unknown>)[f] = after;
      }
    }
    if (!changes.length) return;

    const db = getDb();
    await updateDoc(doc(db, "transactions", prev.id), {
      ...input,
      content: input.content.trim(),
      updatedAt: Date.now(),
    });
    await addDoc(collection(db, "transactions", prev.id, "history"), {
      transactionId: prev.id,
      changedBy: user.id,
      changedByName: user.name,
      changedAt: Date.now(),
      action: "UPDATE",
      changes,
      previousData,
      newData,
    });
  },

  async softDelete(txn: Txn, user: AppUser) {
    const db = getDb();
    await updateDoc(doc(db, "transactions", txn.id), {
      deleted: true,
      deletedBy: user.id,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await addDoc(collection(db, "transactions", txn.id, "history"), {
      transactionId: txn.id,
      changedBy: user.id,
      changedByName: user.name,
      changedAt: Date.now(),
      action: "DELETE",
      changes: [`Đã hủy giao dịch ${formatVnd(txn.amount)}`],
      previousData: { deleted: false },
      newData: { deleted: true },
    });
  },

  async restore(txn: Txn, user: AppUser) {
    const db = getDb();
    await updateDoc(doc(db, "transactions", txn.id), {
      deleted: false,
      updatedAt: Date.now(),
    });
    await addDoc(collection(db, "transactions", txn.id, "history"), {
      transactionId: txn.id,
      changedBy: user.id,
      changedByName: user.name,
      changedAt: Date.now(),
      action: "RESTORE",
      changes: ["Đã khôi phục giao dịch"],
      previousData: { deleted: true },
      newData: { deleted: false },
    });
  },

  async getHistory(transactionId: string): Promise<TxnHistory[]> {
    const snap = await getDocs(
      query(
        collection(getDb(), "transactions", transactionId, "history"),
        orderBy("changedAt", "desc"),
      ),
    );
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        transactionId,
        changedBy: (x["changedBy"] as string) ?? "",
        changedByName: (x["changedByName"] as string) ?? "",
        changedAt: Number(x["changedAt"] ?? 0),
        action: (x["action"] as TxnHistory["action"]) ?? "UPDATE",
        changes: (x["changes"] as string[]) ?? [],
        previousData: (x["previousData"] as Partial<Txn>) ?? {},
        newData: (x["newData"] as Partial<Txn>) ?? {},
      };
    });
  },
};
