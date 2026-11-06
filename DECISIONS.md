# Keputusan Desain — Seleksi Beasiswa ELECTRE

Log keputusan teknis yang diambil selama pengembangan.

---

## D001 — Single SQL migration file
**Tanggal:** 2024-11-05
**Konteks:** Spec meminta 12 file migration terpisah.
**Keputusan:** Menggunakan beberapa file migration berurut agar mudah di-review dan rollback per bagian.
**Alasan:** Supabase migrations menjalankan file secara berurutan berdasarkan nama. File terpisah memudahkan debugging.

## D002 — Auth trigger auto-create profile + role
**Tanggal:** 2024-11-05
**Keputusan:** Trigger `on_auth_user_created` otomatis membuat record di `profiles` dan `user_roles` (default `student`).
**Alasan:** Menjamin setiap user yang register pasti punya profile dan role, menghindari state inconsistent.

## D003 — Enum types di database
**Tanggal:** 2024-11-05
**Keputusan:** Menggunakan PostgreSQL custom enum types (bukan check constraint text).
**Alasan:** Type safety di level database, auto-complete di tools, dan migrasi yang jelas saat menambah value.

## D004 — `cn` package vs manual clsx+twMerge
**Tanggal:** 2024-11-05
**Keputusan:** Menggunakan package `cn` yang sudah terinstall (wraps clsx + tailwind-merge).
**Alasan:** Sudah ada di project, konsisten dengan shadcn/ui setup.

## D005 — Admin seeding via migration
**Tanggal:** 2024-11-05
**Keputusan:** Menyediakan seed migration terpisah yang bisa dijalankan manual untuk membuat admin pertama.
**Alasan:** Reproducible, bisa dimodifikasi sebelum diterapkan.

## D006 — Font: Geist Sans + Geist Mono
**Tanggal:** 2024-11-05
**Keputusan:** Tetap pakai font Geist yang sudah di-setup di project.
**Alasan:** Modern, readable, sudah terkonfigurasi.

## D007 — Sidebar shadcn/ui untuk admin layout
**Tanggal:** 2024-11-05
**Keputusan:** Menggunakan komponen Sidebar dari shadcn/ui untuk admin layout.
**Alasan:** Konsisten dengan design system, responsif, keyboard accessible.

## D008 — Bahasa UI Indonesia, kode/variabel Inggris
**Tanggal:** 2024-11-05
**Keputusan:** UI labels dalam Bahasa Indonesia, tapi nama variabel, function, component tetap Inggris.
**Alasan:** Memisahkan concern UI (user-facing) dari code (developer-facing). Kolom DB mengikuti spec (mix Indonesia).

## D009 — Wizard Pendaftaran 5 Langkah dengan Pemetaan Kriteria Dinamis
**Tanggal:** 2024-11-05
**Keputusan:** Wizard 5 langkah memetakan kriteria periode beasiswa secara dinamis berdasarkan nama kriteria & jenis dokumen, dengan dukungan skala rentang nilai (dropdown) dan penyimpanan otomatis (auto-save debounced).
**Alasan:** Memudahkan mahasiswa mengisi formulir tanpa kebingungan teknis, mencegah input di luar rentang skala ELECTRE, dan menjaga data tidak hilang saat koneksi terputus.

## D010 — Penanganan Upload Dokumen Private Storage & Signed URL
**Tanggal:** 2024-11-05
**Keputusan:** File dokumen disimpan di Supabase Storage private bucket `documents` dengan pola path `{periodId}/{userId}/{jenis}/{fileName}` dan hanya diakses menggunakan signed URL berumur pendek (300 detik).
**Alasan:** Menjaga kerahasiaan dokumen pribadi pelamar (slip gaji, transkrip) sesuai prinsip keamanan RLS.

## D011 — Validasi Transisi Siklus Periode di Sisi Server
**Tanggal:** 2024-11-05
**Keputusan:** Setiap transisi siklus periode (Draft -> Open -> Closed -> Verification -> Calculated -> Published) divalidasi ketat di Server Actions berdasarkan checklist prasyarat (total bobot = 100%, kuota > 0, semua kriteria berskala valid, dan seluruh pelamar terverifikasi sebelum masuk kalkulasi).
**Alasan:** Mencegah ketidakkonsistenan data dan menjamin integritas input untuk mesin algoritma ELECTRE I.

