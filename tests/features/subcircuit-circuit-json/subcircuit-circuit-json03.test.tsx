import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json03 - capacitor inflation", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <capacitor name="C1" capacitance="10uF" footprint="0402" />
      <port name="P1" direction="left" connectsTo="C1.pin1" />
      <port name="P2" direction="right" connectsTo="C1.pin2" />
    </group>,
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: ".S1 .G1 .P1" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const C1 = circuitJson.find(
    (c) =>
      c.type === "source_component" &&
      c.name === "C1" &&
      c.ftype === "simple_capacitor",
  )
  expect(C1).toBeDefined()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
