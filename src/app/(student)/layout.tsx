import * as React from "react"
import { createClient } from "@/lib/supabase/server"
import { StudentHeader } from "@/components/student-header"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName = "Mahasiswa"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.nama) {
      userName = profile.nama
    } else if (user.user_metadata?.nama) {
      userName = user.user_metadata.nama
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      <StudentHeader userName={userName} userEmail={user?.email || ""} />
      <main className="flex-1 container mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
