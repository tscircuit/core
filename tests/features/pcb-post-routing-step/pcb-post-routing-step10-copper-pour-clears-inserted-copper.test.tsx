import { expect, test } from "bun:test"
import type { PcbPostRoutingFn } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const renderBoard = async (fn?: PcbPostRoutingFn) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="10mm">
      {fn && <pcbpostroutingstep fn={fn} />}
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

test("copper pours run after the step and clear the copper it inserted", async () => {
  const pours = (cj: any[]) =>
    JSON.stringify(cj.filter((e) => e.type === "pcb_copper_pour"))
  const without = await renderBoard()
  const circuit = await renderBoard((ctx) => {
    const port = ctx.getPcbPort(".R1 > .pin1")!
    ctx.insert({
      type: "pcb_smtpad",
      shape: "rect",
      x: 0,
      y: 3,
      width: 2,
      height: 1,
      layer: "top",
      port_hints: [],
      pcb_port_id: port.pcb_port_id,
      pcb_component_id: port.pcb_component_id,
    })
  })
  expect(pours(circuit.getCircuitJson())).not.toBe(
    pours(without.getCircuitJson()),
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
