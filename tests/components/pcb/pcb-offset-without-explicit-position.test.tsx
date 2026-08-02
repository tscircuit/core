import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbOffsetX/pcbOffsetY apply once when no explicit pcb position is set", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbOffsetX={8}
        pcbOffsetY={-8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponent = circuit.db.source_component
    .list()
    .find((sc) => sc.name === "C1")!
  const center = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!.center

  expect(center).toEqual({ x: 8, y: -8 })
})
