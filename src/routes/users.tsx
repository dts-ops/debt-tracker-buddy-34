import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppProvider";
import { PageHeader } from "@/components/AppShell";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { AppUser } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Quản lý người dùng — Quản lý công nợ nội bộ" },
      {
        name: "description",
        content: "Duyệt, khóa và phân quyền tài khoản truy cập hệ thống công nợ nội bộ.",
      },
      { property: "og:title", content: "Quản lý người dùng" },
      { property: "og:description", content: "Duyệt, khóa và phân quyền tài khoản." },
    ],
  }),
  component: UsersPage,
});

const STATUS_LABEL = { PENDING: "Chờ duyệt", ACTIVE: "Đang hoạt động", BLOCKED: "Đã khóa" };

function UsersPage() {
  const { isAdmin } = useApp();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    return userService.subscribeAll(setUsers, () =>
      setError("Không có quyền đọc danh sách người dùng."),
    );
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="px-4 py-20 text-center text-sm text-muted-foreground">
        Bạn không có quyền quản lý người dùng.
      </div>
    );
  }

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      toast.success("Đã cập nhật");
    } catch (e) {
      toast.error("Thất bại: " + (e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Người dùng" subtitle={`${users.length} tài khoản`} />
      {error ? <p className="px-4 text-sm text-destructive">{error}</p> : null}
      <div className="border-y bg-surface">
        {users.map((u) => (
          <div key={u.id} className="border-b px-4 py-3.5 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {STATUS_LABEL[u.status]} · {u.role} · {formatDate(u.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {u.status !== "ACTIVE" ? (
                <Button size="sm" variant="outline" onClick={() => act(() => userService.setStatus(u.id, "ACTIVE"))}>
                  Cấp quyền
                </Button>
              ) : null}
              {u.status !== "BLOCKED" ? (
                <Button size="sm" variant="outline" onClick={() => act(() => userService.setStatus(u.id, "BLOCKED"))}>
                  Khóa
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  act(() => userService.setRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN"))
                }
              >
                {u.role === "ADMIN" ? "Chuyển thành USER" : "Chuyển thành ADMIN"}
              </Button>
            </div>
          </div>
        ))}
        {!users.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có tài khoản nào
          </p>
        ) : null}
      </div>
    </>
  );
}
