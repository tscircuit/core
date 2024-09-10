import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multilayer obstacle route", async () => {
  const { circuit, logSoup } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <resistor name="R1" pcbX={-5} pcbY={0} resistance="1k" footprint="0402" />
      <resistor name="R2" pcbX={5} pcbY={0} resistance="1k" footprint="0402" />
      <resistor
        name="R_obstacle"
        pcbX={0}
        pcbY={0}
        resistance="1k"
        footprint="1210"
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <tracehint
        for=".R1 > .pin2"
        offset={{
          x: -3,
          y: 0,
          via: true,
        }}
      />
      <tracehint
        for=".R2 > .pin1"
        offset={{
          x: 3,
          y: 0,
          via: true,
        }}
      />
    </board>,
  )

  circuit.render()

  await expect(
    await circuit.getSvg({
      view: "pcb",
      layer: "top",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
