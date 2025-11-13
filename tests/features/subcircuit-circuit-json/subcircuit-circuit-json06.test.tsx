import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json06 - trace inflation", async () => {
  const { circuit } = await getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </group>,
  )

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} pcbX={-5} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={5} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()

  // Find the trace between R1 and R2 inside the subcircuit
  const sourceTraces = circuitJson.filter((elm) => elm.type === "source_trace")

  const sourceTraceR1R2 = sourceTraces.find((elm: any) => {
    if (!elm.connected_source_port_ids) return false
    const connectedPorts = elm.connected_source_port_ids
      .map((id: string) => {
        const port = circuitJson.find(
          (p: any) => p.type === "source_port" && p.source_port_id === id,
        ) as any
        if (!port) return null
        const comp = circuitJson.find(
          (c: any) =>
            c.type === "source_component" &&
            c.source_component_id === port.source_component_id,
        ) as any
        if (!comp) return null
        return `${comp.name}.${port.name}`
      })
      .filter(Boolean)

    return (
      connectedPorts.includes("R1.pin2") && connectedPorts.includes("R2.pin1")
    )
  })

  expect(sourceTraceR1R2).toBeDefined()

  const pcbTraces = circuitJson.filter((c) => c.type === "pcb_trace")
  const pcbTraceR1R2 = pcbTraces.find(
    (c: any) => c.source_trace_id === (sourceTraceR1R2 as any).source_trace_id,
  )

  expect(pcbTraceR1R2).toBeDefined()

  expect(pcbTraces).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
