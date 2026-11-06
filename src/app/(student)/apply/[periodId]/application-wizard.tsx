"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  Users,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Trash2,
  Camera,
  ArrowRight,
  ArrowLeft,
  Save,
  Check,
  Send,
  Loader2,
  FileCheck,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
  saveApplicationDraft,
  submitApplication,
  uploadDocumentAction,
  getDocumentSignedUrlAction,
  deleteDocumentAction,
} from "./actions"

export interface CriteriaWithScales {
  id: string
  period_id: string
  nama: string
  tipe: "benefit" | "cost"
  bobot: number
  urutan: number
  sumber_nilai: "input" | "document"
  criteria_scales: Array<{
    id: string
    criteria_id: string
    label: string
    nilai_min: number
    nilai_max: number
    skor: number
  }>
}

export interface ApplicationWizardProps {
  period: {
    id: string
    nama: string
    status: string
    tgl_tutup: string
    kuota: number
  }
  application: {
    id: string
    status: string
    submitted_at: string | null
    catatan_admin: string | null
  }
  initialProfile: {
    nama: string
    nim: string | null
    prodi: string | null
    semester: number | null
  }
  criteriaList: CriteriaWithScales[]
  initialValues: Record<string, { nilai_mentah: number | null; skor: number | null }>
  initialDocuments: Array<{
    id: string
    jenis: string
    storage_path: string
    status_verifikasi: string
    catatan: string | null
    created_at: string
  }>
}

const DEFAULT_DOC_TYPES = [
  {
    jenis: "Transkrip Nilai",
    label: "Transkrip Nilai / KHS Resmi Terakhir",
    desc: "Format PDF atau JPG/PNG scan legalisir (Maks 5 MB)",
    required: true,
  },
  {
    jenis: "Slip Gaji / Bukti Penghasilan",
    label: "Slip Gaji / Surat Keterangan Penghasilan / SKTM",
    desc: "Slip gaji resmi instansi atau surat keterangan dari kelurahan (Maks 5 MB)",
    required: true,
  },
  {
    jenis: "Kartu Tanda Mahasiswa",
    label: "Kartu Tanda Mahasiswa (KTM) / KTP",
    desc: "Foto atau scan KTM aktif berstempel (Maks 5 MB)",
    required: true,
  },
  {
    jenis: "Sertifikat Prestasi",
    label: "Sertifikat Prestasi / Keaktifan Organisasi",
    desc: "Bukti sertifikat lomba akademik/non-akademik atau SK kepengurusan (Opsional)",
    required: false,
  },
]

