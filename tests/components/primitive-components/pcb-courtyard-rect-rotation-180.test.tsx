import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_courtyard_rect rotation 180 on bottom layer", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="pinrow6"
        pcbX={0}
        pcbY={0}
        pcbRotation={180}
        layer="bottom"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const pcbCourtyardRects = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_courtyard_rect")

  expect(pcbCourtyardRects[0].ccw_rotation).toBe(180)

  const labels = circuit.db.pcb_silkscreen_text.list()
  const reference = labels.find((label) => label.text === "U1")!
  const pinLabels = labels.filter((label) => label.text.startsWith("pin"))
  expect(pinLabels).toHaveLength(6)
  for (const label of pinLabels) {
    expect(label.ccw_rotation).toBe(reference.ccw_rotation)
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
  await expect(circuit).toMatch3dSnapshot(import.meta.path, {
    snapshotSuffix: "assembled-bottom",
    camPos: [0, -45, 24],
    gltf: { boardTextureResolution: 1024 },
    poppygl: { grid: false, fov: 35, backgroundColor: "#f2f3f5" },
  })
  const pcb = circuit
    .getCircuitJson()
    .filter((element) => element.type !== "cad_component")
  await expect(pcb).toMatch3dSnapshot(import.meta.path, {
    snapshotSuffix: "pcb-bottom",
    camPos: [0, -45, 24],
    gltf: { boardTextureResolution: 1024 },
    poppygl: { grid: false, fov: 35, backgroundColor: "#f2f3f5" },
  })
}, 30_000)
