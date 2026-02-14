import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc resolves chained component-relative references with y references", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="36mm" height="12mm">
      <resistor
        name="R1"
        footprint="0603"
        resistance="1k"
        pcbX="-11mm"
        pcbY="0mm"
      />
      <resistor
        name="R2"
        footprint="0603"
        resistance="1k"
        pcbX="calc(R1.maxX + 1.5mm)"
        pcbY="calc(R1.y)"
      />
      <resistor
        name="R3"
        footprint="0603"
        resistance="1k"
        pcbX="calc(R2.maxX + 1.5mm)"
        pcbY="calc(R2.y)"
      />
      <resistor
        name="R4"
        footprint="0603"
        resistance="1k"
        pcbX="calc(R3.maxX + 1.5mm)"
        pcbY="calc(R3.y)"
      />
    </board>,
  )

  circuit.render()

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()

  const getPcbComponent = (name: string) => {
    const sourceComponent = sourceComponents.find(
      (component) => component.name === name,
    )
    return pcbComponents.find(
      (component) =>
        component.source_component_id === sourceComponent?.source_component_id,
    )
  }

  const r1 = getPcbComponent("R1")
  const r2 = getPcbComponent("R2")
  const r3 = getPcbComponent("R3")
  const r4 = getPcbComponent("R4")

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(r3).toBeDefined()
  expect(r4).toBeDefined()

  expect(r2?.center.y).toBeCloseTo(r1?.center.y ?? 0)
  expect(r3?.center.y).toBeCloseTo(r2?.center.y ?? 0)
  expect(r4?.center.y).toBeCloseTo(r3?.center.y ?? 0)

  expect(r2?.center.x).toBeCloseTo(
    (r1?.center.x ?? 0) + (r1?.width ?? 0) / 2 + 1.5,
  )
  expect(r3?.center.x).toBeCloseTo(
    (r2?.center.x ?? 0) + (r2?.width ?? 0) / 2 + 1.5,
  )
  expect(r4?.center.x).toBeCloseTo(
    (r3?.center.x ?? 0) + (r3?.width ?? 0) / 2 + 1.5,
  )
})
