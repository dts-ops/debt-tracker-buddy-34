import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { PageHeader } from "@/components/AppShell";
import { debtService } from "@/services/debt.service";
import { peopleService } from "@/services/people.service";
import { formatVnd, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/debts")({
  head: () => ({
    meta: [
      { title: "Danh sách công nợ — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content: "Xem số dư công nợ theo từng người, tìm kiếm theo tên hoặc số điện thoại.",
      },
      { property: "og:title", content: "Danh sách công nợ" },
      {
        property: "og:description",
        content: "Số dư công nợ theo từng người, tìm kiếm tức thì.",
      },
    ],
  }),
  component: DebtsPage,
});

function DebtsPage() {
  const { people, txns } = useApp();
  const [q, setQ] = useState("");
  const balances = useMemo(() => debtService.balances(people, txns), [people, txns]);
  const filtered = useMemo(() => {
    const ids = new Set(peopleService.search(people, q).map((p) => p.id));
    return balances.filter((b) => ids.has(b.person.id));
  }, [balances, people, q]);

  return (
    <>
      <PageHeader title="Công nợ" subtitle={`${people.length} người`} />
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại"
            className="h-12 pl-10"
          />
        </div>
      </div>

      <div className="border-y bg-surface">
        {filtered.map(({ person, balance, lastDate }) => (
          <Link
            key={person.id}
            to="/person/$personId"
            params={{ personId: person.id }}
            className="flex items-center justify-between gap-3 border-b px-4 py-3.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{person.name}</p>
              <p className="text-xs text-muted-foreground">
                {balance === 0
                  ? "Không có công nợ"
                  : balance > 0
                    ? "Người này nợ bạn"
                    : "Bạn đang nợ người này"}
                {lastDate ? ` · Gần nhất ${formatDate(lastDate)}` : ""}
              </p>
            </div>
            {balance !== 0 ? (
              <span
                className="shrink-0 font-semibold tabular"
                style={{ color: balance > 0 ? "var(--credit)" : "var(--debit)" }}
              >
                {formatVnd(balance)}
              </span>
            ) : (
              <span className="shrink-0 text-sm text-muted-foreground tabular">0 ₫</span>
            )}
          </Link>
        ))}
        {!filtered.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Không tìm thấy người nào
          </p>
        ) : null}
      </div>
    </>
  );
}
