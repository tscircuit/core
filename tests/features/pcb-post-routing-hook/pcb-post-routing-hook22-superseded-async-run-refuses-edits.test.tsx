import { expect, test } from "bun:test"
import type { PcbPostRoutingHook } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an async run that is superseded by a re-run cannot change the board", async () => {
  const { circuit } = getTestFixture()
  const releases: Array<() => void> = []
  const results: string[] = []
  const hook: PcbPostRoutingHook = async (ctx) => {
    const port = ctx.getPcbPort(".R1 > .pin1")!
    await new Promise<void>((resolve) => releases.push(resolve))
    try {
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
      results.push("inserted")
    } catch (e) {
      results.push(String(e))
    }
  }
  circuit.add(
    <board width="16mm" height="10mm" pcbPostRoutingHook={hook}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  // wait for the first run to be waiting, then re-route under it
  while (releases.length < 1) await new Promise((r) => setTimeout(r, 10))
  ;(circuit.children[0] as any)._markDirty("PcbTraceRender")
  circuit.render()
  while (releases.length < 2) await new Promise((r) => setTimeout(r, 10))
  releases[0]()
  releases[1]()
  await settled
  await circuit.renderUntilSettled()

  expect(results[0]).toMatch(/this run was superseded/)
  expect(results[1]).toBe("inserted")
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_smtpad" && e.shape === "circle"),
  ).toHaveLength(1)
})
