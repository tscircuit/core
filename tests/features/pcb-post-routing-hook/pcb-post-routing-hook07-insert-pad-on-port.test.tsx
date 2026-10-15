import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("insert adds a pad attached to an existing port", async () => {
  const { circuit } = getTestFixture()
  const hook: PcbPostRoutingHook = (ctx) => {
    const port = ctx.getPcbPort(".R1 > .pin1")!
    ctx.insert({
      type: "pcb_smtpad",
      shape: "circle",
      x: -4,
      y: 2,
      radius: 0.4,
      layer: "top",
      port_hints: [],
      pcb_port_id: port.pcb_port_id,
      pcb_component_id: port.pcb_component_id,
    })
  }
  circuit.add(
    <board width="16mm" height="10mm" pcbPostRoutingHook={hook}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const r1Pin1 = circuit.selectOne(".R1 > .pin1") as any
  const pads = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_smtpad" && e.shape === "circle")
  expect(pads).toHaveLength(1)
  expect(pads[0]).toMatchObject({
    pcb_port_id: r1Pin1.pcb_port_id,
    x: -4,
    y: 2,
    radius: 0.4,
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
