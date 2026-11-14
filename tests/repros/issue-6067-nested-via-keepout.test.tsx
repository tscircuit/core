import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent board keepout constrains nested subcircuit routing", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="30mm"
      height="20mm"
      minTraceWidth="0.5mm"
      nominalTraceWidth="0.5mm"
      pcbStyle={{ viaHoleDiameter: "0.9mm", viaPadDiameter: "2.2mm" }}
    >
      <keepout
        shape="rect"
        pcbX={0}
        pcbY={0}
        width="8mm"
        height="6mm"
        layers={["top", "bottom"]}
        allowPlacements
        allowTraces
      />
      <group name="nested" subcircuit>
        <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
        <resistor
          name="R1"
          resistance="1k"
          footprint="1206"
          pcbX={-9}
          pcbY={5}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="1206"
          pcbX={9}
          pcbY={5}
          layer="bottom"
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="1206"
          pcbX={-9}
          pcbY={-5}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="1206"
          pcbX={9}
          pcbY={-5}
        />
        <trace from=".U1 > .pin1" to=".R2 > .pin1" />
        <trace from=".U1 > .pin8" to=".R3 > .pin1" />
        <trace from=".U1 > .pin4" to=".R1 > .pin2" />
        <trace from=".U1 > .pin5" to=".R3 > .pin2" />
        <trace from=".U1 > .pin2" to=".R4 > .pin1" />
        <trace from=".U1 > .pin7" to=".R1 > .pin1" />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(6)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThan(0)
  for (const via of circuit.db.pcb_via.list()) {
    const dx = Math.max(Math.abs(via.x) - 4, 0)
    const dy = Math.max(Math.abs(via.y) - 3, 0)
    expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(via.outer_diameter / 2)
  }
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
