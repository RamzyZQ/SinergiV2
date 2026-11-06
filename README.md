# SINERGI — Seleksi Beasiswa Mahasiswa (ELECTRE I + Net Dominance)

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-yellow?logo=vitest)](https://vitest.dev/)

Aplikasi Sistem Pendukung Keputusan (SPK) berbasis web untuk seleksi penerimaan beasiswa mahasiswa menggunakan metode **ELECTRE I** yang disempurnakan dengan pemeringkatan **Net Dominance** (jumlah yang didominasi − jumlah yang mendominasi).

Dibangun dengan prinsip:
- **Efisien**: Kalkulasi deterministik di server dengan arsitektur *pure function*.
- **Transparan**: Snapshot matematis lengkap di setiap eksekusi, visualisasi heatmap interaktif, dan riwayat *audit log* append-only.
- **Aman**: Keamanan berbasis Row Level Security (RLS) di database PostgreSQL, proteksi data sensitif, dan penyimpanan berkas *private storage* ber-URL kedaluwarsa cepat (*signed URLs*).
- **Mudah Dipahami**: UI ramah pengguna dengan visualisasi interaktif (Recharts), komparasi multi-metode (SAW & TOPSIS), analisis sensitivitas bobot, dan halaman pengumuman mahasiswa berorientasi empatik (*zero data leakage*).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript, Server Actions & Route Handlers)
- **Database & Auth:** Supabase (`@supabase/ssr`, PostgreSQL, Storage bucket privat, Row Level Security)
- **Styling & Komponen UI:** Tailwind CSS v4, shadcn/ui, Lucide Icons, Sonner Toast
- **Visualisasi & Grafik:** Recharts (Horizontal Bar Chart, Radar Chart, Donut Status Distribution, Heatmap Matriks)
- **Formulir & Validasi:** React Hook Form, Zod v4, Auto-save draft pendaftaran
- **Ekspor Dokumen:** ExcelJS (buku kerja multi-sheet audit lengkap), `@react-pdf/renderer` (Surat Keputusan pengesahan resmi)
- **Notifikasi Email:** Resend API (HTML template responsif status kelulusan dengan fallback aman ke database)
- **Pengujian:** Vitest (unit test mesin ELECTRE, SAW, TOPSIS, korelasi Spearman, validasi siklus), Playwright (E2E alur mahasiswa, admin, & pengujian isolasi RLS)

---

## 📐 Siklus Hidup Periode Beasiswa

Alur seleksi mengikuti mesin status terpadu dengan validasi prasyarat ketat di sisi server:

```
[Draft] ──> [Open] ──> [Closed] ──> [Verification] ──> [Calculated] ──> [Published]
```

1. **Draft:** Admin menyiapkan kuota, tanggal batas, kriteria, bobot, dan skala rentang nilai. Indikator akumulasi bobot harus tepat 100%.
2. **Open:** Pendaftaran dibuka untuk mahasiswa (wizard 5 langkah dengan auto-save). Bobot dan kriteria terkunci otomatis demi integritas data.
3. **Closed:** Pendaftaran ditutup. Mahasiswa tidak dapat lagi mengubah data pendaftaran.
4. **Verification:** Panitia memverifikasi berkas pelamar dalam tata letak dua panel (*two-panel layout*) dengan template alasan penolakan cepat.
5. **Calculated:** Eksekusi kalkulasi matriks ELECTRE I menghasilkan snapshot resmi (*official run*) dan pemeringkatan Net Dominance beserta penanganan nilai imbang (*tie-breaking*).
6. **Published:** Hasil seleksi diumumkan ke mahasiswa, status pendaftaran disinkronkan, dan notifikasi email resmi dikirimkan.

---

## 🧮 Mesin ELECTRE I & Metodologi

Algoritma diimplementasikan sebagai *pure function* deterministik tanpa dependensi database di `src/lib/electre/`:

1. **Matriks Keputusan ($X$):** Dibentuk dari konversi nilai mentah ke skor berdasarkan skala kriteria.
2. **Normalisasi Vektor ($R$):** $r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k} x_{kj}^2}}$.
3. **Matriks Terbobot ($V$):** $v_{ij} = w_j \times r_{ij}$ dengan bobot normalisasi $\sum w_j = 1$.
4. **Himpunan Concordance & Discordance:**
   - Concordance $C(k, l)$: kriteria di mana alternatif $k$ setara atau lebih unggul dari $l$ (memperhitungkan benefit/cost).
   - Discordance $D(k, l)$: kriteria di mana alternatif $k$ lebih buruk dari $l$.
