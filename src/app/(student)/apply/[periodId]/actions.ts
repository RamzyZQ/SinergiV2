"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  saveApplicationDraftSchema,
  SaveApplicationDraftInput,
} from "@/lib/validators/application"

export interface ActionResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// ---------------------------------------------------------------------------
// 1. Save Application Draft
// ---------------------------------------------------------------------------
export async function saveApplicationDraft(
  input: SaveApplicationDraftInput
): Promise<ActionResponse<{ savedAt: string }>> {
  const parsed = saveApplicationDraftSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data formulir tidak valid",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Sesi telah berakhir. Silakan masuk kembali." }
  }

  // Verify application exists, belongs to user, and is in draft
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select("id, status, period_id")
    .eq("id", parsed.data.application_id)
    .eq("user_id", user.id)
    .single()

  if (appErr || !app) {
    return { success: false, error: "Pendaftaran tidak ditemukan." }
  }

  if (app.status !== "draft") {
    return {
      success: false,
      error: "Pendaftaran ini sudah dikirim dan tidak dapat diubah.",
    }
  }

  if (app.period_id !== parsed.data.period_id) {
    return { success: false, error: "Periode pendaftaran tidak sesuai." }
  }

  const { data: period, error: periodErr } = await supabase
    .from("scholarship_periods")
    .select("status")
    .eq("id", app.period_id)
    .single()

  if (periodErr || !period || period.status !== "open") {
    return {
      success: false,
      error: "Periode pendaftaran sudah ditutup dan tidak dapat diubah.",
    }
  }

  // Update profile identity if provided
  if (parsed.data.nama || parsed.data.nim || parsed.data.prodi || parsed.data.semester) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        nama: parsed.data.nama,
        nim: parsed.data.nim || null,
        prodi: parsed.data.prodi || null,
        semester: parsed.data.semester ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileErr) {
      console.error("Error updating student profile:", profileErr)
      return { success: false, error: "Gagal menyimpan data identitas." }
    }
  }

  const { error: valuesErr } = await supabase.rpc(
    "save_student_application_values",
    {
      p_application_id: parsed.data.application_id,
      p_period_id: parsed.data.period_id,
      p_values: parsed.data.values,
    }
  )

  if (valuesErr) {
    console.error("Error saving student application values:", valuesErr)
    return { success: false, error: "Gagal menyimpan data kriteria." }
  }

  // Touch application updated_at
  const { error: updateErr } = await supabase
    .from("applications")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", parsed.data.application_id)

  if (updateErr) {
    console.error("Error updating application timestamp:", updateErr)
    return { success: false, error: "Gagal memperbarui waktu penyimpanan." }
  }

  const savedAt = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return {
    success: true,
    message: "Draf berhasil disimpan otomatis",
    data: { savedAt },
  }
}

// ---------------------------------------------------------------------------
// 2. Submit Application
// ---------------------------------------------------------------------------
export async function submitApplication(
  applicationId: string,
  periodId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Sesi telah berakhir. Silakan masuk kembali." }
  }

  // Verify application
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select("id, status, period_id")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single()

  if (appErr || !app) {
    return { success: false, error: "Pendaftaran tidak ditemukan." }
  }

  if (app.status !== "draft") {
    return {
      success: false,
      error: "Pendaftaran ini sudah dikirim sebelumnya.",
    }
  }

  if (app.period_id !== periodId) {
    return { success: false, error: "Periode pendaftaran tidak sesuai." }
  }

  // Check period status
  const { data: period } = await supabase
    .from("scholarship_periods")
    .select("id, status, nama")
    .eq("id", periodId)
    .single()

  if (!period || period.status !== "open") {
    return {
      success: false,
      error: "Periode beasiswa sedang ditutup atau belum dibuka untuk pendaftaran.",
    }
  }

  // Check all criteria have been filled
  const { data: formRows, error: formError } = await supabase.rpc(
    "get_student_application_form",
    { p_application_id: applicationId }
  )

  if (formError) {
    console.error("Failed to validate student application form:", formError)
    return { success: false, error: "Gagal memeriksa kelengkapan data." }
  }

  const criteriaStatus = new Map<string, { nama: string; filled: boolean }>()
  for (const row of formRows || []) {
    if (!criteriaStatus.has(row.criteria_id)) {
      criteriaStatus.set(row.criteria_id, {
        nama: row.nama,
        filled: row.nilai_mentah !== null,
      })
    }
  }
  const missingCriteria = Array.from(criteriaStatus.values()).filter(
    (criterion) => !criterion.filled
  )

  if (missingCriteria.length > 0) {
    return {
      success: false,
      error: `Harap lengkapi semua data kriteria. Kriteria belum diisi: ${missingCriteria
        .map((c) => c.nama)
        .join(", ")}`,
    }
  }

  // Check uploaded documents
  const { data: docs } = await supabase
    .from("documents")
    .select("id, jenis")
    .eq("application_id", applicationId)

  if (!docs || docs.length === 0) {
    return {
      success: false,
      error: "Anda belum mengunggah dokumen wajib yang disyaratkan.",
    }
  }

  // Submit the application
  const nowIso = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      status: "submitted",
      submitted_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", applicationId)

  if (updateErr) {
    return {
      success: false,
      error: "Gagal memperbarui status pendaftaran. Silakan coba kembali.",
    }
  }

  // Create notification for student
  await supabase.from("notifications").insert({
    user_id: user.id,
    jenis: "application_verified", // closest type or notification_type
    judul: "Pendaftaran Beasiswa Berhasil Dikirim",
    pesan: `Pendaftaran Anda untuk ${period.nama} berhasil diajukan dan sedang menunggu proses verifikasi berkas oleh panitia.`,
    dibaca: false,
    status_kirim: "sent",
  })

  revalidatePath(`/apply/${periodId}`)
  revalidatePath("/dashboard")

  return {
    success: true,
    message: "Pendaftaran beasiswa Anda berhasil dikirim!",
  }
}

