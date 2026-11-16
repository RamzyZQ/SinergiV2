import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ApplicationWizard, CriteriaWithScales } from "./application-wizard"

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
    console.error("Failed to load student application form:", formError)
    throw new Error("Gagal memuat data formulir pendaftaran.")
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
