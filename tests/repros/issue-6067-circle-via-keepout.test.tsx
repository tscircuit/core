import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("circular allowTraces keepout excludes via copper without dropping connections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="30mm"
      height="20mm"
      minTraceWidth="0.5mm"
      nominalTraceWidth="0.5mm"
      pcbStyle={{ viaHoleDiameter: "0.9mm", viaPadDiameter: "2.2mm" }}
    >
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <resistor name="R1" resistance="1k" footprint="1206" pcbX={-9} pcbY={5} />
      <resistor
        name="R2"
        layer="bottom"
        resistance="1k"
        footprint="1206"
        pcbX={9}
        pcbY={5}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="1206"
        pcbX={-9}
        pcbY={-5}
      />
      <resistor name="R4" resistance="1k" footprint="1206" pcbX={9} pcbY={-5} />
      <keepout
        shape="circle"
        pcbX={0}
        pcbY={0}
        radius="4mm"
        layers={["top", "bottom"]}
        allowPlacements
        allowTraces
      />
      <trace from=".U1 > .pin1" to=".R2 > .pin1" />
      <trace from=".U1 > .pin8" to=".R3 > .pin1" />
      <trace from=".U1 > .pin4" to=".R1 > .pin2" />
      <trace from=".U1 > .pin5" to=".R3 > .pin2" />
      <trace from=".U1 > .pin2" to=".R4 > .pin1" />
      <trace from=".U1 > .pin7" to=".R1 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(6)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  for (const via of circuit.db.pcb_via.list()) {
    expect(Math.hypot(via.x, via.y)).toBeGreaterThanOrEqual(
      4 + via.outer_diameter / 2,
    )
  }
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
