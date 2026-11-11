"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sliders,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Save,
  RotateCcw,
  CloudUpload,
  Layers,
  Check,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createCriteriaAction,
  updateCriteriaAction,
  deleteCriteriaAction,
  normalizeCriteriaWeightsAction,
  createScaleAction,
  updateScaleAction,
  deleteScaleAction,
  saveAllCriteriaDraftsAction,
} from "@/app/(admin)/admin/periods/actions"

export interface CriteriaWithScalesItem {
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

interface CriteriaManagerProps {
  periodId: string
  periodStatus: "draft" | "open" | "closed" | "verification" | "calculated" | "published"
  criteriaList: CriteriaWithScalesItem[]
}

interface CriterionFormValues {
  nama: string
  tipe: "benefit" | "cost"
  bobot: string
  sumber_nilai: "input" | "document"
}

interface ScaleFormValues {
  label: string
  nilai_min: string
  nilai_max: string
  skor: string
}

interface LocalCriteriaDrafts {
  criteria: Record<string, CriterionFormValues>
  scales: Record<string, ScaleFormValues>
}

const EMPTY_LOCAL_DRAFTS: LocalCriteriaDrafts = { criteria: {}, scales: {} }

interface PresetTemplate {
  id: string
  name: string
  description: string
  scales: Array<{
    label: string
    nilai_min: string
    nilai_max: string
    skor: string
  }>
}

const SCALE_PRESETS: PresetTemplate[] = [
  {
    id: "ipk",
    name: "🎓 Skala IPK (4 Taraf)",
    description: "0.00 - 4.00 (<2.75, 2.75-3.00, 3.01-3.50, 3.51-4.00)",
    scales: [
      { label: "IPK < 2.75", nilai_min: "0.00", nilai_max: "2.74", skor: "1" },
      { label: "IPK 2.75 - 3.00", nilai_min: "2.75", nilai_max: "3.00", skor: "2" },
      { label: "IPK 3.01 - 3.50", nilai_min: "3.01", nilai_max: "3.50", skor: "3" },
      { label: "IPK 3.51 - 4.00", nilai_min: "3.51", nilai_max: "4.00", skor: "5" },
    ],
  },
  {
    id: "income",
    name: "💰 Penghasilan Orang Tua (5 Taraf)",
    description: "Rupiah per bulan (<1 Jt s/d >5 Jt)",
    scales: [
      { label: "> Rp 5.000.000", nilai_min: "5000001", nilai_max: "100000000", skor: "1" },
      { label: "Rp 3.500.000 - Rp 5.000.000", nilai_min: "3500001", nilai_max: "5000000", skor: "2" },
      { label: "Rp 2.000.000 - Rp 3.500.000", nilai_min: "2000001", nilai_max: "3500000", skor: "3" },
      { label: "Rp 1.000.000 - Rp 2.000.000", nilai_min: "1000001", nilai_max: "2000000", skor: "4" },
      { label: "< Rp 1.000.000", nilai_min: "0", nilai_max: "1000000", skor: "5" },
    ],
  },
  {
    id: "achievement",
    name: "🏆 Tingkat Prestasi",
    description: "Internasional, Nasional, Provinsi, Kota/Kab, Belum Ada",
    scales: [
      { label: "Belum Ada Prestasi", nilai_min: "1", nilai_max: "1", skor: "1" },
      { label: "Tingkat Kota / Kabupaten", nilai_min: "2", nilai_max: "2", skor: "2" },
      { label: "Tingkat Provinsi", nilai_min: "3", nilai_max: "3", skor: "3" },
      { label: "Tingkat Nasional", nilai_min: "4", nilai_max: "4", skor: "4" },
      { label: "Tingkat Internasional", nilai_min: "5", nilai_max: "5", skor: "5" },
    ],
  },
  {
    id: "likert5",
    name: "⭐ Skala Standar (1 - 5)",
    description: "Sangat Rendah hingga Sangat Baik",
    scales: [
      { label: "Sangat Rendah", nilai_min: "1", nilai_max: "1", skor: "1" },
      { label: "Rendah", nilai_min: "2", nilai_max: "2", skor: "2" },
      { label: "Cukup", nilai_min: "3", nilai_max: "3", skor: "3" },
      { label: "Baik", nilai_min: "4", nilai_max: "4", skor: "4" },
      { label: "Sangat Baik", nilai_min: "5", nilai_max: "5", skor: "5" },
    ],
  },
  {
    id: "academic_test",
    name: "📝 Nilai Tes / Ujian (0 - 100)",
    description: "5 predikat rentang nilai ujian",
    scales: [
      { label: "Nilai < 60 (Kurang)", nilai_min: "0", nilai_max: "59.99", skor: "1" },
      { label: "Nilai 60 - 69.99 (Cukup)", nilai_min: "60", nilai_max: "69.99", skor: "2" },
      { label: "Nilai 70 - 79.99 (Baik)", nilai_min: "70", nilai_max: "79.99", skor: "3" },
      { label: "Nilai 80 - 89.99 (Sangat Baik)", nilai_min: "80", nilai_max: "89.99", skor: "4" },
      { label: "Nilai 90 - 100 (Unggul)", nilai_min: "90", nilai_max: "100", skor: "5" },
    ],
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseLocalCriteriaDrafts(value: string): LocalCriteriaDrafts {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!isRecord(parsed) || !isRecord(parsed.criteria) || !isRecord(parsed.scales)) {
      throw new Error("Format draf lokal tidak valid.")
    }

    const criteria: LocalCriteriaDrafts["criteria"] = {}
    for (const [id, val] of Object.entries(parsed.criteria)) {
      if (
        isRecord(val) &&
        typeof val.nama === "string" &&
        (val.tipe === "benefit" || val.tipe === "cost") &&
        (typeof val.bobot === "string" || typeof val.bobot === "number") &&
        (val.sumber_nilai === "input" || val.sumber_nilai === "document")
      ) {
        criteria[id] = {
          nama: val.nama,
          tipe: val.tipe,
          bobot: String(val.bobot),
          sumber_nilai: val.sumber_nilai,
        }
      }
    }

    const scales: LocalCriteriaDrafts["scales"] = {}
    for (const [id, val] of Object.entries(parsed.scales)) {
      if (
        isRecord(val) &&
        typeof val.label === "string" &&
        (typeof val.nilai_min === "string" || typeof val.nilai_min === "number") &&
        (typeof val.nilai_max === "string" || typeof val.nilai_max === "number") &&
        (typeof val.skor === "string" || typeof val.skor === "number")
      ) {
        scales[id] = {
          label: val.label,
          nilai_min: String(val.nilai_min),
          nilai_max: String(val.nilai_max),
          skor: String(val.skor),
        }
      }
    }

    return { criteria, scales }
  } catch (error) {
    throw error instanceof Error ? error : new Error("Format draf lokal tidak valid.")
  }
}

export function CriteriaManager({
  periodId,
  periodStatus,
  criteriaList,
}: CriteriaManagerProps) {
  const router = useRouter()
  const isLocked = periodStatus !== "draft"

  // Dialog states for Criteria
  const [addCriteriaOpen, setAddCriteriaOpen] = React.useState(false)
  const [addingCriteria, setAddingCriteria] = React.useState(false)
  const [criteriaError, setCriteriaError] = React.useState<string | null>(null)
  const [activeCriteriaId, setActiveCriteriaId] = React.useState<string | null>(null)
  const [criterionForm, setCriterionForm] = React.useState<CriterionFormValues>({
    nama: "",
    tipe: "benefit",
    bobot: "",
    sumber_nilai: "input",
  })

  // Dialog states for Scales
  const [activeScale, setActiveScale] = React.useState<{
    criterionId: string
    scaleId: string | null
  } | null>(null)
  const [scaleForm, setScaleForm] = React.useState<ScaleFormValues>({
    label: "",
    nilai_min: "",
    nilai_max: "",
    skor: "",
  })
  const [addingScale, setAddingScale] = React.useState(false)
  const [scaleError, setScaleError] = React.useState<string | null>(null)

  // Batch Save States
  const [savingAll, setSavingAll] = React.useState(false)
  const [saveAllMessage, setSaveAllMessage] = React.useState<string | null>(null)
  const [saveAllError, setSaveAllError] = React.useState<string | null>(null)

  // Local storage drafts state
  const [localDrafts, setLocalDrafts] = React.useState(EMPTY_LOCAL_DRAFTS)
  const localDraftsRef = React.useRef(localDrafts)
  const [draftsLoaded, setDraftsLoaded] = React.useState(false)
  const [draftStorageError, setDraftStorageError] = React.useState<string | null>(null)
  const draftStorageKey = `sinergi:criteria-editor:${periodId}`

  // Load drafts on mount
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(draftStorageKey)
        const drafts = saved ? parseLocalCriteriaDrafts(saved) : EMPTY_LOCAL_DRAFTS
        localDraftsRef.current = drafts
        setLocalDrafts(drafts)
      } catch (error) {
        setDraftStorageError(
          error instanceof Error
            ? `Draf lokal tidak dapat dibaca: ${error.message}`
            : "Draf lokal tidak dapat dibaca."
        )
      } finally {
        setDraftsLoaded(true)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [draftStorageKey])

