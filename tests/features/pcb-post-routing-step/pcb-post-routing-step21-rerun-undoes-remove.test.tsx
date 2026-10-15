import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a re-run starts with the elements the previous run removed", async () => {
  const { circuit } = getTestFixture()
  let runs = 0
  const seenSilk: number[] = []
  const hook: PcbPostRoutingFn = (ctx) => {
    runs++
    const r2 = ctx.getPcbComponent(".R2")!
    const silk = ctx
      .getCircuitJson()
      .filter(
        (e) =>
          e.type === "pcb_silkscreen_text" &&
          e.pcb_component_id === r2.pcb_component_id,
      ) as any[]
    seenSilk.push(silk.length)
    for (const s of silk) ctx.remove(s.pcb_silkscreen_text_id)
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
  // the second run saw R2's silkscreen again, and removed it again
  expect(seenSilk[1]).toBe(seenSilk[0])
  expect(seenSilk[0]).toBeGreaterThan(0)
  const r2 = circuit.selectOne(".R2") as any
  expect(
    final.filter(
      (e) =>
        e.type === "pcb_silkscreen_text" &&
        e.pcb_component_id === r2.pcb_component_id,
    ),
  ).toHaveLength(0)
})
