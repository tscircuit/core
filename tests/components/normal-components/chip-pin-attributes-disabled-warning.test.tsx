import { expect, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip pin validation respects DRC controls and leaves other component types alone", async () => {
  const platforms: PlatformConfig[] = [
    { drcChecksDisabled: true },
    { pinSpecificationDrcChecksDisabled: true },
  ]
  for (const platform of platforms) {
    const { circuit } = getTestFixture({ platform })
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic8" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.source_component_pins_underspecified_warning.list(),
    ).toHaveLength(0)
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <resistor name="R1" footprint="0402" resistance="1k" />
      <connector name="J1" footprint="pinrow2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toHaveLength(0)
})
