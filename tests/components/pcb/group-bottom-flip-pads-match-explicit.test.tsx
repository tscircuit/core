import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group flip puts numbered pads where an explicit component flip does", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="20mm" schematicDisabled routingDisabled>
      <group layer="bottom" pcbX={-8}>
        <resistor
          name="R_GROUP"
          resistance="1k"
          footprint="0603"
          pcbX={3}
          pcbY={1}
          pcbRotation={90}
        />
      </group>
      <resistor
        name="R_EXPLICIT"
        resistance="1k"
        footprint="0603"
        layer="bottom"
        pcbX={5}
        pcbY={1}
        pcbRotation={-90}
      />
    </board>,
  )

  circuit.render()

  const pcbByName = Object.fromEntries(
    circuit.db.pcb_component.list().map((pcb) => [
      circuit.db.source_component.get(pcb.source_component_id)?.name,
      pcb,
    ]),
  )
  const getPads = (componentId: string) =>
    circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === componentId)

  const actual = getPads(pcbByName.R_GROUP.pcb_component_id)
  const reference = getPads(pcbByName.R_EXPLICIT.pcb_component_id)

  expect(pcbByName.R_GROUP.layer).toBe("bottom")
  expect(pcbByName.R_EXPLICIT.layer).toBe("bottom")
  expect(actual).toHaveLength(2)
  expect(reference).toHaveLength(2)
  for (let index = 0; index < actual.length; index++) {
    expect(actual[index].layer).toBe(reference[index].layer)
    expect(actual[index].x + 16).toBeCloseTo(reference[index].x)
    expect(actual[index].y).toBeCloseTo(reference[index].y)
  }
})
