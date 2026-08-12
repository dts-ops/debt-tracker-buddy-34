import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { useTxnSheet } from "@/components/AppShell";
import { debtService } from "@/services/debt.service";
import { peopleService } from "@/services/people.service";
import { TxnItem } from "@/components/TxnItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd } from "@/lib/format";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/person/$personId")({
  head: () => ({
    meta: [
      { title: "Chi tiết công nợ — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content: "Số dư, timeline giao dịch và lịch sử chỉnh sửa của từng người.",
      },
      { property: "og:title", content: "Chi tiết công nợ" },
      {
        property: "og:description",
        content: "Số dư và timeline giao dịch của một người.",
      },
    ],
  }),
  component: PersonDetail,
});

const PAGE = 20;

function PersonDetail() {
  const { personId } = useParams({ from: "/person/$personId" });
  const { people, txns } = useApp();
  const { openTxn } = useTxnSheet();
  const [limit, setLimit] = useState(PAGE);
  const [editOpen, setEditOpen] = useState(false);

  const person = people.find((p) => p.id === personId) ?? null;
  const rows = useMemo(() => debtService.timeline(txns, personId), [txns, personId]);
  const balance = debtService.balanceOf(txns, personId);
  const [form, setForm] = useState({
    name: person?.name ?? "",
    phone: person?.phone ?? "",
    address: person?.address ?? "",
    note: person?.note ?? "",
  });

  if (!person) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        Không tìm thấy người này.
        <div className="mt-4">
          <Link to="/debts" className="text-primary">
            Về danh sách công nợ
          </Link>
        </div>
      </div>
    );
  }

  const savePerson = async () => {
    try {
      await peopleService.update(person.id, form);
      setEditOpen(false);
      toast.success("Đã cập nhật thông tin");
    } catch (e) {
      toast.error("Thất bại: " + (e as Error).message);
    }
  };

  return (
    <>
      <header className="px-4 pt-5">
        <Link to="/debts" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Công nợ
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{person.name}</h1>
            {person.phone ? (
              <p className="text-sm text-muted-foreground">{person.phone}</p>
            ) : null}
            {person.note ? (
              <p className="text-sm text-muted-foreground">{person.note}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setForm({
                name: person.name,
                phone: person.phone,
                address: person.address,
                note: person.note,
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </div>

        <div className="mt-4 rounded-xl border bg-surface p-4">
          <p className="text-xs text-muted-foreground">
            {balance === 0
              ? "Không có công nợ"
              : balance > 0
                ? `${person.name} đang nợ bạn`
                : `Bạn đang nợ ${person.name}`}
          </p>
          <p
            className="mt-1 text-amount font-semibold tabular"
            style={{
              color:
                balance === 0
                  ? "var(--foreground)"
                  : balance > 0
                    ? "var(--credit)"
                    : "var(--debit)",
            }}
          >
            {formatVnd(balance)}
          </p>
          <Button className="mt-3 w-full" onClick={() => openTxn({ personId: person.id })}>
            <Plus className="size-4" /> Ghi giao dịch
          </Button>
        </div>
      </header>

      <h2 className="px-4 pt-6 pb-2 text-sm font-semibold text-muted-foreground">
        Lịch sử giao dịch
      </h2>
      <div className="border-y bg-surface">
        {rows.slice(0, limit).map(({ txn, running }) => (
          <TxnItem key={txn.id} txn={txn} running={running} />
        ))}
        {!rows.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào
          </p>
        ) : null}
      </div>
      {rows.length > limit ? (
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
            Tải thêm
          </Button>
        </div>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePerson} disabled={!form.name.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
