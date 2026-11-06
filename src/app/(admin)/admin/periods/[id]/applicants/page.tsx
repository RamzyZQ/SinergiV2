import * as React from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApplicantsWorkspace, ApplicantItem } from "./applicants-workspace"

interface ApplicantsPageProps {
  params: Promise<{ id: string }>
}

export default function PeriodApplicantsPage({ params }: ApplicantsPageProps) {
  return (
    <React.Suspense fallback={<ApplicantsPageFallback />}>
      <PeriodApplicantsContent params={params} />
    </React.Suspense>
  )
}

async function PeriodApplicantsContent({ params }: ApplicantsPageProps) {
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

  // 2. Fetch applications for this period
  const { data: applications } = await supabase
    .from("applications")
    .select("id, user_id, period_id, status, submitted_at, catatan_admin, created_at")
    .eq("period_id", id)
    .order("created_at", { ascending: false })

  const userIds = (applications || []).map((a) => a.user_id)
  const applicationIds = (applications || []).map((a) => a.id)

  // 3. Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nama, nim, prodi, semester")
    .in(
      "id",
      userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]
    )

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  // 4. Fetch criteria for period (to get criteria names & types)
  const { data: criteriaList } = await supabase
    .from("criteria")
    .select("id, nama, tipe")
    .eq("period_id", id)

  const criteriaMap = new Map((criteriaList || []).map((c) => [c.id, c]))

  // 5. Fetch application_values
  const { data: appValues } = await supabase
    .from("application_values")
    .select("application_id, criteria_id, nilai_mentah, skor")
    .in(
      "application_id",
      applicationIds.length > 0
        ? applicationIds
        : ["00000000-0000-0000-0000-000000000000"]
    )

  const valuesByApp = new Map<string, typeof appValues>()
  for (const val of appValues || []) {
    const arr = valuesByApp.get(val.application_id) || []
    arr.push(val)
    valuesByApp.set(val.application_id, arr)
  }

  // 6. Fetch documents
  const { data: documents } = await supabase
    .from("documents")
    .select("id, application_id, jenis, storage_path, status_verifikasi, catatan, created_at")
    .in(
      "application_id",
      applicationIds.length > 0
        ? applicationIds
        : ["00000000-0000-0000-0000-000000000000"]
    )

  const docsByApp = new Map<string, typeof documents>()
  for (const doc of documents || []) {
    const arr = docsByApp.get(doc.application_id) || []
    arr.push(doc)
    docsByApp.set(doc.application_id, arr)
  }

  // Assemble ApplicantItem list
  const applicants: ApplicantItem[] = (applications || []).map((app) => {
    const prof = profileMap.get(app.user_id)
    const rawVals = valuesByApp.get(app.id) || []
    const rawDocs = docsByApp.get(app.id) || []

    const formattedValues = rawVals.map((v) => {
      const crit = criteriaMap.get(v.criteria_id)
      return {
        criteria_id: v.criteria_id,
        criteria_nama: crit?.nama || "Kriteria",
        criteria_tipe: crit?.tipe || "benefit",
        nilai_mentah: v.nilai_mentah !== null ? Number(v.nilai_mentah) : null,
        skor: v.skor !== null ? Number(v.skor) : null,
      }
    })

    const formattedDocs = rawDocs.map((d) => ({
      id: d.id,
      jenis: d.jenis,
      storage_path: d.storage_path,
      status_verifikasi: d.status_verifikasi as "pending" | "approved" | "rejected",
      catatan: d.catatan,
      created_at: d.created_at,
    }))

    return {
      id: app.id,
      user_id: app.user_id,
      period_id: app.period_id,
      status: app.status as ApplicantItem["status"],
      submitted_at: app.submitted_at,
      catatan_admin: app.catatan_admin,
      created_at: app.created_at,
      profile: {
        nama: prof?.nama || "Mahasiswa",
        nim: prof?.nim || null,
        prodi: prof?.prodi || null,
        semester: prof?.semester ?? null,
      },
      values: formattedValues,
      documents: formattedDocs,
    }
  })

  return (
    <ApplicantsWorkspace
      periodId={period.id}
      periodStatus={period.status}
      applicants={applicants}
    />
  )
}

function ApplicantsPageFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
