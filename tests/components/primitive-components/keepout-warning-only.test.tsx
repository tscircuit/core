import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import KeepoutWarningOnlyExample from "tests/examples/keepout-warning-only"

test("warningOnly permits placement and routing while normal keepouts remain obstacles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<KeepoutWarningOnlyExample />)
  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_keepout_overlap_warning")
  expect(warnings).toHaveLength(3)
  expect(
    warnings.filter((warning) => warning.pcb_component_ids?.length),
  ).toHaveLength(1)
  expect(
    warnings.filter((warning) => warning.pcb_trace_ids?.length),
  ).toHaveLength(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1100,
    height: 950,
  })
})
