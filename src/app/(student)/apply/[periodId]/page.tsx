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
    .select("id, status, submitted_at, catatan_admin")
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
      .select("id, status, submitted_at, catatan_admin")
      .single()

    if (createErr || !newApp) {
      console.error("Failed to create application:", createErr)
      redirect("/dashboard")
    }

    application = newApp
  }

  // 3. Fetch criteria and criteria_scales
  const { data: rawCriteria } = await supabase
    .from("criteria")
    .select("id, period_id, nama, tipe, bobot, urutan, sumber_nilai")
    .eq("period_id", periodId)
    .order("urutan", { ascending: true })

  const criteriaIds = (rawCriteria || []).map((c) => c.id)

  const { data: rawScales } = await supabase
    .from("criteria_scales")
    .select("id, criteria_id, label, nilai_min, nilai_max, skor")
    .in(
      "criteria_id",
      criteriaIds.length > 0
        ? criteriaIds
        : ["00000000-0000-0000-0000-000000000000"]
    )

  const criteriaList: CriteriaWithScales[] = (rawCriteria || []).map((c) => ({
    id: c.id,
    period_id: c.period_id,
    nama: c.nama,
    tipe: c.tipe as "benefit" | "cost",
    bobot: Number(c.bobot),
    urutan: c.urutan,
    sumber_nilai: c.sumber_nilai as "input" | "document",
    criteria_scales: (rawScales || [])
      .filter((s) => s.criteria_id === c.id)
      .map((s) => ({
        id: s.id,
        criteria_id: s.criteria_id,
        label: s.label,
        nilai_min: Number(s.nilai_min),
        nilai_max: Number(s.nilai_max),
        skor: Number(s.skor),
      }))
      .sort((a, b) => a.nilai_min - b.nilai_min),
  }))

  // 4. Fetch existing application_values
  const { data: rawValues } = await supabase
    .from("application_values")
    .select("criteria_id, nilai_mentah, skor")
    .eq("application_id", application.id)

  const initialValues: Record<
    string,
    { nilai_mentah: number | null; skor: number | null }
  > = {}

  if (rawValues) {
    for (const v of rawValues) {
      initialValues[v.criteria_id] = {
        nilai_mentah: v.nilai_mentah !== null ? Number(v.nilai_mentah) : null,
        skor: v.skor !== null ? Number(v.skor) : null,
      }
    }
  }

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
