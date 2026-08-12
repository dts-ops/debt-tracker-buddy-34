import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { PageHeader } from "@/components/AppShell";
import { peopleService } from "@/services/people.service";
import { cacheService } from "@/services/cache.service";
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
import { formatDateTime } from "@/lib/format";
import { LogOut, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "Cài đặt & tài khoản — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content: "Thông tin tài khoản, thêm người mới, trạng thái đồng bộ và bộ nhớ đệm.",
      },
      { property: "og:title", content: "Cài đặt & tài khoản" },
      {
        property: "og:description",
        content: "Tài khoản, thêm người, đồng bộ và bộ nhớ đệm.",
      },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  const { user, people, txns, lastSyncAt, offline, signOutUser } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const activeCount = useMemo(() => txns.filter((t) => !t.deleted).length, [txns]);

  const addPerson = async () => {
    if (!user) return;
    try {
      await peopleService.create(form, user.id);
      setForm({ name: "", phone: "", note: "" });
      setOpen(false);
      toast.success("Đã thêm người");
    } catch (e) {
      toast.error("Thất bại: " + (e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Khác" subtitle={user?.email ?? ""} />

      <div className="mx-4 rounded-xl border bg-surface p-4">
        <p className="font-medium">{user?.name}</p>
        <p className="text-sm text-muted-foreground">
          Quyền: {user?.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {offline
            ? "Đang offline — dữ liệu hiển thị từ bộ nhớ đệm"
            : lastSyncAt
              ? `Đồng bộ lúc ${formatDateTime(lastSyncAt)}`
              : "Đang đồng bộ..."}
        </p>
        <p className="text-xs text-muted-foreground">
          {people.length} người · {activeCount} giao dịch
        </p>
      </div>

      <div className="mt-4 space-y-2 px-4">
        <Button variant="outline" className="w-full justify-start" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" /> Thêm người mới
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            cacheService.clearAll();
            window.location.reload();
          }}
        >
          <RefreshCw className="size-4" /> Xóa bộ nhớ đệm & tải lại
        </Button>
        <Button variant="outline" className="w-full justify-start text-destructive" onClick={signOutUser}>
          <LogOut className="size-4" /> Đăng xuất
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm người mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tên *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addPerson} disabled={!form.name.trim()}>
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
