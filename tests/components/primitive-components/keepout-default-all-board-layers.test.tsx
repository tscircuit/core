import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout without layers defaults to all board copper layers and blocks bottom routing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" autorouter="default">
      <keepout shape="rect" width="8mm" height="4mm" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX="-8mm"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX="8mm"
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toHaveLength(1)
  expect(keepouts[0]).toMatchObject({
    shape: "rect",
    layers: ["top", "bottom"],
  })

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(1)
  const wirePoints = pcbTraces[0].route.filter(
    (point) => point.route_type === "wire",
  )
  // A straight horizontal segment from x=-8 to x=8 at y=0 would pass straight through [-4, 4] x [-2, 2].
  // Because the keepout guards bottom as well as top, the route must detour outside y in (-2, 2).
  const hasDetourOutsideKeepoutY = wirePoints.some(
    (point) => Math.abs(point.y) >= 2,
  )
  expect(hasDetourOutsideKeepoutY).toBe(true)
})

test("keepout without layers covers all copper layers on a 4-layer board while preserving explicit layers", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" layers={4}>
      <keepout shape="rect" width="6mm" height="4mm" pcbX="-6mm" />
      <keepout shape="circle" radius="2mm" layers={["inner1"]} pcbX="6mm" />
    </board>,
  )

  circuit.render()

  const [defaultedKeepout, explicitKeepout] = circuit.db.pcb_keepout.list()
  expect(defaultedKeepout).toMatchObject({
    shape: "rect",
    layers: ["top", "bottom", "inner1", "inner2"],
  })
  expect(explicitKeepout).toMatchObject({
    shape: "circle",
    layers: ["inner1"],
  })
})
