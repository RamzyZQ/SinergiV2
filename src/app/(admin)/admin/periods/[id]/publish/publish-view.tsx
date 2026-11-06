"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import {
  transitionPeriodStatusAction,
  sendPublicationNotificationsAction,
} from "@/app/(admin)/admin/periods/actions"
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  FileSpreadsheet,
  FileText,
  Sparkles,
} from "lucide-react"

export interface PublishViewProps {
  period: {
    id: string
    nama: string
    kuota: number
    status: string
  }
  checklist: {
    criteriaValid: boolean
    allVerified: boolean
    officialRunExists: boolean
    hasAwardees: boolean
  }
  summary: {
    totalApplicants: number
    totalPassed: number
    cutoffScore: number
  }
  notificationLogs: Array<{
    id: string
    recipientName: string
    recipientNim: string
    judul: string
    statusKirim: string
    createdAt: string
  }>
}

export function PublishView({
  period,
  checklist,
  summary,
  notificationLogs,
}: PublishViewProps) {
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isSendingEmails, setIsSendingEmails] = React.useState(false)

  const isAlreadyPublished = period.status === "published"
  const canPublish =
    checklist.criteriaValid &&
    checklist.allVerified &&
    checklist.officialRunExists &&
    checklist.hasAwardees &&
    !isAlreadyPublished

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      const res = await transitionPeriodStatusAction(period.id, "published")
      if (res.success) {
        toast.success(res.message || "Periode berhasil dipublikasikan.")

        // Automatically trigger email notifications
        setIsSendingEmails(true)
        const emailRes = await sendPublicationNotificationsAction(period.id)
        if (emailRes.success) {
          toast.success(emailRes.message)
        } else {
          toast.warning("Publikasi berhasil, namun notifikasi: " + emailRes.error)
        }
      } else {
        toast.error("Gagal publikasi: " + res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan saat mempublikasikan hasil.")
    } finally {
      setIsPublishing(false)
      setIsSendingEmails(false)
    }
  }

  const handleResendEmails = async () => {
    try {
      setIsSendingEmails(true)
      const res = await sendPublicationNotificationsAction(period.id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error("Gagal mengirim email: " + res.error)
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim email notifikasi.")
    } finally {
      setIsSendingEmails(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in-50 duration-300">
      {/* Banner */}
      <div className="p-4 rounded-xl border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-foreground">
              Publikasi Hasil & Distribusi Notifikasi
            </h2>
            <StatusBadge status={period.status} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Umumkan penetapan penerima beasiswa ke portal mahasiswa dan kirim notifikasi email
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/api/export/${period.id}/excel`} download>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs">
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              Excel
            </Button>
          </a>

          <a href={`/api/export/${period.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs">
              <FileText className="size-3.5 text-rose-600" />
              SK PDF
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Checklist & Action (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                Checklist Prasyarat Publikasi
              </CardTitle>
              <CardDescription className="text-xs">
                Seluruh tahapan seleksi wajib selesai sebelum hasil dibuka ke mahasiswa
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span>Bobot Kriteria Selesai & Valid (100%)</span>
                  {checklist.criteriaValid ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">Terpenuhi</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-300 text-rose-600 text-[10px]">
                      Belum Valid
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span>Seluruh Berkas Pelamar Telah Diverifikasi</span>
                  {checklist.allVerified ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">Terpenuhi</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-300 text-rose-600 text-[10px]">
                      Ada yang Belum
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span>Kalkulasi Resmi ELECTRE I Telah Dijalankan</span>
                  {checklist.officialRunExists ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">Terpenuhi</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-300 text-rose-600 text-[10px]">
                      Belum Dihitung
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
                  <span>Kandidat Penerima Memenuhi Kuota ({period.kuota} orang)</span>
                  {checklist.hasAwardees ? (
                    <Badge className="bg-emerald-600 text-white text-[10px]">Terpenuhi</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-300 text-rose-600 text-[10px]">
                      Belum Siap
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Box */}
              <div className="pt-4 border-t space-y-3">
                {isAlreadyPublished ? (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <Sparkles className="size-4" />
                      Periode Telah Dipublikasikan
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Hasil seleksi telah aktif dan dapat diakses oleh seluruh mahasiswa melalui portal
                      mahasiswa. Anda dapat mengirim ulang email notifikasi jika diperlukan.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSendingEmails}
                      onClick={handleResendEmails}
                      className="gap-2 text-xs"
                    >
                      <Mail className="size-3.5" />
                      {isSendingEmails ? "Mengirim Notifikasi..." : "Kirim Ulang Notifikasi Email"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={handlePublish}
                      disabled={!canPublish || isPublishing}
                      className="w-full gap-2 font-semibold"
                    >
                      <Send className="size-4" />
                      {isPublishing
                        ? "Mempublikasikan & Mengirim Notifikasi..."
                        : "Publikasikan Hasil ke Mahasiswa"}
                    </Button>
                    {!canPublish && (
                      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
                        <AlertTriangle className="size-3 text-amber-500" />
                        Lengkapi checklist di atas untuk mengaktifkan tombol publikasi.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ringkasan & Log Notifikasi (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Summary Card */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Ringkasan Penetapan Kelulusan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">Total Peserta</span>
                  <span className="text-xl font-bold text-foreground">
                    {summary.totalApplicants}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-800 dark:text-emerald-300">
                  <span className="text-[10px] block">Lolos Kuota</span>
                  <span className="text-xl font-bold">{summary.totalPassed}</span>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">Batas Lolos</span>
                  <span className="text-xl font-bold text-primary">
                    {summary.cutoffScore > 0 ? `+${summary.cutoffScore}` : summary.cutoffScore}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Log Table */}
          <Card className="shadow-2xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  Log Pengiriman Notifikasi ({notificationLogs.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Riwayat status pengiriman email pengumuman ke pelamar
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-muted-foreground text-left font-medium">
                      <th className="py-2 px-3">Penerima</th>
                      <th className="py-2 px-3">Subjek</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {notificationLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                          Belum ada notifikasi yang dikirimkan.
                        </td>
                      </tr>
                    ) : (
                      notificationLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3 font-medium text-foreground">
                            <div>{log.recipientName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {log.recipientNim}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]">
                            {log.judul}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge
                              className={`text-[9px] ${
                                log.statusKirim === "sent"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                            >
                              {log.statusKirim === "sent" ? "Terkirim" : "Gagal"}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-right text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
