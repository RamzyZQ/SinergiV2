import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublishView } from "./publish-view"

interface PublishPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminPublishPage({ params }: PublishPageProps) {
  const { id: periodId } = await params
  const supabase = await createClient()

  // Preconditions check: fetch period, criteria, application counts, and latest run concurrently
  const [
    { data: period, error: periodErr },
    { data: criteria },
    { count: unverifiedCount },
    { count: verifiedCount },
    { data: latestRun },
  ] = await Promise.all([
    supabase
      .from("scholarship_periods")
      .select("id, nama, kuota, status")
      .eq("id", periodId)
      .single(),
    supabase
      .from("criteria")
      .select("id, bobot")
      .eq("period_id", periodId),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("period_id", periodId)
      .eq("status", "submitted"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("period_id", periodId)
      .in("status", ["verified", "passed", "not_passed"]),
    supabase
      .from("calculation_runs")
      .select("id, created_at, snapshot_kriteria, snapshot_threshold")
      .eq("period_id", periodId)
      .eq("tipe", "official")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (periodErr || !period) {
    notFound()
  }

  const totalWeight = (criteria || []).reduce((acc, c) => acc + Number(c.bobot), 0)
  const criteriaValid = Math.abs(totalWeight - 100) < 0.01 && (criteria || []).length > 0
  const allVerified = (unverifiedCount ?? 0) === 0 && (verifiedCount ?? 0) > 0

  const officialRunExists = !!latestRun

  // Calculation results check
  let totalApplicants = 0
  let totalPassed = 0
  let cutoffScore = 0

  if (latestRun) {
    const { data: results } = await supabase
      .from("calculation_results")
      .select("net_score, lolos")
      .eq("run_id", latestRun.id)
      .order("ranking", { ascending: true })

    if (results) {
      totalApplicants = results.length
      const passed = results.filter((r) => r.lolos)
      totalPassed = passed.length
      cutoffScore = passed.length > 0 ? passed[passed.length - 1].net_score : 0
    }
  }

  const hasAwardees = totalPassed > 0

  // 4. Fetch notification logs
  const { data: rawLogs } = await supabase
    .from("notifications")
    .select("id, user_id, judul, status_kirim, created_at")
    .eq("jenis", "result_published")
    .order("created_at", { ascending: false })
    .limit(20)

  const logUserIds = (rawLogs || []).map((l) => l.user_id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nama, nim")
    .in("id", logUserIds)

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  const notificationLogs = (rawLogs || []).map((log) => {
    const prof = profileMap.get(log.user_id)
    return {
      id: log.id,
      recipientName: prof?.nama || "Mahasiswa",
      recipientNim: prof?.nim || "-",
      judul: log.judul,
      statusKirim: log.status_kirim,
      createdAt: log.created_at,
    }
  })

  return (
    <PublishView
      period={{
        id: period.id,
        nama: period.nama,
        kuota: period.kuota,
        status: period.status,
      }}
      checklist={{
        criteriaValid,
        allVerified,
        officialRunExists,
        hasAwardees,
      }}
      summary={{
        totalApplicants,
        totalPassed,
        cutoffScore,
      }}
      notificationLogs={notificationLogs}
    />
  )
}
