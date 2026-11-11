import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseApplicantImportRows } from "@/lib/import/applicant-import"

const criteria = ["IP", "Penghasilan Orang Tua"]

describe("parseApplicantImportRows", () => {
  it("accepts the attached scholarship test dataset", () => {
    const csv = readFileSync(
      resolve(process.cwd(), "tests/fixtures/mahasiswa-beasiswa-prestasi.csv"),
      "utf8"
    )
    const rows = csv
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(",").map((cell) => cell.replace(/^"|"$/g, "")))

    const applicants = parseApplicantImportRows(rows, [
      "IP",
      "Penghasilan Orang Tua",
      "Jumlah Tanggungan",
      "Sertifikat Prestasi",
    ])

    expect(applicants).toHaveLength(10)
    expect(applicants[0]).toMatchObject({
      alternative: "A01",
      name: "Mhs_001",
      values: {
        IP: 3.62,
        "Penghasilan Orang Tua": 3575000,
        "Jumlah Tanggungan": 3,
        "Sertifikat Prestasi": 4,
      },
    })
  })

  it("parses numeric values and Indonesian thousands separators", () => {
    const applicants = parseApplicantImportRows(
      [
        ["Alternatif", "Nama Mahasiswa", "IP", "Penghasilan Orang Tua"],
        ["A01", "Mhs_001", "3,62", "3.575.000"],
      ],
      criteria
    )

    expect(applicants).toEqual([
      {
        alternative: "A01",
        name: "Mhs_001",
        values: { IP: 3.62, "Penghasilan Orang Tua": 3575000 },
      },
    ])
  })

  it("matches headers without regard to case or surrounding spaces", () => {
    const applicants = parseApplicantImportRows(
      [
        [" alternatif ", "NAMA MAHASISWA", "ip", "penghasilan orang tua"],
        ["A01", "Mhs_001", 3.62, 3575000],
      ],
      criteria
    )

    expect(applicants).toHaveLength(1)
  })

  it("rejects duplicate alternatives and missing criteria", () => {
    expect(() =>
      parseApplicantImportRows(
        [
          ["Alternatif", "Nama Mahasiswa", "IP", "Penghasilan Orang Tua"],
          ["A01", "Mhs_001", 3.62, 3575000],
          ["a01", "Mhs_002", 3.14, 2786000],
        ],
        criteria
      )
    ).toThrow('kode alternatif "a01" tercantum lebih dari sekali')

    expect(() =>
      parseApplicantImportRows(
        [["Alternatif", "Nama Mahasiswa", "IP"], ["A01", "Mhs_001", 3.62]],
        criteria
      )
    ).toThrow('Kolom untuk kriteria "Penghasilan Orang Tua" tidak ditemukan.')
  })

  it("rejects invalid numeric values with their row and criterion", () => {
    expect(() =>
      parseApplicantImportRows(
        [
          ["Alternatif", "Nama Mahasiswa", "IP", "Penghasilan Orang Tua"],
          ["A01", "Mhs_001", "bukan angka", 3575000],
        ],
        criteria
      )
    ).toThrow('Baris 2: nilai untuk kriteria "IP" harus berupa angka.')
  })
})
