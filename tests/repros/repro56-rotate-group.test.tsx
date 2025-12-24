import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotate group and have traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <group name="G0" pcbRotation="0deg" pcbX={-18}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <group name="G1" pcbRotation="45deg">
        <resistor name="R3" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R4" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <trace from="G0.R1 > .pin1" to="G1.R3 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)

  const pcb_trace = circuitJson.filter((c) => c.type === "pcb_trace")
  expect(pcb_trace.length).toBe(1)
})
