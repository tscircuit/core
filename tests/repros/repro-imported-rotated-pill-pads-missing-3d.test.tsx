import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { INA240A1PWR } from "./repro-imported-rotated-pill-pads-missing-3d/INA240A1PWR"

test("imported INA240A1PWR rotated pill pads are missing from PCB and 3D output", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm">
      <INA240A1PWR name="U1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Reproduces the bug: footprinter emits eight rotated_pill pads, but Core's
  // footprint conversion drops all of them before they reach Circuit JSON.
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    cameraPreset: "top_down_orthographic",
  })
})
