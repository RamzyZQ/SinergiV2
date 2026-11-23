"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-[#DCE5F1] bg-[#EAF2FF]/70 px-3 py-2 text-sm">
        <span className="font-medium text-[#8492A6]">Total seluruh pengajuan</span>
        <span className="font-bold tabular-nums text-[#263449]">{total}</span>
      </div>
      <p className="mb-2 text-xs text-[#8492A6]">Pilih status untuk melihat daftar pelamarnya.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-4 border-t border-[#DCE5F1]">
        {data.map((item) => (
          <button
            key={item.status}
            type="button"
            onClick={() => handleSliceClick(item)}
            className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#DCE5F1] bg-white px-3 py-2.5 text-left text-xs transition-colors hover:bg-[#EAF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456A6]/40"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#263449]">{item.label}</span>
            </div>
            <span className="shrink-0 rounded-md bg-[#F5F7FB] px-2 py-1 font-bold tabular-nums text-[#263449]">
              {item.count} <span className="font-medium text-[#8492A6]">({((item.count / total) * 100).toFixed(0)}%)</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
