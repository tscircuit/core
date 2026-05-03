import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Keepout component rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <keepout shape="rect" width="5mm" height="3mm" pcbX="-10mm" pcbY="0mm" />
      <keepout shape="circle" radius="2mm" pcbX="0mm" pcbY="0mm" />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})

test("Keepout supports layer and layers props", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <keepout
        shape="rect"
        layer="bottom"
        width="5mm"
        height="3mm"
        pcbX="-10mm"
        pcbY="0mm"
      />
      <keepout
        shape="circle"
        layers={["top", "bottom"]}
        radius="2mm"
        pcbX="0mm"
        pcbY="0mm"
      />
    </board>,
  )

  circuit.render()

  const keepouts = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_keepout")

  expect(keepouts).toHaveLength(2)
  expect(keepouts[0]).toMatchObject({
    type: "pcb_keepout",
    shape: "rect",
    layers: ["bottom"],
  })
  expect(keepouts[1]).toMatchObject({
    type: "pcb_keepout",
    shape: "circle",
    layers: ["top", "bottom"],
  })
})
