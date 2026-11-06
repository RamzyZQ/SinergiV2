import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/status-badge"
import { PeriodWorkspaceTabs } from "@/components/period-workspace-tabs"
import { Calendar, Users } from "lucide-react"
import PeriodWorkspaceLoading from "./loading"

interface PeriodLayoutProps {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export const metadata = {
  title: "Workspace Periode — Admin SINERGI",
  description: "Workspace terpusat pengelolaan kriteria, pelamar, kalkulasi ELECTRE, dan publikasi beasiswa.",
}

export default function PeriodWorkspaceLayout({
  params,
  children,
}: PeriodLayoutProps) {
  return (
    <React.Suspense fallback={<PeriodWorkspaceLoading />}>
      <PeriodWorkspaceContent params={params}>{children}</PeriodWorkspaceContent>
    </React.Suspense>
  )
}

async function PeriodWorkspaceContent({
  params,
  children,
}: PeriodLayoutProps) {
  const { id } = await params
  await connection()
  const supabase = await createClient()

  const { data: period, error } = await supabase
    .from("scholarship_periods")
    .select("id, nama, status, kuota, tgl_tutup")
    .eq("id", id)
    .single()

  if (error || !period) {
    notFound()
  }

  return (
    <div className="space-y-4">
      {/* Workspace Period Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspace Seleksi Beasiswa
            </span>
            <StatusBadge status={period.status} size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {period.nama}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border shadow-2xs">
            <Users className="size-3.5 text-primary" />
            <span>Kuota: <strong>{period.kuota}</strong> Mahasiswa</span>
          </div>
          <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border shadow-2xs">
            <Calendar className="size-3.5 text-primary" />
            <span>
              Batas:{" "}
              <strong>
                {new Date(period.tgl_tutup).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <PeriodWorkspaceTabs periodId={period.id} />

      {/* Main tab content */}
      <div>{children}</div>
    </div>
  )
}
