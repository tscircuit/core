import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import { Circuit } from "lib"

test("pcbPath vias inherit board minViaHoleDiameter and minViaPadDiameter (fixes tscircuit/tscircuit#5559)", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      minTraceWidth={0.15}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={6} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness={0.15}
        pcbPath={[
          { x: 2, y: 2 },
          { x: 2, y: 2, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 2, y: 2 },
          { x: 4, y: 2 },
          { x: 4, y: 2, via: true, fromLayer: "bottom", toLayer: "top" },
          { x: 4, y: 2 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const vias = su(circuit.getCircuitJson()).pcb_via.list()
  expect(vias).toHaveLength(2)
  for (const via of vias) {
    expect(via.hole_diameter).toBe(0.3)
    expect(via.outer_diameter).toBe(0.6)
  }
})

test("standalone via inherits board minViaHoleDiameter and minViaPadDiameter", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      minViaHoleDiameter={0.35}
      minViaPadDiameter={0.7}
      routingDisabled
    >
      <via connectsTo="net.VCC" pcbX={0} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const via = su(circuit.getCircuitJson()).pcb_via.list()[0]
  expect(via).toBeDefined()
  expect(via.hole_diameter).toBe(0.35)
  expect(via.outer_diameter).toBe(0.7)
})
