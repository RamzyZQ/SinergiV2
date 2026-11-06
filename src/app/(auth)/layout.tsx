import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Autentikasi — SINERGI Beasiswa",
  description: "Portal masuk dan pendaftaran beasiswa mahasiswa",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group focus-visible:outline-none"
          >
            <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="size-5" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight block">
                SINERGI
              </span>
              <span className="text-xs text-muted-foreground block -mt-1 font-medium">
                Seleksi Beasiswa Mahasiswa
              </span>
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
