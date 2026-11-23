import * as React from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ApplicationWizard, CriteriaWithScales } from "./application-wizard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"

interface ApplyPageProps {
  params: Promise<{
    periodId: string
  }>
}

export const metadata = {
  title: "Pendaftaran Beasiswa — SINERGI",
  description: "Formulir pendaftaran beasiswa mahasiswa bertahap (5 langkah) dengan auto-save.",
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { periodId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Fetch scholarship period
  const { data: period, error: periodErr } = await supabase
    .from("scholarship_periods")
    .select("id, nama, status, tgl_tutup, kuota")
    .eq("id", periodId)
    .single()

  if (periodErr || !period) {
    notFound()
  }

  // If period is draft, students cannot access
  if (period.status === "draft") {
    redirect("/dashboard")
  }

  // 2. Fetch or create application row
  let { data: application } = await supabase
    .from("applications")
    .select("id, status, submitted_at")
    .eq("period_id", periodId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!application) {
    // Only auto-create draft application if period is open
    if (period.status !== "open") {
      redirect("/dashboard")
    }

    const { data: newApp, error: createErr } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        period_id: periodId,
        status: "draft",
      })
      .select("id, status, submitted_at")
      .single()

    if (createErr || !newApp) {
      console.error("Failed to create application:", createErr)
      redirect("/dashboard")
    }

    application = newApp
  }

  // 3. Fetch only student-visible criteria and existing input values
  const { data: formRows, error: formError } = await supabase.rpc(
    "get_student_application_form",
    { p_application_id: application.id }
  )

  if (formError) {
    console.warn("Failed to load student application form:", {
      code: formError.code,
      message: formError.message,
      details: formError.details,
      hint: formError.hint,
    })
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-[#D9534F]/25 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#D9534F]">
              <AlertCircle className="size-5" />
              <CardTitle>Formulir belum bisa dimuat</CardTitle>
            </div>
            <CardDescription>
              Data formulir belum berhasil diambil. Silakan kembali ke dashboard dan coba buka pengajuan ini lagi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-[#DCE5F1] px-3.5 py-2 text-sm font-semibold text-[#173B70] transition-colors hover:bg-[#EAF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456A6]/40"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const criteriaById = new Map<string, CriteriaWithScales>()
  const initialValues: Record<
    string,
    { nilai_mentah: number | null; selected_scale_id: string | null }
  > = {}

  for (const row of formRows || []) {
    let criterion = criteriaById.get(row.criteria_id)
    if (!criterion) {
      criterion = {
        id: row.criteria_id,
        nama: row.nama,
        urutan: row.urutan,
        criteria_scales: [],
      }
      criteriaById.set(row.criteria_id, criterion)
    }

    if (row.scale_id && row.scale_label) {
      criterion.criteria_scales.push({
        id: row.scale_id,
        label: row.scale_label,
      })
    }

    initialValues[row.criteria_id] = {
      nilai_mentah:
        row.nilai_mentah !== null ? Number(row.nilai_mentah) : null,
      selected_scale_id: row.selected_scale_id,
    }
  }

  const criteriaList = Array.from(criteriaById.values())

  // 5. Fetch uploaded documents
  const { data: rawDocuments } = await supabase
    .from("documents")
    .select("id, jenis, storage_path, status_verifikasi, catatan, created_at")
    .eq("application_id", application.id)

  const initialDocuments = (rawDocuments || []).map((d) => ({
    id: d.id,
    jenis: d.jenis,
    storage_path: d.storage_path,
    status_verifikasi: d.status_verifikasi as string,
    catatan: d.catatan,
    created_at: d.created_at,
  }))

  // 6. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, nim, prodi, semester")
    .eq("id", user.id)
    .single()

  const initialProfile = {
    nama: profile?.nama || user.user_metadata?.nama || "",
    nim: profile?.nim || null,
    prodi: profile?.prodi || null,
    semester: profile?.semester || null,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ApplicationWizard
        period={period}
        application={application}
        initialProfile={initialProfile}
        criteriaList={criteriaList}
        initialValues={initialValues}
        initialDocuments={initialDocuments}
      />
    </div>
  )
}
