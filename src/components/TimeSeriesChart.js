import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function TimeSeriesChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No time series data available for selected filters.
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('th-TH', { notation: 'compact', compactDisplay: 'short' }).format(val);

  return (
    <div className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Sales Trend (Net Sales)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-muted)" 
            tick={{ fill: 'var(--text-muted)' }} 
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} tickFormatter={formatCurrency} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px' }}
            formatter={(value) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value)}
          />
          <Line 
            type="monotone" 
            dataKey="totalSales" 
            stroke="var(--accent-primary)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: 'var(--bg-dark)', strokeWidth: 2 }} 
            activeDot={{ r: 8, stroke: 'var(--accent-primary)', strokeWidth: 2, fill: 'var(--bg-dark)' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
