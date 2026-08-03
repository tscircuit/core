import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const verticalFootprint = (insertionDirection: any) => (
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

test("bottom layer inverts Z axis insertion directions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <chip
        name="U1"
        pcbX={-15}
        pcbY={0}
        footprint={verticalFootprint("from_above") as any}
      />
      <chip
        name="U2"
        pcbX={0}
        pcbY={0}
        layer="bottom"
        footprint={verticalFootprint("from_above") as any}
      />
      <chip
        name="U3"
        pcbX={15}
        pcbY={0}
        layer="bottom"
        footprint={verticalFootprint("from_below") as any}
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

  // A part on the bottom layer is rotated 180 degrees about the board's Y
  // axis, so a mating part that approached from +Z now approaches from -Z.
  expect(getInsertionDirection("U1")).toBe("from_above")
  expect(getInsertionDirection("U2")).toBe("from_below")
  expect(getInsertionDirection("U3")).toBe("from_above")
})
