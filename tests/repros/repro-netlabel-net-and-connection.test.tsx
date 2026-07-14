import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// biome-ignore lint/suspicious/noExportsInTest: Preserve the reported circuit as a reusable reproduction.
export const PowerPathControl = () => (
  <board routingDisabled schMaxTraceDistance={1000}>
    <net name="GND" />
    <netlabel
      net="GND"
      connection=".R205 .pin1"
      schX={0}
      schY={0}
      schRotation={90}
      anchorSide="top"
    />
    <resistor
      name="R210"
      resistance="0"
      footprint="0402"
      schRotation={0}
      schX={1}
      schY={1}
    />
    <trace from=".R210 .pin1" to="net.GND" />
  </board>
)

test("netlabel supports net and connection together", () => {
  const { circuit } = getTestFixture()

  circuit.add(<PowerPathControl />)
  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
