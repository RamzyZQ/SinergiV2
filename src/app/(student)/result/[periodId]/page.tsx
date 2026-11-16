import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentResultView } from "./student-result-view"

interface StudentResultPageProps {
  params: Promise<{ periodId: string }>
}

export const metadata = {
  title: "Hasil Seleksi Beasiswa — SINERGI",
  description: "Pengumuman hasil seleksi beasiswa mahasiswa berbasis metode ELECTRE I.",
}

export default async function StudentResultPage({ params }: StudentResultPageProps) {
  const { periodId } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/result/${periodId}`)
  }

  // 2. Fetch period
  const { data: period, error: periodErr } = await supabase
    .from("scholarship_periods")
    .select("id, nama, status, kuota, tie_break_rules")
    .eq("id", periodId)
    .single()

  if (periodErr || !period) {
    notFound()
  }

  // 3. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama, nim, prodi")
    .eq("id", user.id)
    .single()

  const studentInfo = {
    nama: profile?.nama || "Mahasiswa",
    nim: profile?.nim || "-",
    prodi: profile?.prodi || "-",
  }

  // 4. Fetch user's application for this period
  const { data: application } = await supabase
    .from("applications")
    .select("id, status, submitted_at, catatan_admin")
    .eq("period_id", periodId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!application) {
    return (
      <StudentResultView
        period={{
          id: period.id,
          nama: period.nama,
          status: period.status,
          kuota: period.kuota,
          tie_break_rules: Array.isArray(period.tie_break_rules)
            ? (period.tie_break_rules as string[])
            : undefined,
        }}
        student={studentInfo}
        application={{
          status: "draft",
          submitted_at: null,
          catatan_admin: null,
        }}
        result={null}
      />
    )
  }

  // If period is not published, return view with waiting state
  if (period.status !== "published") {
    return (
      <StudentResultView
        period={{
          id: period.id,
          nama: period.nama,
          status: period.status,
          kuota: period.kuota,
          tie_break_rules: Array.isArray(period.tie_break_rules)
            ? (period.tie_break_rules as string[])
            : undefined,
        }}
        student={studentInfo}
        application={{
          status: application.status,
          submitted_at: application.submitted_at,
          catatan_admin: application.catatan_admin,
        }}
        result={null}
      />
    )
  }

  // 5. If published, fetch calculation result & criteria
  const { data: calcResult } = await supabase
    .from("calculation_results")
    .select("dominasi, didominasi, net_score, lolos")
    .eq("application_id", application.id)
    .maybeSingle()

  // Fetch official calculation run to get the cutoff score
  const { data: officialRun } = await supabase
    .from("calculation_runs")
    .select("hasil_matriks, snapshot_threshold")
    .eq("period_id", periodId)
    .eq("tipe", "official")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasilMatriks = (officialRun?.hasil_matriks as {
    cutoffNetScore?: number
  }) || {}

  const snapshotThreshold = (officialRun?.snapshot_threshold as {
    cutoff_net_score?: number
  }) || {}

  const cutoffScore =
    hasilMatriks.cutoffNetScore ?? snapshotThreshold.cutoff_net_score ?? 0

  // Fetch only student-visible criterion names
  const { data: formRows, error: formError } = await supabase.rpc(
    "get_student_application_form",
    { p_application_id: application.id }
  )

  if (formError) {
    console.error("Failed to load student result criteria:", formError)
    throw new Error("Gagal memuat rincian hasil seleksi.")
  }

  const criteriaById = new Map<string, { id: string; nama: string; urutan: number }>()
  for (const row of formRows || []) {
    if (!criteriaById.has(row.criteria_id)) {
      criteriaById.set(row.criteria_id, {
        id: row.criteria_id,
        nama: row.nama,
        urutan: row.urutan,
      })
    }
  }
  const criteriaList = Array.from(criteriaById.values())
    .sort((a, b) => a.urutan - b.urutan)

  // Fetch application values
  const { data: appValues, error: appValuesError } = await supabase
    .from("application_values")
    .select("criteria_id, nilai_mentah, skor")
    .eq("application_id", application.id)

  if (appValuesError) {
    console.error("Failed to load student result values:", appValuesError)
    throw new Error("Gagal memuat nilai hasil seleksi.")
  }

  const valueMap = new Map((appValues || []).map((v) => [v.criteria_id, v]))

  const criteriaResults = (criteriaList || []).map((c) => {
    const v = valueMap.get(c.id)
    return {
      id: c.id,
      name: c.nama,
      rawScore: v?.nilai_mentah !== null && v?.nilai_mentah !== undefined ? Number(v.nilai_mentah) : null,
      scaleScore: Number(v?.skor ?? 0),
    }
  })

  const resultData = calcResult
    ? {
        lolos: calcResult.lolos,
        netScore: calcResult.net_score,
        cutoffScore,
        criteria: criteriaResults,
      }
    : null

  return (
    <StudentResultView
      period={{
        id: period.id,
        nama: period.nama,
        status: period.status,
        kuota: period.kuota,
        tie_break_rules: Array.isArray(period.tie_break_rules)
          ? (period.tie_break_rules as string[])
          : undefined,
      }}
      student={studentInfo}
      application={{
        status: application.status,
        submitted_at: application.submitted_at,
        catatan_admin: application.catatan_admin,
      }}
      result={resultData}
    />
  )
}
