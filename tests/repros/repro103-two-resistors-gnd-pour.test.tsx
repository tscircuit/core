import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("repro103: two resistors on net.GND with a net.GND copper pour", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <net name="GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0805"
        pcbX={-4}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbErrors = circuitJson.filter((e) => e.type.match(/pcb_.*_error/))
  const pcbTraces = circuitJson.filter((e) => e.type === "pcb_trace")

  expect(pcbErrors.length).toBe(0)
  expect(pcbTraces).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
