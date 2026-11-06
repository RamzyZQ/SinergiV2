"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createPeriodAction } from "@/app/(admin)/admin/periods/actions"

export function CreatePeriodDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dates, setDates] = React.useState({ open: "", close: "" })

  React.useEffect(() => {
    React.startTransition(() => {
      const now = new Date()
      const defaultOpen = now.toISOString().slice(0, 16)
      const closeDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      setDates({
        open: defaultOpen,
        close: closeDate.toISOString().slice(0, 16),
      })
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await createPeriodAction(formData)
    setLoading(false)

    if (res.success && res.data) {
      setOpen(false)
      router.push(`/admin/periods/${res.data.id}/overview`)
      router.refresh()
    } else {
      setError(res.error || "Gagal membuat periode beasiswa.")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 bg-primary">
        <Plus className="size-4" />
        Buat Periode Baru
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Buat Periode Beasiswa Baru</DialogTitle>
            <DialogDescription>
              Isi data dasar periode seleksi beasiswa. Kriteria dan skala dapat disusun setelah periode dibuat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="period-nama">Nama Periode</Label>
              <Input
                id="period-nama"
                name="nama"
                required
                placeholder="Contoh: Beasiswa Prestasi Semester Ganjil 2024/2025"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="period-deskripsi">Deskripsi</Label>
              <Textarea
                id="period-deskripsi"
                name="deskripsi"
                rows={2}
                placeholder="Penjelasan sasaran, kualifikasi, atau benefit beasiswa..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="period-buka">Tanggal Buka</Label>
                <Input
                  id="period-buka"
                  name="tgl_buka"
                  type="datetime-local"
                  required
                  value={dates.open}
                  onChange={(e) =>
                    setDates((current) => ({ ...current, open: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="period-tutup">Tanggal Tutup</Label>
                <Input
                  id="period-tutup"
                  name="tgl_tutup"
                  type="datetime-local"
                  required
                  value={dates.close}
                  onChange={(e) =>
                    setDates((current) => ({ ...current, close: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="period-kuota">Kuota Penerima (Top N)</Label>
              <Input
                id="period-kuota"
                name="kuota"
                type="number"
                min="1"
                required
                defaultValue="10"
                placeholder="Jumlah penerima yang akan diloloskan"
              />
              <span className="text-[11px] text-muted-foreground">
                Jumlah mahasiswa tertinggi berdasarkan Net Dominance ELECTRE yang akan lolos.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Buat Draf Periode
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}
