import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <React.Suspense fallback={<AdminSidebarFallback />}>
        <AdminSidebar />
      </React.Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <React.Suspense fallback={<AdminHeaderFallback />}>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </React.Suspense>
      </div>
    </div>
  )
}

async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Security check: verify admin role
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle()

  if (!roleRow) {
    redirect("/dashboard")
  }

  // Fetch available periods and admin profile concurrently in parallel
  const [{ data: periods }, { data: profile }] = await Promise.all([
    supabase
      .from("scholarship_periods")
      .select("id, nama, status")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("nama")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  const userName = profile?.nama || user.user_metadata?.nama || "Administrator"

  return (
    <>
      <AdminHeader
        userName={userName}
        userEmail={user.email || ""}
        periods={periods || []}
      />
      <React.Suspense fallback={<AdminPageFallback />}>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </React.Suspense>
    </>
  )
}

function AdminSidebarFallback() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar h-screen sticky top-0 shrink-0 z-30">
      <div className="h-16 flex items-center gap-2.5 px-6 border-b">
        <Skeleton className="size-8 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2 w-24" />
        </div>
      </div>
      <div className="flex-1 py-6 px-6 space-y-4">
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </aside>
  )
}

function AdminHeaderFallback() {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </header>
  )
}

function AdminPageFallback() {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      <div className="space-y-2 border-b pb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-lg border bg-card p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </main>
  )
}
