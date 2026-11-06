import { Resend } from "resend"

// Initialize Resend client if API key is provided
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailRecipient {
  userId: string
  email: string
  name: string
  passed: boolean
  ranking: number
  netScore: number
}

export function buildPublicationEmailHtml(params: {
  periodName: string
  recipientName: string
  passed: boolean
  quota: number
  portalUrl?: string
}): { subject: string; html: string; text: string } {
  const { periodName, recipientName, passed, quota, portalUrl = "https://beasiswa.univ.ac.id" } = params

  if (passed) {
    const subject = `[PENGUMUMAN] Selamat, Anda Lolos Seleksi Beasiswa ${periodName}`
    const text = `Halo ${recipientName},\n\nSelamat! Berdasarkan hasil evaluasi multikriteria ELECTRE I, Anda dinyatakan LOLOS seleksi penerima beasiswa ${periodName} dalam kuota ${quota} mahasiswa.\n\nSilakan masuk ke portal beasiswa untuk melihat detail nilai dan petunjuk verifikasi berkas fisik:\n${portalUrl}/dashboard\n\nSalam,\nPanitia Seleksi Beasiswa`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #10b981;">
          <h2 style="color: #065f46; margin: 0;">Pengumuman Hasil Seleksi Beasiswa</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">${periodName}</p>
        </div>
        <div style="padding: 24px 0;">
          <h3 style="color: #0f172a; margin-top: 0;">Selamat, ${recipientName}!</h3>
          <p style="color: #334155; line-height: 1.6; font-size: 14px;">
            Berdasarkan rapat penetapan hasil seleksi menggunakan metode ELECTRE I, Anda dinyatakan 
            <strong style="color: #059669;">LOLOS</strong> sebagai penerima beasiswa program <strong>${periodName}</strong> dengan kuota <strong>${quota} mahasiswa</strong>.
          </p>
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: bold;">Langkah Selanjutnya:</p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #047857;">
              <li>Periksa kelengkapan berkas fisik asli Anda.</li>
              <li>Lakukan verifikasi berkas di kantor kemahasiswaan paling lambat 7 hari kerja.</li>
              <li>Pantau informasi penandatanganan SPK beasiswa.</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${portalUrl}/dashboard" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
              Buka Portal & Lihat Hasil Lengkap
            </a>
          </div>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          Email ini dibuat secara otomatis oleh Sistem Seleksi Beasiswa ELECTRE. Mohon tidak membalas email ini.
        </div>
      </div>
    `
    return { subject, html, text }
  } else {
    const subject = `[PENGUMUMAN] Informasi Hasil Seleksi Beasiswa ${periodName}`
    const text = `Halo ${recipientName},\n\nTerima kasih atas partisipasi Anda dalam seleksi beasiswa ${periodName}. Berdasarkan keterbatasan kuota penerima (${quota} mahasiswa), saat ini Anda belum berhasil lolos.\n\nTetap semangat dalam studi dan pantau peluang beasiswa pada periode berikutnya.\n\nSalam,\nPanitia Seleksi Beasiswa`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #64748b;">
          <h2 style="color: #1e293b; margin: 0;">Pengumuman Hasil Seleksi Beasiswa</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">${periodName}</p>
        </div>
        <div style="padding: 24px 0;">
          <h3 style="color: #0f172a; margin-top: 0;">Halo, ${recipientName}</h3>
          <p style="color: #334155; line-height: 1.6; font-size: 14px;">
            Terima kasih atas dedikasi dan keikutsertaan Anda dalam seleksi <strong>${periodName}</strong>.
            Berdasarkan hasil penilaian komprehensif seluruh kriteria serta keterbatasan kuota sebanyak <strong>${quota} mahasiswa</strong>, saat ini Anda belum berhasil masuk ke dalam kuota terpilih.
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 14px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #334155;">
              Jangan berkecil hati. Perjalanan akademik Anda masih sangat panjang. Terus tingkatkan prestasi dan pantau program beasiswa lain pada semester mendatang.
            </p>
          </div>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${portalUrl}/dashboard" style="background-color: #475569; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
              Buka Dashboard Mahasiswa
            </a>
          </div>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          Email ini dibuat secara otomatis oleh Sistem Seleksi Beasiswa ELECTRE.
        </div>
      </div>
    `
    return { subject, html, text }
  }
}
