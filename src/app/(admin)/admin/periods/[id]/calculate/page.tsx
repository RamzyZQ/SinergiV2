import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalculationStepper } from "./calculation-stepper"
import { MatrixStep, AlternativeRankingResult } from "@/lib/electre"

interface CalculatePageProps {
  params: Promise<{ id: string }>
}

export default function PeriodCalculatePage({ params }: CalculatePageProps) {
  return (
    <React.Suspense fallback={<CalculatePageFallback />}>
      <PeriodCalculateContent params={params} />
    </React.Suspense>
  )
}

async function PeriodCalculateContent({ params }: CalculatePageProps) {
  const { id } = await params
  await connection()
  const supabase = await createClient()

  // Fetch period, verified count, criteria, and runs concurrently
  const [
    { data: period, error: pErr },
    { count: verifiedCount },
    { data: criteriaList },
    { data: runs },
  ] = await Promise.all([
    supabase
      .from("scholarship_periods")
      .select("id, nama, status, kuota")
      .eq("id", id)
      .single(),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("period_id", id)
      .eq("status", "verified"),
    supabase
      .from("criteria")
      .select("id, bobot")
      .eq("period_id", id),
    supabase
      .from("calculation_runs")
      .select("*")
      .eq("period_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  if (pErr || !period) notFound()

  const criteriaCount = criteriaList?.length || 0
  const totalWeight = (criteriaList || []).reduce(
    (acc, c) => acc + Number(c.bobot),
    0
  )

  const officialRun = runs?.find((r) => r.tipe === "official")
  const latestRun = officialRun || runs?.[0] || null

  let existingRunData = null

  if (latestRun) {
    // Fetch calculation_results for this run
    const { data: results } = await supabase
      .from("calculation_results")
      .select("id, application_id, dominasi, didominasi, net_score, ranking, lolos")
      .eq("run_id", latestRun.id)
      .order("ranking", { ascending: true })

    // Fetch applicant names
    const appIds = (results || []).map((r) => r.application_id)
    const { data: apps } = await supabase
      .from("applications")
      .select("id, user_id, submitted_at")
      .in("id", appIds.length > 0 ? appIds : ["00000000-0000-0000-0000-000000000000"])

    const userIds = (apps || []).map((a) => a.user_id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama, nim")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
    const appMap = new Map((apps || []).map((a) => [a.id, a]))

    const rankings: AlternativeRankingResult[] = (results || []).map((r) => {
      const app = appMap.get(r.application_id)
      const prof = app ? profileMap.get(app.user_id) : null

      return {
        id: r.application_id,
        name: prof?.nama ? `${prof.nama} (${prof.nim || "No NIM"})` : `Pelamar ${r.application_id.slice(0, 6)}`,
        dominasi: r.dominasi,
        didominasi: r.didominasi,
        netScore: r.net_score,
        ranking: r.ranking,
        passed: r.lolos,
        tieBreakDetails: {
          submittedAt: app?.submitted_at || undefined,
        },
      }
    })

    const rawMatrices = latestRun.hasil_matriks as unknown as {
      decisionMatrix: MatrixStep
      normalizedMatrix: MatrixStep
      weightedMatrix: MatrixStep
      concordanceMatrix: MatrixStep
      discordanceMatrix: MatrixStep
      concordanceDominanceMatrix: MatrixStep<number>
      discordanceDominanceMatrix: MatrixStep<number>
      aggregateDominanceMatrix: MatrixStep<number>
    }

    const rawThreshold = latestRun.snapshot_threshold as unknown as {
      c_mode: string
      threshold_c: number
      d_mode: string
      threshold_d: number
    }

    existingRunData = {
      id: latestRun.id,
      tipe: latestRun.tipe as "official" | "simulation",
      created_at: latestRun.created_at,
      hasil_matriks: rawMatrices,
      snapshot_threshold: rawThreshold,
      rankings,
    }
  }

  return (
    <CalculationStepper
      periodId={period.id}
      periodStatus={period.status}
      quota={period.kuota}
      verifiedApplicantsCount={verifiedCount ?? 0}
      criteriaCount={criteriaCount}
      totalWeight={totalWeight}
      existingRun={existingRunData}
    />
  )
}

function CalculatePageFallback() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-28 shrink-0 rounded-md" />
        ))}
      </div>
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
