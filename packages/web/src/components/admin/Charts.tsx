import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

const CHART_COLORS = ["#0ea5e9", "#14b8a6", "#f97316", "#22c55e", "#e11d48", "#f59e0b"];

type ChartDatum = object;

interface BaseChartProps<T extends ChartDatum> {
  title: string;
  data: T[];
  dataKey: keyof T & string;
  xAxisKey: keyof T & string;
  valueFormatter?: (value: number) => string;
}

function defaultNumberFormatter(value: number) {
  return value.toLocaleString("vi-VN");
}

function getValueFormatter(
  dataKey: string,
  valueFormatter?: (value: number) => string,
) {
  if (valueFormatter) {
    return valueFormatter;
  }

  const isCurrency =
    dataKey.toLowerCase().includes("revenue") ||
    dataKey.toLowerCase().includes("amount") ||
    dataKey.toLowerCase().includes("price");

  if (isCurrency) {
    return (value: number) => `${value.toLocaleString("vi-VN")}đ`;
  }

  return defaultNumberFormatter;
}

export function LineChartComponent<T extends ChartDatum>({
  title,
  data,
  dataKey,
  xAxisKey,
  valueFormatter,
}: BaseChartProps<T>) {
  const formatValue = getValueFormatter(dataKey, valueFormatter);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
            formatter={(value: number) => formatValue(value)}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS[0]}
            strokeWidth={2.5}
            dot={{ fill: CHART_COLORS[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarChartComponent<T extends ChartDatum>({
  title,
  data,
  dataKey,
  xAxisKey,
  valueFormatter,
}: BaseChartProps<T>) {
  const formatValue = getValueFormatter(dataKey, valueFormatter);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
            formatter={(value: number) => formatValue(value)}
          />
          <Bar dataKey={dataKey} radius={[10, 10, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`bar-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface PieChartProps<T extends ChartDatum> {
  title: string;
  data: T[];
  dataKey: keyof T & string;
  nameKey: keyof T & string;
  valueFormatter?: (value: number) => string;
}

export function PieChartComponent<T extends ChartDatum>({
  title,
  data,
  dataKey,
  nameKey,
  valueFormatter,
}: PieChartProps<T>) {
  const formatValue = getValueFormatter(dataKey, valueFormatter);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((_, index) => (
              <Cell key={`pie-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
            }}
            formatter={(value: number) => formatValue(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
