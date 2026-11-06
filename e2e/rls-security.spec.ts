import { test, expect } from "@playwright/test"

test.describe("Keamanan API & Isolasi RLS Data", () => {
  test("Endpoint ekspor Excel (.xlsx) menolak akses yang tidak terautentikasi (401)", async ({ request }) => {
    const response = await request.get("/api/export/00000000-0000-0000-0000-000000000001/excel")
    expect(response.status()).toBe(401)
    const json = await response.json()
    expect(json).toHaveProperty("error")
  })

  test("Endpoint ekspor PDF SK resmi menolak akses yang tidak terautentikasi (401)", async ({ request }) => {
    const response = await request.get("/api/export/00000000-0000-0000-0000-000000000001/pdf")
    expect(response.status()).toBe(401)
    const json = await response.json()
    expect(json).toHaveProperty("error")
  })
})
