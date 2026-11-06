import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SensitivityDashboard } from "./sensitivity-dashboard"

interface AnalysisPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminAnalysisPage({ params }: AnalysisPageProps) {
  const { id: periodId } = await params
  const supabase = await createClient()

  // 1. Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!roleData || roleData.role !== "admin") {
    redirect("/dashboard")
  }

  // 2. Fetch period
  const { data: period, error: periodErr } = await supabase
    .from("scholarship_periods")
    .select(
      "id, nama, kuota, status, threshold_c_mode, threshold_c, threshold_d_mode, threshold_d, tie_break_rules"
    )
    .eq("id", periodId)
    .single()

  if (periodErr || !period) {
    notFound()
  }

  // 3. Fetch latest official calculation run
  const { data: officialRun } = await supabase
    .from("calculation_runs")
    .select("id, snapshot_kriteria, created_at")
    .eq("period_id", periodId)
    .eq("tipe", "official")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!officialRun) {
    return (
      <SensitivityDashboard
        period={{
          id: period.id,
          nama: period.nama,
          kuota: period.kuota,
          status: period.status,
          threshold_c_mode: period.threshold_c_mode,
          threshold_c: period.threshold_c !== null ? Number(period.threshold_c) : null,
          threshold_d_mode: period.threshold_d_mode,
          threshold_d: period.threshold_d !== null ? Number(period.threshold_d) : null,
          tie_break_rules: Array.isArray(period.tie_break_rules)
            ? (period.tie_break_rules as string[])
            : undefined,
        }}
        officialRun={null}
        criteria={[]}
        alternatives={[]}
      />
    )
  }

  // Parse snapshot kriteria
  const snapshotKriteria = (officialRun.snapshot_kriteria as Array<{
    id: string
    nama: string
    tipe: "benefit" | "cost"
    bobot: number
  }>) || []

  const criteria = snapshotKriteria.map((c) => ({
    id: c.id,
    name: c.nama,
    type: c.tipe,
    weight: c.bobot,
  }))

  // 4. Fetch official calculation results
  const { data: rawResults } = await supabase
    .from("calculation_results")
    .select("application_id, dominasi, didominasi, net_score, ranking, lolos")
    .eq("run_id", officialRun.id)
    .order("ranking", { ascending: true })

  const appIds = (rawResults || []).map((r) => r.application_id)

  // Fetch applications and profiles
  const { data: apps } = await supabase
    .from("applications")
    .select("id, user_id, submitted_at")
    .in("id", appIds)

  const userIds = (apps || []).map((a) => a.user_id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nama, nim, prodi")
    .in("id", userIds)

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
  const appUserMap = new Map((apps || []).map((a) => [a.id, a.user_id]))
  const appSubmittedMap = new Map((apps || []).map((a) => [a.id, a.submitted_at]))

  // Fetch application values for criteria scores
  const { data: appValues } = await supabase
    .from("application_values")
    .select("application_id, criteria_id, nilai_mentah, skor")
    .in("application_id", appIds)

  const alternatives = (rawResults || []).map((res) => {
    const userId = appUserMap.get(res.application_id) || ""
    const profile = profileMap.get(userId)
    const thisVals = (appValues || []).filter((v) => v.application_id === res.application_id)

    const scores: Record<string, number> = {}
    let ipkVal: number | undefined
    let penghasilanVal: number | undefined

    for (const v of thisVals) {
      scores[v.criteria_id] = Number(v.skor ?? 0)
      const crit = criteria.find((c) => c.id === v.criteria_id)
      const critNameLower = (crit?.name || "").toLowerCase()

      if (critNameLower.includes("ipk") || critNameLower.includes("indeks prestasi")) {
        ipkVal = v.nilai_mentah !== null ? Number(v.nilai_mentah) : undefined
      }
      if (critNameLower.includes("penghasilan") || critNameLower.includes("gaji")) {
        penghasilanVal = v.nilai_mentah !== null ? Number(v.nilai_mentah) : undefined
      }
    }

    return {
      id: res.application_id,
      name: profile?.nama || `Pelamar ${res.application_id.slice(0, 6)}`,
      nim: profile?.nim || "-",
      prodi: profile?.prodi || "-",
      scores,
      officialRank: res.ranking,
      officialPassed: res.lolos,
      officialNetScore: res.net_score,
      metadata: {
        ipk: ipkVal,
        penghasilan: penghasilanVal,
        submittedAt: appSubmittedMap.get(res.application_id) || undefined,
      },
    }
  })

  return (
    <SensitivityDashboard
      period={{
        id: period.id,
        nama: period.nama,
        kuota: period.kuota,
        status: period.status,
        threshold_c_mode: period.threshold_c_mode,
        threshold_c: period.threshold_c !== null ? Number(period.threshold_c) : null,
        threshold_d_mode: period.threshold_d_mode,
        threshold_d: period.threshold_d !== null ? Number(period.threshold_d) : null,
        tie_break_rules: Array.isArray(period.tie_break_rules)
          ? (period.tie_break_rules as string[])
          : undefined,
      }}
      officialRun={{
        id: officialRun.id,
        createdAt: officialRun.created_at,
      }}
      criteria={criteria}
      alternatives={alternatives}
    />
  )
}
