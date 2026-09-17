import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("switch noConnect accepts a readonly pin alias without marking other ports", async () => {
  const { circuit } = getTestFixture()
  const noConnect = ["UNUSED"] as const

  circuit.add(
    <board width="30mm" height="20mm">
      <switch
        name="SW1"
        spdt
        footprint="pinrow3"
        pinLabels={{ pin1: "COM", pin2: "OUT", pin3: "UNUSED" }}
        noConnect={noConnect}
        schX={-3}
      />
      <switch name="SW2" spdt footprint="pinrow3" pcbX={6} schX={3} />
      <schematictext
        text="SW1: UNUSED (pin3) intentionally unconnected"
        schX={-3}
        schY={1}
        fontSize={0.12}
      />
      <schematictext
        text="SW2: all pins connectable"
        schX={3}
        schY={1}
        fontSize={0.12}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  const switch1 = circuit.db.source_component.getWhere({ name: "SW1" })!
  expect(sourcePorts).toHaveLength(6)
  expect(
    sourcePorts
      .filter((port) => port.do_not_connect)
      .map((port) => [port.source_component_id, port.pin_number]),
  ).toEqual([[switch1.source_component_id, 3]])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