  const persistLocalDrafts = (drafts: LocalCriteriaDrafts) => {
    localDraftsRef.current = drafts
    setLocalDrafts(drafts)
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts))
      setDraftStorageError(null)
    } catch (error) {
      setDraftStorageError(
        error instanceof Error
          ? `Draf belum tersimpan di perangkat: ${error.message}`
          : "Draf belum tersimpan di perangkat."
      )
    }
  }

  const updateCriterionDraft = (id: string, value: CriterionFormValues | null) => {
    const criteria = { ...localDraftsRef.current.criteria }
    if (value) criteria[id] = value
    else delete criteria[id]
    persistLocalDrafts({ ...localDraftsRef.current, criteria })
  }

  const updateScaleDraft = (id: string, value: ScaleFormValues | null) => {
    const scales = { ...localDraftsRef.current.scales }
    if (value) scales[id] = value
    else delete scales[id]
    persistLocalDrafts({ ...localDraftsRef.current, scales })
  }

  const discardAllLocalDrafts = () => {
    if (!confirm("Buang semua draf lokal yang belum dikirim ke database?")) return
    persistLocalDrafts(EMPTY_LOCAL_DRAFTS)
    setSaveAllMessage(null)
    setSaveAllError(null)
  }

  const localDraftCount =
    Object.keys(localDrafts.criteria).length + Object.keys(localDrafts.scales).length

  // Accordion for scales expansion
  const [expandedCriteria, setExpandedCriteria] = React.useState<Record<string, boolean>>(
    criteriaList.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  )

  const toggleExpand = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Calculate total weight with drafts
  const totalWeightWithDrafts =
    criteriaList.reduce(
      (acc, criterion) =>
        acc +
        Number(localDrafts.criteria[criterion.id]?.bobot ?? criterion.bobot),
      0
    ) + Number(localDrafts.criteria.new?.bobot ?? 0)
  const isWeightValid = Math.abs(totalWeightWithDrafts - 100) < 0.01

  // Function to analyze scale gaps and overlaps
  const analyzeScales = (scales: Array<{ nilai_min: number; nilai_max: number; label: string }>) => {
    if (!scales || scales.length <= 1) return null

    const sorted = [...scales].sort((a, b) => a.nilai_min - b.nilai_min)
    const warnings: string[] = []

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      if (current.nilai_max >= next.nilai_min) {
        warnings.push(
          `Rentang tumpang tindih: [${current.nilai_min} - ${current.nilai_max}] dan [${next.nilai_min} - ${next.nilai_max}]`
        )
      } else if (next.nilai_min > current.nilai_max + 1) {
        warnings.push(
          `Celah nilai belum ter-cover antara ${current.nilai_max} dan ${next.nilai_min}`
        )
      }
    }

    return warnings.length > 0 ? warnings : null
  }

  // Normalizing state
  const [normalizing, setNormalizing] = React.useState(false)

  // Smart normalization handler (normalizes locally if drafts exist, or hits server if none)
  const handleNormalize = async () => {
    if (isLocked) return

    if (localDraftCount > 0) {
      // Normalize directly in the local drafts!
      const items: Array<{ id: string; currentWeight: number }> = criteriaList.map(
        (c) => ({
          id: c.id,
          currentWeight: Number(localDrafts.criteria[c.id]?.bobot ?? c.bobot),
        })
      )

      if (localDrafts.criteria.new) {
        items.push({
          id: "new",
          currentWeight: Number(localDrafts.criteria.new.bobot || 0),
        })
      }

      const total = items.reduce(
        (acc, it) => acc + (it.currentWeight > 0 ? it.currentWeight : 1),
        0
      )
      if (total <= 0) return

      let runningTotal = 0
      const updatedCriteria = { ...localDraftsRef.current.criteria }

      items.forEach((item, index) => {
        let normWeight: number
        if (index === items.length - 1) {
          normWeight = Number((100 - runningTotal).toFixed(2))
        } else {
          normWeight = Number(
            (((item.currentWeight > 0 ? item.currentWeight : 1) / total) * 100).toFixed(2)
          )
          runningTotal += normWeight
        }

        const existingDraft = updatedCriteria[item.id]
        if (existingDraft) {
          updatedCriteria[item.id] = { ...existingDraft, bobot: String(normWeight) }
        } else {
          const original = criteriaList.find((c) => c.id === item.id)
          if (original) {
            updatedCriteria[item.id] = {
              nama: original.nama,
              tipe: original.tipe,
              bobot: String(normWeight),
              sumber_nilai: original.sumber_nilai,
            }
          }
        }
      })

      persistLocalDrafts({ ...localDraftsRef.current, criteria: updatedCriteria })
      return
    }

    // No local drafts: call server action
    setNormalizing(true)
    const res = await normalizeCriteriaWeightsAction(periodId)
    setNormalizing(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal menormalisasi bobot.")
    }
  }

  // Batch Save all local drafts to DB
  const handleSaveAllToDatabase = async () => {
    if (isLocked) return
    if (localDraftCount === 0) return

    setSavingAll(true)
    setSaveAllMessage(null)
    setSaveAllError(null)

    const res = await saveAllCriteriaDraftsAction(periodId, localDraftsRef.current)
    setSavingAll(false)

    if (res.success) {
      persistLocalDrafts(EMPTY_LOCAL_DRAFTS)
      setSaveAllMessage(res.message || "Semua perubahan berhasil disimpan ke database.")
      router.refresh()
    } else {
      setSaveAllError(res.error || "Gagal menyimpan perubahan ke database.")
    }
  }

  // Quick weight update directly from card input
  const handleQuickWeightChange = (criterion: CriteriaWithScalesItem, newWeight: string) => {
    const existing = localDraftsRef.current.criteria[criterion.id] ?? {
      nama: criterion.nama,
      tipe: criterion.tipe,
      bobot: String(criterion.bobot),
      sumber_nilai: criterion.sumber_nilai,
    }
    updateCriterionDraft(criterion.id, { ...existing, bobot: newWeight })
  }

  // Quick type toggle directly from card
  const handleQuickTypeToggle = (criterion: CriteriaWithScalesItem) => {
    const currentType = localDraftsRef.current.criteria[criterion.id]?.tipe ?? criterion.tipe
    const nextType = currentType === "benefit" ? "cost" : "benefit"
    const existing = localDraftsRef.current.criteria[criterion.id] ?? {
      nama: criterion.nama,
      tipe: criterion.tipe,
      bobot: String(criterion.bobot),
      sumber_nilai: criterion.sumber_nilai,
    }
    updateCriterionDraft(criterion.id, { ...existing, tipe: nextType })
  }

  // Quick source toggle directly from card
  const handleQuickSourceToggle = (criterion: CriteriaWithScalesItem) => {
    const currentSource = localDraftsRef.current.criteria[criterion.id]?.sumber_nilai ?? criterion.sumber_nilai
    const nextSource = currentSource === "input" ? "document" : "input"
    const existing = localDraftsRef.current.criteria[criterion.id] ?? {
      nama: criterion.nama,
      tipe: criterion.tipe,
      bobot: String(criterion.bobot),
      sumber_nilai: criterion.sumber_nilai,
    }
    updateCriterionDraft(criterion.id, { ...existing, sumber_nilai: nextSource })
  }

  // Quick add new scale row to draft
  const handleQuickAddScale = (criterionId: string) => {
    const existingNewCount = Object.keys(localDraftsRef.current.scales).filter((k) =>
      k.startsWith(`${criterionId}:new:`)
    ).length
    const uniqueKey = `${criterionId}:new:${existingNewCount + 1}`
    updateScaleDraft(uniqueKey, {
      label: "Kategori Baru",
      nilai_min: "0",
      nilai_max: "100",
      skor: "1",
    })
  }

  // Apply scale preset to criterion
  const handleApplyPreset = (criterionId: string, presetId: string) => {
    const preset = SCALE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    const scales = { ...localDraftsRef.current.scales }
    // Clean up existing :new scales for this criterion
    Object.keys(scales).forEach((key) => {
      if (key.startsWith(`${criterionId}:new`)) {
        delete scales[key]
      }
    })

    preset.scales.forEach((s, idx) => {
      scales[`${criterionId}:new:${idx + 1}`] = {
        label: s.label,
        nilai_min: s.nilai_min,
        nilai_max: s.nilai_max,
        skor: s.skor,
      }
    })

    persistLocalDrafts({ ...localDraftsRef.current, scales })
  }

  // Single Criteria Submit Handler (from Dialog)
  const handleAddCriteriaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeCriteriaId) return
    setAddingCriteria(true)
    setCriteriaError(null)

    const formData = new FormData(e.currentTarget)
    const res =
      activeCriteriaId === "new"
        ? await createCriteriaAction(periodId, formData)
        : await updateCriteriaAction(activeCriteriaId, periodId, formData)
    setAddingCriteria(false)

    if (res.success) {
      updateCriterionDraft(activeCriteriaId, null)
      setAddCriteriaOpen(false)
      setActiveCriteriaId(null)
      router.refresh()
    } else {
      setCriteriaError(res.error || "Gagal menyimpan kriteria.")
    }
  }

  const openCriterionForm = (criterion?: CriteriaWithScalesItem) => {
    const id = criterion?.id ?? "new"
    const savedDraft = localDraftsRef.current.criteria[id]
    setCriterionForm(
      savedDraft ?? {
        nama: criterion?.nama ?? "",
        tipe: criterion?.tipe ?? "benefit",
        bobot: criterion ? String(criterion.bobot) : "",
        sumber_nilai: criterion?.sumber_nilai ?? "input",
      }
    )
    setActiveCriteriaId(id)
    setCriteriaError(null)
    setAddCriteriaOpen(true)
  }

  const openScaleForm = (
    criterionId: string,
    scale?: { id: string; label: string; nilai_min: number; nilai_max: number; skor: number }
  ) => {
    const scaleDraftId = scale?.id ?? `${criterionId}:new`
    setScaleForm(
      localDraftsRef.current.scales[scaleDraftId] ?? {
        label: scale?.label ?? "",
        nilai_min: scale ? String(scale.nilai_min) : "",
        nilai_max: scale ? String(scale.nilai_max) : "",
        skor: scale ? String(scale.skor) : "",
      }
    )
    setActiveScale({ criterionId, scaleId: scale?.id ?? null })
    setScaleError(null)
  }

  // Delete criteria handler
  const handleDeleteCriteria = async (criteriaId: string) => {
    if (isLocked) return
    if (!confirm("Hapus kriteria ini beserta seluruh skala nilainya?")) return

    const res = await deleteCriteriaAction(criteriaId, periodId)
    if (res.success) {
      updateCriterionDraft(criteriaId, null)
      const scales = { ...localDraftsRef.current.scales }
      Object.keys(scales).forEach((key) => {
        if (key.startsWith(`${criteriaId}:`)) delete scales[key]
      })
      criteriaList
        .find((criterion) => criterion.id === criteriaId)
        ?.criteria_scales.forEach((scale) => delete scales[scale.id])
      persistLocalDrafts({ ...localDraftsRef.current, scales })
      router.refresh()
    } else {
      alert(res.error || "Gagal menghapus kriteria.")
    }
  }

  // Single Scale Submit Handler (from Dialog)
  const handleAddScaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activeScale) return

    setAddingScale(true)
    setScaleError(null)

    const formData = new FormData(e.currentTarget)
    const res = activeScale.scaleId
      ? await updateScaleAction(
          activeScale.scaleId,
          activeScale.criterionId,
          periodId,
          formData
        )
      : await createScaleAction(activeScale.criterionId, periodId, formData)
    setAddingScale(false)

    if (res.success) {
      updateScaleDraft(
        activeScale.scaleId ?? `${activeScale.criterionId}:new`,
        null
      )
      setActiveScale(null)
      router.refresh()
    } else {
      setScaleError(res.error || "Gagal menyimpan skala kriteria.")
    }
  }

  // Delete scale handler
  const handleDeleteScale = async (scaleId: string, criterionId: string) => {
    if (isLocked) return

    // If it's a local-only draft (new scale that hasn't been saved to DB)
    if (scaleId.includes(":new")) {
      updateScaleDraft(scaleId, null)
      return
    }

    if (!confirm("Hapus baris skala nilai ini?")) return

    const res = await deleteScaleAction(scaleId, periodId)
    if (res.success) {
      updateScaleDraft(scaleId, null)
      router.refresh()
    } else {
      alert(res.error || "Gagal menghapus skala.")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-20">
      {/* Storage Error Alert */}
      {draftStorageError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {draftStorageError} Salin perubahan penting sebelum meninggalkan halaman.
        </div>
      )}

      {/* Success / Error Banners for Batch Save */}
      {saveAllMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{saveAllMessage}</span>
        </div>
      )}
      {saveAllError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <AlertTriangle className="size-4 shrink-0 text-rose-600" />
          <span>{saveAllError}</span>
        </div>
      )}

      {/* Local Draft Status Notification Banner */}
      {localDraftCount > 0 ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 via-sky-50/70 to-indigo-50/50 p-4 text-sm text-sky-950 sm:flex-row sm:items-center sm:justify-between shadow-xs"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="rounded-full bg-sky-200/70 p-2 text-sky-800 shrink-0">
              <Zap className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-sky-900">
                Mode Draf Cepat Aktif ({localDraftCount} perubahan lokal)
              </p>
              <p className="text-xs text-sky-700/90">
                Semua perubahan (bobot, nama, tipe, dan skala) disimpan di perangkat Anda terlebih dahulu tanpa latensi server.
                {isLocked && " Periode sudah terkunci sehingga draf ini tidak dapat disimpan."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={discardAllLocalDrafts}
              disabled={savingAll}
              className="text-xs border-sky-300 text-sky-800 hover:bg-sky-100/60"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Buang Draf
            </Button>
            {!isLocked && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAllToDatabase}
                disabled={savingAll}
                className="text-xs bg-sky-700 hover:bg-sky-800 text-white shadow-xs font-semibold gap-1.5"
              >
                {savingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="size-3.5" />
                )}
                Simpan Semua ke Database
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>Semua kriteria dan skala tersinkronisasi penuh dengan database</span>
          </div>
        </div>
      )}

      {/* Locked status banner */}
      {isLocked && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900 flex items-start gap-3">
          <Lock className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Kriteria dan Bobot Terkunci
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Karena periode seleksi telah dibuka atau dalam proses verifikasi/kalkulasi, kriteria, bobot, dan skala penilaian telah dikunci demi integritas dan transparansi seleksi. Perubahan hanya diperbolehkan melalui periode baru.
            </p>
          </div>
        </div>
      )}

      {/* Real-time Weight Progress Bar Card */}
      <Card className="shadow-xs border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Indikator Akumulasi Bobot
                </span>
                {isWeightValid ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Tepat 100%
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Tidak Valid ({totalWeightWithDrafts.toFixed(2)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Algoritma normalisasi matriks terbobot ELECTRE mensyaratkan total bobot kriteria persis bernilai 100%.
              </p>
            </div>

            {/* Normalization button if invalid */}
            {!isLocked && !isWeightValid && totalWeightWithDrafts > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNormalize}
                disabled={normalizing}
                className="gap-2 text-primary border-primary/30 hover:bg-primary/5 self-start sm:self-auto"
              >
                {normalizing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Normalisasi Otomatis {localDraftCount > 0 ? "(Lokal)" : ""}
              </Button>
            )}
          </div>

          {/* Progress bar visual */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isWeightValid ? "text-emerald-600 font-bold" : "text-foreground"}>
                {totalWeightWithDrafts.toFixed(2)}% dari 100%
              </span>
              <span className="text-muted-foreground">
                {totalWeightWithDrafts < 100
                  ? `Kekurangan: ${(100 - totalWeightWithDrafts).toFixed(2)}%`
                  : totalWeightWithDrafts > 100
                  ? `Kelebihan: ${(totalWeightWithDrafts - 100).toFixed(2)}%`
                  : "Target tercapai"}
              </span>
            </div>
            <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isWeightValid
                    ? "bg-emerald-600"
                    : totalWeightWithDrafts < 100
                    ? "bg-amber-500"
                    : "bg-rose-600"
                }`}
                style={{ width: `${Math.min(totalWeightWithDrafts, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Add Criteria Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Daftar Kriteria Penilaian ({criteriaList.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Tentukan kriteria benefit/cost, persentase bobot, dan skala rentang penilaian
          </p>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openCriterionForm()}
              disabled={!draftsLoaded}
              className="gap-2 bg-primary shadow-xs"
            >
              <Plus className="size-4" />
              Tambah Kriteria
            </Button>
          </div>
        )}
      </div>

      {/* Criteria & Scales List */}
      <div className="space-y-5">
        {criteriaList.length > 0 || localDrafts.criteria.new ? (
          <>
            {/* New Criteria Draft Card */}
            {localDrafts.criteria.new && (
              <Card className="border-sky-300 bg-sky-50/60 shadow-xs border-dashed">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-sky-400 bg-sky-100 text-sky-800">
                        Draf Baru
                      </Badge>
                      <span className="font-semibold text-sky-950">
                        {localDrafts.criteria.new.nama || "Kriteria Baru"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-sky-700">
                      Tipe: <span className="uppercase font-semibold">{localDrafts.criteria.new.tipe}</span> · Bobot:{" "}
                      <span className="font-bold">{localDrafts.criteria.new.bobot || "—"}%</span> · Sumber:{" "}
                      {localDrafts.criteria.new.sumber_nilai === "document" ? "Dokumen" : "Input"} · Belum dikirim ke database
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openCriterionForm()}>
                      <Pencil className="mr-2 size-3.5" />
                      Lanjutkan Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => updateCriterionDraft("new", null)}
                    >
                      Buang Draf
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Render Existing Criteria */}
            {criteriaList.map((criterion, idx) => {
              const isExpanded = expandedCriteria[criterion.id] ?? true
              const criterionDraft = localDrafts.criteria[criterion.id]
              const displayedName = criterionDraft?.nama ?? criterion.nama
              const displayedType = criterionDraft?.tipe ?? criterion.tipe
              const displayedWeight = Number(criterionDraft?.bobot ?? criterion.bobot)
              const displayedSource = criterionDraft?.sumber_nilai ?? criterion.sumber_nilai

              // Existing database scales overlaid with local draft
              const existingScales = criterion.criteria_scales.map((scale) => {
                const draft = localDrafts.scales[scale.id]
                if (!draft) return { ...scale, isDraft: false }
                const min = parseFloat(draft.nilai_min)
                const max = parseFloat(draft.nilai_max)
                const score = parseFloat(draft.skor)
                return {
                  ...scale,
                  label: draft.label,
                  nilai_min: Number.isFinite(min) ? min : scale.nilai_min,
                  nilai_max: Number.isFinite(max) ? max : scale.nilai_max,
                  skor: Number.isFinite(score) ? score : scale.skor,
                  isDraft: true,
                }
              })

              // Any new draft scales for this criterion
              const newScaleDrafts = Object.entries(localDrafts.scales)
                .filter(([key]) => key === `${criterion.id}:new` || key.startsWith(`${criterion.id}:new:`))
                .map(([key, draft]) => {
                  const min = parseFloat(draft.nilai_min)
                  const max = parseFloat(draft.nilai_max)
                  const score = parseFloat(draft.skor)
                  return {
                    id: key,
                    criteria_id: criterion.id,
                    label: draft.label || "Skala baru",
                    nilai_min: Number.isFinite(min) ? min : 0,
                    nilai_max: Number.isFinite(max) ? max : 0,
                    skor: Number.isFinite(score) ? score : 1,
                    isDraft: true,
                    isNew: true,
                  }
                })

              const displayedScales = [...existingScales, ...newScaleDrafts].sort(
                (a, b) => a.nilai_min - b.nilai_min
              )
              const scaleWarnings = analyzeScales(displayedScales)

              return (
                <Card
                  key={criterion.id}
                  className={`overflow-hidden border shadow-2xs transition-all ${
                    criterionDraft
                      ? "border-sky-300 ring-1 ring-sky-200"
                      : "hover:border-primary/40"
                  }`}
                >
                  {/* Criterion Header bar */}
                  <CardHeader className="p-4 bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold size-7 rounded-full bg-background border flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {displayedName}
                          </span>

                          {/* Quick Toggle Benefit/Cost */}
                          <Badge
                            variant={displayedType === "benefit" ? "default" : "destructive"}
                            className="text-[10px] uppercase font-bold cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => !isLocked && handleQuickTypeToggle(criterion)}
                            title={!isLocked ? "Klik untuk ganti Benefit / Cost" : undefined}
                          >
                            {displayedType}
                          </Badge>

                          {/* Quick Toggle Source */}
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-normal cursor-pointer hover:bg-muted"
                            onClick={() => !isLocked && handleQuickSourceToggle(criterion)}
                            title={!isLocked ? "Klik untuk ganti Sumber Pengisian" : undefined}
                          >
                            Sumber: {displayedSource === "document" ? "Dokumen" : "Input Mahasiswa"}
                          </Badge>

                          {criterionDraft && (
                            <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 text-[10px]">
                              Draf lokal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {/* Direct Weight Input / Slider */}
                      <div className="flex items-center gap-2 px-2 py-1 bg-background/80 border rounded-lg">
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">Bobot:</span>
                        {!isLocked ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="100"
                              value={Number.isFinite(displayedWeight) ? displayedWeight : criterion.bobot}
                              onChange={(e) => handleQuickWeightChange(criterion, e.target.value)}
                              className="h-7 w-16 text-right font-bold text-xs p-1 text-primary"
                              title="Ubah bobot langsung (disimpan di draf lokal)"
                            />
                            <span className="text-xs font-bold text-primary">%</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {Number.isFinite(displayedWeight) ? displayedWeight : criterion.bobot}%
                          </span>
                        )}
                      </div>

                      {!isLocked && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCriterionForm(criterion)}
                            disabled={!draftsLoaded}
                            className="size-8"
                            aria-label={`Edit ${criterion.nama}`}
                            title="Edit Kriteria Lengkap"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCriteria(criterion.id)}
                            className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            aria-label={`Hapus ${criterion.nama}`}
                            title="Hapus Kriteria"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(criterion.id)}
                        className="size-8"
                        aria-label={isExpanded ? "Tutup detail skala" : "Buka detail skala"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Collapsible Scales Editor */}
                  {isExpanded && (
                    <CardContent className="p-4 space-y-4">
                      {/* Scale warnings */}
                      {scaleWarnings && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="size-3.5 text-amber-600" />
                            <span>Peringatan Struktur Skala:</span>
                          </div>
                          <ul className="list-disc list-inside pl-1 text-[11px]">
                            {scaleWarnings.map((w, wi) => (
                              <li key={wi}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Scale Table */}
                      <div className="border rounded-lg overflow-x-auto bg-background shadow-2xs">
                        <div className="min-w-[700px]">
                          <div className="grid grid-cols-12 bg-muted/40 p-2.5 text-[11px] font-semibold text-muted-foreground uppercase border-b">
                            <div className="col-span-5">Label Kategori / Rentang</div>
                            <div className="col-span-2 text-center">Nilai Min</div>
                            <div className="col-span-2 text-center">Nilai Max</div>
                            <div className="col-span-2 text-center">Skor (1-5)</div>
                            <div className="col-span-1 text-right">Aksi</div>
                          </div>

                          {displayedScales.length > 0 ? (
                            <div className="divide-y text-xs">
                              {displayedScales.map((scale) => {
                                const isDraft = scale.isDraft
                                return (
                                  <div
                                    key={scale.id}
                                    className={`grid grid-cols-12 p-2.5 items-center transition-colors ${
                                      isDraft
                                        ? "bg-sky-50/50 hover:bg-sky-50/80"
                                        : "hover:bg-muted/20"
                                    }`}
                                  >
                                    <div className="col-span-5 font-medium truncate flex items-center gap-2">
                                      <span>{scale.label}</span>
                                      {isDraft && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] border-sky-300 bg-sky-100/70 text-sky-800"
                                        >
                                          Draf lokal
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="col-span-2 text-center font-mono text-muted-foreground">
                                      {scale.nilai_min}
                                    </div>
                                    <div className="col-span-2 text-center font-mono text-muted-foreground">
                                      {scale.nilai_max}
                                    </div>
                                    <div className="col-span-2 text-center">
                                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]">
                                        {scale.skor}
                                      </span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                      {!isLocked && (
                                        <div className="inline-flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => openScaleForm(criterion.id, scale)}
                                            disabled={!draftsLoaded}
                                            aria-label={`Edit skala ${scale.label}`}
                                            title="Edit Skala"
                                          >
                                            <Pencil className="size-3.5" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-rose-600"
                                            onClick={() => handleDeleteScale(scale.id, criterion.id)}
                                            aria-label={`Hapus skala ${scale.label}`}
                                            title="Hapus Skala"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="p-5 text-center text-xs text-muted-foreground italic">
                              Belum ada skala rentang yang ditentukan untuk kriteria ini.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scale Action Toolbar (Presets & Adding) */}
                      {!isLocked && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed">
                          {/* Scale Presets Selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Layers className="size-3.5 text-primary" />
                              Template Skala:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {SCALE_PRESETS.map((preset) => (
                                <Button
                                  key={preset.id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] px-2.5 bg-muted/30 hover:bg-primary/5 hover:border-primary/40"
                                  onClick={() => handleApplyPreset(criterion.id, preset.id)}
                                  title={preset.description}
                                >
                                  {preset.name}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickAddScale(criterion.id)}
                              disabled={!draftsLoaded}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Plus className="size-3.5" />
                              Tambah Baris Cepat
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => openScaleForm(criterion.id)}
                              disabled={!draftsLoaded}
                              className="h-8 text-xs gap-1.5"
                            >
                              <Plus className="size-3.5" />
                              Tambah Baris Skala
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </>
        ) : (
          <Card className="text-center py-12 px-4 border-dashed">
            <CardContent className="space-y-3">
              <Sliders className="size-10 text-muted-foreground/60 mx-auto" />
              <CardTitle className="text-base">Belum Ada Kriteria</CardTitle>
              <CardDescription>
                Tambahkan kriteria penilaian beasiswa (misal: IPK, Penghasilan Orang Tua, Prestasi) dan atur bobot total menjadi 100%.
              </CardDescription>
              {!isLocked && (
                <Button
                  size="sm"
                  onClick={() => openCriterionForm()}
                  disabled={!draftsLoaded}
                  className="gap-2 mt-2"
                >
                  <Plus className="size-4" />
                  Tambah Kriteria Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Bar for Unsaved Changes */}
      {localDraftCount > 0 && !isLocked && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-300 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex size-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-sky-500" />
              </span>
              <div className="text-xs truncate">
                <span className="font-bold text-foreground">
                  {localDraftCount} Perubahan Tersimpan di Lokal
                </span>
                <span className="text-muted-foreground hidden sm:inline ml-1">
                  · Siap dikirim ke database
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={discardAllLocalDrafts}
                disabled={savingAll}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8"
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAllToDatabase}
                disabled={savingAll}
                className="text-xs font-semibold bg-primary hover:bg-primary/90 text-white gap-1.5 h-8 shadow-xs"
              >
                {savingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Simpan Semua ke Database
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Add/Edit Criteria */}
      <Dialog open={addCriteriaOpen} onOpenChange={setAddCriteriaOpen}>
        <DialogContent>
          <form onSubmit={handleAddCriteriaSubmit}>
            <DialogHeader>
              <DialogTitle>
                {activeCriteriaId === "new" ? "Tambah Kriteria Penilaian" : "Edit Kriteria Penilaian"}
              </DialogTitle>
              <DialogDescription>
                Perubahan disimpan di perangkat ini saat Anda mengetik. Kirim ke database setelah siap.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-xs text-sky-800">
                Draf lokal · belum tersimpan ke database
              </p>
              {criteriaError && (
                <div role="alert" className="p-3 rounded bg-rose-50 text-rose-700 text-xs">
                  {criteriaError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="crit-nama">Nama Kriteria</Label>
                <Input
                  id="crit-nama"
                  name="nama"
                  value={criterionForm.nama}
                  onChange={(event) => {
                    const value = { ...criterionForm, nama: event.target.value }
                    setCriterionForm(value)
                    if (activeCriteriaId) updateCriterionDraft(activeCriteriaId, value)
                  }}
                  required
                  placeholder="Contoh: Indeks Prestasi Kumulatif (IPK)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="crit-tipe">Tipe Kriteria</Label>
                  <select
                    id="crit-tipe"
                    name="tipe"
                    value={criterionForm.tipe}
                    onChange={(event) => {
                      const value = {
                        ...criterionForm,
                        tipe: event.target.value as CriterionFormValues["tipe"],
                      }
                      setCriterionForm(value)
                      if (activeCriteriaId) updateCriterionDraft(activeCriteriaId, value)
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                  >
                    <option value="benefit">Benefit (Makin tinggi makin baik)</option>
                    <option value="cost">Cost (Makin rendah makin baik)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="crit-bobot">Bobot (%)</Label>
                  <Input
                    id="crit-bobot"
                    name="bobot"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    required
                    value={criterionForm.bobot}
                    onChange={(event) => {
                      const value = { ...criterionForm, bobot: event.target.value }
                      setCriterionForm(value)
                      if (activeCriteriaId) updateCriterionDraft(activeCriteriaId, value)
                    }}
                    placeholder="Contoh: 30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crit-sumber">Sumber Pengisian</Label>
                <select
                  id="crit-sumber"
                  name="sumber_nilai"
                  value={criterionForm.sumber_nilai}
                  onChange={(event) => {
                    const value = {
                      ...criterionForm,
                      sumber_nilai: event.target.value as CriterionFormValues["sumber_nilai"],
                    }
                    setCriterionForm(value)
                    if (activeCriteriaId) updateCriterionDraft(activeCriteriaId, value)
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-ring"
                >
                  <option value="input">Input / Pilihan Mahasiswa</option>
                  <option value="document">Berdasarkan Dokumen Terverifikasi</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={addingCriteria}
                onClick={() => setAddCriteriaOpen(false)}
              >
                Tutup
              </Button>
              {activeCriteriaId &&
                localDrafts.criteria[activeCriteriaId] && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={addingCriteria}
                    onClick={() => {
                      updateCriterionDraft(activeCriteriaId, null)
                      const criterion = criteriaList.find((item) => item.id === activeCriteriaId)
                      setCriterionForm({
                        nama: criterion?.nama ?? "",
                        tipe: criterion?.tipe ?? "benefit",
                        bobot: criterion ? String(criterion.bobot) : "",
                        sumber_nilai: criterion?.sumber_nilai ?? "input",
                      })
                    }}
                  >
                    Buang draf
                  </Button>
                )}
              <Button type="submit" disabled={addingCriteria}>
                {addingCriteria
                  ? "Menyimpan..."
                  : activeCriteriaId === "new"
                    ? "Simpan Kriteria ke Database"
                    : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add/Edit Scale Row */}
      <Dialog
        open={!!activeScale}
        onOpenChange={(open) => !open && setActiveScale(null)}
      >
        <DialogContent>
          <form onSubmit={handleAddScaleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {activeScale?.scaleId ? "Edit Skala Nilai" : "Tambah Baris Skala Nilai"}
              </DialogTitle>
              <DialogDescription>
                Perubahan disimpan di perangkat ini saat Anda mengetik. Kirim ke database setelah siap.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-xs text-sky-800">
                Draf lokal · belum tersimpan ke database
              </p>
              {scaleError && (
                <div role="alert" className="p-3 rounded bg-rose-50 text-rose-700 text-xs">
                  {scaleError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="scale-label">Label Rentang Nilai</Label>
                <Input
                  id="scale-label"
                  name="label"
                  value={scaleForm.label}
                  onChange={(event) => {
                    const value = { ...scaleForm, label: event.target.value }
                    setScaleForm(value)
                    if (activeScale) {
                      updateScaleDraft(activeScale.scaleId ?? `${activeScale.criterionId}:new`, value)
                    }
                  }}
                  required
                  placeholder="Contoh: Rp 1.500.000 - Rp 3.000.000 atau IPK 3.51 - 4.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="scale-min">Nilai Min (Inklusif)</Label>
                  <Input
                    id="scale-min"
                    name="nilai_min"
                    type="number"
                    step="any"
                    required
                    value={scaleForm.nilai_min}
                    onChange={(event) => {
                      const value = { ...scaleForm, nilai_min: event.target.value }
                      setScaleForm(value)
                      if (activeScale) {
                        updateScaleDraft(activeScale.scaleId ?? `${activeScale.criterionId}:new`, value)
                      }
                    }}
                    placeholder="Contoh: 1500000"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="scale-max">Nilai Max (Inklusif)</Label>
                  <Input
                    id="scale-max"
                    name="nilai_max"
                    type="number"
                    step="any"
                    required
                    value={scaleForm.nilai_max}
                    onChange={(event) => {
                      const value = { ...scaleForm, nilai_max: event.target.value }
                      setScaleForm(value)
                      if (activeScale) {
                        updateScaleDraft(activeScale.scaleId ?? `${activeScale.criterionId}:new`, value)
                      }
                    }}
                    placeholder="Contoh: 3000000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="scale-skor">Skor Standar</Label>
                <Input
                  id="scale-skor"
                  name="skor"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={scaleForm.skor}
                  onChange={(event) => {
                    const value = { ...scaleForm, skor: event.target.value }
                    setScaleForm(value)
                    if (activeScale) {
                      updateScaleDraft(activeScale.scaleId ?? `${activeScale.criterionId}:new`, value)
                    }
                  }}
                  placeholder="Contoh: 4 atau 5"
                />
                <span className="text-[11px] text-muted-foreground">
                  Skor yang akan digunakan dalam matriks keputusan X algoritma ELECTRE.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={addingScale}
                onClick={() => setActiveScale(null)}
              >
                Tutup
              </Button>
              {activeScale &&
                localDrafts.scales[
                  activeScale.scaleId ?? `${activeScale.criterionId}:new`
                ] && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={addingScale}
                    onClick={() => {
                      const key = activeScale.scaleId ?? `${activeScale.criterionId}:new`
                      updateScaleDraft(key, null)
                      const scale = activeScale.scaleId
                        ? criteriaList
                            .find((criterion) => criterion.id === activeScale.criterionId)
                            ?.criteria_scales.find((item) => item.id === activeScale.scaleId)
                        : undefined
                      setScaleForm({
                        label: scale?.label ?? "",
                        nilai_min: scale ? String(scale.nilai_min) : "",
                        nilai_max: scale ? String(scale.nilai_max) : "",
                        skor: scale ? String(scale.skor) : "",
                      })
                    }}
                  >
                    Buang draf
                  </Button>
                )}
              <Button type="submit" disabled={addingScale}>
                {addingScale
                  ? "Menyimpan..."
                  : activeScale?.scaleId
                    ? "Simpan Perubahan"
                    : "Simpan Skala ke Database"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
