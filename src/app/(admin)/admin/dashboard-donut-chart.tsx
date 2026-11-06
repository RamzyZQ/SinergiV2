"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"

export interface StatusDistributionItem {
  status: string
  label: string
  count: number
  color: string
}

interface DashboardDonutChartProps {
  data: StatusDistributionItem[]
  activePeriodId?: string | null
}

export function DashboardDonutChart({ data, activePeriodId }: DashboardDonutChartProps) {
  const router = useRouter()
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data])

  const handleSliceClick = (entry: StatusDistributionItem) => {
    if (activePeriodId) {
      router.push(`/admin/periods/${activePeriodId}/applicants?status=${entry.status}`)
    } else {
      router.push("/admin/periods")
    }
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-sm text-muted-foreground">Belum ada data pelamar untuk ditampilkan.</p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          Grafik distribusi status akan muncul ketika mahasiswa mulai mendaftar.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter((d) => d.count > 0)}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="count"
              nameKey="label"
              cursor="pointer"
              onClick={(_event, index) => {
                const activeData = data.filter((d) => d.count > 0)
                if (activeData[index]) {
                  handleSliceClick(activeData[index])
                }
              }}
            >
              {data
                .filter((d) => d.count > 0)
                .map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={entry.color}
                    className="transition-all duration-200 hover:opacity-80 focus:outline-none"
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as StatusDistributionItem
                  const percent = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0"
                  return (
                    <div className="bg-popover text-popover-foreground border shadow-md rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <span
                          className="size-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Jumlah: <span className="font-bold text-foreground">{item.count}</span> ({percent}%)
                      </div>
                      <div className="text-[10px] text-primary pt-1 border-t">
                        Klik untuk memfilter di workspace pelamar
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs font-medium text-foreground/80 hover:text-foreground cursor-pointer">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t">
        {data.map((item) => (
          <button
            key={item.status}
            type="button"
            onClick={() => handleSliceClick(item)}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-left transition-colors text-xs border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-bold font-mono ml-2 shrink-0">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
