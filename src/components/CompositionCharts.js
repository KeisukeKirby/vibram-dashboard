import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4'];

export default function CompositionCharts({ data }) {
  if (!data) return null;

  const renderPie = (chartData, title) => (
    <div className="glass-panel" style={{ padding: '2rem', height: '400px', flex: 1, minWidth: '300px' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      {data.categories && renderPie(data.categories, 'Sales by Category')}
      {data.channels && renderPie(data.channels, 'Sales by Channel')}
    </div>
  );
}
