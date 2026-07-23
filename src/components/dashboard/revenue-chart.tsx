"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatSAR } from "@/lib/format";

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number; expense: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v / 1000)}ألف`}
          width={50}
        />
        <Tooltip
          formatter={(value) => formatSAR(Number(value))}
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value) => (value === "revenue" ? "الإيرادات" : "المصروفات")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-1)"
          fill="url(#revenueFill)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="var(--color-chart-5)"
          fill="url(#expenseFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
