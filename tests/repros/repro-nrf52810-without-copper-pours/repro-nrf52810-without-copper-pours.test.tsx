import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Nrf52810Circuit from "./nrf52810-circuit"

// Reproduces https://tscircuit.com/seveibar/nrf52810#files without explicit
// <copperpour> elements so the implicit copper pour phase owns their creation.
test(
  "nRF52810 tracker routes with implicit copper pours",
  async () => {
    const { circuit } = getTestFixture({
      platform: { placementDrcChecksDisabled: true },
    })

    circuit.add(<Nrf52810Circuit />)
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(60)
    const implicitPours = circuit.db.pcb_copper_pour.list()
    expect(implicitPours.length).toBeGreaterThan(0)
    expect(implicitPours.every((pour) => pour.shape === "brep")).toBe(true)

    const topSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-top.test.tsx",
    )
    const bottomSnapshotPath = import.meta.path.replace(
      /\.test\.tsx$/,
      "-bottom.test.tsx",
    )

    await expect(circuit).toMatchPcbSnapshot(topSnapshotPath, { layer: "top" })
    await expect(circuit).toMatchPcbSnapshot(bottomSnapshotPath, {
      layer: "bottom",
    })
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 30_000 },
)
