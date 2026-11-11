import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CriteriaManager, CriteriaWithScalesItem } from "@/app/(admin)/admin/periods/[id]/criteria/criteria-manager"

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  createCriteriaAction: vi.fn(),
  updateCriteriaAction: vi.fn(),
  deleteCriteriaAction: vi.fn(),
  normalizeCriteriaWeightsAction: vi.fn(),
  createScaleAction: vi.fn(),
  updateScaleAction: vi.fn(),
  deleteScaleAction: vi.fn(),
  saveAllCriteriaDraftsAction: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock("@/app/(admin)/admin/periods/actions", () => ({
  createCriteriaAction: mocks.createCriteriaAction,
  updateCriteriaAction: mocks.updateCriteriaAction,
  deleteCriteriaAction: mocks.deleteCriteriaAction,
  normalizeCriteriaWeightsAction: mocks.normalizeCriteriaWeightsAction,
  createScaleAction: mocks.createScaleAction,
  updateScaleAction: mocks.updateScaleAction,
  deleteScaleAction: mocks.deleteScaleAction,
  saveAllCriteriaDraftsAction: mocks.saveAllCriteriaDraftsAction,
}))

const criteria: CriteriaWithScalesItem[] = [
  {
    id: "criterion-1",
    period_id: "period-1",
    nama: "IPK",
    tipe: "benefit",
    bobot: 40,
    urutan: 1,
    sumber_nilai: "input",
    criteria_scales: [
      {
        id: "scale-1",
        criteria_id: "criterion-1",
        label: "Rendah",
        nilai_min: 0,
        nilai_max: 2.5,
        skor: 1,
      },
    ],
  },
]

function renderCriteriaManager() {
  return render(
    <CriteriaManager
      periodId="period-1"
      periodStatus="draft"
      criteriaList={criteria}
    />
  )
}

async function clickEnabledButton(name: string) {
  const button = await screen.findByRole("button", { name })
  await waitFor(() =>
    expect((button as HTMLButtonElement).disabled).toBe(false)
  )
  fireEvent.click(button)
}

