import { expect, test } from "bun:test"
import type { Port } from "lib/components"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SourceLeaf = () => (
  <subcircuit
    name="SOURCE_LEAF"
    width="2mm"
    height="2mm"
    autorouter="auto_local"
    exposedNets={["SIGNAL"]}
  >
    <resistor name="R1" resistance="1k" footprint="0402" />
    <trace from="R1.pin1" to="net.SIGNAL" />
  </subcircuit>
)

const SourceBlock = () => (
  <subcircuit
    name="SOURCE_BLOCK"
    pcbX={-3}
    width="2mm"
    height="2mm"
    autorouter="auto_local"
    exposedNets={["SIGNAL"]}
  >
    <SourceLeaf />
  </subcircuit>
)

const SinkLeaf = () => (
  <subcircuit
    name="SINK_LEAF"
    width="2mm"
    height="2mm"
    autorouter="auto_local"
    exposedNets={["SIGNAL"]}
  >
    <resistor name="R2" resistance="1k" footprint="0402" />
    <trace from="R2.pin1" to="net.SIGNAL" />
  </subcircuit>
)

const SinkBlock = () => (
  <subcircuit
    name="SINK_BLOCK"
    pcbX={3}
    width="2mm"
    height="2mm"
    autorouter="auto_local"
    exposedNets={["SIGNAL"]}
  >
    <SinkLeaf />
  </subcircuit>
)

test("nets exposed through two nested subcircuit levels are routed with copper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="6mm">
      <SourceBlock />
      <SinkBlock />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((el) => el.type.includes("error"))
  expect(errors).toEqual([])

  const r1Pin1 = circuit.selectOne(".R1 > .pin1", { type: "port" }) as Port
  const r2Pin1 = circuit.selectOne(".R2 > .pin1", { type: "port" }) as Port
  const r1PcbPortId = circuit.db.pcb_port.getWhere({
    source_port_id: r1Pin1.source_port_id!,
  })?.pcb_port_id
  const r2PcbPortId = circuit.db.pcb_port.getWhere({
    source_port_id: r2Pin1.source_port_id!,
  })?.pcb_port_id
  expect(r1PcbPortId).toBeDefined()
  expect(r2PcbPortId).toBeDefined()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(0)

  const connectedPcbPortIds = new Set(
    pcbTraces.flatMap((trace) =>
      trace.route.flatMap((point) => {
        const ids: string[] = []
        if ("start_pcb_port_id" in point && point.start_pcb_port_id) {
          ids.push(point.start_pcb_port_id)
        }
        if ("end_pcb_port_id" in point && point.end_pcb_port_id) {
          ids.push(point.end_pcb_port_id)
        }
        return ids
      }),
    ),
  )

  expect(connectedPcbPortIds.has(r1PcbPortId!)).toBe(true)
  expect(connectedPcbPortIds.has(r2PcbPortId!)).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
