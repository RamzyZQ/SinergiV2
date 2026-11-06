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

  // Fetch criteria
  const { data: criteriaList } = await supabase
    .from("criteria")
    .select("id, nama, tipe, bobot, urutan")
    .eq("period_id", periodId)
    .order("urutan", { ascending: true })

  // Fetch application values
  const { data: appValues } = await supabase
    .from("application_values")
    .select("criteria_id, nilai_mentah, skor")
    .eq("application_id", application.id)

  const valueMap = new Map((appValues || []).map((v) => [v.criteria_id, v]))

  const criteriaResults = (criteriaList || []).map((c) => {
    const v = valueMap.get(c.id)
    return {
      id: c.id,
      name: c.nama,
      type: c.tipe as "benefit" | "cost",
      weight: Number(c.bobot),
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
