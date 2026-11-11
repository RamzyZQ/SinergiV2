"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { loginAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LogIn, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginFallback />}>
      <LoginFormContent />
    </React.Suspense>
  )
}

function LoginFormContent() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [emailValue, setEmailValue] = React.useState("")
  const [passwordValue, setPasswordValue] = React.useState("")
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "true"

  const fillQuickAccount = (email: string, pass: string) => {
    setEmailValue(email)
    setPasswordValue(pass)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Selamat Datang</h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun Anda untuk mengakses portal seleksi beasiswa
        </p>
      </div>

      {/* Alert: Just Registered */}
      {justRegistered && !state?.error && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 text-sm rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>Pendaftaran berhasil! Akun Anda aktif, silakan masuk.</span>
        </div>
      )}

      {/* Alert: Error */}
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
          <Label htmlFor="email" className="text-sm font-semibold">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@mahasiswa.ac.id"
            required
            autoComplete="email"
            disabled={isPending}
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="h-11 bg-background border-border/80 focus-visible:ring-primary/40 transition-shadow"
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="h-11 pr-11 bg-background border-border/80 focus-visible:ring-primary/40 transition-shadow"
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

        {/* Quick Login Helper — demo purposes */}
        <div className="p-3 rounded-lg bg-muted/60 border border-border/50">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
            <Sparkles className="size-3 text-primary" />
            <span className="font-semibold">Akun Demo Pengujian</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillQuickAccount("admin@sinergi.ac.id", "admin123456")}
              className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground font-medium transition-colors"
            >
              🛡️ Panitia/Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount("mahasiswa@campus.ac.id", "mahasiswa123")}
              className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground font-medium transition-colors"
            >
              🎓 Mahasiswa Demo
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold text-sm gap-2 bg-primary hover:bg-primary/90 transition-all"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Masuk ke Akun
            </>
          )}
        </Button>
      </form>

      {/* Footer link */}
      <p className="text-sm text-center text-muted-foreground">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline underline-offset-4 focus-visible:outline-none"
        >
          Daftar sebagai Mahasiswa
        </Link>
      </p>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-muted rounded" />
        <div className="h-4 w-72 max-w-full bg-muted rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-11 w-full bg-muted rounded-lg" />
        <div className="h-11 w-full bg-muted rounded-lg" />
        <div className="h-16 w-full bg-muted rounded-lg" />
        <div className="h-11 w-full bg-muted rounded-lg" />
      </div>
    </div>
  )
}

