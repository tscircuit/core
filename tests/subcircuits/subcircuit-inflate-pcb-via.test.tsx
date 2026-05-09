import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_via elements should be inflated from circuitJson", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="16mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPath={[
          { x: 0, y: 1 },
          { x: 0, y: 1, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 0, y: 1 },
          { x: 8, y: 1 },
        ]}
      />
      <via
        pcbX={0}
        pcbY={-2}
        holeDiameter={0.45}
        outerDiameter={0.95}
        fromLayer="top"
        toLayer="bottom"
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = structuredClone(sourceCircuit.getCircuitJson())
  const sourceVias = sourceJson.filter((elm) => elm.type === "pcb_via")
  expect(sourceVias).toHaveLength(2)

  const traceVia = sourceVias.find((via) => via.pcb_trace_id)
  expect(traceVia).toBeDefined()
  traceVia!.hole_diameter = 0.41
  traceVia!.outer_diameter = 0.83

  const standaloneVia = sourceVias.find((via) => !via.pcb_trace_id)
  expect(standaloneVia).toBeDefined()
  standaloneVia!.hole_diameter = 0.52
  standaloneVia!.outer_diameter = 1.04

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="16mm" height="10mm">
      <subcircuit name="Inflated" circuitJson={sourceJson as CircuitJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  const targetVias = targetJson.filter((elm) => elm.type === "pcb_via")
  expect(targetVias).toHaveLength(2)

  const inflatedTraceVia = targetVias.find((via) => via.pcb_trace_id)
  expect(inflatedTraceVia?.hole_diameter).toBe(0.41)
  expect(inflatedTraceVia?.outer_diameter).toBe(0.83)
  expect(inflatedTraceVia?.from_layer).toBe("top")
  expect(inflatedTraceVia?.to_layer).toBe("bottom")

  const inflatedStandaloneVia = targetVias.find((via) => !via.pcb_trace_id)
  expect(inflatedStandaloneVia?.hole_diameter).toBe(0.52)
  expect(inflatedStandaloneVia?.outer_diameter).toBe(1.04)
  expect(inflatedStandaloneVia?.from_layer).toBe("top")
  expect(inflatedStandaloneVia?.to_layer).toBe("bottom")
})
