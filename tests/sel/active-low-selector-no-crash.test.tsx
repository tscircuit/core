import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test, expect } from "bun:test"

// Regression test for a crash where a trace connecting to a selector that
// contains the active-low "!" prefix (e.g. "!OE") produced an uncaught
// "Unmatched selector: !.OE" error from css-select/css-what and killed the
// entire render pipeline (doInitialSourceTraceRender -> Trace__findConnectedPorts
// -> selectOne -> css-what parse).
test("active-low '!' selector does not crash the render", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "OE", pin2: "GND" }}
      />
      <net name="OE" />
      {/* This selector form previously threw "Unmatched selector: !.OE" */}
      <trace from=".U1 !.OE" to="net.OE" />
    </board>,
  )

  // Should not throw - the render degrades gracefully instead of crashing.
  expect(() => circuit.render()).not.toThrow()

  const circuitJson = circuit.getCircuitJson()
  expect(circuitJson.length).toBeGreaterThan(0)
})
