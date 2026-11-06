"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { registerSchema } from "@/lib/validators/auth"

export interface RegisterActionState {
  error?: string
  success?: boolean
}

export async function registerAction(
  _prevState: RegisterActionState | null,
  formData: FormData
): Promise<RegisterActionState> {
  const privacyVal = formData.get("privacyConsent")
  const rawData = {
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    privacyConsent: privacyVal === "on" || privacyVal === "true",
  }

  const parsed = registerSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    }
  }

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nama: parsed.data.nama,
      },
    },
  })

  if (authError) {
    return {
      error: authError.message || "Pendaftaran gagal. Silakan coba kembali.",
    }
  }

  // Update privacy_consented_at on profile if user session is active
  if (authData?.user) {
    await supabase
      .from("profiles")
      .update({
        privacy_consented_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)
  }

  redirect("/dashboard")
}