// ---------------------------------------------------------------------------
// 3. Upload Document
// ---------------------------------------------------------------------------
export async function uploadDocumentAction(
  formData: FormData
): Promise<ActionResponse<{ id: string; jenis: string; storage_path: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Sesi telah berakhir. Silakan masuk kembali." }
  }

  const file = formData.get("file") as File | null
  const jenis = formData.get("jenis") as string | null
  const applicationId = formData.get("applicationId") as string | null
  const periodId = formData.get("periodId") as string | null

  if (!file || !jenis || !applicationId || !periodId) {
    return { success: false, error: "Parameter unggahan berkas tidak lengkap." }
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: "Ukuran berkas melebihi batas maksimal 5 MB.",
    }
  }

  // Validate MIME type
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Format berkas tidak didukung. Harap gunakan PDF, JPG, atau PNG.",
    }
  }

  // Verify application is in draft
  const { data: app } = await supabase
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single()

  if (!app || app.status !== "draft") {
    return {
      success: false,
      error: "Tidak dapat mengunggah berkas karena pendaftaran sudah dikirim.",
    }
  }

  // Sanitize file name & generate storage path
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const storagePath = `${periodId}/${user.id}/${encodeURIComponent(jenis)}/${Date.now()}_${sanitizedName}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: storageErr } = await supabase.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (storageErr) {
    console.error("Storage upload error:", storageErr)
    return {
      success: false,
      error: "Gagal menyimpan berkas ke server: " + storageErr.message,
    }
  }

  // Check if document of this jenis already exists for this application
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("application_id", applicationId)
    .eq("jenis", jenis)
    .maybeSingle()

  let docId = existingDoc?.id

  if (existingDoc) {
    // Update existing document record
    const { error: dbErr } = await supabase
      .from("documents")
      .update({
        storage_path: storagePath,
        status_verifikasi: "pending",
        catatan: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingDoc.id)

    if (dbErr) {
      return { success: false, error: "Gagal memperbarui catatan dokumen." }
    }
  } else {
    // Insert new document record
    const { data: newDoc, error: dbErr } = await supabase
      .from("documents")
      .insert({
        application_id: applicationId,
        jenis,
        storage_path: storagePath,
        status_verifikasi: "pending",
      })
      .select("id")
      .single()

    if (dbErr || !newDoc) {
      return { success: false, error: "Gagal menyimpan metadata dokumen." }
    }
    docId = newDoc.id
  }

  revalidatePath(`/apply/${periodId}`)

  return {
    success: true,
    message: "Berkas berhasil diunggah",
    data: {
      id: docId!,
      jenis,
      storage_path: storagePath,
    },
  }
}

// ---------------------------------------------------------------------------
// 4. Get Short-lived Signed URL for Document Preview
// ---------------------------------------------------------------------------
export async function getDocumentSignedUrlAction(
  storagePath: string
): Promise<ActionResponse<{ signedUrl: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Sesi telah berakhir. Silakan masuk kembali." }
  }

  // Generate 5-minute signed URL
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 300)

  if (error || !data) {
    return {
      success: false,
      error: "Tidak dapat membuka preview berkas: " + (error?.message || "File tidak ditemukan"),
    }
  }

  return {
    success: true,
    data: { signedUrl: data.signedUrl },
  }
}

// ---------------------------------------------------------------------------
// 5. Delete Document
// ---------------------------------------------------------------------------
export async function deleteDocumentAction(
  documentId: string,
  storagePath: string,
  periodId: string
): Promise<ActionResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Sesi telah berakhir." }
  }

  // Remove from storage
  await supabase.storage.from("documents").remove([storagePath])

  // Remove from DB
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)

  if (error) {
    return { success: false, error: "Gagal menghapus berkas: " + error.message }
  }

  revalidatePath(`/apply/${periodId}`)
  return { success: true, message: "Berkas berhasil dihapus" }
}
