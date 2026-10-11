import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { theme } from "@/constants/theme";
import type { DailyAudiobookCount } from "@/types/api";

type AudiobookActivityChartProps = {
  data: DailyAudiobookCount[];
};

function formatDay(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AudiobookActivityChart({ data }: AudiobookActivityChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    label: formatDay(row.date),
  }));

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Audiobook generations</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Last 30 days</p>
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={theme.colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: theme.colors.mutedForeground }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: theme.colors.mutedForeground }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: theme.radius.lg,
                border: `1px solid ${theme.colors.border}`,
                fontSize: 12,
              }}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.date
                  ? formatDay(String(payload[0].payload.date))
                  : ""
              }
            />
            <Bar dataKey="count" fill={theme.colors.chart} radius={[0, 0, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
