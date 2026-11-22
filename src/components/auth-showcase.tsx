import Image from "next/image"

export function AuthShowcase() {
  return (
    <aside className="auth-showcase">
      <div className="showcase-copy">
        <div className="showcase-brand">
          <Image
            src="/images/brand/sinergi-logo-white.png"
            alt="SINERGI"
            width={1080}
            height={360}
            priority
            className="auth-showcase-logo"
          />
        </div>
        <div className="showcase-main">
          <h2>Seleksi adil dimulai dari data terukur.</h2>
          <p>SINERGI memakai ELECTRE I dan Net Dominance untuk pemeringkatan beasiswa yang transparan.</p>
          <div className="showcase-tags" aria-label="Keunggulan seleksi">
            <span>Metode ELECTRE I</span>
            <span>Transparan</span>
            <span>Berbasis data</span>
            <span>Audit Log</span>
          </div>
        </div>
        <div className="showcase-footer">
          <div className="showcase-flow" aria-label="Tahapan seleksi">
            <span>Daftar</span><i>→</i><span>Verifikasi</span><i>→</i><span>Kalkulasi</span><i>→</i><span>Hasil</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
