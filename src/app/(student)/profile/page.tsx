import * as React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { ProfileForm } from "./profile-form"

export const metadata = {
  title: "Profil Mahasiswa — SINERGI Beasiswa",
  description: "Kelola data identitas akademik mahasiswa penerima beasiswa.",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Mahasiswa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui data identitas dasar untuk keperluan validasi berkas pendaftaran
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <User className="size-4" />
            <span>Informasi Akademik</span>
          </div>
          <CardTitle className="text-lg">Biodata Pribadi</CardTitle>
          <CardDescription>
            Pastikan NIM dan Program Studi sesuai dengan kartu tanda mahasiswa aktif
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ProfileForm email={user.email || ""} profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
