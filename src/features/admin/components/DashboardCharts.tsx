import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardResponse } from '@/types'

const STATUS_CHART_COLORS = ['#f59e0b', '#2563eb', '#8b5cf6', '#dc2626', '#059669', '#6b7280']

interface DashboardChartsProps {
  dashboard: DashboardResponse
}

export function DashboardCharts({ dashboard }: DashboardChartsProps) {
  const statusData = [
    { name: 'Pending', value: dashboard.pendingAlerts },
    { name: 'Acknowledged', value: dashboard.acknowledgedAlerts },
    { name: 'Broadcasted', value: dashboard.broadcastedAlerts },
    { name: 'Auto Escalated', value: dashboard.autoEscalatedAlerts },
    { name: 'Resolved', value: dashboard.resolvedAlerts },
    { name: 'Closed', value: dashboard.closedAlerts },
  ].filter((item) => item.value > 0)

  const todayData = [
    { name: 'Fire', value: dashboard.fireAlertsToday, fill: '#dc2626' },
    { name: 'Medical', value: dashboard.medicalAlertsToday, fill: '#2563eb' },
    { name: 'Security', value: dashboard.securityAlertsToday, fill: '#ea580c' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border p-4">
        <h3 className="mb-4 font-medium">Status Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="mb-4 font-medium">Today&apos;s Alerts by Type</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={todayData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {todayData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

interface KpiGridProps {
  dashboard: DashboardResponse
}

export function KpiGrid({ dashboard }: KpiGridProps) {
  const todayItems = [
    { label: 'Fire Today', value: dashboard.fireAlertsToday },
    { label: 'Medical Today', value: dashboard.medicalAlertsToday },
    { label: 'Security Today', value: dashboard.securityAlertsToday },
  ]

  const items = [
    { label: 'Pending', value: dashboard.pendingAlerts },
    { label: 'Acknowledged', value: dashboard.acknowledgedAlerts },
    { label: 'Broadcasted', value: dashboard.broadcastedAlerts },
    { label: 'Auto Escalated', value: dashboard.autoEscalatedAlerts },
    { label: 'Resolved', value: dashboard.resolvedAlerts },
    { label: 'Closed', value: dashboard.closedAlerts },
    { label: 'Total All Time', value: dashboard.totalAlerts },
  ]

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border bg-card/50 p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {todayItems.map((item) => (
            <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
