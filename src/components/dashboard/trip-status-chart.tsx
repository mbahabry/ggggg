"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TripStatus } from "@/generated/prisma/client";

const COLORS: Record<TripStatus, string> = {
  DRAFT: "var(--color-chart-3)",
  PENDING_ACCEPTANCE: "var(--color-chart-4)",
  ACCEPTED: "var(--color-chart-2)",
  TO_PICKUP: "var(--color-chart-2)",
  LOADED: "var(--color-chart-2)",
  TO_DROPOFF: "var(--color-chart-1)",
  DELIVERED: "var(--color-chart-3)",
  CANCELLED: "var(--color-chart-5)",
};

// Shorter labels tailored for the narrow chart axis (full labels are used everywhere else via TRIP_STATUS_LABELS).
const CHART_LABELS: Record<TripStatus, string> = {
  DRAFT: "مسودة",
  PENDING_ACCEPTANCE: "بانتظار القبول",
  ACCEPTED: "مقبولة",
  TO_PICKUP: "إلى التحميل",
  LOADED: "تم التحميل",
  TO_DROPOFF: "إلى التسليم",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغاة",
};

export function TripStatusChart({ data }: { data: { status: TripStatus; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: CHART_LABELS[d.status],
    count: d.count,
    status: d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={95}
          interval={0}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [value, "عدد الرحلات"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
