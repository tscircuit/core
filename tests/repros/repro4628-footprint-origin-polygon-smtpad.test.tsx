import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BasePads = () => (
  <>
    <smtpad
      portHints={["pin1"]}
      pcbX="-0.4mm"
      pcbY="0mm"
      width="0.5mm"
      height="0.5mm"
      shape="rect"
    />
    <smtpad
      portHints={["pin2"]}
      pcbX="0.4mm"
      pcbY="0mm"
      width="0.5mm"
      height="0.5mm"
      shape="rect"
    />
  </>
)

const circlePoints = Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * Math.PI * 2
  return { x: 0.6 + Math.cos(a) * 0.32, y: 0.6 + Math.sin(a) * 0.32 }
})

const cadModel = {
  stlUrl: "https://example.com/test-model.stl",
}

test("polygon smtpad bounds match circle smtpad and CAD model stays anchored at footprint origin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="6mm">
      {/* Control: symmetric pads around (0, 0) */}
      <chip
        name="PLAIN"
        pcbX={-4}
        pcbY={0}
        cadModel={cadModel}
        footprint={
          <footprint>
            <BasePads />
          </footprint>
        }
      />

      {/* Extra off-origin circle smtpad */}
      <chip
        name="CIRCLE"
        pcbX={0}
        pcbY={0}
        cadModel={cadModel}
        footprint={
          <footprint>
            <BasePads />
            <smtpad pcbX={0.6} pcbY={0.6} radius={0.32} shape="circle" />
          </footprint>
        }
      />

      {/* Same circle approximated as a 32-gon polygon smtpad */}
      <chip
        name="POLY"
        pcbX={4}
        pcbY={0}
        cadModel={cadModel}
        footprint={
          <footprint>
            <BasePads />
            <smtpad shape="polygon" points={circlePoints} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const getComponentRecords = (name: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({ name })!
    const pcbComponent = circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    const cadComponent = circuit.db.cad_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!
    return { pcbComponent, cadComponent }
  }

  const plain = getComponentRecords("PLAIN")
  const circle = getComponentRecords("CIRCLE")
  const poly = getComponentRecords("POLY")

  // CIRCLE has an off-origin copper bounding-box center
  expect(circle.pcbComponent.center.x).toBeCloseTo(0.135, 5)
  expect(circle.pcbComponent.center.y).toBeCloseTo(0.335, 5)

  // CAD models stay anchored at each footprint's (0, 0) origin instead of snapping to the copper bounding-box center
  expect(plain.cadComponent.position.x).toBeCloseTo(-4, 5)
  expect(plain.cadComponent.position.y).toBeCloseTo(0, 5)
  expect(circle.cadComponent.position.x).toBeCloseTo(0, 5)
  expect(circle.cadComponent.position.y).toBeCloseTo(0, 5)
  expect(poly.cadComponent.position.x).toBeCloseTo(4, 5)
  expect(poly.cadComponent.position.y).toBeCloseTo(0, 5)
})
