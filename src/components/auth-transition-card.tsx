"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ViewTransition } from "react"
import { AuthShowcase } from "@/components/auth-showcase"

export function AuthTransitionCard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRegister = pathname.startsWith("/register")

  return (
    <section className="auth-card" data-mode={isRegister ? "register" : "login"}>
      <div className="auth-form-side">
        <div className="auth-form-slot">
          <div className="auth-form-content">
            <ViewTransition key={pathname} enter="auth-text-in" exit="auth-text-out" default="none">
              {children}
            </ViewTransition>
          </div>
          <p className="auth-legal">© 2025 SINERGI · Sistem Seleksi Beasiswa ELECTRE</p>
        </div>
      </div>
      <AuthShowcase />
    </section>
  )
}
