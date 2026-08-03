import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const inPlaneFootprint = (insertionDirection: any) => (
  <footprint insertionDirection={insertionDirection}>
    <smtpad
      shape="rect"
      portHints={["pin1"]}
      pcbX={-1}
      pcbY={0}
      width={1}
      height={1}
    />
    <smtpad
      shape="rect"
      portHints={["pin2"]}
      pcbX={1}
      pcbY={0}
      width={1}
      height={1}
    />
  </footprint>
)

test("bottom layer mirrors in-plane insertion directions across the X axis", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <chip
        name="U1"
        pcbX={-20}
        pcbY={0}
        layer="bottom"
        footprint={inPlaneFootprint("from_left") as any}
      />
      <chip
        name="U2"
        pcbX={-5}
        pcbY={0}
        layer="bottom"
        footprint={inPlaneFootprint("from_right") as any}
      />
      <chip
        name="U3"
        pcbX={10}
        pcbY={0}
        layer="bottom"
        footprint={inPlaneFootprint("from_top") as any}
      />
      <chip
        name="U4"
        pcbX={22}
        pcbY={0}
        layer="bottom"
        footprint={inPlaneFootprint("from_bottom") as any}
      />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()

  const getInsertionDirection = (name: string) => {
    const sourceComponent = circuitJson.find(
      (element: any) =>
        element.type === "source_component" && element.name === name,
    ) as any
    const pcbComponent = circuitJson.find(
      (element: any) =>
        element.type === "pcb_component" &&
        element.source_component_id === sourceComponent.source_component_id,
    ) as any
    return pcbComponent.insertion_direction
  }

  // Moving a footprint to the bottom layer mirrors it across the X axis, so
  // the X-facing directions swap while the Y-facing directions are unchanged.
  expect(getInsertionDirection("U1")).toBe("from_right")
  expect(getInsertionDirection("U2")).toBe("from_left")
  expect(getInsertionDirection("U3")).toBe("from_top")
  expect(getInsertionDirection("U4")).toBe("from_bottom")
})
