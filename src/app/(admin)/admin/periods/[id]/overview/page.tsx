import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewManager } from "./overview-manager"

interface OverviewPageProps {
  params: Promise<{ id: string }>
}

export default function PeriodOverviewPage({ params }: OverviewPageProps) {
  return (
    <React.Suspense fallback={<OverviewPageFallback />}>
      <PeriodOverviewContent params={params} />
    </React.Suspense>
  )
}

async function PeriodOverviewContent({ params }: OverviewPageProps) {
  const { id } = await params
  await connection()
  const supabase = await createClient()

  // 1. Fetch period
  const { data: period, error } = await supabase
    .from("scholarship_periods")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !period) notFound()

  // 2. Fetch criteria count & total weight
  const { data: criteriaList } = await supabase
    .from("criteria")
    .select("id, bobot")
    .eq("period_id", id)

  const criteriaCount = criteriaList?.length || 0
  const totalWeight = (criteriaList || []).reduce(
    (acc, c) => acc + Number(c.bobot),
    0
  )

  // 3. Check scales completeness
  const criteriaIds = (criteriaList || []).map((c) => c.id)
  const { data: scales } = await supabase
    .from("criteria_scales")
    .select("criteria_id")
    .in(
      "criteria_id",
      criteriaIds.length > 0
        ? criteriaIds
        : ["00000000-0000-0000-0000-000000000000"]
    )

  const criteriaWithScales = new Set((scales || []).map((s) => s.criteria_id))
  const missingScalesCount = (criteriaList || []).filter(
    (c) => !criteriaWithScales.has(c.id)
  ).length

  // 4. Applications count by status
  const { count: submittedApplicants } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("period_id", id)
    .eq("status", "submitted")

  const { count: verifiedApplicants } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("period_id", id)
    .eq("status", "verified")

  const { count: rejectedApplicants } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("period_id", id)
    .eq("status", "rejected")

  const { count: draftApplicants } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("period_id", id)
    .eq("status", "draft")

  // 5. Official calculation run check
  const { count: officialRunCount } = await supabase
    .from("calculation_runs")
    .select("*", { count: "exact", head: true })
    .eq("period_id", id)
    .eq("tipe", "official")

  const tieBreakRules: string[] = Array.isArray(period.tie_break_rules)
    ? (period.tie_break_rules as string[])
    : ["ipk", "penghasilan", "waktu_submit"]

  const stats = {
    criteriaCount,
    totalWeight,
    missingScalesCount,
    submittedApplicants: submittedApplicants ?? 0,
    verifiedApplicants: verifiedApplicants ?? 0,
    rejectedApplicants: rejectedApplicants ?? 0,
    draftApplicants: draftApplicants ?? 0,
    hasOfficialRun: (officialRunCount ?? 0) > 0,
  }

  return (
    <OverviewManager
      period={{
        ...period,
        threshold_c: period.threshold_c !== null ? Number(period.threshold_c) : null,
        threshold_d: period.threshold_d !== null ? Number(period.threshold_d) : null,
        tie_break_rules: tieBreakRules,
      }}
      stats={stats}
    />
  )
}

function OverviewPageFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
    </div>
  )
}
