"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState } from "react"
import { registerAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Buat Akun Baru</h1>
        <p className="text-sm text-muted-foreground">
          Daftar sebagai mahasiswa untuk mengajukan beasiswa
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3.5 text-xs rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
        <CheckCircle2 className="size-4 shrink-0 text-sky-600 mt-0.5" />
        <span>Akun langsung aktif setelah pendaftaran — tidak perlu menunggu email verifikasi.</span>
      </div>

      {/* Error */}
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 text-sm rounded-xl bg-rose-50 text-rose-700 border border-rose-200"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nama" className="text-sm font-semibold">
            Nama Lengkap
          </Label>
          <Input
            id="nama"
            name="nama"
            placeholder="Contoh: Ahmad Fauzi"
            required
            disabled={isPending}
            className="h-11 bg-background border-border/80 focus-visible:ring-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ahmad@mahasiswa.ac.id"
            required
            autoComplete="email"
            disabled={isPending}
            className="h-11 bg-background border-border/80 focus-visible:ring-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold">
            Kata Sandi
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              required
              autoComplete="new-password"
              disabled={isPending}
              className="h-11 pr-11 bg-background border-border/80 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold">
            Konfirmasi Kata Sandi
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ulangi kata sandi"
              required
              autoComplete="new-password"
              disabled={isPending}
              className="h-11 pr-11 bg-background border-border/80 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Privacy consent */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="privacyConsent"
            name="privacyConsent"
            required
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/40 accent-primary"
          />
          <Label
            htmlFor="privacyConsent"
            className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
          >
            Saya menyetujui pemrosesan data pribadi akademik dan finansial untuk keperluan evaluasi
            beasiswa sesuai{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Kebijakan Privasi
            </Link>
            .
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold text-sm gap-2 bg-primary hover:bg-primary/90 transition-all"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mendaftarkan...
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Daftar Sekarang
            </>
          )}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline underline-offset-4 focus-visible:outline-none"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}