describe("CriteriaManager local drafts and editing", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
    mocks.createCriteriaAction.mockResolvedValue({ success: true })
    mocks.updateCriteriaAction.mockResolvedValue({ success: true })
    mocks.createScaleAction.mockResolvedValue({ success: true })
    mocks.updateScaleAction.mockResolvedValue({ success: true })
    mocks.saveAllCriteriaDraftsAction.mockResolvedValue({
      success: true,
      message: "Semua perubahan berhasil disimpan ke database.",
      data: { savedCriteriaCount: 1, savedScalesCount: 1 },
    })
  })

  it("keeps criterion edits local until the admin saves them", async () => {
    renderCriteriaManager()

    await clickEnabledButton("Edit IPK")
    const nameInput = screen.getByLabelText("Nama Kriteria")
    fireEvent.change(nameInput, { target: { value: "IPK terbaru" } })

    expect(
      JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
        .criteria["criterion-1"].nama
    ).toBe("IPK terbaru")
    expect(mocks.updateCriteriaAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }))
    await waitFor(() => expect(mocks.updateCriteriaAction).toHaveBeenCalledTimes(1))

    expect(mocks.updateCriteriaAction).toHaveBeenCalledWith(
      "criterion-1",
      "period-1",
      expect.any(FormData)
    )
    expect(
      JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
        .criteria["criterion-1"]
    ).toBeUndefined()
  })

  it("restores unsaved edits from local storage after reopening the page", async () => {
    const firstRender = renderCriteriaManager()
    await clickEnabledButton("Edit IPK")
    fireEvent.change(screen.getByLabelText("Nama Kriteria"), {
      target: { value: "IPK draf lokal" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }))
    firstRender.unmount()

    renderCriteriaManager()
    await clickEnabledButton("Edit IPK")

    expect(
      (screen.getByLabelText("Nama Kriteria") as HTMLInputElement).value
    ).toBe("IPK draf lokal")
    expect(mocks.updateCriteriaAction).not.toHaveBeenCalled()
  })

  it("stores a new criterion draft locally before creating it in the database", async () => {
    renderCriteriaManager()

    await clickEnabledButton("Tambah Kriteria")
    fireEvent.change(screen.getByLabelText("Nama Kriteria"), {
      target: { value: "Penghasilan" },
    })
    fireEvent.change(screen.getByLabelText("Bobot (%)"), {
      target: { value: "60" },
    })

    expect(
      JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
        .criteria.new.nama
    ).toBe("Penghasilan")
    expect(mocks.createCriteriaAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Simpan Kriteria ke Database" }))
    await waitFor(() => expect(mocks.createCriteriaAction).toHaveBeenCalledTimes(1))
  })

  it("edits a scale directly and sends the update only after save", async () => {
    renderCriteriaManager()

    await clickEnabledButton("Edit skala Rendah")
    fireEvent.change(screen.getByLabelText("Label Rentang Nilai"), {
      target: { value: "Perlu ditingkatkan" },
    })

    expect(
      JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
        .scales["scale-1"].label
    ).toBe("Perlu ditingkatkan")
    expect(mocks.updateScaleAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }))
    await waitFor(() => expect(mocks.updateScaleAction).toHaveBeenCalledTimes(1))

    expect(mocks.updateScaleAction).toHaveBeenCalledWith(
      "scale-1",
      "criterion-1",
      "period-1",
      expect.any(FormData)
    )
  })

  it("saves all local drafts in a single batch to the database", async () => {
    renderCriteriaManager()

    // 1. Edit a criterion locally
    await clickEnabledButton("Edit IPK")
    fireEvent.change(screen.getByLabelText("Nama Kriteria"), {
      target: { value: "IPK Terupdate" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }))

    // 2. Edit a scale locally
    await clickEnabledButton("Edit skala Rendah")
    fireEvent.change(screen.getByLabelText("Label Rentang Nilai"), {
      target: { value: "Kurang Sekali" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }))

    // Verify both exist in local draft and no DB actions were fired
    const draftsBefore = JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
    expect(draftsBefore.criteria["criterion-1"].nama).toBe("IPK Terupdate")
    expect(draftsBefore.scales["scale-1"].label).toBe("Kurang Sekali")
    expect(mocks.updateCriteriaAction).not.toHaveBeenCalled()
    expect(mocks.updateScaleAction).not.toHaveBeenCalled()

    // 3. Click "Simpan Semua ke Database"
    const saveAllButtons = await screen.findAllByRole("button", { name: "Simpan Semua ke Database" })
    fireEvent.click(saveAllButtons[0])

    await waitFor(() => expect(mocks.saveAllCriteriaDraftsAction).toHaveBeenCalledTimes(1))
    expect(mocks.saveAllCriteriaDraftsAction).toHaveBeenCalledWith(
      "period-1",
      expect.objectContaining({
        criteria: expect.objectContaining({
          "criterion-1": expect.objectContaining({ nama: "IPK Terupdate" }),
        }),
        scales: expect.objectContaining({
          "scale-1": expect.objectContaining({ label: "Kurang Sekali" }),
        }),
      })
    )

    // Verify local storage is cleared upon successful batch save
    await waitFor(() => {
      const draftsAfter = JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
      expect(Object.keys(draftsAfter.criteria).length).toBe(0)
      expect(Object.keys(draftsAfter.scales).length).toBe(0)
    })
  })

  it("applies a scale preset instantly to local drafts without network delay", async () => {
    renderCriteriaManager()

    const presetButton = await screen.findByRole("button", { name: "🎓 Skala IPK (4 Taraf)" })
    fireEvent.click(presetButton)

    // Verify preset scales were populated into local draft immediately
    const drafts = JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
    const scaleKeys = Object.keys(drafts.scales).filter((k) => k.startsWith("criterion-1:new:"))
    expect(scaleKeys.length).toBe(4)
    expect(drafts.scales[scaleKeys[0]].label).toBe("IPK < 2.75")
    expect(mocks.createScaleAction).not.toHaveBeenCalled()
  })

  it("normalizes criteria weights locally in drafts to exactly 100%", async () => {
    renderCriteriaManager()

    // Change weight in draft to 50
    await clickEnabledButton("Edit IPK")
    fireEvent.change(screen.getByLabelText("Bobot (%)"), { target: { value: "50" } })
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }))

    // Click local normalize button
    const normalizeButton = await screen.findByRole("button", { name: /Normalisasi Otomatis/ })
    fireEvent.click(normalizeButton)

    // With 1 criterion having weight 50, normalizing it must make it 100%
    const drafts = JSON.parse(window.localStorage.getItem("sinergi:criteria-editor:period-1")!)
    expect(Number(drafts.criteria["criterion-1"].bobot)).toBe(100)
    // Server action not called because it normalized locally in draft!
    expect(mocks.normalizeCriteriaWeightsAction).not.toHaveBeenCalled()
  })
})