export function ApplicationWizard({
  period,
  application,
  initialProfile,
  criteriaList,
  initialValues,
  initialDocuments,
}: ApplicationWizardProps) {
  const router = useRouter()
  const isReadOnly = application.status !== "draft"

  // Step state (1 to 5)
  const [currentStep, setCurrentStep] = React.useState(1)

  // Profile data
  const [nama, setNama] = React.useState(initialProfile.nama || "")
  const [nim, setNim] = React.useState(initialProfile.nim || "")
  const [prodi, setProdi] = React.useState(initialProfile.prodi || "")
  const [semester, setSemester] = React.useState<number | "">(
    initialProfile.semester ?? ""
  )

  // Criteria values: mapping from criteria_id -> { nilai_mentah, skor }
  const [values, setValues] = React.useState<
    Record<string, { nilai_mentah: number | null; skor: number | null }>
  >(initialValues)

  // Documents
  const [documents, setDocuments] = React.useState(initialDocuments)

  // Auto-save & Submission state
  const [savingStatus, setSavingStatus] = React.useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved")
  const [lastSavedTime, setLastSavedTime] = React.useState<string | null>(null)
  const [submitDialogOpen, setSubmitDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Uploading state per document type
  const [uploadingJenis, setUploadingJenis] = React.useState<string | null>(null)

  // Classify criteria into steps
  const academicCriteria = criteriaList.filter((c) => {
    const n = c.nama.toLowerCase()
    return (
      n.includes("ipk") ||
      n.includes("akademik") ||
      n.includes("sks") ||
      n.includes("semester") ||
      n.includes("nilai")
    )
  })

  const familyCriteria = criteriaList.filter((c) => {
    const n = c.nama.toLowerCase()
    return (
      n.includes("penghasilan") ||
      n.includes("gaji") ||
      n.includes("keluarga") ||
      n.includes("tanggungan") ||
      n.includes("ekonomi") ||
      n.includes("pbb") ||
      n.includes("listrik")
    )
  })

  const achievementCriteria = criteriaList.filter((c) => {
    const n = c.nama.toLowerCase()
    return (
      n.includes("prestasi") ||
      n.includes("organisasi") ||
      n.includes("lomba") ||
      n.includes("kegiatan") ||
      n.includes("kejuaraan") ||
      n.includes("sertifikat")
    )
  })

  // Catch other criteria that didn't match the keywords
  const otherCriteria = criteriaList.filter(
    (c) =>
      !academicCriteria.includes(c) &&
      !familyCriteria.includes(c) &&
      !achievementCriteria.includes(c)
  )

  // Auto-save logic debounced
  const performSave = React.useCallback(async () => {
    if (isReadOnly) return

    setSavingStatus("saving")
    const valuesArray = Object.entries(values).map(([criteria_id, v]) => ({
      criteria_id,
      nilai_mentah: v.nilai_mentah,
      skor: v.skor,
    }))

    const res = await saveApplicationDraft({
      application_id: application.id,
      period_id: period.id,
      nama,
      nim,
      prodi,
      semester: typeof semester === "number" ? semester : null,
      values: valuesArray,
    })

    if (res.success && res.data) {
      setSavingStatus("saved")
      setLastSavedTime(res.data.savedAt)
    } else {
      setSavingStatus("error")
    }
  }, [
    isReadOnly,
    values,
    application.id,
    period.id,
    nama,
    nim,
    prodi,
    semester,
  ])

  const isFirstMount = React.useRef(true)

  // Trigger auto-save on value change with 1.5s debounce
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    if (isReadOnly) return

    const timer = setTimeout(() => {
      performSave()
    }, 1500)

    return () => clearTimeout(timer)
  }, [nama, nim, prodi, semester, values, performSave, isReadOnly])

  // Handler for scale dropdown change
  const handleScaleSelect = (
    criterionId: string,
    scaleId: string,
    scales: CriteriaWithScales["criteria_scales"]
  ) => {
    if (isReadOnly) return
    setSavingStatus("unsaved")
    const chosen = scales.find((s) => s.id === scaleId)
    if (!chosen) {
      setValues((prev) => ({
        ...prev,
        [criterionId]: { nilai_mentah: null, skor: null },
      }))
      return
    }

    setValues((prev) => ({
      ...prev,
      [criterionId]: {
        nilai_mentah: chosen.nilai_min,
        skor: chosen.skor,
      },
    }))
  }

  // Handler for direct numeric input
  const handleNumericInput = (
    criterionId: string,
    valStr: string,
    scales: CriteriaWithScales["criteria_scales"]
  ) => {
    if (isReadOnly) return
    setSavingStatus("unsaved")
    const num = parseFloat(valStr)
    if (isNaN(num)) {
      setValues((prev) => ({
        ...prev,
        [criterionId]: { nilai_mentah: null, skor: null },
      }))
      return
    }

    let calculatedScore = num
    if (scales && scales.length > 0) {
      const matched = scales.find(
        (s) => num >= s.nilai_min && num <= s.nilai_max
      )
      if (matched) {
        calculatedScore = matched.skor
      } else {
        const sorted = [...scales].sort((a, b) => a.nilai_min - b.nilai_min)
        if (num < sorted[0].nilai_min) calculatedScore = sorted[0].skor
        else if (num > sorted[sorted.length - 1].nilai_max)
          calculatedScore = sorted[sorted.length - 1].skor
      }
    }

    setValues((prev) => ({
      ...prev,
      [criterionId]: {
        nilai_mentah: num,
        skor: calculatedScore,
      },
    }))
  }

  // Document upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    jenis: string
  ) => {
    if (isReadOnly) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingJenis(jenis)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("jenis", jenis)
    formData.append("applicationId", application.id)
    formData.append("periodId", period.id)

    const res = await uploadDocumentAction(formData)
    setUploadingJenis(null)

    if (res.success && res.data) {
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.jenis !== jenis)
        return [
          ...filtered,
          {
            id: res.data!.id,
            jenis: res.data!.jenis,
            storage_path: res.data!.storage_path,
            status_verifikasi: "pending",
            catatan: null,
            created_at: new Date().toISOString(),
          },
        ]
      })
    } else {
      alert(res.error || "Gagal mengunggah berkas")
    }
  }

  // Document preview handler (signed URL)
  const handlePreviewDocument = async (storagePath: string) => {
    const res = await getDocumentSignedUrlAction(storagePath)
    if (res.success && res.data?.signedUrl) {
      window.open(res.data.signedUrl, "_blank", "noopener,noreferrer")
    } else {
      alert(res.error || "Tidak dapat memuat berkas")
    }
  }

  // Document delete handler
  const handleDeleteDocument = async (docId: string, storagePath: string) => {
    if (isReadOnly) return
    if (!confirm("Apakah Anda yakin ingin menghapus berkas ini?")) return

    const res = await deleteDocumentAction(docId, storagePath, period.id)
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } else {
      alert(res.error || "Gagal menghapus berkas")
    }
  }

  // Final submission handler
  const handleFinalSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)

    const res = await submitApplication(application.id, period.id)
    setSubmitting(false)

    if (res.success) {
      setSubmitDialogOpen(false)
      router.push("/dashboard")
      router.refresh()
    } else {
      setSubmitError(res.error || "Gagal mengirim formulir pendaftaran")
    }
  }

  // Calculate completeness for review step
  const totalCriteriaCount = criteriaList.length
  const filledCriteriaCount = Object.values(values).filter(
    (v) => v.skor !== null && v.skor !== undefined
  ).length
  const mandatoryDocsCount = DEFAULT_DOC_TYPES.filter((d) => d.required).length
  const uploadedMandatoryDocsCount = DEFAULT_DOC_TYPES.filter(
    (d) => d.required && documents.some((doc) => doc.jenis === d.jenis)
  ).length

  const isFormComplete =
    filledCriteriaCount === totalCriteriaCount &&
    uploadedMandatoryDocsCount === mandatoryDocsCount &&
    !!nama &&
    !!nim

  const stepLabels = [
    { num: 1, title: "Akademik", icon: GraduationCap },
    { num: 2, title: "Keluarga", icon: Users },
    { num: 3, title: "Prestasi", icon: Award },
    { num: 4, title: "Dokumen", icon: Upload },
    { num: 5, title: "Review", icon: CheckCircle2 },
  ]

  const progressPercentage = (currentStep / 5) * 100

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Read-only notification banner */}
      {isReadOnly && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-800 flex items-start gap-3">
          <FileCheck className="size-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Formulir Pendaftaran Sudah Terkirim
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Berkas Anda telah diajukan pada{" "}
              {application.submitted_at
                ? new Date(application.submitted_at).toLocaleString("id-ID")
                : "periode aktif"}{" "}
              dengan status <StatusBadge status={application.status} size="sm" />.
              Data berada dalam mode hanya baca (read-only) selama proses verifikasi panitia.
            </p>
          </div>
        </div>
      )}

      {/* Period Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-primary tracking-wider">
              Formulir Pendaftaran Beasiswa
            </span>
            <StatusBadge status={period.status} size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
            {period.nama}
          </h1>
        </div>

        {/* Live Auto-save indicator */}
        {!isReadOnly && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto bg-muted/40 px-3 py-1.5 rounded-full border">
            {savingStatus === "saving" && (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Menyimpan draf...</span>
              </>
            )}
            {savingStatus === "saved" && (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span>
                  {lastSavedTime
                    ? `Tersimpan pukul ${lastSavedTime}`
                    : "Draf tersimpan"}
                </span>
              </>
            )}
            {savingStatus === "unsaved" && (
              <>
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Perubahan belum disimpan</span>
              </>
            )}
            {savingStatus === "error" && (
              <>
                <AlertTriangle className="size-3.5 text-rose-500" />
                <span className="text-rose-600 font-medium">Gagal simpan</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="space-y-3 bg-card p-4 rounded-xl border shadow-2xs">
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground px-1">
          <span>Langkah {currentStep} dari 5</span>
          <span>{Math.round(progressPercentage)}% Selesai</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />

        {/* Stepper Buttons */}
        <div className="grid grid-cols-5 gap-1.5 pt-2">
          {stepLabels.map((s) => {
            const isCurrent = currentStep === s.num
            const isDone = currentStep > s.num
            const StepIcon = s.icon

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-semibold border border-primary/30"
                    : isDone
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-1">
                  <StepIcon className="size-3.5" />
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                <span className="text-[10px] sm:hidden mt-0.5">{s.num}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* STEP 1: DATA AKADEMIK */}
      {/* ==================================================================== */}
      {currentStep === 1 && (
        <Card className="shadow-xs animate-in fade-in-30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <GraduationCap className="size-5" />
              <span>Langkah 1: Data Akademik</span>
            </div>
            <CardTitle className="text-lg">Informasi Akademik Mahasiswa</CardTitle>
            <CardDescription>
              Isi data identitas mahasiswa dan kriteria penilaian akademik sesuai transkrip resmi
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              <div className="space-y-1.5">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value)
                    setSavingStatus("unsaved")
                  }}
                  disabled={isReadOnly}
                  placeholder="Contoh: Ahmad Fauzi"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</Label>
                <Input
                  id="nim"
                  value={nim}
                  onChange={(e) => {
                    setNim(e.target.value)
                    setSavingStatus("unsaved")
                  }}
                  disabled={isReadOnly}
                  placeholder="Contoh: 210101001"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodi">Program Studi</Label>
                <Input
                  id="prodi"
                  value={prodi}
                  onChange={(e) => {
                    setProdi(e.target.value)
                    setSavingStatus("unsaved")
                  }}
                  disabled={isReadOnly}
                  placeholder="Contoh: Sistem Informasi"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  type="number"
                  min="1"
                  max="14"
                  value={semester}
                  onChange={(e) => {
                    setSemester(
                      e.target.value === "" ? "" : parseInt(e.target.value, 10)
                    )
                    setSavingStatus("unsaved")
                  }}
                  disabled={isReadOnly}
                  placeholder="1 - 14"
                />
              </div>
            </div>

            {/* Criteria in Academic step */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-tight text-foreground border-b pb-2">
                Kriteria Penilaian Akademik
              </h4>

              {academicCriteria.length > 0 ? (
                academicCriteria.map((criterion) => {
                  const currentValue = values[criterion.id]
                  const hasScales =
                    criterion.criteria_scales &&
                    criterion.criteria_scales.length > 0

                  return (
                    <div
                      key={criterion.id}
                      className="p-4 rounded-xl border bg-card space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`crit-${criterion.id}`}
                          className="font-semibold text-sm"
                        >
                          {criterion.nama}
                        </Label>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Bobot: {criterion.bobot}% ({criterion.tipe})
                        </span>
                      </div>

                      {hasScales ? (
                        <div className="space-y-1.5">
                          <select
                            id={`crit-${criterion.id}`}
                            disabled={isReadOnly}
                            value={
                              currentValue?.skor !== null &&
                              currentValue?.skor !== undefined
                                ? criterion.criteria_scales.find(
                                    (s) => s.skor === currentValue.skor
                                  )?.id || ""
                                : ""
                            }
                            onChange={(e) =>
                              handleScaleSelect(
                                criterion.id,
                                e.target.value,
                                criterion.criteria_scales
                              )
                            }
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">-- Pilih Rentang Nilai --</option>
                            {criterion.criteria_scales.map((scale) => (
                              <option key={scale.id} value={scale.id}>
                                {scale.label} (Skor: {scale.skor})
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-muted-foreground">
                            Pilih rentang nilai yang sesuai dengan transkrip nilai akademik Anda.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Input
                            id={`crit-${criterion.id}`}
                            type="number"
                            step="0.01"
                            disabled={isReadOnly}
                            value={currentValue?.nilai_mentah ?? ""}
                            onChange={(e) =>
                              handleNumericInput(
                                criterion.id,
                                e.target.value,
                                criterion.criteria_scales
                              )
                            }
                            placeholder="Masukkan nilai (misal: 3.75)"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Masukkan angka riil sesuai berkas resmi.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Tidak ada kriteria akademik spesifik yang dikonfigurasi untuk periode ini.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* STEP 2: DATA KELUARGA & SOSIAL EKONOMI */}
      {/* ==================================================================== */}
      {currentStep === 2 && (
        <Card className="shadow-xs animate-in fade-in-30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Users className="size-5" />
              <span>Langkah 2: Data Sosial Ekonomi Keluarga</span>
            </div>
            <CardTitle className="text-lg">Kondisi Ekonomi & Keluarga</CardTitle>
            <CardDescription>
              Informasi penghasilan dan tanggungan orang tua untuk menentukan kriteria biaya (Cost)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>Perlindungan Data Sensitif:</strong> Data ekonomi keluarga hanya dipergunakan untuk perangkingan sistem SPK beasiswa. Data ini bersifat rahasia dan tidak dipublikasikan ke mahasiswa lain.
              </div>
            </div>

            <div className="space-y-4">
              {familyCriteria.length > 0 ? (
                familyCriteria.map((criterion) => {
                  const currentValue = values[criterion.id]
                  const hasScales =
                    criterion.criteria_scales &&
                    criterion.criteria_scales.length > 0

                  return (
                    <div
                      key={criterion.id}
                      className="p-4 rounded-xl border bg-card space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`crit-${criterion.id}`}
                          className="font-semibold text-sm"
                        >
                          {criterion.nama}
                        </Label>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Bobot: {criterion.bobot}% ({criterion.tipe})
                        </span>
                      </div>

                      {hasScales ? (
                        <div className="space-y-1.5">
                          <select
                            id={`crit-${criterion.id}`}
                            disabled={isReadOnly}
                            value={
                              currentValue?.skor !== null &&
                              currentValue?.skor !== undefined
                                ? criterion.criteria_scales.find(
                                    (s) => s.skor === currentValue.skor
                                  )?.id || ""
                                : ""
                            }
                            onChange={(e) =>
                              handleScaleSelect(
                                criterion.id,
                                e.target.value,
                                criterion.criteria_scales
                              )
                            }
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">-- Pilih Rentang Penghasilan / Kategori --</option>
                            {criterion.criteria_scales.map((scale) => (
                              <option key={scale.id} value={scale.id}>
                                {scale.label} (Skor: {scale.skor})
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-muted-foreground">
                            Pilih opsi yang paling sesuai dengan dokumen slip gaji atau SKTM terlampir.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Input
                            id={`crit-${criterion.id}`}
                            type="number"
                            disabled={isReadOnly}
                            value={currentValue?.nilai_mentah ?? ""}
                            onChange={(e) =>
                              handleNumericInput(
                                criterion.id,
                                e.target.value,
                                criterion.criteria_scales
                              )
                            }
                            placeholder="Contoh: 2000000"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Masukkan nominal angka tanpa titik atau koma.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Tidak ada kriteria ekonomi keluarga pada periode ini.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* STEP 3: PRESTASI & ORGANISASI */}
      {/* ==================================================================== */}
      {currentStep === 3 && (
        <Card className="shadow-xs animate-in fade-in-30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Award className="size-5" />
              <span>Langkah 3: Prestasi & Pengalaman Organisasi</span>
            </div>
            <CardTitle className="text-lg">Kriteria Tambahan & Prestasi</CardTitle>
            <CardDescription>
              Penilaian keaktifan mahasiswa dalam kegiatan ilmiah, kejuaraan, atau organisasi kemahasiswaan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {achievementCriteria.concat(otherCriteria).length > 0 ? (
              achievementCriteria.concat(otherCriteria).map((criterion) => {
                const currentValue = values[criterion.id]
                const hasScales =
                  criterion.criteria_scales &&
                  criterion.criteria_scales.length > 0

                return (
                  <div
                    key={criterion.id}
                    className="p-4 rounded-xl border bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor={`crit-${criterion.id}`}
                        className="font-semibold text-sm"
                      >
                        {criterion.nama}
                      </Label>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Bobot: {criterion.bobot}% ({criterion.tipe})
                      </span>
                    </div>

                    {hasScales ? (
                      <div className="space-y-1.5">
                        <select
                          id={`crit-${criterion.id}`}
                          disabled={isReadOnly}
                          value={
                            currentValue?.skor !== null &&
                            currentValue?.skor !== undefined
                              ? criterion.criteria_scales.find(
                                  (s) => s.skor === currentValue.skor
                                )?.id || ""
                              : ""
                          }
                          onChange={(e) =>
                            handleScaleSelect(
                              criterion.id,
                              e.target.value,
                              criterion.criteria_scales
                            )
                          }
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">-- Pilih Tingkat Prestasi / Pengalaman --</option>
                          {criterion.criteria_scales.map((scale) => (
                            <option key={scale.id} value={scale.id}>
                              {scale.label} (Skor: {scale.skor})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                          Pilih tingkatan capaian prestasi tertinggi yang dibuktikan dengan sertifikat.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Input
                          id={`crit-${criterion.id}`}
                          type="number"
                          disabled={isReadOnly}
                          value={currentValue?.nilai_mentah ?? ""}
                          onChange={(e) =>
                            handleNumericInput(
                              criterion.id,
                              e.target.value,
                              criterion.criteria_scales
                            )
                          }
                          placeholder="Masukkan angka capaian / skor"
                        />
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Tidak ada kriteria prestasi tambahan untuk periode ini. Anda dapat lanjut ke langkah berikutnya.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* STEP 4: UPLOAD DOKUMEN */}
      {/* ==================================================================== */}
      {currentStep === 4 && (
        <Card className="shadow-xs animate-in fade-in-30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Upload className="size-5" />
              <span>Langkah 4: Unggah Berkas & Dokumen Pendukung</span>
            </div>
            <CardTitle className="text-lg">Dokumen Persyaratan Seleksi</CardTitle>
            <CardDescription>
              Unggah file dokumen asli dalam format PDF, JPG, atau PNG (maksimal 5 MB per berkas)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_DOC_TYPES.map((docDef) => {
                const uploaded = documents.find((d) => d.jenis === docDef.jenis)
                const isUploading = uploadingJenis === docDef.jenis

                return (
                  <div
                    key={docDef.jenis}
                    className="p-4 rounded-xl border bg-card flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">
                          {docDef.label}
                        </span>
                        {docDef.required ? (
                          <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Wajib
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            Opsional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {docDef.desc}
                      </p>
                    </div>

                    {/* Upload Status Card / Area */}
                    {uploaded ? (
                      <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="size-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">
                              Berkas Telah Diunggah
                            </span>
                          </div>
                          <StatusBadge
                            status={uploaded.status_verifikasi}
                            size="sm"
                          />
                        </div>

                        {uploaded.catatan && (
                          <div className="text-[11px] p-2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                            <strong>Catatan Penolakan:</strong> {uploaded.catatan}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              handlePreviewDocument(uploaded.storage_path)
                            }
                            className="gap-1 text-xs"
                          >
                            <Eye className="size-3" />
                            Lihat Berkas
                          </Button>

                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() =>
                                handleDeleteDocument(
                                  uploaded.id,
                                  uploaded.storage_path
                                )
                              }
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 text-xs ml-auto"
                            >
                              <Trash2 className="size-3" />
                              Hapus
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-4 text-center bg-muted/10 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2">
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-xs text-primary font-medium py-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Mengunggah berkas...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="size-6 text-muted-foreground/80" />
                            <div className="space-y-0.5">
                              <span className="text-xs font-medium text-foreground block">
                                Tarik berkas ke sini atau pilih
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                PDF, JPG, PNG hingga 5MB
                              </span>
                            </div>

                            {!isReadOnly && (
                              <div className="flex items-center gap-2 pt-1">
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png"
                                    onChange={(e) =>
                                      handleFileUpload(e, docDef.jenis)
                                    }
                                    className="hidden"
                                    disabled={isReadOnly}
                                  />
                                  <span className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors">
                                    Pilih Berkas
                                  </span>
                                </label>

                                {/* Mobile camera capture button */}
                                <label className="cursor-pointer sm:hidden">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) =>
                                      handleFileUpload(e, docDef.jenis)
                                    }
                                    className="hidden"
                                    disabled={isReadOnly}
                                  />
                                  <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium hover:bg-muted transition-colors">
                                    <Camera className="size-3" />
                                    Foto
                                  </span>
                                </label>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* STEP 5: REVIEW & KIRIM */}
      {/* ==================================================================== */}
      {currentStep === 5 && (
        <Card className="shadow-xs animate-in fade-in-30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <CheckCircle2 className="size-5" />
              <span>Langkah 5: Ringkasan & Konfirmasi Pengajuan</span>
            </div>
            <CardTitle className="text-lg">Review Data Pendaftaran</CardTitle>
            <CardDescription>
              Periksa kembali seluruh data dan kelengkapan dokumen sebelum mengirimkan pendaftaran
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Checklist Box */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isFormComplete
                  ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                  : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
              }`}
            >
              {isFormComplete ? (
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4
                  className={`text-sm font-bold ${
                    isFormComplete
                      ? "text-emerald-900 dark:text-emerald-300"
                      : "text-amber-900 dark:text-amber-300"
                  }`}
                >
                  {isFormComplete
                    ? "Semua Persyaratan Lengkap & Siap Diajukan"
                    : "Terdapat Data atau Berkas yang Belum Dilengkapi"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Kriteria terisi: {filledCriteriaCount} dari {totalCriteriaCount} |
                  Dokumen wajib: {uploadedMandatoryDocsCount} dari{" "}
                  {mandatoryDocsCount}
                </p>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Identity summary */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Identitas Pelamar
                </h5>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="font-semibold text-foreground">{nama || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">NIM:</span>
                    <span className="font-semibold text-foreground">{nim || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Prodi:</span>
                    <span className="font-semibold text-foreground">{prodi || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Semester:</span>
                    <span className="font-semibold text-foreground">
                      {semester || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document checklist */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Kelengkapan Berkas
                </h5>
                <div className="text-xs space-y-1.5">
                  {DEFAULT_DOC_TYPES.map((d) => {
                    const isUploaded = documents.some((doc) => doc.jenis === d.jenis)
                    return (
                      <div
                        key={d.jenis}
                        className="flex items-center justify-between py-1 border-b last:border-b-0"
                      >
                        <span className="truncate max-w-[200px]">{d.jenis}</span>
                        {isUploaded ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <Check className="size-3" />
                            Terunggah
                          </span>
                        ) : d.required ? (
                          <span className="text-rose-600 font-semibold text-[11px]">
                            Belum Ada
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">
                            Opsional
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Criteria summary */}
            <div className="border rounded-xl p-4 bg-muted/10 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rincian Nilai Kriteria Pilihan
              </h5>
              <div className="divide-y text-xs">
                {criteriaList.map((c) => {
                  const val = values[c.id]
                  const scale = c.criteria_scales.find((s) => s.skor === val?.skor)

                  return (
                    <div
                      key={c.id}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-medium text-foreground block">
                          {c.nama}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {scale ? scale.label : val?.nilai_mentah ? `Nilai: ${val.nilai_mentah}` : "Belum diisi"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">
                          Skor: {val?.skor ?? "-"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Bobot {c.bobot}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit Action */}
            {!isReadOnly && (
              <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={performSave}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Save className="size-4" />
                  Simpan Draf Sekarang
                </Button>

                <Button
                  type="button"
                  disabled={!isFormComplete || submitting}
                  onClick={() => setSubmitDialogOpen(true)}
                  className="w-full sm:w-auto gap-2 bg-primary font-semibold"
                >
                  <Send className="size-4" />
                  Ajukan Pendaftaran Beasiswa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stepper Navigation Buttons (Bottom) */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
          className="gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Sebelumnya
        </Button>

        {currentStep < 5 ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
            className="gap-1.5"
          >
            Selanjutnya
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Kembali ke Dashboard
            </Button>
          </Link>
        )}
      </div>

      {/* Confirmation Dialog before Final Submit */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="size-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-center">
              Konfirmasi Pengiriman Pendaftaran
            </DialogTitle>
            <DialogDescription className="text-center pt-1 text-xs sm:text-sm">
              Setelah dikirim, seluruh data kriteria dan berkas dokumen pendaftaran Anda akan dikunci dan{" "}
              <strong className="text-foreground">TIDAK BISA DIUBAH LAGI</strong>.
              Panitia akan memvalidasi data untuk proses perangkingan metode ELECTRE.
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {submitError}
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setSubmitDialogOpen(false)}
            >
              Periksa Kembali
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="gap-2 bg-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Mengirimkan...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Ya, Kirim Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
