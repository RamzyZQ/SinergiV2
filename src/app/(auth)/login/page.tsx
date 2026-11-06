"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState } from "react"
import { loginAction } from "./actions"
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
import { AlertCircle, Loader2, LogIn } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold">Masuk ke Akun</CardTitle>
        <CardDescription>
          Masukkan email dan kata sandi untuk mengakses portal seleksi beasiswa
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
            <Label htmlFor="email">Email Kampus / Pribadi</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@mahasiswa.ac.id"
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="size-4 mr-2" />
                Masuk
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline focus-visible:outline-none"
            >
              Daftar sebagai Mahasiswa
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
