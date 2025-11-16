import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

/**
 * This test verifies that a subcircuit can inflate a transistor component
 */
test("subcircuit-circuit-json07", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <transistor name="Q1" type="npn" footprint="sot-23" />
      <port name="P1" direction="left" connectsTo="Q1.collector" />
      <port name="P2" direction="right" connectsTo="Q1.emitter" />
    </group>,
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: ".S1 .G1 .Q1 .collector" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  const Q1 = circuitJson.find(
    (element) =>
      element.type === "source_component" &&
      (element as any).ftype === "simple_transistor" &&
      (element as any).name === "Q1",
  ) as any

  expect(Q1).toBeDefined()
  expect(Q1?.transistor_type).toBe("npn")

  const pcbTrace = circuitJson.find((c) => c.type === "pcb_trace")

  expect(pcbTrace).toBeDefined()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
