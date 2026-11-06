import * as React from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"

export default function HomePage() {
  return (
    <React.Suspense fallback={null}>
      <HomeRedirect />
    </React.Suspense>
  )
}

async function HomeRedirect() {
  await connection()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (roleRow) {
    redirect("/admin")
  }

  redirect("/dashboard")
  return null
}
