import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Person } from "@/types";
import { normalize } from "@/lib/format";

function toPerson(id: string, d: Record<string, unknown>): Person {
  return {
    id,
    name: (d["name"] as string) ?? "",
    phone: (d["phone"] as string) ?? "",
    address: (d["address"] as string) ?? "",
    note: (d["note"] as string) ?? "",
    createdAt: Number(d["createdAt"] ?? 0),
    updatedAt: Number(d["updatedAt"] ?? 0),
    createdBy: (d["createdBy"] as string) ?? "",
  };
}

export const peopleService = {
  subscribe(cb: (p: Person[]) => void, onError?: (e: unknown) => void) {
    return onSnapshot(
      collection(getDb(), "people"),
      (snap) =>
        cb(
          snap.docs
            .map((d) => toPerson(d.id, d.data()))
            .sort((a, b) => a.name.localeCompare(b.name, "vi")),
        ),
      (e) => onError?.(e),
    );
  },

  async create(
    input: { name: string; phone?: string; address?: string; note?: string },
    createdBy: string,
  ): Promise<string> {
    const now = Date.now();
    const ref = await addDoc(collection(getDb(), "people"), {
      name: input.name.trim(),
      phone: input.phone?.trim() ?? "",
      address: input.address?.trim() ?? "",
      note: input.note?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
      createdBy,
    });
    return ref.id;
  },

  async update(id: string, patch: Partial<Omit<Person, "id">>) {
    await updateDoc(doc(getDb(), "people", id), { ...patch, updatedAt: Date.now() });
  },

  async remove(id: string) {
    await deleteDoc(doc(getDb(), "people", id));
  },

  search(people: Person[], query: string): Person[] {
    const q = normalize(query);
    if (!q) return people;
    return people.filter(
      (p) => normalize(p.name).includes(q) || p.phone.replace(/\s/g, "").includes(q),
    );
  },
};
