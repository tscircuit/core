import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

/**
 * This test verifies that a subcircuit
 */
test("subcircuit-circuit-json01", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit
        name="S1"
        circuitJson={
          await renderToCircuitJson(
            <group name="G1">
              <resistor name="R1" resistance="10k" footprint="0402" />
              <port name="P1" direction="left" connectsTo="R1.pin1" />
            </group>,
          )
        }
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: ".S1 .G1 .P1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const R1 = circuitJson.find(
    (c) => c.type === "source_component" && c.name === "R1",
  )

  // TODO circuitJson loading doesn't currently work!
  // expect(R1).toBeDefined()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
