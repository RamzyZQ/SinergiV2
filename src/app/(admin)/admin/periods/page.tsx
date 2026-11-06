import * as React from "react"
import Link from "next/link"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Calendar, ArrowRight } from "lucide-react"
import { CreatePeriodDialog } from "@/components/create-period-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Daftar Periode Beasiswa — Admin SINERGI",
  description: "Kelola siklus periode seleksi penerimaan beasiswa mahasiswa.",
}

export default function AdminPeriodsPage() {
  return (
    <React.Suspense fallback={<AdminPeriodsFallback />}>
      <AdminPeriodsContent />
    </React.Suspense>
  )
}

async function AdminPeriodsContent() {
  await connection()
  const supabase = await createClient()

  const { data: periods } = await supabase
    .from("scholarship_periods")
    .select(`
      id,
      nama,
      deskripsi,
      tgl_buka,
      tgl_tutup,
      kuota,
      status,
      created_at
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Periode Beasiswa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar seluruh periode seleksi beasiswa dan pengaturan siklus hidup
          </p>
        </div>

        <CreatePeriodDialog />
      </div>

      {periods && periods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periods.map((period) => (
            <Card
              key={period.id}
              className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-2xs"
            >
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold line-clamp-1">
                    {period.nama}
                  </CardTitle>
                  <StatusBadge status={period.status} size="sm" />
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {period.deskripsi || "Tidak ada deskripsi"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span>Kuota:</span>
                    <span className="font-semibold text-foreground">
                      {period.kuota} Mahasiswa
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Batas Akhir:</span>
                    <span>
                      {new Date(period.tgl_tutup).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/admin/periods/${period.id}/overview`}
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    Buka Workspace
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 px-4 border-dashed">
          <CardContent className="space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <CardTitle className="text-lg">Belum Ada Periode</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Mulai dengan membuat periode baru untuk menyusun kriteria, bobot, dan membuka pendaftaran mahasiswa.
            </CardDescription>
            <div className="pt-2">
              <CreatePeriodDialog />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminPeriodsFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-lg border bg-card p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
