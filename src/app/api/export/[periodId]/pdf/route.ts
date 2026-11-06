import * as React from "react"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { ScholarshipPdfDocument } from "@/lib/export/pdf-document"

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
      .select("id, snapshot_threshold")
      .eq("period_id", periodId)
      .eq("tipe", "official")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!officialRun) {
      return new NextResponse("Belum ada kalkulasi resmi untuk periode ini", { status: 400 })
    }

    const snapshotThreshold = (officialRun.snapshot_threshold as {
      threshold_c?: number
      threshold_d?: number
      cutoff_net_score?: number
    }) || {}

    // 4. Fetch results
    const { data: rawResults } = await supabase
      .from("calculation_results")
      .select("application_id, net_score, ranking, lolos")
      .eq("run_id", officialRun.id)
      .eq("lolos", true) // Only passed candidates for the official decree
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

    const awardees = (rawResults || []).map((res) => {
      const uId = appUserMap.get(res.application_id) || ""
      const prof = profileMap.get(uId)
      return {
        ranking: res.ranking,
        name: prof?.nama || `Mahasiswa #${res.ranking}`,
        nim: prof?.nim || "-",
        prodi: prof?.prodi || "-",
        netScore: res.net_score,
      }
    })

    const cutoffNetScore =
      snapshotThreshold.cutoff_net_score ??
      (awardees.length > 0 ? awardees[awardees.length - 1].netScore : 0)

    const generatedAt = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    // Render PDF buffer
    const pdfElement = React.createElement(ScholarshipPdfDocument, {
      periodName: period.nama,
      quota: period.kuota,
      thresholdC: snapshotThreshold.threshold_c ?? 0.5,
      thresholdD: snapshotThreshold.threshold_d ?? 0.5,
      cutoffNetScore,
      awardees,
      generatedAt,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any)
    const filename = `SK-Beasiswa-${period.nama.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    console.error("Error generating PDF:", err)
    const message = err instanceof Error ? err.message : "Internal Server Error"
    return new NextResponse("Gagal menghasilkan file PDF: " + message, { status: 500 })
  }
}
