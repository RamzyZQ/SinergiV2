import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CalendarDays, ExternalLink, FileText, GraduationCap, UserRound } from "lucide-react"
import { AnnouncementCountdown } from "@/components/announcement-countdown"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

interface ApplicationDetailPageProps {
  params: Promise<{ applicationId: string }>
}

interface ApplicationFormRow {
  criteria_id: string
  nama: string
  urutan: number
  nilai_mentah: number | null
  scale_id: string | null
  scale_label: string | null
  selected_scale_id: string | null
}

export const metadata = {
  title: "Rincian Pengajuan — SINERGI Beasiswa",
  description: "Rincian pengajuan, status seleksi, dan countdown pengumuman beasiswa.",
}

export default async function StudentApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { applicationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/applications/${applicationId}`)

  const { data: application } = await supabase
    .from("applications")
    .select("id, period_id, status, created_at, submitted_at, catatan_admin")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!application) notFound()

  let { data: period, error: periodError } = await supabase
    .from("scholarship_periods")
    .select("id, nama, status, tgl_tutup, tgl_pengumuman")
    .eq("id", application.period_id)
    .maybeSingle()

  // The detail page remains readable while the additive date migration is pending.
  if (periodError?.message.includes("tgl_pengumuman")) {
    const fallback = await supabase
      .from("scholarship_periods")
      .select("id, nama, status, tgl_tutup")
      .eq("id", application.period_id)
      .maybeSingle()
    period = fallback.data ? { ...fallback.data, tgl_pengumuman: null } : null
    periodError = fallback.error
  }
  if (!period || periodError) notFound()

  const [{ data: profile }, { data: formRows, error: formError }, { data: documents, error: documentsError }] = await Promise.all([
    supabase.from("profiles").select("nama, nim, prodi, semester").eq("id", user.id).maybeSingle(),
    supabase.rpc("get_student_application_form", { p_application_id: application.id }),
    supabase
      .from("documents")
      .select("id, jenis, storage_path, status_verifikasi, catatan, created_at")
      .eq("application_id", application.id)
      .order("created_at", { ascending: true }),
  ])
  if (documentsError) console.warn("Failed to load application documents:", documentsError.message)
  const documentLinks = await Promise.all((documents || []).map(async (document) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(document.storage_path, 300)
    return { ...document, signedUrl: data?.signedUrl || null }
  }))

  const criteriaMap = new Map<string, {
    id: string
    name: string
    order: number
    value: number | null
    selectedScale: string | null
  }>()
  for (const row of (formRows || []) as ApplicationFormRow[]) {
    const criterion = criteriaMap.get(row.criteria_id) || {
      id: row.criteria_id,
      name: row.nama,
      order: row.urutan,
      value: row.nilai_mentah,
      selectedScale: null,
    }
    if (row.scale_id && row.scale_id === row.selected_scale_id) criterion.selectedScale = row.scale_label
    criteriaMap.set(row.criteria_id, criterion)
  }
  const criteria = Array.from(criteriaMap.values()).sort((a, b) => a.order - b.order)
  if (formError) console.warn("Failed to load application detail criteria:", formError.message)

  const statusMessages: Record<string, string> = {
    draft: "Pengajuan masih berupa draf. Anda dapat melanjutkan formulir selama pendaftaran dibuka.",
    submitted: "Pengajuan telah dikirim dan menunggu pemeriksaan panitia.",
    verified: "Berkas telah terverifikasi dan pengajuan menunggu hasil seleksi.",
    rejected: "Pengajuan memerlukan perbaikan. Periksa catatan dari panitia di bawah.",
    passed: "Selamat, pengajuan Anda dinyatakan lolos seleksi.",
    not_passed: "Pengumuman hasil seleksi untuk pengajuan ini telah tersedia.",
  }
  const applicationDate = application.submitted_at || application.created_at
  const formattedApplicationDate = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(applicationDate))

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Rincian Pengajuan</h1>
          <p className="mt-1 text-sm text-muted-foreground">{period.nama}</p>
        </div>
        <StatusBadge status={application.status} size="md" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" aria-hidden="true" /> Berkas Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentsError ? (
            <p role="status" className="text-sm text-muted-foreground">
              Berkas pengajuan belum berhasil dimuat. Silakan buka kembali halaman ini beberapa saat lagi.
            </p>
          ) : documentLinks.length ? (
            <ul className="divide-y rounded-lg border border-[#DCE5F1]">
              {documentLinks.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#263449]">{document.jenis}</p>
                    {document.catatan && <p className="mt-1 text-xs text-[#8492A6]">Catatan: {document.catatan}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={document.status_verifikasi} size="sm" />
                    {document.signedUrl ? (
                      <a
                        href={document.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2456A6] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2456A6]/40"
                      >
                        Lihat berkas <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#8492A6]">Pratinjau tidak tersedia</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada berkas yang diunggah untuk pengajuan ini.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" /> Status Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {statusMessages[application.status] || "Pengajuan sedang diproses panitia."}
          </p>
          <p className="text-xs text-muted-foreground">
            {application.submitted_at ? "Dikirim" : "Dibuat"} pada {formattedApplicationDate}
          </p>
          {application.catatan_admin && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="mb-1 font-semibold">Catatan panitia</p>
              <p>{application.catatan_admin}</p>
            </div>
          )}
          {application.status === "draft" && period.status === "open" && (
            <Link href={`/apply/${period.id}`}><Button size="sm">Lanjutkan Pengajuan</Button></Link>
          )}
          {period.status === "published" && (
            <Link href={`/result/${period.id}`}><Button size="sm">Lihat Hasil Seleksi</Button></Link>
          )}
        </CardContent>
      </Card>

      {period.status === "published" ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm font-medium text-emerald-900">Pengumuman hasil seleksi sudah tersedia.</p>
            <Link href={`/result/${period.id}`} className="text-sm font-semibold text-primary underline underline-offset-4">
              Buka pengumuman
            </Link>
          </CardContent>
        </Card>
      ) : (
        <AnnouncementCountdown announcementAt={period.tgl_pengumuman} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" aria-hidden="true" /> Data Mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Nama Lengkap" value={profile?.nama || "Belum diisi"} />
          <DetailField label="Email" value={user.email || "-"} />
          <DetailField label="NIM" value={profile?.nim || "Belum diisi"} />
          <DetailField label="Program Studi" value={profile?.prodi || "Belum diisi"} />
          <DetailField label="Semester" value={profile?.semester ? String(profile.semester) : "Belum diisi"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" aria-hidden="true" /> Data Pengajuan Beasiswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formError ? (
            <p role="status" className="text-sm text-muted-foreground">
              Rincian kriteria belum berhasil dimuat. Coba buka kembali halaman ini beberapa saat lagi.
            </p>
          ) : criteria.length ? (
            <dl className="divide-y rounded-lg border">
              {criteria.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <dt className="font-medium">{item.name}</dt>
                  <dd className="text-muted-foreground">
                    {item.value === null ? "Belum diisi" : String(item.value)}
                    {item.selectedScale ? ` · ${item.selectedScale}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data kriteria pada pengajuan ini.</p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
