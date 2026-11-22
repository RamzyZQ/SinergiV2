import * as React from "react"
import type { Metadata } from "next"
import { AuthTransitionCard } from "@/components/auth-transition-card"

export const metadata: Metadata = {
  title: "Autentikasi — SINERGI Beasiswa",
  description: "Portal masuk dan pendaftaran beasiswa mahasiswa",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-scene">
      <AuthTransitionCard>{children}</AuthTransitionCard>
    </main>
  )
}
