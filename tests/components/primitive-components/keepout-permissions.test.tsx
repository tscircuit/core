import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import KeepoutPermissionsExample from "tests/examples/keepout-permissions"

test("keepout permissions allow independent routing and placement while pours avoid both", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<KeepoutPermissionsExample />)
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter(
        (element) =>
          element.type.endsWith("_error") ||
          element.type === "pcb_keepout_overlap_warning",
      ),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(
    circuit.db.pcb_keepout
      .list()
      .map((keepout) => [keepout.allow_traces, keepout.allow_placements]),
  ).toEqual([
    [true, false],
    [false, true],
  ])
  expect(
    circuit.db.pcb_copper_pour
      .list()
      .map(
        (pour) => pour.shape === "brep" && pour.brep_shape.inner_rings.length,
      ),
  ).toEqual([1, 1])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 750,
  })
})
