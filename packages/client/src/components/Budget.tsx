import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useBudget } from '../lib/hooks'

interface BudgetProps {
  userId: string
}

export function Budget({ userId }: BudgetProps) {
  const { budget: budgetData } = useBudget(userId)

  const totalBudget = budgetData.reduce((acc, curr) => acc + (curr.budget || 0), 0)
  const totalActual = budgetData.reduce((acc, curr) => acc + (curr.actual || 0), 0)
  const percentageUsed = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  return (
    <main className="flex-1 overflow-auto">
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Budget</h1>
          <p className="text-zinc-400 text-sm">Manage your monthly spending</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium text-zinc-200 transition-colors">
            November 2025
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Total Budget Usage</h3>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: totalActual }, { value: totalBudget - totalActual }]}
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={percentageUsed > 100 ? '#ef4444' : '#10b981'} />
                    <Cell fill="#27272a" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-100">{Math.round(percentageUsed)}%</span>
                <span className="text-zinc-400 text-sm">of budget</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-zinc-100">${totalActual.toLocaleString()} / ${totalBudget.toLocaleString()}</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Spending by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="budget"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                    itemStyle={{ color: '#f4f4f5' }}
                    formatter={(value: number) => [`$${value}`, 'Budget']}
                  />
                  <Legend formatter={(_value, entry: any) => <span className="text-zinc-300">{entry.payload.name}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-zinc-100">Category Breakdown</h3>
          <div className="space-y-6">
            {budgetData.map((category: any) => {
              const catPercentage = category.budget > 0 ? (category.actual / category.budget) * 100 : 0
              const isOverBudget = category.actual > category.budget
              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || '#3b82f6' }} />
                      <span className="font-medium text-zinc-200">{category.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className={isOverBudget ? 'text-red-400 font-medium' : 'text-zinc-200'}>
                        ${(category.actual || 0).toLocaleString()}
                      </span>
                      <span className="text-zinc-500"> / ${(category.budget || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : ''}`}
                      style={{
                        width: `${Math.min(catPercentage, 100)}%`,
                        backgroundColor: isOverBudget ? undefined : (category.color || '#3b82f6')
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
