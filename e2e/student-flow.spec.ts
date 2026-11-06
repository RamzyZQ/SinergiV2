import { test, expect } from "@playwright/test"

test.describe("Alur Mahasiswa (Portal & Wizard Beasiswa)", () => {
  test("Halaman publik login dapat diakses dan memuat formulir autentikasi", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveTitle(/Autentikasi|SINERGI/i)
    await expect(page.getByRole("heading", { name: /Masuk ke Akun/i })).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Kata Sandi/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /Masuk/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Daftar sekarang/i })).toBeVisible()
  })

  test("Halaman registrasi memiliki tautan persetujuan kebijakan privasi", async ({ page }) => {
    await page.goto("/register")
    await expect(page.getByRole("heading", { name: /Buat Akun Mahasiswa/i })).toBeVisible()
    await expect(page.getByLabel(/Nama Lengkap/i)).toBeVisible()
    await expect(page.getByLabel(/NIM/i)).toBeVisible()
    await expect(page.getByLabel(/Program Studi/i)).toBeVisible()
    await expect(page.getByLabel(/Semester/i)).toBeVisible()

    // Cek persetujuan privasi
    const privacyLink = page.getByRole("link", { name: /kebijakan privasi/i })
    await expect(privacyLink).toBeVisible()
    await privacyLink.click()
    await expect(page).toHaveURL(/\/privacy/)
  })

  test("Halaman Kebijakan Privasi memuat klausul perlindungan data lengkap", async ({ page }) => {
    await page.goto("/privacy")
    await expect(page.getByRole("heading", { name: /Kebijakan Privasi/i })).toBeVisible()
    await expect(page.getByText(/1\. Data yang Dikumpulkan/i)).toBeVisible()
    await expect(page.getByText(/2\. Tujuan Pengolahan Data/i)).toBeVisible()
    await expect(page.getByText(/3\. Pihak yang Mengakses Data/i)).toBeVisible()
    await expect(page.getByText(/4\. Retensi & Penyimpanan Data/i)).toBeVisible()
    await expect(page.getByText(/5\. Hak Mahasiswa/i)).toBeVisible()
  })

  test("Rute terproteksi mahasiswa mengalihkan pengguna yang belum login ke /login", async ({ page }) => {
    // 1. Dashboard mahasiswa
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)

    // 2. Profil mahasiswa
    await page.goto("/profile")
    await expect(page).toHaveURL(/\/login/)

    // 3. Wizard pendaftaran
    await page.goto("/apply/00000000-0000-0000-0000-000000000001")
    await expect(page).toHaveURL(/\/login/)

    // 4. Hasil seleksi beasiswa
    await page.goto("/result/00000000-0000-0000-0000-000000000001")
    await expect(page).toHaveURL(/\/login/)
  })
})
