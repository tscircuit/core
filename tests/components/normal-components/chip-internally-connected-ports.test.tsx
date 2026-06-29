import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip internallyConnectedPorts aliases internallyConnectedPins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematictext
        text="U1 has pin1-pin2 and C-D internally connected"
        fontSize={0.2}
        schY={2}
      />
      <chip
        name="U1"
        pinLabels={{
          pin1: "A",
          pin2: "B",
          pin3: "C",
          pin4: "D",
        }}
        internallyConnectedPorts={[
          ["pin1", "pin2"],
          ["C", "D"],
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const chip = circuit.selectOne("chip.U1") as any
  expect(chip.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["C", "D"],
  ])

  const sourceComponent = circuit.db.source_component.get(
    chip.source_component_id,
  )!
  const internalPortGroups =
    sourceComponent.internally_connected_source_port_ids ?? []
  expect(internalPortGroups).toHaveLength(2)
  expect(internalPortGroups.every((group) => group.length === 2)).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
