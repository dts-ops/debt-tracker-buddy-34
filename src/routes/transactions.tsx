import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { PageHeader } from "@/components/AppShell";
import { TxnItem } from "@/components/TxnItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalize } from "@/lib/format";
import { Search } from "lucide-react";

const PAGE = 25;

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Lịch sử giao dịch — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content: "Toàn bộ giao dịch nợ và thanh toán, kèm lịch sử chỉnh sửa có kiểm toán.",
      },
      { property: "og:title", content: "Lịch sử giao dịch" },
      {
        property: "og:description",
        content: "Giao dịch nợ, thanh toán và audit log chỉnh sửa.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { txns, people } = useApp();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const nq = normalize(q);
    const sorted = [...txns].sort(
      (a, b) => b.transactionDate - a.transactionDate || b.createdAt - a.createdAt,
    );
    if (!nq) return sorted;
    return sorted.filter(
      (t) =>
        normalize(nameOf(t.personId)).includes(nq) ||
        normalize(t.content).includes(nq),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txns, people, q]);

  return (
    <>
      <PageHeader title="Giao dịch" subtitle={`${filtered.length} giao dịch`} />
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Tìm theo người hoặc nội dung"
            className="h-12 pl-10"
          />
        </div>
      </div>
      <div className="border-y bg-surface">
        {filtered.slice(0, limit).map((t) => (
          <TxnItem key={t.id} txn={t} personName={nameOf(t.personId)} showPerson />
        ))}
        {!filtered.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào
          </p>
        ) : null}
      </div>
      {filtered.length > limit ? (
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
            Tải thêm
          </Button>
        </div>
      ) : null}
    </>
  );
}
