import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<fuse /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse
        name="F1"
        currentRating="10"
        voltageRating="220"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<fuse /> honours schShowRatings={false}", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm" routingDisabled>
      <fuse
        name="F1"
        currentRating="1A"
        voltageRating="32V"
        footprint="0402"
        schX={-4}
      />
      <fuse
        name="F2"
        currentRating="1A"
        voltageRating="32V"
        schShowRatings
        footprint="0402"
        schX={0}
      />
      <fuse
        name="F3"
        currentRating="1A"
        voltageRating="32V"
        schShowRatings={false}
        footprint="0402"
        schX={4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const nameBySourceId = Object.fromEntries(
    circuitJson
      .filter((e: any) => e.type === "source_component")
      .map((e: any) => [e.source_component_id, e.name]),
  )
  const symbolValueByName = Object.fromEntries(
    circuitJson
      .filter((e: any) => e.type === "schematic_component")
      .map((e: any) => [
        nameBySourceId[e.source_component_id],
        e.symbol_display_value,
      ]),
  )

  // `schShowRatings` has no schema default on fuse, so omitting it keeps the
  // existing "always show" behaviour...
  expect(symbolValueByName.F1).toBe("1A / 32V")
  expect(symbolValueByName.F2).toBe("1A / 32V")
  // ...and only an explicit `false` suppresses the ratings. This prop is
  // declared on FuseProps but used to be ignored entirely.
  expect(symbolValueByName.F3).toBeUndefined()
})
