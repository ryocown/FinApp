import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { date: 'Oct 31', value: 6500 },
  { date: 'Nov 05', value: 6400 },
  { date: 'Nov 10', value: 6300 },
  { date: 'Nov 15', value: 6200 },
  { date: 'Nov 20', value: 6100 },
  { date: 'Nov 25', value: 6000 },
  { date: 'Nov 29', value: 6000 },
  { date: 'Nov 30', value: 6418.94 },
]

export function NetWorthChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
            dy={10}
          />
          <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#10b981' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
