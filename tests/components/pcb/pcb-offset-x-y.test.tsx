import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbOffsetX/pcbOffsetY shift a component away from its pcbX/pcbY", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={2}
        pcbY={0}
        pcbOffsetX={5}
        pcbOffsetY={3}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={0}
        pcbOffsetX="1mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const centerOf = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((sc) => sc.name === name)!
    return circuit.db.pcb_component.getWhere({
      source_component_id: sourceComponent.source_component_id,
    })!.center
  }

  expect(centerOf("R1")).toEqual({ x: 2, y: 0 })
  expect(centerOf("R2")).toEqual({ x: 7, y: 3 })
  expect(centerOf("R3")).toEqual({ x: -5, y: 0 })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
