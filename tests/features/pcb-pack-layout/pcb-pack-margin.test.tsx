import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"

test("pcbMargin props affect pcbPack layout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack pcbGap={0}>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbMarginTop="5mm"
        pcbMarginBottom="5mm"
        pcbMarginLeft="5mm"
        pcbMarginRight="5mm"
      />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { db } = circuit
  const components = db.pcb_component.list().map((c) => ({
    name: db.source_component.get(c.source_component_id).name,
    center: c.center,
    width: c.width,
    height: c.height,
  }))

  const r1 = components.find((c) => c.name === "R1")!
  const r2 = components.find((c) => c.name === "R2")!

  const distance = computeDistanceBetweenBoxes(
    { center: r1.center, width: r1.width, height: r1.height },
    { center: r2.center, width: r2.width, height: r2.height },
  ).distance

  expect(distance).toBeGreaterThanOrEqual(5)
})
