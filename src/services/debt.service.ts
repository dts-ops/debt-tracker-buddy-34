import type { Person, Txn } from "@/types";
import { signedAmount } from "@/types";

export interface PersonBalance {
  person: Person;
  /** > 0 : họ nợ mình, < 0 : mình nợ họ */
  balance: number;
  lastDate: number;
  txnCount: number;
}

export const debtService = {
  activeTxns(txns: Txn[]): Txn[] {
    return txns.filter((t) => !t.deleted);
  },

  balanceOf(txns: Txn[], personId: string): number {
    return this.activeTxns(txns)
      .filter((t) => t.personId === personId)
      .reduce((sum, t) => sum + signedAmount(t.type, t.amount), 0);
  },

  balances(people: Person[], txns: Txn[]): PersonBalance[] {
    const active = this.activeTxns(txns);
    return people
      .map((person) => {
        const own = active.filter((t) => t.personId === person.id);
        return {
          person,
          balance: own.reduce((s, t) => s + signedAmount(t.type, t.amount), 0),
          lastDate: own.reduce((m, t) => Math.max(m, t.transactionDate), 0),
          txnCount: own.length,
        };
      })
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  },

  totals(people: Person[], txns: Txn[]) {
    const list = this.balances(people, txns);
    const theyOweMe = list.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
    const iOwe = list.filter((b) => b.balance < 0).reduce((s, b) => s - b.balance, 0);
    return { theyOweMe, iOwe, net: theyOweMe - iOwe, list };
  },

  /** Running balance per transaction for a person, oldest → newest. */
  timeline(txns: Txn[], personId: string) {
    const own = txns
      .filter((t) => t.personId === personId)
      .sort(
        (a, b) => a.transactionDate - b.transactionDate || a.createdAt - b.createdAt,
      );
    let running = 0;
    const rows = own.map((t) => {
      if (!t.deleted) running += signedAmount(t.type, t.amount);
      return { txn: t, running };
    });
    return rows.reverse();
  },
};
