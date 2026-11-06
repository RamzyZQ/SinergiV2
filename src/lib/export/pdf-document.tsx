import * as React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 10,
    marginBottom: 16,
    textAlign: "center",
  },
  universityName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  facultyName: {
    fontSize: 10,
    fontFamily: "Helvetica",
    marginTop: 2,
    color: "#475569",
  },
  letterTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  letterSubtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#475569",
    marginBottom: 14,
  },
  metaTable: {
    marginBottom: 14,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  metaValue: {
    flex: 1,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 20,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  colRank: {
    width: "10%",
    padding: 4,
    textAlign: "center",
  },
  colName: {
    width: "35%",
    padding: 4,
  },
  colNim: {
    width: "20%",
    padding: 4,
    textAlign: "center",
  },
  colProdi: {
    width: "23%",
    padding: 4,
  },
  colScore: {
    width: "12%",
    padding: 4,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  footerSignatures: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: 180,
    textAlign: "center",
  },
  signatureLine: {
    marginTop: 48,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 4,
    fontFamily: "Helvetica-Bold",
  },
})

export interface PdfReportProps {
  periodName: string
  quota: number
  thresholdC: number
  thresholdD: number
  cutoffNetScore: number
  awardees: Array<{
    ranking: number
    name: string
    nim: string
    prodi: string
    netScore: number
  }>
  generatedAt: string
}

export function ScholarshipPdfDocument({
  periodName,
  quota,
  thresholdC,
  thresholdD,
  cutoffNetScore,
  awardees,
  generatedAt,
}: PdfReportProps) {
  return (
    <Document title={`SK-Hasil-Beasiswa-${periodName}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.headerContainer}>
          <Text style={styles.universityName}>PANITIA SELEKSI BEASISWA MAHASISWA</Text>
          <Text style={styles.facultyName}>
            Sistem Informasi Pengambilan Keputusan Metode ELECTRE I
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.letterTitle}>SURAT KEPUTUSAN PENETAPAN PENERIMA BEASISWA</Text>
        <Text style={styles.letterSubtitle}>
          Nomor: SK-BEASISWA/{new Date().getFullYear()}/{(periodName || "").replace(/\s+/g, "-")}
        </Text>

        {/* Meta Info */}
        <View style={styles.metaTable}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Program Seleksi:</Text>
            <Text style={styles.metaValue}>{periodName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Kuota Penerima:</Text>
            <Text style={styles.metaValue}>{quota} Mahasiswa</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Garis Batas Kelulusan:</Text>
            <Text style={styles.metaValue}>Net Score {cutoffNetScore}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Parameter Ambang Batas:</Text>
            <Text style={styles.metaValue}>
              Concordance (c) = {thresholdC.toFixed(3)} | Discordance (d) = {thresholdD.toFixed(3)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Tanggal Pengesahan:</Text>
            <Text style={styles.metaValue}>{generatedAt}</Text>
          </View>
        </View>

        {/* Awardees Table */}
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 6 }}>
          DAFTAR MAHASISWA YANG LOLOS SELEKSI (KUOTA PENERIMA):
        </Text>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colRank}>Rank</Text>
            <Text style={styles.colName}>Nama Mahasiswa</Text>
            <Text style={styles.colNim}>NIM</Text>
            <Text style={styles.colProdi}>Program Studi</Text>
            <Text style={styles.colScore}>Net Score</Text>
          </View>

          {/* Rows */}
          {awardees.map((item, idx) => (
            <View
              key={item.nim || idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.colRank}>#{item.ranking}</Text>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colNim}>{item.nim || "-"}</Text>
              <Text style={styles.colProdi}>{item.prodi || "-"}</Text>
              <Text style={styles.colScore}>
                {item.netScore > 0 ? `+${item.netScore}` : item.netScore}
              </Text>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={styles.footerSignatures}>
          <View style={styles.signatureBox}>
            <Text>Mengetahui,</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
              Sekretaris Tim Penilai
            </Text>
            <View style={styles.signatureLine}>
              <Text>( Panitia Seleksi Beasiswa )</Text>
            </View>
          </View>

          <View style={styles.signatureBox}>
            <Text>Ditetapkan di Tempat,</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
              Ketua Panitia Seleksi Beasiswa
            </Text>
            <View style={styles.signatureLine}>
              <Text>( Pimpinan Bagian Kemahasiswaan )</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
