import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ResultsDashboard, CalculationRunMeta } from "./results-dashboard"
import { CandidateDetailData, CriterionInfo } from "./candidate-radar-dialog"

interface ResultsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ runId?: string }>
}

export default async function AdminResultsPage({ params, searchParams }: ResultsPageProps) {
  const { id: periodId } = await params
  const { runId: requestedRunId } = await searchParams

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
    .select("id, nama, kuota, status, tgl_tutup")
    .eq("id", periodId)
    .single()

  if (periodErr || !period) {
    notFound()
  }

  // 3. Fetch calculation runs for this period
  const { data: rawRuns } = await supabase
    .from("calculation_runs")
    .select("id, tipe, created_at, dijalankan_oleh")
    .eq("period_id", periodId)
    .order("created_at", { ascending: false })

  const runs: CalculationRunMeta[] = (rawRuns || []).map((r) => ({
    id: r.id,
    tipe: r.tipe as "official" | "simulation",
    created_at: r.created_at,
    dijalankan_oleh: r.dijalankan_oleh,
  }))

  if (runs.length === 0) {
    return (
      <ResultsDashboard
        period={period}
        runs={[]}
        selectedRunId=""
        runData={null}
      />
    )
  }

  // Determine active run
  let targetRunId = requestedRunId
  if (!targetRunId || !runs.some((r) => r.id === targetRunId)) {
    // Prefer official run first
    const officialRun = runs.find((r) => r.tipe === "official")
    targetRunId = officialRun ? officialRun.id : runs[0].id
  }

  // 4. Fetch full calculation run details
  const { data: targetRun } = await supabase
    .from("calculation_runs")
    .select("*")
    .eq("id", targetRunId)
    .single()

  if (!targetRun) {
    return (
      <ResultsDashboard
        period={period}
        runs={runs}
        selectedRunId=""
        runData={null}
      />
    )
  }

  // Parse snapshots
  const snapshotKriteria = (targetRun.snapshot_kriteria as Array<{
    id: string
    nama: string
    tipe: "benefit" | "cost"
    bobot: number
  }>) || []

  const criteria: CriterionInfo[] = snapshotKriteria.map((c) => ({
    id: c.id,
    name: c.nama,
    type: c.tipe,
    weight: c.bobot,
  }))

  const snapshotThreshold = (targetRun.snapshot_threshold as {
    threshold_c?: number
    threshold_d?: number
    cutoff_net_score?: number
    total_passed?: number
  }) || {}

  const hasilMatriks = (targetRun.hasil_matriks as {
    decisionMatrix?: number[][]
    normalizedMatrix?: number[][]
    weightedMatrix?: number[][]
    concordanceMatrix?: number[][]
    discordanceMatrix?: number[][]
    aggregateDominanceMatrix?: number[][]
    cutoffNetScore?: number
    totalPassed?: number
  }) || {}

  // 5. Fetch applicants data and results
  // Fetch calculation_results if available
  const { data: rawResults } = await supabase
    .from("calculation_results")
    .select("application_id, dominasi, didominasi, net_score, ranking, lolos")
    .eq("run_id", targetRun.id)
    .order("ranking", { ascending: true })

  let rankings: CandidateDetailData[] = []
  const alternativeIndexMap: Record<string, number> = {}

  if (rawResults && rawResults.length > 0) {
    const appIds = rawResults.map((r) => r.application_id)

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

    rankings = rawResults.map((res, idx) => {
      alternativeIndexMap[res.application_id] = idx
      const userId = appUserMap.get(res.application_id) || ""
      const profile = profileMap.get(userId)
      const thisVals = (appValues || []).filter((v) => v.application_id === res.application_id)

      const scores: Record<string, number> = {}
      const rawScores: Record<string, number | null> = {}

      for (const v of thisVals) {
        scores[v.criteria_id] = Number(v.skor ?? 0)
        rawScores[v.criteria_id] = v.nilai_mentah !== null ? Number(v.nilai_mentah) : null
      }

      return {
        id: res.application_id,
        userId,
        name: profile?.nama || `Pelamar #${idx + 1}`,
        nim: profile?.nim || "-",
        prodi: profile?.prodi || "-",
        ranking: res.ranking,
        dominasi: res.dominasi,
        didominasi: res.didominasi,
        netScore: res.net_score,
        passed: res.lolos,
        scores,
        rawValues: rawScores,
        metadata: {
          submittedAt: appSubmittedMap.get(res.application_id) || undefined,
        },
      }
    })
  } else {
    // If simulation run without calculation_results rows, fallback to snapshot_input
    const snapshotInput = (targetRun.snapshot_input as Array<{
      id: string
      name: string
      scores: Record<string, number>
      metadata?: { ipk?: number; penghasilan?: number; submittedAt?: string }
    }>) || []

    // Calculate rankings on the fly or from matrices if needed
    rankings = snapshotInput.map((input, idx) => {
      alternativeIndexMap[input.id] = idx
      return {
        id: input.id,
        userId: "",
        name: input.name,
        nim: "-",
        prodi: "-",
        ranking: idx + 1,
        dominasi: 0,
        didominasi: 0,
        netScore: 0,
        passed: idx < period.kuota,
        scores: input.scores,
        rawValues: {},
        metadata: input.metadata,
      }
    })
  }

  // Calculate average criteria scores across all candidates
  const averageCriteriaScores: Record<string, number> = {}
  if (rankings.length > 0) {
    for (const c of criteria) {
      const total = rankings.reduce((acc, curr) => acc + (curr.scores[c.id] ?? 0), 0)
      averageCriteriaScores[c.id] = total / rankings.length
    }
  }

  // Cutoff net score
  const passedCandidates = rankings.filter((r) => r.passed)
  const cutoffNetScore =
    hasilMatriks.cutoffNetScore ??
    snapshotThreshold.cutoff_net_score ??
    (passedCandidates.length > 0
      ? passedCandidates[passedCandidates.length - 1].netScore
      : rankings[0]?.netScore ?? 0)

  const runData = {
    runId: targetRun.id,
    tipe: targetRun.tipe as "official" | "simulation",
    createdAt: targetRun.created_at,
    thresholdC: snapshotThreshold.threshold_c ?? 0.5,
    thresholdD: snapshotThreshold.threshold_d ?? 0.5,
    cutoffNetScore,
    totalPassed: passedCandidates.length,
    totalApplicants: rankings.length,
    criteria,
    rankings,
    averageCriteriaScores,
    concordanceMatrix: hasilMatriks.concordanceMatrix,
    discordanceMatrix: hasilMatriks.discordanceMatrix,
    aggregateDominanceMatrix: hasilMatriks.aggregateDominanceMatrix,
    alternativeIndexMap,
  }

  return (
    <ResultsDashboard
      period={period}
      runs={runs}
      selectedRunId={targetRunId}
      runData={runData}
    />
  )
}
