"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { loginSchema } from "@/lib/validators/auth"

export interface AuthActionState {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Input tidak valid",
    }
  }

  const supabase = await createClient()

  let { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  // If login failed because email is not confirmed, auto-confirm it via Admin Client!
  // This rescues users stuck due to Supabase email delivery/rate limit issues.
  if (error && error.message.toLowerCase().includes("email not confirmed")) {
    try {
      const adminClient = createAdminClient()
      const { data: usersData } = await adminClient.auth.admin.listUsers()
      const targetUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
      )
      if (targetUser) {
        await adminClient.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        })
        // Retry sign in immediately
        const retryResult = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        })
        error = retryResult.error
      }
    } catch {
      // Ignore admin auto-confirm error and proceed
    }
  }

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("invalid login credentials")) {
      return {
        error: "Email atau kata sandi tidak cocok. Silakan periksa kembali.",
      }
    }
    if (msg.includes("email not confirmed")) {
      return {
        error:
          "Email belum dikonfirmasi. Silakan periksa inbox/spam atau coba masuk kembali.",
      }
    }
    return {
      error: error.message || "Gagal masuk. Silakan coba kembali.",
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()

    if (roleRow) {
      redirect("/admin")
    }
  }

  redirect("/dashboard")
}
