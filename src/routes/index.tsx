import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp } from "@/context/AppProvider";
import { PageHeader } from "@/components/AppShell";
import { debtService } from "@/services/debt.service";
import { formatVnd, formatDate } from "@/lib/format";
import { TxnItem } from "@/components/TxnItem";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tổng quan công nợ — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content:
          "Theo dõi tổng tiền phải thu, phải trả và các giao dịch công nợ gần đây trên điện thoại.",
      },
      { property: "og:title", content: "Tổng quan công nợ" },
      {
        property: "og:description",
        content: "Tổng phải thu, phải trả và giao dịch gần đây.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { people, txns, user, lastSyncAt } = useApp();
  const { theyOweMe, iOwe, list } = useMemo(
    () => debtService.totals(people, txns),
    [people, txns],
  );
  const recent = useMemo(
    () =>
      [...txns]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8),
    [txns],
  );
  const attention = list.filter((b) => Math.abs(b.balance) > 0).slice(0, 3);
  const personName = (id: string) => people.find((p) => p.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title={`Chào ${user?.name?.split(" ").slice(-1)[0] ?? ""}`}
        subtitle={
          lastSyncAt ? `Cập nhật ${formatDate(lastSyncAt)}` : "Đang đồng bộ..."
        }
      />

      <section className="grid grid-cols-2 gap-3 px-4">
        <div className="rounded-xl border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Tôi đang nợ</p>
          <p
            className="mt-1 text-xl font-semibold tabular"
            style={{ color: "var(--debit)" }}
          >
            {formatVnd(iOwe)}
          </p>
        </div>
        <div className="rounded-xl border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Người khác nợ tôi</p>
          <p
            className="mt-1 text-xl font-semibold tabular"
            style={{ color: "var(--credit)" }}
          >
            {formatVnd(theyOweMe)}
          </p>
        </div>
      </section>

      {attention.length ? (
        <section className="mt-6">
          <h2 className="px-4 pb-2 text-sm font-semibold text-muted-foreground">
            Công nợ cần chú ý
          </h2>
          <div className="border-y bg-surface">
            {attention.map(({ person, balance, lastDate }) => (
              <Link
                key={person.id}
                to="/person/$personId"
                params={{ personId: person.id }}
                className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {balance > 0 ? "Người này nợ bạn" : "Bạn đang nợ người này"}
                    {lastDate ? ` · ${formatDate(lastDate)}` : ""}
                  </p>
                </div>
                <span
                  className="shrink-0 font-semibold tabular"
                  style={{ color: balance > 0 ? "var(--credit)" : "var(--debit)" }}
                >
                  {formatVnd(balance)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Giao dịch gần đây
          </h2>
          <Link to="/transactions" className="flex items-center text-xs text-primary">
            Tất cả <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="border-y bg-surface">
          {recent.length ? (
            recent.map((t) => (
              <TxnItem key={t.id} txn={t} personName={personName(t.personId)} showPerson />
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Chưa có giao dịch nào. Bấm “+ Giao dịch” để bắt đầu.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
