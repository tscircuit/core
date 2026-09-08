import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("4-pin pushbutton emits documented default internal connections (#3115)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pushbutton
        name="SW1"
        footprint="pushbutton_id1.3mm_od2mm"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sw1 = circuit.selectOne("pushbutton.SW1") as any
  expect(sw1.internallyConnectedPinNames).toEqual([
    ["pin1", "pin2"],
    ["pin3", "pin4"],
  ])

  const internalPins = sw1._getInternallyConnectedPins()
  expect(internalPins).toHaveLength(2)
  expect(internalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ])
  expect(internalPins[1].map((p: any) => p.props.name).sort()).toEqual([
    "pin3",
    "pin4",
  ])

  const jsonConnections = circuit.db.source_component_internal_connection.list()
  expect(jsonConnections).toHaveLength(2)
  expect(
    jsonConnections.every(
      (connection: { source_port_ids: string[] }) =>
        connection.source_port_ids.length === 2,
    ),
  ).toBe(true)
})

test("explicit internallyConnectedPins still overrides the pushbutton default", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pushbutton
        name="SW1"
        footprint="pushbutton_id1.3mm_od2mm"
        internallyConnectedPins={[
          [1, 4],
          [2, 3],
        ]}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sw1 = circuit.selectOne("pushbutton.SW1") as any
  expect(sw1.internallyConnectedPinNames).toEqual([
    ["pin1", "pin4"],
    ["pin2", "pin3"],
  ])
})
