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

const MOCK_AUDIOBOOKS_DATA = [
  { month: "Jan", success: 380, inProgress: 5, queued: 3, failed: 18 },
  { month: "Feb", success: 395, inProgress: 7, queued: 4, failed: 20 },
  { month: "Mar", success: 410, inProgress: 8, queued: 5, failed: 21 },
  { month: "Apr", success: 425, inProgress: 10, queued: 6, failed: 22 },
  { month: "May", success: 435, inProgress: 11, queued: 7, failed: 22 },
  { month: "Jun", success: 445, inProgress: 12, queued: 8, failed: 23 },
];

const chartConfig = {
  success: { label: "Success", color: "var(--chart-1)" },
  inProgress: { label: "In progress", color: "var(--chart-2)" },
  queued: { label: "Queued", color: "var(--chart-3)" },
  failed: { label: "Failed", color: "var(--destructive)" },
} satisfies ChartConfig;

export function AudiobooksChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[320px] w-full">
      <LineChart data={MOCK_AUDIOBOOKS_DATA} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="success"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="inProgress"
          stroke="var(--color-inProgress)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="queued"
          stroke="var(--color-queued)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="var(--color-failed)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
