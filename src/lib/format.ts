const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ar-SA");

const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSAR(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(num);
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return numberFormatter.format(num);
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function daysUntil(value: Date | string): number {
  const target = new Date(value);
  const now = new Date();
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