5. **Indeks Concordance ($c_{kl}$):** Akumulasi bobot kriteria dalam $C(k,l)$.
6. **Indeks Discordance ($d_{kl}$):** $\frac{\max_{j \in D} |v_{kj} - v_{lj}|}{\max_j |v_{kj} - v_{lj}|}$ (dengan penanganan batas pembagi nol).
7. **Matriks Dominansi & Agregat ($E$):** $e_{kl} = f_{kl} \times g_{kl}$ berdasarkan ambang batas $c$ dan $d$.
8. **Net Dominance & Tie-Breaking:**
   $$\text{Net Score}(k) = \sum_{l \neq k} e_{kl} - \sum_{l \neq k} e_{lk}$$
   Aturan *tie-breaking* otomatis: Skor Net $\rightarrow$ IPK tertinggi $\rightarrow$ Penghasilan orang tua terendah $\rightarrow$ Waktu pendaftaran terawal.

---

## 🚀 Memulai Instalasi Lokal

### 1. Prasyarat
- Node.js versi 20 atau yang lebih baru.
- Akun Supabase (lokal via Supabase CLI atau proyek di cloud).

### 2. Kloning Repositori & Instal Dependensi
```bash
git clone <repository-url>
cd sinerginew.v2

# Gunakan --legacy-peer-deps saat instalasi paket
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variables
Salin file template `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```
Lengkapi nilai konfigurasi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_api_key   # Opsional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Eksekusi Migrasi Database Supabase
Jalankan berkas migrasi SQL yang tersedia secara berurutan di `supabase/migrations/`:
1. `00001_enum_types.sql`
2. `00002_profiles.sql`
3. `00003_user_roles.sql`
4. `00004_scholarship_periods.sql`
5. `00005_criteria.sql`
6. `00006_criteria_scales.sql`
7. `00007_applications.sql`
8. `00008_application_values.sql`
9. `00009_documents.sql`
10. `00010_calculation_runs.sql`
11. `00011_calculation_results.sql`
12. `00012_audit_logs.sql`
13. `00013_storage.sql`

Untuk mengaktifkan akun admin pertama, jalankan perintah SQL:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<UUID_USER_SUPABASE>', 'admin');
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Akses aplikasi melalui browser di `http://localhost:3000`.

---

## 🧪 Skrip Pengujian & Quality Assurance

Proyek dilengkapi dengan pengujian unit, typecheck, linting, dan pengujian integrasi:

```bash
# Menjalankan seluruh pengujian unit (Vitest)
npm test

# Menjalankan typecheck TypeScript
npm run typecheck

# Menjalankan audit linting ESLint
npm run lint

# Menjalankan pengujian E2E (Playwright)
npm run test:e2e
```

---

## 📁 Struktur Direktori

```
src/
├── app/
│   ├── (admin)/admin/            # Workspace Admin: periode, kriteria, verifikasi, kalkulasi, hasil, publikasi
│   ├── (auth)/                   # Halaman Autentikasi: login, register, privasi
│   ├── (student)/                # Portal Mahasiswa: dashboard, profil, wizard daftar, pengumuman hasil
│   ├── api/export/               # Route Handler ekspor Excel (.xlsx) & PDF SK resmi
│   └── privacy/                  # Halaman kebijakan privasi & perlindungan data
├── components/                   # Komponen UI atomik, status badge, layout shell
├── lib/
│   ├── compare/                  # Mesin validasi silang SPK (SAW, TOPSIS, Spearman)
│   ├── electre/                  # Pure functions algoritma ELECTRE I & Net Dominance
│   ├── email/                    # Integrasi email notifikasi Resend & template responsif
│   ├── export/                   # Generator workbook ExcelJS & dokumen React-PDF
│   ├── supabase/                 # Klien Supabase (server, client, admin, middleware)
│   └── validators/               # Skema validasi Zod
└── types/                        # Definisi tipe TypeScript database & enum
```

---

## 🔒 Keamanan & Prinsip Privasi

- **Row Level Security (RLS):** Seluruh tabel memiliki kebijakan RLS aktif. Pengguna peran `student` hanya dapat mengakses baris miliknya, sedangkan peran `admin` diautentikasi melalui fungsi `is_admin()` berbasis SECURITY DEFINER.
- **Penyimpanan Berkas Privat:** Berkas dokumen (slip gaji, KK, transkrip) disimpan dalam bucket privat dan hanya dapat dibuka menggunakan URL bertanda tangan (*signed URL*) berdurasi 300 detik.
- **Perlindungan Data Sensitif:** Data penghasilan orang tua dilindungi dari daftar umum pelamar dan hanya ditampilkan di dalam panel detail verifikasi resmi panitia.
- **Audit Trail:** Segala manipulasi data bobot, perubahan siklus periode, dan eksekusi kalkulasi dicatat secara permanen di tabel `audit_logs` (*append-only*).

---

## 📖 Log Keputusan Desain

Daftar lengkap keputusan teknis arsitektur terdokumentasi di file [DECISIONS.md](./DECISIONS.md).
