import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed netlabel wires retain crossing hops on their own sheet", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board routingDisabled>
      <net name="GND" isGroundNet />
      <schematicsheet name="Connections" sheetWidth={12} sheetHeight={8} />
      <group schSheetName="Connections">
        <chip
          name="U_GND"
          schX={0}
          schY={2}
          pinLabels={{ pin1: "GND" }}
          schPinArrangement={{ bottomSide: [1] }}
        />
        <chip
          name="U_SIGNAL"
          schX={3}
          schY={0}
          pinLabels={{ pin1: "SIGNAL" }}
          schPinArrangement={{ leftSide: [1] }}
        />
        <netlabel
          net="GND"
          connection="U_GND.pin1"
          schX={0}
          schY={-1}
          anchorSide="top"
        />
        <netlabel
          net="SIGNAL"
          connection="U_SIGNAL.pin1"
          schX={-2}
          schY={0}
          anchorSide="right"
        />
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()

  const crossings = circuit.db.schematic_trace
    .list()
    .flatMap((trace) => trace.edges)
    .filter((edge) => edge.is_crossing)
  expect(crossings).toHaveLength(1)
  expect((crossings[0]!.from.x + crossings[0]!.to.x) / 2).toBeCloseTo(0)
  expect(crossings[0]!.from.y).toBeCloseTo(0)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
