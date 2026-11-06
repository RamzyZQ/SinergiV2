"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Loader2,
  Filter,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  verifyApplicantAction,
  getAdminDocumentSignedUrl,
} from "@/app/(admin)/admin/periods/actions"

export interface ApplicantItem {
  id: string
  user_id: string
  period_id: string
  status: "draft" | "submitted" | "verified" | "rejected" | "passed" | "not_passed"
  submitted_at: string | null
  catatan_admin: string | null
  created_at: string
  profile: {
    nama: string
    nim: string | null
    prodi: string | null
    semester: number | null
  }
  values: Array<{
    criteria_id: string
    criteria_nama: string
    criteria_tipe: string
    nilai_mentah: number | null
    skor: number | null
  }>
  documents: Array<{
    id: string
    jenis: string
    storage_path: string
    status_verifikasi: "pending" | "approved" | "rejected"
    catatan: string | null
    created_at: string
  }>
}

interface ApplicantsWorkspaceProps {
  periodId: string
  periodStatus: string
  applicants: ApplicantItem[]
}

const REJECTION_TEMPLATES = [
  "Transkrip nilai tidak terbaca / scan buram",
  "Slip gaji tidak berstempel resmi instansi / tidak ada SKTM",
  "KTM tidak aktif / bukan mahasiswa aktif terdaftar",
  "Nilai yang diinputkan tidak cocok dengan dokumen terlampir",
  "Berkas persyaratan belum lengkap",
]