## D012 — Perlindungan Data Sensitif pada Layout Verifikasi Dua Panel
**Tanggal:** 2024-11-05
**Keputusan:** Data penghasilan dan slip gaji orang tua disembunyikan sepenuhnya dari tabel/daftar pencarian pelamar di panel kiri, dan hanya dapat dilihat di panel detail verifikator di sebelah kanan.
**Alasan:** Sesuai prinsip *privacy by design* dan spesifikasi keamanan data sensitif.

## D013 — Arsitektur Pure Function Mesin ELECTRE I
**Tanggal:** 2024-11-05
**Keputusan:** Seluruh modul perhitungan ELECTRE I di `src/lib/electre/` dirancang murni (*pure functions*, deterministik, tanpa I/O database) dan mengembalikan seluruh matriks perantara (X, R, V, C, D, F, G, E, net score, tie-break rank).
**Alasan:** Memudahkan unit testing, reproduktifitas audit log, dan visualisasi interaktif pada stepper kalkulasi dan heatmap.

## D014 — Penanganan Kasus Tepi Discordance (Pembagi Nol & Himpunan Kosong)
**Tanggal:** 2024-11-05
**Keputusan:** Pada kalkulasi discordance $D_{kl}$, jika $D(k,l) = \emptyset$ maka $D_{kl} = 0$. Jika penyebut $\max_j |v_{kj} - v_{lj}| = 0$ (seluruh nilai kriteria dua alternatif identik), maka $D_{kl} = 0$.
**Alasan:** Menghindari nilai `NaN` atau `Infinity` saat ada pelamar dengan profil nilai kriteria yang sama persis.

## D015 — Visualisasi Hasil Admin & Komparasi Outranking Berdampingan
**Tanggal:** 2024-11-05
**Keputusan:** Visualisasi hasil admin menyajikan Bar Chart Horizontal Top N dengan garis batas kuota, modal Radar Chart kriteria kandidat vs rata-rata seluruh pelamar, serta fitur komparasi berdampingan 2–3 pelamar yang mengungkap relasi outranking ELECTRE I (dominasi agregat $E$, indeks concordance $C$, discordance $D$).
**Alasan:** Memungkinkan tim pengambil keputusan memahami secara transparan mengapa seorang kandidat mengungguli kandidat lainnya secara terperinci.

## D016 — Halaman Hasil Mahasiswa Empatik & Zero Data Leakage
**Tanggal:** 2024-11-05
**Keputusan:** Halaman pengumuman hasil mahasiswa (`/result/[periodId]`) dirancang mobile-first, mengedepankan komunikasi empatik (pesan suportif bagi yang belum lolos dan instruksi langkah berikutnya bagi yang lolos), menyajikan posisi skor terhadap batas kelulusan dan diagram radar pribadi, tanpa membocorkan data pribadi atau skor mahasiswa lain (*zero data leakage*). Istilah teknis ("concordance", "discordance") diganti dengan terminologi awam yang mudah dipahami ("skor akhir", "batas lolos").
**Alasan:** Mematuhi etika privasi data pelamar, menjaga kenyamanan psikologis mahasiswa, dan memenuhi spesifikasi keamanan RLS.

## D017 — Arsitektur Modul Komparasi SPK (SAW & TOPSIS) dan Korelasi Spearman
**Tanggal:** 2024-11-05
**Keputusan:** Membangun modul pure function `lib/compare/` untuk metode SAW (Simple Additive Weighting) dan TOPSIS (Technique for Order Preference by Similarity to Ideal Solution), serta mengkalkulasi koefisien korelasi peringkat Spearman ($r_s$) terhadap ELECTRE I.
**Alasan:** Memberikan transparansi metodologis dan validasi silang multi-metode kepada panitia seleksi, membuktikan objektivitas dan konsistensi pengambilan keputusan.

## D018 — Analisis Sensitivitas Dinamis & Proteksi Hasil Resmi
**Tanggal:** 2024-11-05
**Keputusan:** Slider penyesuaian bobot kriteria pada halaman analisis menghitung ulang ranking ELECTRE secara reaktif di browser dan memetakan dampaknya melalui Slope Chart (identifikasi kandidat yang masuk atau keluar dari kuota). Fitur simpan hanya menulis record sebagai `tipe: "simulation"`.
**Alasan:** Memfasilitasi simulasi *what-if* tanpa risiko merusak integritas atau menimpa *Official Run* yang telah disahkan.

