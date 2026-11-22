import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * SINERGI Logo Component
 * Visual: GraduationCap + abstract star/light rays (scholarship & brilliance)
 * Colors follow the brand palette: deep teal primary, amber accent
 */

interface SinergiLogoMarkProps {
  className?: string
  size?: number
}

export function SinergiLogoMark({ className, size = 32 }: SinergiLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background rounded square */}
      <rect width="36" height="36" rx="9" fill="currentColor" className="text-primary" />

      {/* Graduation cap body */}
      <path
        d="M18 10L7 15.5L18 21L29 15.5L18 10Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Cap brim highlight */}
      <path
        d="M18 10L7 15.5L18 21L29 15.5L18 10Z"
        fill="white"
        fillOpacity="0.2"
      />

      {/* Tassel cord */}
      <path
        d="M29 15.5V22"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      {/* Tassel end */}
      <circle cx="29" cy="23" r="1.5" fill="white" fillOpacity="0.9" />

      {/* Cap platform (the flat top) */}
      <path
        d="M12 18v4c0 1.657 2.686 3 6 3s6-1.343 6-3v-4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.85"
        fill="none"
      />

      {/* Amber star rays — top left */}
      <path
        d="M9 9 L10.5 7"
        stroke="#D9A441"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Amber star ray — top */}
      <path
        d="M18 7 L18 5"
        stroke="#D9A441"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Amber star ray — top right */}
      <path
        d="M27 9 L25.5 7"
        stroke="#D9A441"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Amber star dot */}
      <circle cx="18" cy="8" r="1" fill="#D9A441" fillOpacity="0.7" />
    </svg>
  )
}

interface SinergiLogoProps {
  /** Show the full logotype (mark + wordmark) */
  variant?: "full" | "mark-only" | "wordmark-only"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  /** Custom subtitle text below SINERGI */
  subtitle?: string | false
  /** White artwork for dark surfaces */
  tone?: "light" | "dark"
}

const sizeMap = {
  sm: { mark: 28, titleClass: "text-sm", subtitleClass: "text-[9px]", logoWidth: 132 },
  md: { mark: 34, titleClass: "text-base", subtitleClass: "text-[10px]", logoWidth: 158 },
  lg: { mark: 42, titleClass: "text-xl", subtitleClass: "text-xs", logoWidth: 190 },
  xl: { mark: 52, titleClass: "text-2xl", subtitleClass: "text-sm", logoWidth: 224 },
}

export function SinergiLogo({
  variant = "full",
  size = "md",
  className,
  subtitle = "Seleksi Beasiswa",
  tone = "light",
}: SinergiLogoProps) {
  const { mark, titleClass, subtitleClass, logoWidth } = sizeMap[size]

  if (variant === "mark-only") {
    return <SinergiLogoMark size={mark} className={className} />
  }

  if (variant === "wordmark-only") {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className={cn("font-black tracking-tight leading-none text-primary", titleClass)}>
          SINERGI
        </span>
        {subtitle !== false && (
          <span className={cn("text-muted-foreground font-medium uppercase tracking-wider leading-none mt-0.5", subtitleClass)}>
            {subtitle}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <Image
        src={tone === "dark" ? "/images/brand/sinergi-logo-white.png" : "/images/brand/sinergi-logo-color.png"}
        alt="SINERGI · Sistem Penerimaan Beasiswa Terintegrasi"
        width={tone === "dark" ? 1080 : 1300}
        height={tone === "dark" ? 360 : 420}
        priority
        className="h-auto object-contain"
        style={{ width: logoWidth }}
      />
      {subtitle !== false && (
        <span className={cn("mt-0.5 font-medium uppercase tracking-wider leading-none", subtitleClass, tone === "dark" ? "text-white/75" : "text-muted-foreground")}>
          {subtitle}
        </span>
      )}
    </div>
  )
}
