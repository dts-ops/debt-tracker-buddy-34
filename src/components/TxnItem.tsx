import { useState } from "react";
import { useApp } from "@/context/AppProvider";
import { useTxnSheet } from "@/components/AppShell";
import { transactionService } from "@/services/transaction.service";
import { formatVnd, formatDateTime, formatDate } from "@/lib/format";
import {
  TXN_LABEL,
  PAYMENT_LABEL,
  signedAmount,
  type Txn,
  type TxnHistory,
} from "@/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function TxnItem({
  txn,
  running,
  personName,
  showPerson,
}: {
  txn: Txn;
  running?: number;
  personName?: string;
  showPerson?: boolean;
}) {
  const { user } = useApp();
  const { openTxn } = useTxnSheet();
  const [history, setHistory] = useState<TxnHistory[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const signed = signedAmount(txn.type, txn.amount);

  const loadHistory = async () => {
    if (history) return setHistory(null);
    try {
      setHistory(await transactionService.getHistory(txn.id));
    } catch (e) {
      toast.error("Không tải được lịch sử: " + (e as Error).message);
    }
  };

  const doDelete = async () => {
    if (!user) return;
    try {
      await transactionService.softDelete(txn, user);
      toast.success("Đã hủy giao dịch");
    } catch (e) {
      toast.error("Thất bại: " + (e as Error).message);
    }
  };

  const doRestore = async () => {
    if (!user) return;
    try {
      await transactionService.restore(txn, user);
      toast.success("Đã khôi phục");
    } catch (e) {
      toast.error("Thất bại: " + (e as Error).message);
    }
  };

  return (
    <article className={`border-b px-4 py-3 ${txn.deleted ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showPerson && personName ? (
            <p className="truncate text-sm font-semibold">{personName}</p>
          ) : null}
          <p className="text-sm font-medium">{txn.content || TXN_LABEL[txn.type]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(txn.transactionDate)} · {TXN_LABEL[txn.type]}
            {txn.paymentMethod ? ` · ${PAYMENT_LABEL[txn.paymentMethod]}` : ""}
          </p>
          {txn.deleted ? (
            <p className="mt-1 text-xs font-medium text-destructive">
              Đã hủy giao dịch
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-base font-semibold tabular ${txn.deleted ? "line-through" : ""}`}
            style={{ color: signed >= 0 ? "var(--credit)" : "var(--debit)" }}
          >
            {signed >= 0 ? "+" : "−"}
            {formatVnd(txn.amount)}
          </p>
          {running !== undefined && !txn.deleted ? (
            <p className="text-[11px] text-muted-foreground tabular">
              Số dư: {formatVnd(running)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {!txn.deleted ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => openTxn({ editing: txn })}
          >
            <Pencil className="size-3.5" /> Sửa
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={doRestore}>
            <RotateCcw className="size-3.5" /> Khôi phục
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={loadHistory}>
          <History className="size-3.5" /> Lịch sử
        </Button>
        {!txn.deleted ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-destructive"
            onClick={() => setConfirm(true)}
          >
            <Trash2 className="size-3.5" /> Xóa
          </Button>
        ) : null}
      </div>

      {history ? (
        <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
          <p className="font-medium text-muted-foreground">
            Tạo bởi {txn.createdByName || "—"} · {formatDateTime(txn.createdAt)}
          </p>
          {history.length === 0 ? (
            <p className="text-muted-foreground">Chưa có chỉnh sửa nào.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="border-t pt-2">
                <p className="font-medium">
                  {h.action === "UPDATE"
                    ? "✎ Đã chỉnh sửa giao dịch"
                    : h.action === "DELETE"
                      ? "✕ Đã hủy giao dịch"
                      : "↺ Đã khôi phục giao dịch"}
                </p>
                {h.changes.map((c, i) => (
                  <p key={i} className="text-muted-foreground">
                    {c}
                  </p>
                ))}
                <p className="mt-0.5 text-muted-foreground">
                  Bởi {h.changedByName} · {formatDateTime(h.changedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giao dịch này?</AlertDialogTitle>
            <AlertDialogDescription>
              Giao dịch sẽ được đánh dấu đã hủy và vẫn lưu trong lịch sử kiểm toán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Xóa giao dịch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