## D019 — Multi-Format Export (ExcelJS & React-PDF)
**Tanggal:** 2024-11-05
**Keputusan:** Menyediakan dua jalur ekspor resmi via Route Handler: (1) Excel (.xlsx via ExcelJS) multi-sheet yang memuat seluruh riwayat matriks matematis untuk keperluan audit teknis, dan (2) PDF resmi (@react-pdf/renderer) berformat Surat Keputusan (SK) penetapan penerima beasiswa lengkap dengan lembar tanda tangan pengesahan.
**Alasan:** Memenuhi kebutuhan administratif perguruan tinggi baik untuk pengolahan data tabular maupun pengarsipan surat keputusan pimpinan.

## D020 — Integrasi Email Notifikasi Resend dengan Fallback Aman
**Tanggal:** 2024-11-05
**Keputusan:** Distribusi notifikasi pengumuman saat publikasi terintegrasi dengan Resend API menggunakan template HTML responsif dwibahasa untuk kandidat lolos dan belum lolos, dengan mekanisme fallback pencatatan log ke database `notifications` dan `audit_logs` jika kunci API belum dikonfigurasi.
**Alasan:** Memastikan alur komunikasi tidak memblokir proses publikasi jika terjadi kendala pada gateway email pihak ketiga.

## D021 — Dashboard Admin Interaktif: Donut Chart Distribusi Status & Daftar Perlu Ditindak
**Tanggal:** 2024-11-05
**Keputusan:** Halaman utama admin (`/admin`) dilengkapi dengan 4 kartu metrik KPI (Total Pelamar, Perlu Verifikasi, Total Kuota, dan Garis Batas Lolos), daftar aksi dinamis "Perlu Ditindak" dengan tautan langsung ke antrean dokumen atau kalkulasi tertunda, serta diagram Donut interaktif proporsi status pelamar yang dapat diklik untuk memfilter daftar pelamar secara langsung.
**Alasan:** Meningkatkan efisiensi kerja administrator dan panitia penyeleksi beasiswa agar dapat segera mengenali titik kemacetan (*bottleneck*) tanpa harus menelusuri menu secara manual.

## D022 — Komponen Loading Skeleton Berlapis untuk Optimasi Perceived Performance
**Tanggal:** 2024-11-05
**Keputusan:** Menyediakan file `loading.tsx` berbasis komponen atomik `Skeleton` di seluruh rute utama, meliputi Admin Dashboard, Workspace Periode, Dashboard Mahasiswa, Wizard Pendaftaran, dan Pengumuman Hasil.
**Alasan:** Mengoptimalkan *perceived performance* dan mencegah *layout shift* (CLS) saat data asynchronous sedang diambil dari server atau database Supabase.

## D023 — Pengujian End-to-End (Playwright) & Verifikasi Skenario Keamanan RLS 3 Akun
**Tanggal:** 2024-11-05
**Keputusan:** Menyiapkan konfigurasi Playwright E2E testing terpadu (`playwright.config.ts`) dengan cakupan uji alur mahasiswa (autentikasi, pendaftaran, kebijakan privasi), alur admin (proteksi rute workspace), serta membuat rangkaian uji Vitest (`tests/rls-security.test.ts`) yang memverifikasi ketat aturan isolasi multi-tenant Row Level Security (RLS) dengan 3 akun (Mahasiswa A, Mahasiswa B, Admin), proteksi berkas *private storage* ber-URL kedaluwarsa cepat, dan *append-only audit log*.
**Alasan:** Menjamin kepatuhan standar keamanan sistem beasiswa dan integritas data kandidat terhadap kebocoran antar pengguna.

## D024 — Audit Aksesibilitas (WCAG 2.1), Desain Responsif Dwimode, dan Metadata SEO Komprehensif
**Tanggal:** 2024-11-05
**Keputusan:** Menerapkan pendekatan *mobile-first* pada antarmuka mahasiswa dan *desktop-first* pada workspace admin, melengkapi setiap halaman dengan deklarasi metadata Next.js yang informatif, serta memastikan elemen interaktif (form, dialog, modal komparasi, dan grafik visualisasi) memiliki kontras yang memadai dan atribut aksesibilitas standar.
**Alasan:** Memberikan kenyamanan pengalaman pengguna yang inklusif di berbagai resolusi perangkat seluler maupun monitor kerja.



