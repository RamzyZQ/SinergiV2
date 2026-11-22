"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react"

export interface OpenScholarship {
  id: string
  nama: string
  deskripsi: string | null
  tgl_tutup: string
  kuota: number
}

const scholarshipPhotos = {
  classroom: "/images/scholarships/classroom.png",
  laboratory: "/images/scholarships/laboratory.png",
  volunteer: "/images/scholarships/volunteer.png",
  graduation: "/images/scholarships/graduation.png",
}

function getScholarshipPhoto(name: string, index: number) {
  const normalizedName = name.toLocaleLowerCase("id-ID")
  if (normalizedName.includes("konservasi")) return scholarshipPhotos.graduation
  if (normalizedName.includes("beasiswa unggulan")) return scholarshipPhotos.classroom
  if (normalizedName.includes("volunteer")) return scholarshipPhotos.volunteer
  if (normalizedName.includes("lentera prestasi")) return scholarshipPhotos.laboratory
  return Object.values(scholarshipPhotos)[index % Object.keys(scholarshipPhotos).length]
}

export function StudentScholarshipHero({ scholarships }: { scholarships: OpenScholarship[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (scholarships.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % scholarships.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [scholarships.length])

  const renderSlide = (scholarship: OpenScholarship, index: number) => {
    const closeDate = new Date(scholarship.tgl_tutup).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return (
      <article
        key={scholarship.id}
        className="student-hero-slide"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12, 30, 56, .91) 0%, rgba(16, 43, 79, .76) 48%, rgba(23, 59, 112, .32) 100%), url("${getScholarshipPhoto(scholarship.nama, index)}")`,
        }}
        aria-hidden={index !== activeIndex}
      >
        <div className="student-hero-copy">
          <div className="student-hero-kicker">
            <span className="student-hero-kicker-mark"><GraduationCap size={16} /></span>
            Pendaftaran beasiswa sedang dibuka
          </div>
          <h1>{scholarship.nama}</h1>
          <p className="student-hero-description">
            {scholarship.deskripsi?.trim() || "Ambil kesempatan untuk mendukung perjalanan akademik dan meraih masa depan yang lebih baik."}
          </p>
          <div className="student-hero-meta">
            <span><CalendarDays size={16} /> Pendaftaran ditutup {closeDate}</span>
            <span><span className="student-hero-gold-dot" /> Kuota {scholarship.kuota} mahasiswa</span>
          </div>
          <Link href={`/apply/${scholarship.id}`} className="student-hero-cta" tabIndex={index === activeIndex ? 0 : -1}>
            Lihat beasiswa <ArrowRight size={17} />
          </Link>
        </div>
      </article>
    )
  }

  return (
    <section
      className="student-scholarship-hero"
      aria-label="Program beasiswa yang sedang dibuka"
      aria-roledescription="carousel"
    >
      <div
        className="student-hero-slides"
        style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        aria-live="off"
      >
        {scholarships.length > 0 ? scholarships.map(renderSlide) : (
          <article className="student-hero-slide student-hero-empty" aria-hidden="false">
            <div className="student-hero-copy student-hero-copy-empty">
              <div className="student-hero-kicker">
                <span className="student-hero-kicker-mark"><GraduationCap size={16} /></span>
                Portal beasiswa SINERGI
              </div>
              <h1>Raih kesempatan untuk masa depanmu</h1>
              <p className="student-hero-description">
                Belum ada pendaftaran beasiswa yang dibuka saat ini. Lengkapi profilmu dan cek kembali nanti.
              </p>
              <Link href="/profile" className="student-hero-cta">Lengkapi profil <ArrowRight size={17} /></Link>
            </div>
          </article>
        )}
      </div>

      {scholarships.length > 1 && (
        <div className="student-hero-controls" aria-label="Pilih beasiswa">
          <span className="student-hero-count">
            {String(activeIndex + 1).padStart(2, "0")} <i>/</i> {String(scholarships.length).padStart(2, "0")}
          </span>
          <div className="student-hero-dots">
            {scholarships.map((scholarship, index) => (
              <button
                key={scholarship.id}
                type="button"
                aria-label={`Tampilkan ${scholarship.nama}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={index === activeIndex ? "student-hero-dot is-active" : "student-hero-dot"}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
