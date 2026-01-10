import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify net connectsTo accepts net-to-net connections

test("net connectsTo array of nets", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <net name="VCC" />
      <net name="VCC_REGULATED" />
      <net name="VCC_MAIN" connectsTo={["net.VCC", "net.VCC_REGULATED"]} />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      "net.VCC to net.VCC_MAIN",
      "net.VCC_REGULATED to net.VCC_MAIN",
    ]
  `)
})

test("net connectsTo single net", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <net name="GND" />
      <net name="GND_PLANE" connectsTo="net.GND" />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      "net.GND to net.GND_PLANE",
    ]
  `)
})
