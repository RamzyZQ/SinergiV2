import * as React from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollText, Clock, ShieldAlert } from "lucide-react"

export const metadata = {
  title: "Audit Log — Admin SINERGI",
  description: "Riwayat log audit append-only seluruh aktivitas penyesuaian bobot, verifikasi, dan eksekusi perhitungan ELECTRE.",
}

export default function AdminAuditPage() {
  return (
    <React.Suspense fallback={<AdminAuditFallback />}>
      <AdminAuditContent />
    </React.Suspense>
  )
}

async function AdminAuditContent() {
  await connection()
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="pb-2 border-b">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Audit Log Sistem
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat append-only perubahan kriteria, bobot, status periode, verifikasi, dan eksekusi perhitungan ELECTRE
        </p>
      </div>

      <Card className="shadow-2xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ScrollText className="size-4" />
            <span>Aktivitas Tercatat</span>
          </div>
          <CardTitle className="text-lg">Catatan Audit Keamanan</CardTitle>
          <CardDescription>
            Tabel ini bersifat append-only di level database (RLS mencegah modifikasi/penghapusan)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="divide-y border rounded-lg overflow-hidden">
              {logs.map((log) => {
                const isInsert = log.aksi === "INSERT"
                const isUpdate = log.aksi === "UPDATE"

                return (
                  <div key={log.id} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            isInsert
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isUpdate
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {log.aksi}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {log.entitas}
                        </span>
                        {log.entitas_id && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ID: {log.entitas_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* Diff visualization */}
                    {(log.sebelum || log.sesudah) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                        {log.sebelum && (
                          <div className="p-2.5 rounded bg-rose-50/70 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 overflow-x-auto">
                            <span className="font-semibold block text-[10px] text-rose-600 mb-1">
                              SEBELUM:
                            </span>
                            <pre className="text-[11px] whitespace-pre-wrap">
                              {JSON.stringify(log.sebelum, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.sesudah && (
                          <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 overflow-x-auto">
                            <span className="font-semibold block text-[10px] text-emerald-600 mb-1">
                              SESUDAH:
                            </span>
                            <pre className="text-[11px] whitespace-pre-wrap">
                              {JSON.stringify(log.sesudah, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground space-y-2">
              <ShieldAlert className="size-8 mx-auto text-muted-foreground/60" />
              <p>Belum ada rekaman audit log. Aktivitas akan dicatat secara otomatis melalui PostgreSQL database trigger.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminAuditFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b pb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}
