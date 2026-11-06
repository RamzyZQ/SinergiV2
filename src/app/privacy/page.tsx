import * as React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Kebijakan Privasi — SINERGI Beasiswa",
  description: "Kebijakan privasi dan transparansi perlindungan data pelamar beasiswa mahasiswa.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Kembali
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground">
            Terakhir diperbarui: 5 November 2024
          </span>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-6 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <ShieldCheck className="size-5" />
              <span>Transparansi & Perlindungan Data</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Kebijakan Privasi dan Perlindungan Data Pelamar Beasiswa
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistem Seleksi Beasiswa SINERGI berkomitmen menjaga keamanan dan
              kerahasiaan data pribadi mahasiswa sesuai prinsip perlindungan
              data dan kepatuhan hukum yang berlaku di Indonesia.
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <FileText className="size-4 text-primary" />
                <h3>1. Data yang Dikumpulkan</h3>
              </div>
              <p>
                Untuk keperluan verifikasi dan perhitungan perangkingan beasiswa,
                sistem mengumpulkan data berikut:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Identitas Dasar:</strong>{" "}
                  Nama lengkap, NIM, Program Studi, Semester, dan Alamat Email.
                </li>
                <li>
                  <strong className="text-foreground">Data Akademik:</strong>{" "}
                  Indeks Prestasi Kumulatif (IPK), Transkrip Nilai resmi.
                </li>
                <li>
                  <strong className="text-foreground">Data Sosial Ekonomi:</strong>{" "}
                  Penghasilan orang tua/wali, slip gaji/surat keterangan tidak mampu, jumlah tanggungan.
                </li>
                <li>
                  <strong className="text-foreground">Data Pendukung:</strong>{" "}
                  Sertifikat prestasi, keaktifan organisasi, dan surat rekomendasi.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <Lock className="size-4 text-primary" />
                <h3>2. Tujuan Pemrosesan Data</h3>
              </div>
              <p>
                Data yang diunggah hanya diproses untuk tujuan:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-2 text-muted-foreground">
                <li>Validasi keabsahan status mahasiswa aktif dan berkas fisik.</li>
                <li>
                  Penentuan skor kriteria menggunakan algoritma Sistem Pendukung
                  Keputusan <strong>ELECTRE I (Elimination and Choice Expressing
                  Reality)</strong> dengan perangkingan <em>Net Dominance</em>.
                </li>
                <li>
                  Pemberitahuan hasil kelulusan beasiswa dan pencatatan audit log
                  seleksi.
                </li>
              </ol>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <Eye className="size-4 text-primary" />
                <h3>3. Akses Data dan Batasan Data Sensitif</h3>
              </div>
              <p>
                Akses terhadap berkas dibatasi secara ketat menggunakan mekanisme{" "}
                <em>Row Level Security (RLS)</em> di level basis data:
              </p>
              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                <strong>Ketentuan Data Sensitif:</strong> Data penghasilan dan slip gaji orang tua dianggap sebagai data sensitif. Informasi ini tidak akan ditampilkan pada tabel daftar umum pelamar dan hanya dapat ditinjau oleh verifikator resmi dalam panel verifikasi tertutup.
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-base text-foreground">
                <Trash2 className="size-4 text-primary" />
                <h3>4. Retensi dan Hak Penghapusan Data</h3>
              </div>
              <p>
                Data pelamar disimpan selama periode seleksi berlangsung ditambah 1
                (satu) tahun kalender untuk keperluan pelaporan dan audit akademik.
                Setelah masa retensi berakhir, dokumen berkas digital akan
                dihapus permanen dari storage sistem.
              </p>
              <p>
                Mahasiswa berhak mengajukan permohonan pembatalan pendaftaran dan
                penghapusan data selama periode seleksi masih dalam status{" "}
                <em>Draf</em> atau melalui surat permohonan resmi ke panitia
                beasiswa universitas.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
