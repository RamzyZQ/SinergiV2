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
  deleteCriteriaAction,
  normalizeCriteriaWeightsAction,
  createScaleAction,
  deleteScaleAction,
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

export function CriteriaManager({
  periodId,
  periodStatus,
  criteriaList,
}: CriteriaManagerProps) {
  const router = useRouter()
  const isLocked = periodStatus !== "draft"

  // Dialog states
  const [addCriteriaOpen, setAddCriteriaOpen] = React.useState(false)
  const [addingCriteria, setAddingCriteria] = React.useState(false)
  const [criteriaError, setCriteriaError] = React.useState<string | null>(null)

  // Scale add dialog
  const [addScaleCriterionId, setAddScaleCriterionId] = React.useState<string | null>(null)
  const [addingScale, setAddingScale] = React.useState(false)
  const [scaleError, setScaleError] = React.useState<string | null>(null)

  // Normalizing state
  const [normalizing, setNormalizing] = React.useState(false)

  // Accordion for scales expansion
  const [expandedCriteria, setExpandedCriteria] = React.useState<Record<string, boolean>>(
    criteriaList.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
  )

  const toggleExpand = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Calculate total weight
  const totalWeight = criteriaList.reduce((acc, c) => acc + Number(c.bobot), 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01

  // Function to analyze scale gaps and overlaps
  const analyzeScales = (scales: CriteriaWithScalesItem["criteria_scales"]) => {
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

  // Normalization handler
  const handleNormalize = async () => {
    if (isLocked) return
    setNormalizing(true)
    const res = await normalizeCriteriaWeightsAction(periodId)
    setNormalizing(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal menormalisasi bobot.")
    }
  }

  // Add criteria handler
  const handleAddCriteriaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddingCriteria(true)
    setCriteriaError(null)

    const formData = new FormData(e.currentTarget)
    const res = await createCriteriaAction(periodId, formData)
    setAddingCriteria(false)

    if (res.success) {
      setAddCriteriaOpen(false)
      router.refresh()
    } else {
      setCriteriaError(res.error || "Gagal menambah kriteria.")
    }
  }

  // Delete criteria handler
  const handleDeleteCriteria = async (criteriaId: string) => {
    if (isLocked) return
    if (!confirm("Hapus kriteria ini beserta seluruh skala nilainya?")) return

    const res = await deleteCriteriaAction(criteriaId, periodId)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal menghapus kriteria.")
    }
  }

  // Add scale handler
  const handleAddScaleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!addScaleCriterionId) return

    setAddingScale(true)
    setScaleError(null)

    const formData = new FormData(e.currentTarget)
    const res = await createScaleAction(addScaleCriterionId, periodId, formData)
    setAddingScale(false)

    if (res.success) {
      setAddScaleCriterionId(null)
      router.refresh()
    } else {
      setScaleError(res.error || "Gagal menambah skala kriteria.")
    }
  }

  // Delete scale handler
  const handleDeleteScale = async (scaleId: string) => {
    if (isLocked) return
    if (!confirm("Hapus baris skala nilai ini?")) return

    const res = await deleteScaleAction(scaleId, periodId)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || "Gagal menghapus skala.")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
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
                    <AlertTriangle className="size-3" /> Tidak Valid ({totalWeight.toFixed(2)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Algoritma normalisasi matriks terbobot ELECTRE mensyaratkan total bobot kriteria persis bernilai 100%.
              </p>
            </div>

            {/* Normalization button if invalid */}
            {!isLocked && !isWeightValid && totalWeight > 0 && (
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
                Normalisasi Otomatis
              </Button>
            )}
          </div>

          {/* Progress bar visual */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isWeightValid ? "text-emerald-600" : "text-foreground"}>
                {totalWeight.toFixed(2)}% dari 100%
              </span>
              <span className="text-muted-foreground">Target: 100.00%</span>
            </div>
            <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isWeightValid
                    ? "bg-emerald-600"
                    : totalWeight < 100
                    ? "bg-amber-500"
                    : "bg-rose-600"
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Add Criteria Button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Daftar Kriteria Penilaian ({criteriaList.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Tentukan kriteria benefit/cost, persentase bobot, dan skala rentang penilaian
          </p>
        </div>

        {!isLocked && (
          <Button
            size="sm"
            onClick={() => setAddCriteriaOpen(true)}
            className="gap-2 bg-primary"
          >
            <Plus className="size-4" />
            Tambah Kriteria
          </Button>
        )}
      </div>

      {/* Criteria & Scales List */}
      <div className="space-y-4">
        {criteriaList && criteriaList.length > 0 ? (
          criteriaList.map((criterion, idx) => {
            const isExpanded = expandedCriteria[criterion.id] ?? true
            const scaleWarnings = analyzeScales(criterion.criteria_scales)

            return (
              <Card
                key={criterion.id}
                className="overflow-hidden border shadow-2xs hover:border-primary/30 transition-colors"
              >
                {/* Criterion Header bar */}
                <CardHeader className="p-4 bg-muted/20 border-b flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold size-6 rounded-full bg-background border flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">
                          {criterion.nama}
                        </span>
                        <Badge
                          variant={criterion.tipe === "benefit" ? "default" : "destructive"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {criterion.tipe}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Sumber: {criterion.sumber_nilai === "document" ? "Dokumen" : "Input Langsung"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right px-2">
                      <span className="text-sm font-bold text-primary block">
                        {criterion.bobot}%
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Bobot Kriteria
                      </span>
                    </div>

                    {!isLocked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCriteria(criterion.id)}
                        className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Hapus Kriteria"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(criterion.id)}
                      className="size-8"
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
                  <CardContent className="p-4 space-y-3">
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
                    <div className="border rounded-lg overflow-hidden bg-background">
                      <div className="grid grid-cols-12 bg-muted/40 p-2 text-[11px] font-semibold text-muted-foreground uppercase border-b">
                        <div className="col-span-5">Label Kategori / Rentang</div>
                        <div className="col-span-2 text-center">Nilai Min</div>
                        <div className="col-span-2 text-center">Nilai Max</div>
                        <div className="col-span-2 text-center">Skor (1-5)</div>
                        <div className="col-span-1 text-right">Aksi</div>
                      </div>

                      {criterion.criteria_scales && criterion.criteria_scales.length > 0 ? (
                        <div className="divide-y text-xs">
                          {criterion.criteria_scales.map((scale) => (
                            <div
                              key={scale.id}
                              className="grid grid-cols-12 p-2.5 items-center hover:bg-muted/20 transition-colors"
                            >
                              <div className="col-span-5 font-medium truncate">
                                {scale.label}
                              </div>
                              <div className="col-span-2 text-center font-mono text-muted-foreground">
                                {scale.nilai_min}
                              </div>
                              <div className="col-span-2 text-center font-mono text-muted-foreground">
                                {scale.nilai_max}
                              </div>
                              <div className="col-span-2 text-center">
                                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {scale.skor}
                                </span>
                              </div>
                              <div className="col-span-1 text-right">
                                {!isLocked && (
                                  <button
                                    onClick={() => handleDeleteScale(scale.id)}
                                    className="text-muted-foreground hover:text-rose-600 p-1"
                                    title="Hapus Skala"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground italic">
                          Belum ada skala yang ditentukan. Kriteria tanpa skala akan mengharuskan mahasiswa memasukkan angka bebas.
                        </div>
                      )}
                    </div>

                    {!isLocked && (
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setAddScaleCriterionId(criterion.id)}
                          className="gap-1.5 text-xs"
                        >
                          <Plus className="size-3" />
                          Tambah Baris Skala
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
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
                  onClick={() => setAddCriteriaOpen(true)}
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

      {/* Dialog: Add Criteria */}
      <Dialog open={addCriteriaOpen} onOpenChange={setAddCriteriaOpen}>
        <DialogContent>
          <form onSubmit={handleAddCriteriaSubmit}>
            <DialogHeader>
              <DialogTitle>Tambah Kriteria Penilaian</DialogTitle>
              <DialogDescription>
                Masukkan nama kriteria, tipe (Benefit/Cost), dan persentase bobot
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {criteriaError && (
                <div className="p-3 rounded bg-rose-50 text-rose-700 text-xs">
                  {criteriaError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="crit-nama">Nama Kriteria</Label>
                <Input
                  id="crit-nama"
                  name="nama"
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
                    min="1"
                    max="100"
                    required
                    placeholder="Contoh: 30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crit-sumber">Sumber Pengisian</Label>
                <select
                  id="crit-sumber"
                  name="sumber_nilai"
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
                Batal
              </Button>
              <Button type="submit" disabled={addingCriteria}>
                {addingCriteria ? "Menyimpan..." : "Simpan Kriteria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Scale Row */}
      <Dialog
        open={!!addScaleCriterionId}
        onOpenChange={(open) => !open && setAddScaleCriterionId(null)}
      >
        <DialogContent>
          <form onSubmit={handleAddScaleSubmit}>
            <DialogHeader>
              <DialogTitle>Tambah Baris Skala Nilai</DialogTitle>
              <DialogDescription>
                Tentukan label rentang, nilai batas minimum & maksimum, dan skor standar (1-5)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {scaleError && (
                <div className="p-3 rounded bg-rose-50 text-rose-700 text-xs">
                  {scaleError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="scale-label">Label Rentang Nilai</Label>
                <Input
                  id="scale-label"
                  name="label"
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
                onClick={() => setAddScaleCriterionId(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={addingScale}>
                {addingScale ? "Menyimpan..." : "Simpan Skala"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
