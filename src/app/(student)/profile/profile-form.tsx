"use client"

import { useActionState } from "react"
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { updateProfile, type ProfileActionState } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProfileData = {
  nama?: string | null
  nim?: string | null
  prodi?: string | null
  semester?: number | null
  privacy_consented_at?: string | null
}

const initialState: ProfileActionState = { status: "idle", message: "" }

export function ProfileForm({ email, profile }: { email: string; profile: ProfileData | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState)

  return (
    <form action={formAction} aria-busy={pending} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Terdaftar</Label>
        <Input
          id="email"
          type="email"
          value={email}
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
          <Input id="nim" name="nim" defaultValue={profile?.nim || ""} placeholder="Contoh: 210101001" />
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

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live={state.status === "error" ? "assertive" : "polite"}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.status === "success" && <CheckCircle2 className="size-4 shrink-0" />}
          {state.message}
        </p>
      )}

      <div className="pt-4 border-t flex justify-end">
        <Button type="submit" disabled={pending} aria-live="polite">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  )
}
