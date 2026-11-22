"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface ProfileActionState {
  status: "idle" | "success" | "error"
  message: string
}

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const nama = (formData.get("nama") as string | null)?.trim() || ""
  const nim = (formData.get("nim") as string | null)?.trim() || null
  const prodi = (formData.get("prodi") as string | null)?.trim() || null
  const semesterRaw = (formData.get("semester") as string | null)?.trim() || ""
  const semester = semesterRaw ? Number(semesterRaw) : null

  if (!nama) return { status: "error", message: "Nama lengkap wajib diisi." }
  if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 14)) {
    return { status: "error", message: "Semester harus berupa angka 1 sampai 14." }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nama,
      nim,
      prodi,
      semester,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return {
      status: "error",
      message: error.code === "23505"
        ? "NIM tersebut sudah digunakan akun lain."
        : "Perubahan profil gagal disimpan. Silakan coba lagi.",
    }
  }

  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { status: "success", message: "Perubahan tersimpan." }
}
