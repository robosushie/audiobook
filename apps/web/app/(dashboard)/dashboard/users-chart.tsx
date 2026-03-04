"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const MOCK_USERS_DATA = [
  { month: "Jan", total: 920, free: 600, pro: 220, premium: 100 },
  { month: "Feb", total: 980, free: 630, pro: 230, premium: 120 },
  { month: "Mar", total: 1040, free: 660, pro: 240, premium: 140 },
  { month: "Apr", total: 1100, free: 700, pro: 250, premium: 150 },
  { month: "May", total: 1160, free: 740, pro: 250, premium: 170 },
  { month: "Jun", total: 1200, free: 760, pro: 250, premium: 190 },
];

const chartConfig = {
  total: { label: "Total users", color: "var(--chart-1)" },
  free: { label: "Free", color: "var(--chart-2)" },
  pro: { label: "Pro", color: "var(--chart-3)" },
  premium: { label: "Premium", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function UsersChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[320px] w-full">
      <LineChart data={MOCK_USERS_DATA} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="free" stroke="var(--color-free)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="pro" stroke="var(--color-pro)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="premium" stroke="var(--color-premium)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
