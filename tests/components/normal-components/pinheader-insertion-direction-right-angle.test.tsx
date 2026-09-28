import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("right-angle headers and explicit footprint directions are not defaulted to vertical", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={20} routingDisabled>
      <chip
        name="J_RIGHT_ANGLE"
        footprint="pinrow2_rightangle"
        pcbX={-8}
        pcbY={8}
      />
      <pinheader
        name="J_EXPLICIT"
        pinCount={2}
        pcbX={8}
        pcbY={8}
        footprint={
          <footprint insertionDirection="from_bottom">
            <platedhole
              portHints={["pin1"]}
              pcbX={-1.27}
              holeDiameter={1}
              outerDiameter={1.5}
              shape="circle"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={1.27}
              holeDiameter={1}
              outerDiameter={1.5}
              shape="circle"
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Explicit side entry stays horizontal"
        pcbY={0}
        fontSize={1}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [rightAngle, explicit] = circuit.db.pcb_component.list()
  expect(rightAngle.insertion_direction).toBeUndefined()
  expect(explicit.insertion_direction).toBe("from_bottom")
  expect(
    circuit
      .getCircuitJson()
      .filter(
        (el) =>
          el.type === "pcb_connector_not_in_accessible_orientation_warning",
      )
      .some((el) => el.pcb_component_id === explicit.pcb_component_id),
  ).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
