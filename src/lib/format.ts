export function formatVnd(n: number): string {
  const abs = Math.abs(Math.round(n));
  return abs.toLocaleString("vi-VN") + " ₫";
}

export function formatSigned(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return sign + formatVnd(n);
}

export function parseAmount(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatAmountInput(raw: string): string {
  const n = parseAmount(raw);
  return n ? n.toLocaleString("vi-VN") : "";
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(ts: number): string {
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
