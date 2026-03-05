import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro102: courtyard and fabrication notes do not affect outside-board DRC bounds", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10.4} height={10.4} borderRadius={1.2}>
      <chip
        name="U1"
        pcbX={4}
        pcbY={4}
        footprint={
          <footprint>
            <platedhole
              shape="circle"
              holeDiameter={1.1}
              outerDiameter={1.6}
              pcbX={0}
              pcbY={0}
              portHints={["1"]}
            />
            <courtyardcircle pcbX={0} pcbY={0} radius={0.99} layer="top" />
            <courtyardcircle pcbX={0} pcbY={0} radius={0.99} layer="bottom" />
            <fabricationnotetext
              pcbX={2.5}
              pcbY={0}
              text="FAB NOTE"
              fontSize={1}
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const outsideBoardErrors = circuitJson.filter(
    (elm) => elm.type === "pcb_component_outside_board_error",
  )
  expect(outsideBoardErrors).toEqual([])

  const pcbComponents = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
      elm.type === "pcb_component",
  )

  expect(pcbComponents).toHaveLength(1)
  expect(pcbComponents[0].width).toBeCloseTo(1.6, 2)
  expect(pcbComponents[0].height).toBeCloseTo(1.6, 2)
})
