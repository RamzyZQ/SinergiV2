"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { importTestApplicantsAction } from "@/app/(admin)/admin/periods/actions"

interface BulkApplicantImportProps {
  periodId: string
  criteria: Array<{ id: string; nama: string }>
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export function BulkApplicantImport({
  periodId,
  criteria,
}: BulkApplicantImportProps) {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [isError, setIsError] = React.useState(false)

  const downloadTemplate = () => {
    const headers = ["Alternatif", "Nama Mahasiswa", ...criteria.map((item) => item.nama)]
    const csv = `\uFEFF${headers.map(csvCell).join(",")}\r\n`
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "template-data-uji-mahasiswa.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async () => {
    if (!file) {
      setIsError(true)
      setMessage("Pilih berkas CSV atau Excel terlebih dahulu.")
      return
    }

    setBusy(true)
    setMessage("")
    const formData = new FormData()
    formData.set("file", file)

    const result = await importTestApplicantsAction(periodId, formData)
    setBusy(false)
    setIsError(!result.success)
    setMessage(result.message || result.error || "Impor gagal.")

    if (result.success) {
      setFile(null)
      const input = document.getElementById("applicant-import-file")
      if (input instanceof HTMLInputElement) input.value = ""
      router.refresh()
    }
  }

  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileSpreadsheet className="size-4 text-primary" />
            Impor Data Uji Mahasiswa
          </h2>
          <p className="text-xs text-muted-foreground">
            Unggah CSV atau Excel (.xlsx). Data akan dibuat sebagai mahasiswa
            sintetis terverifikasi khusus untuk pengujian perhitungan.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="size-4" />
          Unduh template CSV
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="applicant-import-file"
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null)
            setMessage("")
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium"
        />
        <Button
          type="button"
          size="sm"
          onClick={importFile}
          disabled={busy || !file}
          className="shrink-0"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {busy ? "Mengimpor..." : "Impor data"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Kolom wajib: Alternatif, Nama Mahasiswa, dan satu kolom untuk setiap
        kriteria. Maksimal 500 baris; nilai akan dicocokkan dengan skala yang
        sudah Anda atur. Akun mahasiswa asli dan bobot kriteria tidak diubah.
      </p>
      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`text-xs ${isError ? "text-destructive" : "text-emerald-700"}`}
        >
          {message}
        </p>
      )}
    </section>
  )
}
