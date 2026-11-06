import ExcelJS from "exceljs"

export interface ExportData {
  periodName: string
  quota: number
  thresholdC: number
  thresholdD: number
  cutoffNetScore: number
  totalPassed: number
  totalApplicants: number
  criteria: Array<{
    id: string
    name: string
    type: "benefit" | "cost"
    weight: number
  }>
  rankings: Array<{
    ranking: number
    name: string
    nim: string
    prodi: string
    dominasi: number
    didominasi: number
    netScore: number
    passed: boolean
    scores: Record<string, number>
  }>
  aggregateDominanceMatrix?: number[][]
}

export async function generateScholarshipExcel(data: ExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Sinergi ELECTRE Scholarship System"
  workbook.created = new Date()

  // -------------------------------------------------------------------------
  // SHEET 1: Hasil & Perankingan
  // -------------------------------------------------------------------------
  const sheet1 = workbook.addWorksheet("Hasil & Perankingan", {
    views: [{ showGridLines: true }],
  })

  // Title Block
  sheet1.mergeCells("A1:H1")
  const titleCell = sheet1.getCell("A1")
  titleCell.value = `HASIL SELEKSI BEASISWA: ${data.periodName.toUpperCase()}`
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }
  sheet1.getRow(1).height = 32

  // Metadata Subtitle
  sheet1.mergeCells("A2:H2")
  const metaCell = sheet1.getCell("A2")
  metaCell.value = `Kuota Penerima: ${data.quota} Mahasiswa | Batas Skor Lolos: ${data.cutoffNetScore} | Total Pelamar: ${data.totalApplicants}`
  metaCell.font = { italic: true, size: 10, color: { argb: "FF334155" } }
  metaCell.alignment = { vertical: "middle", horizontal: "center" }
  sheet1.getRow(2).height = 20

  sheet1.addRow([]) // empty row 3

  // Table Headers
  const headers = [
    "Peringkat",
    "Nama Lengkap",
    "NIM",
    "Program Studi",
    "Dominasi (E+)",
    "Didominasi (E-)",
    "Net Score",
    "Status Kelulusan",
  ]
  const headerRow = sheet1.addRow(headers)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" }, // Blue
    }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }
  })

  // Table Rows
  data.rankings.forEach((r, idx) => {
    const row = sheet1.addRow([
      `#${r.ranking}`,
      r.name,
      r.nim || "-",
      r.prodi || "-",
      r.dominasi,
      r.didominasi,
      r.netScore > 0 ? `+${r.netScore}` : r.netScore,
      r.passed ? "LOLOS KUOTA" : "TIDAK LOLOS",
    ])
    row.height = 20

    // Alternate shading
    const isEven = idx % 2 === 0
    row.eachCell((cell, colNumber) => {
      cell.font = { size: 10 }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        }
      }

      // Center aligns
      if ([1, 3, 5, 6, 7, 8].includes(colNumber)) {
        cell.alignment = { vertical: "middle", horizontal: "center" }
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" }
      }

      // Highlight status
      if (colNumber === 8) {
        cell.font = {
          bold: true,
          size: 10,
          color: { argb: r.passed ? "FF166534" : "FF991B1B" },
        }
      }
    })
  })

  // Column widths
  sheet1.columns = [
    { width: 12 },
    { width: 30 },
    { width: 18 },
    { width: 25 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 18 },
  ]

  // -------------------------------------------------------------------------
  // SHEET 2: Matriks Keputusan (X)
  // -------------------------------------------------------------------------
  const sheet2 = workbook.addWorksheet("Matriks Keputusan (X)", {
    views: [{ showGridLines: true }],
  })

  const critHeaders = ["Peringkat", "Nama Pelamar", ...data.criteria.map((c) => `${c.name} (${c.weight}%)`)]
  const row2Header = sheet2.addRow(critHeaders)
  row2Header.height = 24
  row2Header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" },
    }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })

  data.rankings.forEach((r) => {
    const vals = data.criteria.map((c) => r.scores[c.id] ?? 0)
    const row = sheet2.addRow([`#${r.ranking}`, r.name, ...vals])
    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { size: 10 }
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber <= 2 ? "left" : "center",
      }
    })
  })

  sheet2.columns = [
    { width: 12 },
    { width: 28 },
    ...data.criteria.map(() => ({ width: 20 })),
  ]

  // -------------------------------------------------------------------------
  // SHEET 3: Parameter & Kriteria
  // -------------------------------------------------------------------------
  const sheet3 = workbook.addWorksheet("Parameter & Kriteria", {
    views: [{ showGridLines: true }],
  })

  sheet3.addRow(["Parameter Sistem", "Nilai"])
  sheet3.addRow(["Nama Periode", data.periodName])
  sheet3.addRow(["Kuota Penerima", data.quota])
  sheet3.addRow(["Threshold Concordance (c)", data.thresholdC])
  sheet3.addRow(["Threshold Discordance (d)", data.thresholdD])
  sheet3.addRow(["Garis Batas Lolos (Net Score)", data.cutoffNetScore])
  sheet3.addRow([])

  sheet3.addRow(["ID Kriteria", "Nama Kriteria", "Tipe", "Bobot (%)"])
  data.criteria.forEach((c) => {
    sheet3.addRow([c.id, c.name, c.type.toUpperCase(), c.weight])
  })

  sheet3.columns = [{ width: 25 }, { width: 30 }, { width: 15 }, { width: 15 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
