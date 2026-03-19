import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const CATEGORY_COLORS = {
  food: '#f59e0b',
  transport: '#3b82f6',
  shopping: '#8b5cf6',
  bills: '#ef4444',
  entertainment: '#ec4899',
  health: '#10b981',
  others: '#6b7280',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      {label && <p className="text-slate-400 text-xs mb-2">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white text-sm font-medium capitalize">{payload[0].name}</p>
      <p className="text-slate-300 text-sm">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
      <p className="text-slate-400 text-xs">{payload[0].payload.percent?.toFixed(1)}%</p>
    </div>
  );
};

// Monthly bar chart (income vs expense)
export function MonthlyChart({ data }) {
  if (!data?.length) return <EmptyChart message="No monthly data yet" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend formatter={(v) => <span className="text-slate-400 text-xs capitalize">{v}</span>} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="expense" name="Expense" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Category pie chart
export function CategoryPieChart({ data }) {
  if (!data?.length) return <EmptyChart message="No category data yet" />;
  const total = data.reduce((s, d) => s + d.value, 0);
  const withPercent = data.map((d) => ({ ...d, percent: (d.value / total) * 100 }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie data={withPercent} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
            dataKey="value" paddingAngle={3}>
            {withPercent.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 flex-1">
        {withPercent.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2 min-w-[130px]">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[entry.name] || '#6b7280' }} />
            <div>
              <p className="text-xs font-medium text-slate-300 capitalize">{entry.name}</p>
              <p className="text-xs text-slate-500">₹{Number(entry.value).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Spending trend line chart
export function TrendChart({ data }) {
  if (!data?.length) return <EmptyChart message="No trend data yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="expense" name="Expense" stroke="#6366f1"
          strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-48 text-slate-500 text-sm">{message}</div>
  );
}
