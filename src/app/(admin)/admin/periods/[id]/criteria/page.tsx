import * as React from "react"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CriteriaManager, CriteriaWithScalesItem } from "./criteria-manager"

interface CriteriaPageProps {
  params: Promise<{ id: string }>
}

export default function PeriodCriteriaPage({ params }: CriteriaPageProps) {
  return (
    <React.Suspense fallback={<CriteriaPageFallback />}>
      <PeriodCriteriaContent params={params} />
    </React.Suspense>
  )
}

async function PeriodCriteriaContent({ params }: CriteriaPageProps) {
  const { id } = await params
  await connection()
  const supabase = await createClient()

  // 1. Fetch period
  const { data: period, error: pErr } = await supabase
    .from("scholarship_periods")
    .select("id, status")
    .eq("id", id)
    .single()

  if (pErr || !period) notFound()

  // 2. Fetch criteria
  const { data: rawCriteria } = await supabase
    .from("criteria")
    .select("id, period_id, nama, tipe, bobot, urutan, sumber_nilai")
    .eq("period_id", id)
    .order("urutan", { ascending: true })

  const criteriaIds = (rawCriteria || []).map((c) => c.id)

  // 3. Fetch criteria scales
  const { data: rawScales } = await supabase
    .from("criteria_scales")
    .select("id, criteria_id, label, nilai_min, nilai_max, skor")
    .in(
      "criteria_id",
      criteriaIds.length > 0
        ? criteriaIds
        : ["00000000-0000-0000-0000-000000000000"]
    )

  const criteriaList: CriteriaWithScalesItem[] = (rawCriteria || []).map((c) => ({
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

  return (
    <CriteriaManager
      periodId={period.id}
      periodStatus={period.status}
      criteriaList={criteriaList}
    />
  )
}

function CriteriaPageFallback() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardContent className="flex items-center justify-between p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
