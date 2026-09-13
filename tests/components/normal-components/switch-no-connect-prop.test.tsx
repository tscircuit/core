import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SPDT noConnect marks only the unused source port", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <switch name="SW1" type="spdt" footprint="pinrow3" noConnect={["pin3"]} />
      <trace from=".SW1 > .pin1" to=".SW1 > .pin2" />
      <schematictext
        text="SW1: pin3 intentionally unconnected"
        schY={1.5}
        fontSize={0.15}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePorts = circuit.db.source_port.list()
  expect(sourcePorts).toHaveLength(3)
  expect(
    sourcePorts.find((port) => port.pin_number === 3)?.do_not_connect,
  ).toBe(true)
  expect(
    sourcePorts
      .filter((port) => port.do_not_connect)
      .map((port) => port.pin_number),
  ).toEqual([3])
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
