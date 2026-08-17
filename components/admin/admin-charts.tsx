"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DailyRiskPoint = {
  date: string;
  none: number;
  low: number;
  medium: number;
  high: number;
  avgRisk: number;
};

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" };
const AXIS_LINE = { stroke: "rgba(100,116,139,0.3)" };
const GRID = "rgba(100,116,139,0.15)";
const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export default function RiskChart({ data }: { data: DailyRiskPoint[] }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 px-5 py-4 dark:border-neutral-700">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">
            Risk analysis
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Login attempts by risk level and average risk score — last 14 days
          </p>
        </div>
      </div>
      <div className="h-[360px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="riskLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={AXIS_LINE}
            />
            <YAxis
              yAxisId="count"
              allowDecimals={false}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <YAxis
              yAxisId="risk"
              orientation="right"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                if (name === "Avg risk score") {
                  return [`${(Number(value) * 100).toFixed(0)}%`, name];
                }
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="count"
              dataKey="none"
              name="No score"
              stackId="risk"
              fill="#94a3b8"
            />
            <Bar
              yAxisId="count"
              dataKey="low"
              name="Low"
              stackId="risk"
              fill="#10b981"
            />
            <Bar
              yAxisId="count"
              dataKey="medium"
              name="Medium"
              stackId="risk"
              fill="#f59e0b"
            />
            <Bar
              yAxisId="count"
              dataKey="high"
              name="High"
              stackId="risk"
              fill="#ef4444"
            />
            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="avgRisk"
              name="Avg risk score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}