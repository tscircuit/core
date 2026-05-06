import { expect, test } from "bun:test"
import { unrouteCircuitJson } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unroute circuit json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" layers={1}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const unroutedCircuitJson = unrouteCircuitJson(circuitJson)

  expect(circuitJson.some((element) => element.type === "pcb_trace")).toBe(true)
  expect(
    unroutedCircuitJson.some((element) => element.type === "pcb_trace"),
  ).toBe(false)
  expect(unroutedCircuitJson).toMatchPcbSnapshot(import.meta.path)
})
