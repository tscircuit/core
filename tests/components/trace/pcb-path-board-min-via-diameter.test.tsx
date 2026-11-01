import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPath and pcbPaths vias honor board minViaHoleDiameter and minViaPadDiameter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="16mm"
      height="12mm"
      layers={2}
      minViaHoleDiameter={0.35}
      minViaPadDiameter={0.7}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={2}
        layer="top"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        pcbY={2}
        layer="bottom"
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPath={[
          { x: 0, y: 2, via: true, fromLayer: "top", toLayer: "bottom" },
        ]}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-2}
        layer="top"
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        pcbX={4}
        pcbY={-2}
        layer="bottom"
      />
      <trace
        from=".R3 > .pin2"
        to=".R4 > .pin1"
        pcbPaths={[
          [
            ".R3 > .pin2",
            { x: 0, y: -2, via: true, fromLayer: "top", toLayer: "bottom" },
            ".R4 > .pin1",
          ],
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(2)
  for (const via of vias) {
    expect(via.hole_diameter).toBeCloseTo(0.35, 5)
    expect(via.outer_diameter).toBeCloseTo(0.7, 5)
  }
})
