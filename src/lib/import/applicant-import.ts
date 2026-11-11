export interface ImportedApplicant {
  alternative: string
  name: string
  values: Record<string, number>
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value !== "string" || !value.trim()) return null

  let normalized = value.trim().replace(/^rp\.?\s*/i, "").replace(/\s/g, "")
  if (!/^[+-]?\d+(?:[.,]\d+)*$/.test(normalized)) {
    return null
  }
  const lastComma = normalized.lastIndexOf(",")
  const lastDot = normalized.lastIndexOf(".")

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : "."
    const groupingSeparator = decimalSeparator === "," ? "." : ","
    normalized = normalized
      .split(groupingSeparator)
      .join("")
      .replace(decimalSeparator, ".")
  } else if (lastComma >= 0 || lastDot >= 0) {
    const separator = lastComma >= 0 ? "," : "."
    const parts = normalized.split(separator)
    const isThousandsGrouping =
      parts.length > 2 ||
      (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)

    normalized = isThousandsGrouping
      ? parts.join("")
      : parts.join(".")
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseApplicantImportRows(
  rows: unknown[][],
  criteriaNames: string[]
): ImportedApplicant[] {
  if (rows.length < 2) {
    throw new Error("Berkas harus berisi baris judul dan minimal satu data mahasiswa.")
  }

  const headers = rows[0].map((cell) =>
    normalizeHeader(typeof cell === "string" || typeof cell === "number" ? String(cell) : "")
  )
  const alternativeIndex = headers.findIndex((header) =>
    ["alternatif", "kode alternatif"].includes(header)
  )
  const nameIndex = headers.findIndex((header) =>
    ["nama mahasiswa", "nama"].includes(header)
  )

  if (alternativeIndex < 0 || nameIndex < 0) {
    throw new Error('Kolom wajib "Alternatif" dan "Nama Mahasiswa" tidak ditemukan.')
  }

  const criterionIndexes = criteriaNames.map((name) => {
    const index = headers.indexOf(normalizeHeader(name))
    if (index < 0) {
      throw new Error(`Kolom untuk kriteria "${name}" tidak ditemukan.`)
    }
    return { name, index }
  })

  const seenAlternatives = new Set<string>()
  const applicants: ImportedApplicant[] = []

  for (const [rowIndex, row] of rows.slice(1).entries()) {
    if (row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "")) {
      continue
    }

    const lineNumber = rowIndex + 2
    const alternative = String(row[alternativeIndex] ?? "").trim()
    const name = String(row[nameIndex] ?? "").trim()

    if (!alternative || !name) {
      throw new Error(`Baris ${lineNumber}: alternatif dan nama mahasiswa wajib diisi.`)
    }
    if (alternative.length > 50 || name.length > 120) {
      throw new Error(`Baris ${lineNumber}: alternatif maksimal 50 dan nama maksimal 120 karakter.`)
    }

    const normalizedAlternative = alternative.toLowerCase()
    if (seenAlternatives.has(normalizedAlternative)) {
      throw new Error(`Baris ${lineNumber}: kode alternatif "${alternative}" tercantum lebih dari sekali.`)
    }
    seenAlternatives.add(normalizedAlternative)

    const values: Record<string, number> = {}
    for (const criterion of criterionIndexes) {
      const value = parseNumericValue(row[criterion.index])
      if (value === null) {
        throw new Error(
          `Baris ${lineNumber}: nilai untuk kriteria "${criterion.name}" harus berupa angka.`
        )
      }
      values[criterion.name] = value
    }

    applicants.push({ alternative, name, values })
  }

  if (applicants.length === 0) {
    throw new Error("Tidak ada baris data mahasiswa yang dapat diimpor.")
  }
  if (applicants.length > 500) {
    throw new Error("Maksimal 500 mahasiswa dapat diimpor dalam satu berkas.")
  }

  return applicants
}
