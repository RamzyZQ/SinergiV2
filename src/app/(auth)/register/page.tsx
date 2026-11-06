"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState } from "react"
import { registerAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle, Loader2, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null)

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold">Daftar Akun Mahasiswa</CardTitle>
        <CardDescription>
          Buat akun untuk mengajukan pendaftaran beasiswa di kampus
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 text-sm rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              name="nama"
              placeholder="Contoh: Ahmad Fauzi"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ahmad@mahasiswa.ac.id"
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              required
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi kata sandi"
              required
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>

          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="privacyConsent"
              name="privacyConsent"
              required
              disabled={isPending}
              className="mt-1 size-4 rounded border-input text-primary focus:ring-ring"
            />
            <label
              htmlFor="privacyConsent"
              className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
            >
              Saya menyetujui{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Kebijakan Privasi & Pemrosesan Data
              </Link>{" "}
              termasuk penggunaan data akademik & ekonomi untuk seleksi beasiswa
              metode ELECTRE.
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Mendaftarkan...
              </>
            ) : (
              <>
                <UserPlus className="size-4 mr-2" />
                Buat Akun Sekarang
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline focus-visible:outline-none"
            >
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
