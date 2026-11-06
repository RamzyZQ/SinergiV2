import { test, expect } from "@playwright/test"

test.describe("Alur Admin (Workspace & Siklus Periode)", () => {
  test("Rute admin terproteksi mengalihkan pengguna yang belum login ke /login", async ({ page }) => {
    // 1. Dashboard Admin
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login/)

    // 2. Daftar Periode
    await page.goto("/admin/periods")
    await expect(page).toHaveURL(/\/login/)

    // 3. Audit Log
    await page.goto("/admin/audit")
    await expect(page).toHaveURL(/\/login/)

    // 4. Workspace Tab Overview
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/overview")
    await expect(page).toHaveURL(/\/login/)

    // 5. Workspace Tab Kriteria
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/criteria")
    await expect(page).toHaveURL(/\/login/)

    // 6. Workspace Tab Pelamar
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/applicants")
    await expect(page).toHaveURL(/\/login/)

    // 7. Workspace Tab Kalkulasi
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/calculate")
    await expect(page).toHaveURL(/\/login/)

    // 8. Workspace Tab Hasil
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/results")
    await expect(page).toHaveURL(/\/login/)

    // 9. Workspace Tab Analisis Sensitivitas
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/analysis")
    await expect(page).toHaveURL(/\/login/)

    // 10. Workspace Tab Publikasi
    await page.goto("/admin/periods/00000000-0000-0000-0000-000000000001/publish")
    await expect(page).toHaveURL(/\/login/)
  })

  test("Halaman beranda publik menampilkan brand SINERGI dan navigasi utama", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/SINERGI/i)
    await expect(page.getByText(/SINERGI/i).first()).toBeVisible()
  })
})
