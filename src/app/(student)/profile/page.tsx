import * as React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { revalidatePath } from "next/cache"
import { User, ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Profil Mahasiswa — SINERGI Beasiswa",
  description: "Kelola data identitas akademik mahasiswa penerima beasiswa.",
}

async function updateProfile(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const nama = formData.get("nama") as string
  const nim = formData.get("nim") as string
  const prodi = formData.get("prodi") as string
  const semesterStr = formData.get("semester") as string
  const semester = semesterStr ? parseInt(semesterStr, 10) : null

  await supabase
    .from("profiles")
    .update({
      nama,
      nim,
      prodi,
      semester,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  revalidatePath("/profile")
  revalidatePath("/dashboard")
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
          <form action={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Terdaftar</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <span className="text-[11px] text-muted-foreground">
                Email terikat pada akun dan tidak dapat diubah
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                name="nama"
                defaultValue={profile?.nama || ""}
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</Label>
                <Input
                  id="nim"
                  name="nim"
                  defaultValue={profile?.nim || ""}
                  placeholder="Contoh: 210101001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester Saat Ini</Label>
                <Input
                  id="semester"
                  name="semester"
                  type="number"
                  min="1"
                  max="14"
                  defaultValue={profile?.semester ?? ""}
                  placeholder="1 - 14"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodi">Program Studi</Label>
              <Input
                id="prodi"
                name="prodi"
                defaultValue={profile?.prodi || ""}
                placeholder="Contoh: Teknik Informatika"
              />
            </div>

            {profile?.privacy_consented_at && (
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  Persetujuan privasi tercatat pada:{" "}
                  {new Date(profile.privacy_consented_at).toLocaleString("id-ID")}
                </span>
              </div>
            )}

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
