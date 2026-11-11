"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

  // Try creating verified user directly via Admin Client
  // This bypasses Supabase default SMTP email rate limits (which limit to 3-4 emails/hour)
  // and confirms the account immediately so user can log in without email friction.
  try {
    const adminSupabase = createAdminClient()
    const { data: adminUserData, error: adminCreateErr } =
      await adminSupabase.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: {
          nama: parsed.data.nama,
        },
      })

    if (adminCreateErr) {
      const errMsg = adminCreateErr.message.toLowerCase()
      if (
        errMsg.includes("already registered") ||
        errMsg.includes("already exists") ||
        errMsg.includes("duplicate")
      ) {
        return {
          error: "Email sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.",
        }
      }
      throw adminCreateErr
    }

    // User is created and auto-confirmed. Immediately establish session in cookies
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (signInErr) {
      redirect("/login?registered=true")
    }

    if (adminUserData?.user) {
      await supabase
        .from("profiles")
        .update({
          privacy_consented_at: new Date().toISOString(),
        })
        .eq("id", adminUserData.user.id)
    }

    redirect("/dashboard")
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.toLowerCase().includes("email sudah terdaftar")) {
      return {
        error: "Email sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.",
      }
    }

    // Fallback standard signup if admin client failed
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
      const msg = authError.message.toLowerCase()
      if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        return {
          error:
            "Batas pengiriman email sistem tercapai. Silakan coba masuk langsung atau hubungi administrator.",
        }
      }
      if (msg.includes("already registered")) {
        return {
          error: "Email sudah terdaftar. Silakan masuk menggunakan akun Anda.",
        }
      }
      return {
        error: authError.message || "Pendaftaran gagal. Silakan coba kembali.",
      }
    }

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
}