export function ApplicantsWorkspace({
  periodId,
  applicants,
}: ApplicantsWorkspaceProps) {
  const router = useRouter()

  // Selected applicant ID
  const [selectedId, setSelectedId] = React.useState<string | null>(
    applicants[0]?.id || null
  )

  // Search & Filter
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)

  // Document preview loading state
  const [previewingDocId, setPreviewingDocId] = React.useState<string | null>(null)

  // Filtered applicants
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter((app) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        app.profile.nama.toLowerCase().includes(q) ||
        (app.profile.nim && app.profile.nim.toLowerCase().includes(q)) ||
        (app.profile.prodi && app.profile.prodi.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === "all" ? true : app.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [applicants, searchQuery, statusFilter])

  const selectedApplicant = React.useMemo(() => {
    return applicants.find((a) => a.id === selectedId) || null
  }, [applicants, selectedId])

  // Approve handler
  const handleApprove = async () => {
    if (!selectedApplicant) return
    setActionLoading(true)

    const res = await verifyApplicantAction(
      selectedApplicant.id,
      periodId,
      "verified"
    )
    setActionLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal memverifikasi pelamar.")
    }
  }

  // Reject handler
  const handleRejectConfirm = async () => {
    if (!selectedApplicant || !rejectReason.trim()) return
    setActionLoading(true)

    const res = await verifyApplicantAction(
      selectedApplicant.id,
      periodId,
      "rejected",
      rejectReason.trim()
    )
    setActionLoading(false)

    if (res.success) {
      setRejectDialogOpen(false)
      setRejectReason("")
      router.refresh()
    } else {
      alert(res.error || "Gagal menolak pelamar.")
    }
  }

  // Document preview
  const handlePreview = async (docId: string, storagePath: string) => {
    setPreviewingDocId(docId)
    const res = await getAdminDocumentSignedUrl(storagePath)
    setPreviewingDocId(null)

    if (res.success && res.data?.signedUrl) {
      window.open(res.data.signedUrl, "_blank", "noopener,noreferrer")
    } else {
      alert(res.error || "Gagal membuka berkas.")
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* KPI mini counter bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground mr-1">Status Antrean:</span>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-2.5 py-1 rounded-full border transition-all ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          Semua ({applicants.length})
        </button>
        <button
          onClick={() => setStatusFilter("submitted")}
          className={`px-2.5 py-1 rounded-full border transition-all ${
            statusFilter === "submitted"
              ? "bg-blue-600 text-white font-semibold"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          Menunggu Verifikasi (
          {applicants.filter((a) => a.status === "submitted").length})
        </button>
        <button
          onClick={() => setStatusFilter("verified")}
          className={`px-2.5 py-1 rounded-full border transition-all ${
            statusFilter === "verified"
              ? "bg-emerald-600 text-white font-semibold"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          Terverifikasi (
          {applicants.filter((a) => a.status === "verified").length})
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-2.5 py-1 rounded-full border transition-all ${
            statusFilter === "rejected"
              ? "bg-rose-600 text-white font-semibold"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          Ditolak ({applicants.filter((a) => a.status === "rejected").length})
        </button>
      </div>

      {/* TWO PANEL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px] items-start">
        {/* ================================================================ */}
        {/* LEFT PANEL: APPLICANTS LIST (NO SENSITIVE INCOME DATA HERE) */}
        {/* ================================================================ */}
        <div className="lg:col-span-5 rounded-xl border bg-card shadow-xs flex flex-col h-[700px] overflow-hidden">
          {/* Search Header */}
          <div className="p-3.5 border-b bg-muted/20 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIM, atau program studi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-background"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
              <span>Menampilkan {filteredApplicants.length} pelamar</span>
              <span className="flex items-center gap-1">
                <Filter className="size-3" /> Filter Aktif: {statusFilter.toUpperCase()}
              </span>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y">
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map((app) => {
                const isSelected = app.id === selectedId

                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedId(app.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 focus:outline-none ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {app.profile.nama}
                      </span>
                      <StatusBadge status={app.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>NIM: {app.profile.nim || "-"}</span>
                      <span>•</span>
                      <span className="truncate">{app.profile.prodi || "-"}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Semester {app.profile.semester || "-"}</span>
                      <span>
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString("id-ID")
                          : "Draf"}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Users className="size-8 mx-auto text-muted-foreground/50" />
                <p>Tidak ada pelamar yang cocok dengan kriteria pencarian.</p>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT PANEL: APPLICANT DETAIL & VERIFICATION PANEL */}
        {/* ================================================================ */}
        <div className="lg:col-span-7 rounded-xl border bg-card shadow-xs flex flex-col h-[700px] overflow-hidden">
          {selectedApplicant ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">
                      {selectedApplicant.profile.nama}
                    </h3>
                    <StatusBadge status={selectedApplicant.status} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    NIM: <strong>{selectedApplicant.profile.nim || "-"}</strong> • Prodi:{" "}
                    <strong>{selectedApplicant.profile.prodi || "-"}</strong> • Semester:{" "}
                    <strong>{selectedApplicant.profile.semester || "-"}</strong>
                  </p>
                </div>

                {/* Top Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs gap-1.5"
                  >
                    <XCircle className="size-3.5" />
                    Tolak Berkas
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                  >
                    {actionLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    Verifikasi & Setujui
                  </Button>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Admin notes if rejected */}
                {selectedApplicant.catatan_admin && (
                  <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                    <span className="font-semibold block">Catatan Verifikator:</span>
                    <p>{selectedApplicant.catatan_admin}</p>
                  </div>
                )}

                {/* Section 1: Nilai Kriteria Pelamar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="size-4 text-primary" />
                      Nilai Kriteria Penilaian Mahasiswa
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedApplicant.values.length} kriteria terisi
                    </span>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-background">
                    <div className="grid grid-cols-12 bg-muted/40 p-2 text-[11px] font-semibold text-muted-foreground uppercase border-b">
                      <div className="col-span-5">Kriteria</div>
                      <div className="col-span-2 text-center">Tipe</div>
                      <div className="col-span-3 text-right">Nilai Mentah</div>
                      <div className="col-span-2 text-right">Skor Standar</div>
                    </div>

                    <div className="divide-y text-xs">
                      {selectedApplicant.values.map((v) => {
                        const isIncome = v.criteria_nama.toLowerCase().includes("penghasilan") ||
                          v.criteria_nama.toLowerCase().includes("gaji")

                        return (
                          <div
                            key={v.criteria_id}
                            className={`grid grid-cols-12 p-2.5 items-center ${
                              isIncome ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                            }`}
                          >
                            <div className="col-span-5 font-medium flex items-center gap-1.5">
                              {isIncome && (
                                <span title="Data Sensitif: Penghasilan Orang Tua">
                                  <ShieldCheck className="size-3.5 text-amber-600 shrink-0" />
                                </span>
                              )}
                              <span className="truncate">{v.criteria_nama}</span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                {v.criteria_tipe}
                              </span>
                            </div>
                            <div className="col-span-3 text-right font-mono">
                              {isIncome && v.nilai_mentah
                                ? `Rp ${Number(v.nilai_mentah).toLocaleString("id-ID")}`
                                : v.nilai_mentah ?? "-"}
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {v.skor ?? "-"}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Uploaded Documents */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Eye className="size-4 text-primary" />
                    Berkas Dokumen Pendukung ({selectedApplicant.documents.length})
                  </h4>

                  <div className="space-y-2">
                    {selectedApplicant.documents && selectedApplicant.documents.length > 0 ? (
                      selectedApplicant.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-lg border bg-background flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {doc.jenis}
                              </span>
                              <StatusBadge
                                status={doc.status_verifikasi}
                                size="sm"
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              Diunggah:{" "}
                              {new Date(doc.created_at).toLocaleString("id-ID")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                handlePreview(doc.id, doc.storage_path)
                              }
                              disabled={previewingDocId === doc.id}
                              className="text-xs gap-1"
                            >
                              {previewingDocId === doc.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Eye className="size-3" />
                              )}
                              Buka Berkas
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg border text-center text-xs text-muted-foreground italic">
                        Belum ada dokumen yang diunggah oleh pelamar.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-2">
              <Users className="size-12 text-muted-foreground/40" />
              <h4 className="font-bold text-sm text-foreground">Pilih Pelamar</h4>
              <p className="text-xs max-w-xs">
                Pilih salah satu pelamar pada daftar di panel sebelah kiri untuk melihat rincian kriteria, pratinjau berkas, dan memproses verifikasi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Rejection Reason */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="size-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <XCircle className="size-5" />
            </div>
            <DialogTitle className="text-center">Tolak Berkas Pendaftaran</DialogTitle>
            <DialogDescription className="text-center text-xs pt-1">
              Sertakan catatan penolakan spesifik agar mahasiswa mengetahui berkas yang perlu diperbaiki
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Template Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Template Alasan Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(tmpl)}
                    className="text-[11px] px-2.5 py-1 rounded-md border bg-muted/40 hover:bg-muted text-foreground text-left transition-colors"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catatan">Catatan Penolakan (Wajib Diisi)</Label>
              <Textarea
                id="catatan"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
                placeholder="Tuliskan alasan penolakan secara spesifik..."
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={actionLoading}
              onClick={() => setRejectDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={actionLoading || !rejectReason.trim()}
              onClick={handleRejectConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
