"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resend, buildPublicationEmailHtml } from "@/lib/email/resend"
import {
  calculateElectre,
  ElectreCriterion,
  ElectreAlternative,
  ElectreResult,
} from "@/lib/electre"

export interface ActionResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// Helper to check admin role
async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Tidak terautentikasi.")

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (!roleRow) throw new Error("Akses ditolak: Hanya untuk administrator.")

  return { supabase, user }
}

// ---------------------------------------------------------------------------
// 1. Create New Period
// ---------------------------------------------------------------------------
export async function createPeriodAction(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { supabase, user } = await verifyAdmin()

    const nama = (formData.get("nama") as string)?.trim()
    const deskripsi = (formData.get("deskripsi") as string)?.trim() || null
    const tgl_buka = formData.get("tgl_buka") as string
    const tgl_tutup = formData.get("tgl_tutup") as string
    const kuota = parseInt(formData.get("kuota") as string, 10)

    if (!nama) return { success: false, error: "Nama periode wajib diisi." }
    if (!tgl_buka || !tgl_tutup)
      return { success: false, error: "Tanggal buka dan tutup wajib diisi." }
    if (isNaN(kuota) || kuota <= 0)
      return { success: false, error: "Kuota harus berupa bilangan bulat positif." }

    if (new Date(tgl_tutup) <= new Date(tgl_buka)) {
      return {
        success: false,
        error: "Tanggal tutup pendaftaran harus setelah tanggal buka.",
      }
    }

    const { data: newPeriod, error: insertErr } = await supabase
      .from("scholarship_periods")
      .insert({
        nama,
        deskripsi,
        tgl_buka: new Date(tgl_buka).toISOString(),
        tgl_tutup: new Date(tgl_tutup).toISOString(),
        kuota,
        status: "draft",
        threshold_c_mode: "average",
        threshold_d_mode: "average",
        created_by: user.id,
      })
      .select("id")
      .single()

    if (insertErr || !newPeriod) {
      return {
        success: false,
        error: "Gagal membuat periode: " + (insertErr?.message || "Kesalahan database"),
      }
    }

    revalidatePath("/admin/periods")
    revalidatePath("/admin")

    return {
      success: true,
      message: "Periode baru berhasil dibuat dalam status Draf.",
      data: { id: newPeriod.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 2. Update Period Settings
// ---------------------------------------------------------------------------
export async function updatePeriodSettingsAction(
  periodId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin()

    const nama = (formData.get("nama") as string)?.trim()
    const deskripsi = (formData.get("deskripsi") as string)?.trim() || null
    const tgl_buka = formData.get("tgl_buka") as string
    const tgl_tutup = formData.get("tgl_tutup") as string
    const kuota = parseInt(formData.get("kuota") as string, 10)

    const threshold_c_mode = (formData.get("threshold_c_mode") as string) || "average"
    const threshold_d_mode = (formData.get("threshold_d_mode") as string) || "average"
    const threshold_c_str = formData.get("threshold_c") as string
    const threshold_d_str = formData.get("threshold_d") as string

    const threshold_c = threshold_c_str ? parseFloat(threshold_c_str) : null
    const threshold_d = threshold_d_str ? parseFloat(threshold_d_str) : null

    const tie_break_rules_str = formData.get("tie_break_rules") as string
    let tie_break_rules = ["ipk", "penghasilan", "waktu_submit"]
    if (tie_break_rules_str) {
      try {
        tie_break_rules = JSON.parse(tie_break_rules_str)
      } catch {
        // use default
      }
    }

    if (!nama) return { success: false, error: "Nama periode wajib diisi." }
    if (isNaN(kuota) || kuota <= 0)
      return { success: false, error: "Kuota harus lebih besar dari 0." }

    const { error: updateErr } = await supabase
      .from("scholarship_periods")
      .update({
        nama,
        deskripsi,
        tgl_buka: new Date(tgl_buka).toISOString(),
        tgl_tutup: new Date(tgl_tutup).toISOString(),
        kuota,
        threshold_c_mode: threshold_c_mode as "average" | "manual",
        threshold_c,
        threshold_d_mode: threshold_d_mode as "average" | "manual",
        threshold_d,
        tie_break_rules,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periodId)

    if (updateErr) {
      return { success: false, error: "Gagal memperbarui pengaturan periode: " + updateErr.message }
    }

    revalidatePath(`/admin/periods/${periodId}/overview`)
    return { success: true, message: "Pengaturan periode berhasil disimpan." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 3. Transition Period Status
// ---------------------------------------------------------------------------
export async function transitionPeriodStatusAction(
  periodId: string,
  targetStatus: "draft" | "open" | "closed" | "verification" | "calculated" | "published"
): Promise<ActionResponse> {
  try {
    const { supabase, user } = await verifyAdmin()

    // Get current period
    const { data: period, error: pErr } = await supabase
      .from("scholarship_periods")
      .select("*")
      .eq("id", periodId)
      .single()

    if (pErr || !period) return { success: false, error: "Periode tidak ditemukan." }

    // Validation rules for transitions
    if (targetStatus === "open") {
      // 1. Must have criteria
      const { data: criteriaList } = await supabase
        .from("criteria")
        .select("id, bobot")
        .eq("period_id", periodId)

      if (!criteriaList || criteriaList.length === 0) {
        return {
          success: false,
          error: "Syarat belum terpenuhi: Minimal harus ada 1 kriteria penilaian.",
        }
      }

      // 2. Total weight must be exactly 100
      const totalWeight = criteriaList.reduce((acc, c) => acc + Number(c.bobot), 0)
      if (Math.abs(totalWeight - 100) > 0.01) {
        return {
          success: false,
          error: `Syarat belum terpenuhi: Total bobot kriteria harus tepat 100% (saat ini ${totalWeight.toFixed(2)}%). Silakan gunakan fitur normalisasi otomatis.`,
        }
      }

      // 3. Check scales exist
      const { data: scales } = await supabase
        .from("criteria_scales")
        .select("criteria_id")
        .in(
          "criteria_id",
          criteriaList.map((c) => c.id)
        )

      const criteriaWithScales = new Set(scales?.map((s) => s.criteria_id) || [])
      const missingScales = criteriaList.filter((c) => !criteriaWithScales.has(c.id))

      if (missingScales.length > 0) {
        return {
          success: false,
          error: "Syarat belum terpenuhi: Semua kriteria harus memiliki skala penilaian.",
        }
      }
    } else if (targetStatus === "verification") {
      // Check if submitted applicants exist
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("period_id", periodId)
        .eq("status", "submitted")

      if (!count || count === 0) {
        return {
          success: false,
          error: "Syarat belum terpenuhi: Tidak ada pendaftar berstatus 'Diajukan' untuk diverifikasi.",
        }
      }
    } else if (targetStatus === "calculated") {
      // Check all submitted applications have been resolved (verified or rejected)
      const { count: pendingCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("period_id", periodId)
        .eq("status", "submitted")

      if (pendingCount && pendingCount > 0) {
        return {
          success: false,
          error: `Syarat belum terpenuhi: Masih ada ${pendingCount} pelamar yang belum diverifikasi. Seluruh pelamar harus berstatus 'Terverifikasi' atau 'Ditolak'.`,
        }
      }

      // Check at least 1 verified applicant exists
      const { count: verifiedCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("period_id", periodId)
        .eq("status", "verified")

      if (!verifiedCount || verifiedCount === 0) {
        return {
          success: false,
          error: "Syarat belum terpenuhi: Minimal harus ada 1 pelamar terverifikasi untuk dihitung.",
        }
      }
    } else if (targetStatus === "published") {
      // Check if official calculation run exists
      const { data: latestRun } = await supabase
        .from("calculation_runs")
        .select("id")
        .eq("period_id", periodId)
        .eq("tipe", "official")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!latestRun) {
        return {
          success: false,
          error: "Syarat belum terpenuhi: Anda harus menjalankan perhitungan resmi (official) terlebih dahulu sebelum mempublikasikan hasil.",
        }
      }

      // Sync applications status based on calculation_results
      const { data: results } = await supabase
        .from("calculation_results")
        .select("application_id, lolos")
        .eq("run_id", latestRun.id)

      if (results && results.length > 0) {
        for (const res of results) {
          await supabase
            .from("applications")
            .update({
              status: res.lolos ? "passed" : "not_passed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", res.application_id)
        }
      }
    }

    // Update status
    const { error: updErr } = await supabase
      .from("scholarship_periods")
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", periodId)

    if (updErr) {
      return { success: false, error: "Gagal mengubah status periode: " + updErr.message }
    }

    // Manual audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      aksi: "TRANSITION_STATUS",
      entitas: "scholarship_periods",
      entitas_id: periodId,
      sebelum: { status: period.status },
      sesudah: { status: targetStatus },
    })

    revalidatePath(`/admin/periods/${periodId}`)
    revalidatePath(`/admin/periods/${periodId}/overview`)
    revalidatePath("/admin/periods")

    return {
      success: true,
      message: `Status periode berhasil dialihkan ke: ${targetStatus.toUpperCase()}`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 4. Criteria CRUD & Auto-Normalization
// ---------------------------------------------------------------------------
export async function createCriteriaAction(
  periodId: string,
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { supabase } = await verifyAdmin()

    // Period must be in draft
    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Kriteria tidak dapat diubah karena periode sudah dibuka/dikunci.",
      }
    }

    const nama = (formData.get("nama") as string)?.trim()
    const tipe = (formData.get("tipe") as "benefit" | "cost") || "benefit"
    const bobot = parseFloat(formData.get("bobot") as string)
    const sumber_nilai = (formData.get("sumber_nilai") as "input" | "document") || "input"

    if (!nama) return { success: false, error: "Nama kriteria wajib diisi." }
    if (isNaN(bobot) || bobot <= 0 || bobot > 100)
      return { success: false, error: "Bobot harus bernilai antara 1 hingga 100." }

    // Get current max order
    const { data: maxOrderRow } = await supabase
      .from("criteria")
      .select("urutan")
      .eq("period_id", periodId)
      .order("urutan", { ascending: false })
      .limit(1)

    const nextOrder = (maxOrderRow?.[0]?.urutan ?? 0) + 1

    const { data: newCrit, error: insertErr } = await supabase
      .from("criteria")
      .insert({
        period_id: periodId,
        nama,
        tipe,
        bobot,
        urutan: nextOrder,
        sumber_nilai,
      })
      .select("id")
      .single()

    if (insertErr || !newCrit) {
      return { success: false, error: "Gagal menambah kriteria: " + insertErr?.message }
    }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Kriteria berhasil ditambahkan.", data: { id: newCrit.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function updateCriteriaAction(
  criteriaId: string,
  periodId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin()

    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Kriteria tidak dapat diubah karena periode sudah dibuka/dikunci.",
      }
    }

    const nama = (formData.get("nama") as string)?.trim()
    const tipe = (formData.get("tipe") as "benefit" | "cost") || "benefit"
    const bobot = parseFloat(formData.get("bobot") as string)
    const sumber_nilai = (formData.get("sumber_nilai") as "input" | "document") || "input"

    if (!nama) return { success: false, error: "Nama kriteria wajib diisi." }
    if (isNaN(bobot) || bobot <= 0 || bobot > 100)
      return { success: false, error: "Bobot harus bernilai antara 1 hingga 100." }

    const { error: updErr } = await supabase
      .from("criteria")
      .update({
        nama,
        tipe,
        bobot,
        sumber_nilai,
        updated_at: new Date().toISOString(),
      })
      .eq("id", criteriaId)

    if (updErr) return { success: false, error: "Gagal memperbarui kriteria: " + updErr.message }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Kriteria berhasil diperbarui." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function deleteCriteriaAction(
  criteriaId: string,
  periodId: string
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin()

    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Kriteria tidak dapat dihapus karena periode sudah dibuka/dikunci.",
      }
    }

    const { error: delErr } = await supabase
      .from("criteria")
      .delete()
      .eq("id", criteriaId)

    if (delErr) return { success: false, error: "Gagal menghapus kriteria: " + delErr.message }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Kriteria berhasil dihapus." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function normalizeCriteriaWeightsAction(
  periodId: string
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin()

    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Bobot kriteria terkunci dan tidak dapat diubah.",
      }
    }

    const { data: criteriaList } = await supabase
      .from("criteria")
      .select("id, bobot")
      .eq("period_id", periodId)

    if (!criteriaList || criteriaList.length === 0) {
      return { success: false, error: "Tidak ada kriteria untuk dinormalisasi." }
    }

    const totalWeight = criteriaList.reduce((acc, c) => acc + Number(c.bobot), 0)
    if (totalWeight <= 0) {
      return { success: false, error: "Total bobot harus lebih besar dari 0." }
    }

    // Proportionally scale so sum = 100
    let runningTotal = 0
    for (let i = 0; i < criteriaList.length; i++) {
      const c = criteriaList[i]
      let newWeight: number

      if (i === criteriaList.length - 1) {
        // Last item gets remainder to ensure exact 100.00
        newWeight = Number((100 - runningTotal).toFixed(2))
      } else {
        newWeight = Number(((Number(c.bobot) / totalWeight) * 100).toFixed(2))
        runningTotal += newWeight
      }

      await supabase
        .from("criteria")
        .update({ bobot: newWeight, updated_at: new Date().toISOString() })
        .eq("id", c.id)
    }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Bobot kriteria berhasil dinormalisasi menjadi tepat 100%." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 5. Criteria Scales CRUD
// ---------------------------------------------------------------------------
export async function createScaleAction(
  criteriaId: string,
  periodId: string,
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { supabase } = await verifyAdmin()

    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Skala kriteria terkunci karena periode sudah dibuka.",
      }
    }

    const label = (formData.get("label") as string)?.trim()
    const nilai_min = parseFloat(formData.get("nilai_min") as string)
    const nilai_max = parseFloat(formData.get("nilai_max") as string)
    const skor = parseFloat(formData.get("skor") as string)

    if (!label) return { success: false, error: "Label skala wajib diisi." }
    if (isNaN(nilai_min) || isNaN(nilai_max))
      return { success: false, error: "Nilai minimum dan maksimum harus berupa angka." }
    if (nilai_max < nilai_min)
      return { success: false, error: "Nilai maksimum harus lebih besar atau sama dengan nilai minimum." }
    if (isNaN(skor) || skor <= 0)
      return { success: false, error: "Skor harus berupa angka positif." }

    const { data: newScale, error: insErr } = await supabase
      .from("criteria_scales")
      .insert({
        criteria_id: criteriaId,
        label,
        nilai_min,
        nilai_max,
        skor,
      })
      .select("id")
      .single()

    if (insErr || !newScale) {
      return { success: false, error: "Gagal menambah skala: " + insErr?.message }
    }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Rentang skala berhasil ditambahkan.", data: { id: newScale.id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function deleteScaleAction(
  scaleId: string,
  periodId: string
): Promise<ActionResponse> {
  try {
    const { supabase } = await verifyAdmin()

    const { data: period } = await supabase
      .from("scholarship_periods")
      .select("status")
      .eq("id", periodId)
      .single()

    if (!period || period.status !== "draft") {
      return {
        success: false,
        error: "Skala kriteria terkunci dan tidak dapat dihapus.",
      }
    }

    const { error: delErr } = await supabase
      .from("criteria_scales")
      .delete()
      .eq("id", scaleId)

    if (delErr) return { success: false, error: "Gagal menghapus skala: " + delErr.message }

    revalidatePath(`/admin/periods/${periodId}/criteria`)
    return { success: true, message: "Skala berhasil dihapus." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 6. Applicant Verification Actions (Two-Panel Workspace)
// ---------------------------------------------------------------------------
export async function verifyApplicantAction(
  applicationId: string,
  periodId: string,
  decision: "verified" | "rejected",
  catatanAdmin?: string
): Promise<ActionResponse> {
  try {
    const { supabase, user } = await verifyAdmin()

    if (decision === "rejected" && (!catatanAdmin || catatanAdmin.trim().length === 0)) {
      return {
        success: false,
        error: "Penolakan berkas wajib menyertakan catatan alasan bagi mahasiswa.",
      }
    }

    const { error: updErr } = await supabase
      .from("applications")
      .update({
        status: decision,
        catatan_admin: catatanAdmin || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updErr) return { success: false, error: "Gagal memperbarui status pelamar: " + updErr.message }

    // If verified, mark all documents as approved
    if (decision === "verified") {
      await supabase
        .from("documents")
        .update({
          status_verifikasi: "approved",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          catatan: null,
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
    } else {
      // If rejected, also mark documents with rejection notes
      await supabase
        .from("documents")
        .update({
          status_verifikasi: "rejected",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          catatan: catatanAdmin || "Berkas tidak memenuhi persyaratan",
          updated_at: new Date().toISOString(),
        })
        .eq("application_id", applicationId)
    }

    revalidatePath(`/admin/periods/${periodId}/applicants`)
    revalidatePath("/admin")

    return {
      success: true,
      message:
        decision === "verified"
          ? "Pelamar berhasil diverifikasi dan berkas disetujui."
          : "Pelamar ditolak dengan catatan yang dikirimkan.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function verifyDocumentAction(
  documentId: string,
  periodId: string,
  status: "approved" | "rejected",
  catatan?: string
): Promise<ActionResponse> {
  try {
    const { supabase, user } = await verifyAdmin()

    const { error } = await supabase
      .from("documents")
      .update({
        status_verifikasi: status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        catatan: catatan || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    if (error) return { success: false, error: "Gagal memverifikasi dokumen: " + error.message }

    revalidatePath(`/admin/periods/${periodId}/applicants`)
    return { success: true, message: "Status verifikasi dokumen berhasil diperbarui." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

export async function getAdminDocumentSignedUrl(
  storagePath: string
): Promise<ActionResponse<{ signedUrl: string }>> {
  try {
    const { supabase } = await verifyAdmin()

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, 300)

    if (error || !data) {
      return {
        success: false,
        error: "Gagal memuat pratinjau dokumen: " + (error?.message || "File tidak ditemukan"),
      }
    }

    return { success: true, data: { signedUrl: data.signedUrl } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 7. Run ELECTRE Calculation (Official / Simulation)
// ---------------------------------------------------------------------------
export async function runElectreCalculationAction(
  periodId: string,
  type: "official" | "simulation" = "official"
): Promise<ActionResponse<{ runId: string; result: ElectreResult }>> {
  try {
    const { supabase, user } = await verifyAdmin()

    // 1. Fetch period
    const { data: period, error: pErr } = await supabase
      .from("scholarship_periods")
      .select("*")
      .eq("id", periodId)
      .single()

    if (pErr || !period) return { success: false, error: "Periode tidak ditemukan." }

    // Official run requires status verification or calculated
    if (type === "official" && !["verification", "calculated"].includes(period.status)) {
      return {
        success: false,
        error: `Perhitungan resmi hanya dapat dijalankan pada tahap 'Verifikasi' atau 'Kalkulasi Selesai'. Status saat ini: ${period.status.toUpperCase()}.`,
      }
    }

    // 2. Fetch criteria & scales
    const { data: rawCriteria } = await supabase
      .from("criteria")
      .select("id, nama, tipe, bobot, urutan")
      .eq("period_id", periodId)
      .order("urutan", { ascending: true })

    if (!rawCriteria || rawCriteria.length === 0) {
      return { success: false, error: "Tidak ada kriteria penilaian untuk periode ini." }
    }

    const { data: rawScales } = await supabase
      .from("criteria_scales")
      .select("id, criteria_id, label, nilai_min, nilai_max, skor")
      .in(
        "criteria_id",
        rawCriteria.map((c) => c.id)
      )

    // 3. Fetch verified applications
    const { data: verifiedApps } = await supabase
      .from("applications")
      .select("id, user_id, submitted_at")
      .eq("period_id", periodId)
      .eq("status", "verified")

    if (!verifiedApps || verifiedApps.length === 0) {
      return {
        success: false,
        error: "Tidak ada pelamar berstatus 'Terverifikasi' untuk dihitung.",
      }
    }

    const appIds = verifiedApps.map((a) => a.id)
    const userIds = verifiedApps.map((a) => a.user_id)

    // Fetch applicant profiles for names and tie-break
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama, nim, prodi")
      .in("id", userIds)

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    // Fetch application values
    const { data: appValues } = await supabase
      .from("application_values")
      .select("application_id, criteria_id, nilai_mentah, skor")
      .in("application_id", appIds)

    // Build ElectreCriteria array
    const criteria: ElectreCriterion[] = rawCriteria.map((c) => ({
      id: c.id,
      name: c.nama,
      type: c.tipe as "benefit" | "cost",
      weight: Number(c.bobot),
    }))

    // Build ElectreAlternative array
    const alternatives: ElectreAlternative[] = verifiedApps.map((app) => {
      const prof = profileMap.get(app.user_id)
      const thisVals = (appValues || []).filter((v) => v.application_id === app.id)

      const scores: Record<string, number> = {}
      let ipkVal: number | undefined
      let penghasilanVal: number | undefined

      for (const val of thisVals) {
        const crit = rawCriteria.find((c) => c.id === val.criteria_id)
        scores[val.criteria_id] = Number(val.skor ?? 0)

        const critNameLower = (crit?.nama || "").toLowerCase()
        if (critNameLower.includes("ipk") || critNameLower.includes("indeks prestasi")) {
          ipkVal = val.nilai_mentah !== null ? Number(val.nilai_mentah) : undefined
        }
        if (critNameLower.includes("penghasilan") || critNameLower.includes("gaji")) {
          penghasilanVal = val.nilai_mentah !== null ? Number(val.nilai_mentah) : undefined
        }
      }

      return {
        id: app.id,
        name: prof?.nama ? `${prof.nama} (${prof.nim || "No NIM"})` : `Pelamar ${app.id.slice(0, 6)}`,
        scores,
        metadata: {
          ipk: ipkVal,
          penghasilan: penghasilanVal,
          submittedAt: app.submitted_at || undefined,
        },
      }
    })

    // Execute pure ELECTRE function
    const tieBreakOrder = Array.isArray(period.tie_break_rules)
      ? (period.tie_break_rules as string[])
      : ["ipk", "penghasilan", "waktu_submit"]

    const electreResult = calculateElectre({
      criteria,
      alternatives,
      thresholds: {
        thresholdCMode: period.threshold_c_mode as "average" | "manual",
        manualThresholdC: period.threshold_c !== null ? Number(period.threshold_c) : null,
        thresholdDMode: period.threshold_d_mode as "average" | "manual",
        manualThresholdD: period.threshold_d !== null ? Number(period.threshold_d) : null,
      },
      quota: period.kuota,
      tieBreakOrder,
    })

    // Prepare Snapshots
    const passedRankings = electreResult.rankings.filter((r) => r.passed)
    const cutoffNetScore =
      passedRankings.length > 0
        ? passedRankings[passedRankings.length - 1].netScore
        : electreResult.rankings[0]?.netScore ?? 0

    const snapshotKriteria = rawCriteria
    const snapshotSkala = rawScales || []
    const snapshotThreshold = {
      c_mode: period.threshold_c_mode,
      threshold_c: electreResult.thresholdC,
      d_mode: period.threshold_d_mode,
      threshold_d: electreResult.thresholdD,
      cutoff_net_score: cutoffNetScore,
      total_passed: passedRankings.length,
      quota: period.kuota,
    }
    const snapshotInput = alternatives.map((a) => ({
      id: a.id,
      name: a.name,
      scores: a.scores,
      metadata: a.metadata,
    }))
    const hasilMatriks = {
      decisionMatrix: electreResult.decisionMatrix,
      normalizedMatrix: electreResult.normalizedMatrix,
      weightedMatrix: electreResult.weightedMatrix,
      concordanceMatrix: electreResult.concordanceMatrix,
      discordanceMatrix: electreResult.discordanceMatrix,
      concordanceDominanceMatrix: electreResult.concordanceDominanceMatrix,
      discordanceDominanceMatrix: electreResult.discordanceDominanceMatrix,
      aggregateDominanceMatrix: electreResult.aggregateDominanceMatrix,
      cutoffNetScore,
      totalPassed: passedRankings.length,
    }

    // Save calculation run
    const { data: newRun, error: runErr } = await supabase
      .from("calculation_runs")
      .insert({
        period_id: periodId,
        dijalankan_oleh: user.id,
        tipe: type,
        snapshot_kriteria: snapshotKriteria as unknown as import("@/types/database").Json,
        snapshot_skala: snapshotSkala as unknown as import("@/types/database").Json,
        snapshot_threshold: snapshotThreshold as unknown as import("@/types/database").Json,
        snapshot_input: snapshotInput as unknown as import("@/types/database").Json,
        hasil_matriks: hasilMatriks as unknown as import("@/types/database").Json,
      })
      .select("id")
      .single()

    if (runErr || !newRun) {
      return { success: false, error: "Gagal menyimpan snapshot kalkulasi: " + runErr?.message }
    }

    // If official, save results into calculation_results table and update status
    if (type === "official") {
      // Remove any prior official results for this period
      const { data: priorRuns } = await supabase
        .from("calculation_runs")
        .select("id")
        .eq("period_id", periodId)
        .eq("tipe", "official")
        .neq("id", newRun.id)

      if (priorRuns && priorRuns.length > 0) {
        await supabase
          .from("calculation_results")
          .delete()
          .in("run_id", priorRuns.map((r) => r.id))
      }

      // Insert calculation_results for each applicant
      const resultRows = electreResult.rankings.map((r) => ({
        run_id: newRun.id,
        application_id: r.id,
        dominasi: r.dominasi,
        didominasi: r.didominasi,
        net_score: r.netScore,
        ranking: r.ranking,
        lolos: r.passed,
      }))

      const { error: resErr } = await supabase
        .from("calculation_results")
        .insert(resultRows)

      if (resErr) {
        console.error("Error inserting calculation_results:", resErr)
      }

      // If period was verification, advance period status to calculated
      if (period.status === "verification") {
        await supabase
          .from("scholarship_periods")
          .update({
            status: "calculated",
            updated_at: new Date().toISOString(),
          })
          .eq("id", periodId)
      }

      // Append-only audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        aksi: "OFFICIAL_CALCULATION_RUN",
        entitas: "calculation_runs",
        entitas_id: newRun.id,
        sesudah: {
          period_id: periodId,
          total_alternatives: alternatives.length,
          quota: period.kuota,
          threshold_c: electreResult.thresholdC,
          threshold_d: electreResult.thresholdD,
        },
      })
    }

    revalidatePath(`/admin/periods/${periodId}/calculate`)
    revalidatePath(`/admin/periods/${periodId}/results`)
    revalidatePath(`/admin/periods/${periodId}/overview`)

    return {
      success: true,
      message:
        type === "official"
          ? "Perhitungan resmi ELECTRE I berhasil dijalankan dan snapshot hasil telah disimpan."
          : "Simulasi perhitungan berhasil diselesaikan.",
      data: {
        runId: newRun.id,
        result: electreResult,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// 8. Publication Email Notifications (Resend & Audit)
// ---------------------------------------------------------------------------
export async function sendPublicationNotificationsAction(
  periodId: string
): Promise<ActionResponse<{ totalRecipients: number; sentCount: number }>> {
  try {
    const { supabase, user } = await verifyAdmin()

    // 1. Fetch period
    const { data: period, error: pErr } = await supabase
      .from("scholarship_periods")
      .select("id, nama, kuota, status")
      .eq("id", periodId)
      .single()

    if (pErr || !period) {
      return { success: false, error: "Periode tidak ditemukan." }
    }

    // 2. Fetch latest official run
    const { data: latestRun } = await supabase
      .from("calculation_runs")
      .select("id")
      .eq("period_id", periodId)
      .eq("tipe", "official")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestRun) {
      return {
        success: false,
        error: "Tidak ada perhitungan resmi untuk dikirimkan notifikasinya.",
      }
    }

    // 3. Fetch calculation_results
    const { data: results } = await supabase
      .from("calculation_results")
      .select("application_id, net_score, ranking, lolos")
      .eq("run_id", latestRun.id)

    if (!results || results.length === 0) {
      return { success: false, error: "Tidak ada data hasil pelamar untuk dikirimkan." }
    }

    const appIds = results.map((r) => r.application_id)
    const { data: apps } = await supabase
      .from("applications")
      .select("id, user_id")
      .in("id", appIds)

    const userIds = (apps || []).map((a) => a.user_id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama")
      .in("id", userIds)

    const profileMap = new Map((profiles || []).map((p) => [p.id, p.nama]))
    const appUserMap = new Map((apps || []).map((a) => [a.id, a.user_id]))

    let adminClient: ReturnType<typeof createAdminClient> | null = null
    try {
      adminClient = createAdminClient()
    } catch (e) {
      console.warn("createAdminClient could not be initialized:", e)
    }

    let sentCount = 0

    for (const res of results) {
      const recipientUserId = appUserMap.get(res.application_id)
      if (!recipientUserId) continue

      const recipientName = profileMap.get(recipientUserId) || "Mahasiswa"
      let recipientEmail = `${recipientUserId.slice(0, 8)}@student.univ.ac.id`

      if (adminClient) {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(recipientUserId)
          if (authUser?.user?.email) {
            recipientEmail = authUser.user.email
          }
        } catch (e) {
          console.warn("Failed fetching user email for", recipientUserId, e)
        }
      }

      const { subject, html, text } = buildPublicationEmailHtml({
        periodName: period.nama,
        recipientName,
        passed: res.lolos,
        quota: period.kuota,
      })

      let sendStatus: "sent" | "failed" = "sent"

      if (resend) {
        try {
          await resend.emails.send({
            from: "Seleksi Beasiswa <beasiswa@resend.dev>",
            to: recipientEmail,
            subject,
            html,
            text,
          })
        } catch (mailErr) {
          console.error("Resend delivery failed for", recipientEmail, mailErr)
          sendStatus = "failed"
        }
      }

      // Record in notifications table
      await supabase.from("notifications").insert({
        user_id: recipientUserId,
        jenis: "result_published",
        judul: subject,
        pesan: text,
        status_kirim: sendStatus,
        dibaca: false,
      })

      if (sendStatus === "sent") {
        sentCount++
      }
    }

    // Append to audit_logs
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      aksi: "SEND_PUBLICATION_NOTIFICATIONS",
      entitas: "scholarship_periods",
      entitas_id: periodId,
      sesudah: {
        totalRecipients: results.length,
        sentCount,
        timestamp: new Date().toISOString(),
      },
    })

    revalidatePath(`/admin/periods/${periodId}/publish`)

    return {
      success: true,
      message: `Berhasil memproses pengiriman notifikasi ke ${sentCount} dari ${results.length} pelamar.`,
      data: {
        totalRecipients: results.length,
        sentCount,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return { success: false, error: message }
  }
}

