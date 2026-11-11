import * as React from "react"
import { connection } from "next/server"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/server"
import { StudentHeader } from "@/components/student-header"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <React.Suspense fallback={<StudentLayoutFallback />}>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </React.Suspense>
  )
}

async function StudentLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
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
    <div className="min-h-screen bg-background flex flex-col">
      <StudentHeader userName={userName} userEmail={user?.email || ""} />
      <main className="flex-1 container mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <React.Suspense fallback={<StudentPageFallback />}>
          {children}
        </React.Suspense>
      </main>
    </div>
  )
}

function StudentLayoutFallback() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b bg-background">
        <div className="container mx-auto flex h-full max-w-5xl items-center px-4 sm:px-6">
          <Skeleton className="h-8 w-40" />
        </div>
      </header>
      <main className="container mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </main>
    </div>
  )
}

function StudentPageFallback() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}
