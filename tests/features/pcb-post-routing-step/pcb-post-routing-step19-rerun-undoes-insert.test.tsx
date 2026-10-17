import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a re-run starts without the pads the previous run inserted", async () => {
  const { circuit } = getTestFixture()
  let runs = 0
  const hook: PcbPostRoutingFn = (ctx) => {
    runs++
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
    <board width="16mm" height="10mm">
      <pcbpostroutingstep fn={hook} />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  // getCircuitJson() is live; keep a copy of the board after the first run
  const afterFirstRun = structuredClone(circuit.getCircuitJson())

  // Re-routing (anything at or before the step's phase going dirty) undoes the
  // step's changes, then the step runs again on the restored board
  ;(circuit.children[0] as any)._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()
  expect(runs).toBe(2)
  const final = circuit.getCircuitJson()
  const hookPads = (cj: any[]) =>
    cj.filter((e) => e.type === "pcb_smtpad" && e.shape === "circle")
  expect(hookPads(afterFirstRun)).toHaveLength(1)
  expect(hookPads(final)).toHaveLength(1)
})
