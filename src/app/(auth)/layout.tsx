import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { SinergiLogo } from "@/components/sinergi-logo"

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
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-primary p-10 relative overflow-hidden shrink-0">
        {/* Decorative background shapes */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, oklch(0.72 0.17 55) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, oklch(0.65 0.14 160) 0%, transparent 50%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-72 h-72 rounded-full"
          style={{ background: "oklch(1 0 0 / 4%)", transform: "translate(30%, -30%)" }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full"
          style={{ background: "oklch(1 0 0 / 5%)", transform: "translate(-30%, 30%)" }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg">
            <SinergiLogo size="lg" subtitle="Seleksi Beasiswa" className="[&_span]:text-white [&_span.text-muted-foreground]:text-white/60" />
          </Link>
        </div>

        {/* Middle: Tagline */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-white text-xl font-semibold leading-snug">
              "Seleksi yang adil dimulai dari data yang terukur."
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Sistem SINERGI menggunakan metode ELECTRE I dengan Net Dominance
              untuk menghasilkan perankingan beasiswa yang transparan dan objektif.
            </p>
          </blockquote>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["Metode ELECTRE I", "Transparan", "Berbasis Data", "Audit Log"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/15"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom: Steps preview */}
        <div className="relative z-10">
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-semibold mb-3">
            Alur Seleksi
          </p>
          <div className="space-y-2.5">
            {[
              { step: "01", label: "Daftar & Isi Formulir" },
              { step: "02", label: "Verifikasi Berkas" },
              { step: "03", label: "Kalkulasi ELECTRE" },
              { step: "04", label: "Pengumuman Hasil" },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/30 font-mono w-6">{step}</span>
                <span className="w-12 h-px bg-white/20 shrink-0" />
                <span className="text-white/70 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form area */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:px-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="inline-block focus-visible:outline-none">
            <SinergiLogo size="md" subtitle="Seleksi Beasiswa" />
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          © 2025 SINERGI · Sistem Seleksi Beasiswa ELECTRE
        </p>
      </div>
    </div>
  )
}

