import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateScholarshipExcel, ExportData } from "@/lib/export/excel"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    const { periodId } = await params
    const supabase = await createClient()

    // 1. Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!roleData || roleData.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // 2. Fetch period
    const { data: period, error: periodErr } = await supabase
      .from("scholarship_periods")
      .select("id, nama, kuota")
      .eq("id", periodId)
      .single()

    if (periodErr || !period) {
      return new NextResponse("Periode tidak ditemukan", { status: 404 })
    }

    // 3. Fetch latest official run
    const { data: officialRun } = await supabase
      .from("calculation_runs")
      .select("id, snapshot_kriteria, snapshot_threshold, hasil_matriks")
      .eq("period_id", periodId)
      .eq("tipe", "official")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!officialRun) {
      return new NextResponse("Belum ada kalkulasi resmi untuk periode ini", { status: 400 })
    }

    const snapshotKriteria = (officialRun.snapshot_kriteria as Array<{
      id: string
      nama: string
      tipe: "benefit" | "cost"
      bobot: number
    }>) || []

    const snapshotThreshold = (officialRun.snapshot_threshold as {
      threshold_c?: number
      threshold_d?: number
      cutoff_net_score?: number
    }) || {}

    // 4. Fetch results
    const { data: rawResults } = await supabase
      .from("calculation_results")
      .select("application_id, dominasi, didominasi, net_score, ranking, lolos")
      .eq("run_id", officialRun.id)
      .order("ranking", { ascending: true })

    const appIds = (rawResults || []).map((r) => r.application_id)

    const { data: apps } = await supabase
      .from("applications")
      .select("id, user_id")
      .in("id", appIds)

    const userIds = (apps || []).map((a) => a.user_id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama, nim, prodi")
      .in("id", userIds)

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))
    const appUserMap = new Map((apps || []).map((a) => [a.id, a.user_id]))

    const { data: appValues } = await supabase
      .from("application_values")
      .select("application_id, criteria_id, skor")
      .in("application_id", appIds)

    const rankings = (rawResults || []).map((res) => {
      const uId = appUserMap.get(res.application_id) || ""
      const prof = profileMap.get(uId)
      const thisVals = (appValues || []).filter((v) => v.application_id === res.application_id)

      const scores: Record<string, number> = {}
      for (const v of thisVals) {
        scores[v.criteria_id] = Number(v.skor ?? 0)
      }

      return {
        ranking: res.ranking,
        name: prof?.nama || `Pelamar ${res.application_id.slice(0, 6)}`,
        nim: prof?.nim || "-",
        prodi: prof?.prodi || "-",
        dominasi: res.dominasi,
        didominasi: res.didominasi,
        netScore: res.net_score,
        passed: res.lolos,
        scores,
      }
    })

    const passedList = rankings.filter((r) => r.passed)
    const cutoffNetScore =
      snapshotThreshold.cutoff_net_score ??
      (passedList.length > 0 ? passedList[passedList.length - 1].netScore : 0)

    const exportData: ExportData = {
      periodName: period.nama,
      quota: period.kuota,
      thresholdC: snapshotThreshold.threshold_c ?? 0.5,
      thresholdD: snapshotThreshold.threshold_d ?? 0.5,
      cutoffNetScore,
      totalPassed: passedList.length,
      totalApplicants: rankings.length,
      criteria: snapshotKriteria.map((c) => ({
        id: c.id,
        name: c.nama,
        type: c.tipe,
        weight: c.bobot,
      })),
      rankings,
    }

    const buffer = await generateScholarshipExcel(exportData)
    const filename = `hasil-beasiswa-${period.nama.toLowerCase().replace(/[^a-z0-9]/g, "-")}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    console.error("Error exporting Excel:", err)
    const message = err instanceof Error ? err.message : "Internal Server Error"
    return new NextResponse("Gagal menghasilkan file Excel: " + message, { status: 500 })
  }
}
