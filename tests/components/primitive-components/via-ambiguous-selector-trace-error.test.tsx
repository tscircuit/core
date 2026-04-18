import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via shorthand selectors do not fall back to the via component for traces", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <led name="LED1" footprint="0603" pcbX={5} pcbY={0} />
      <led name="LED2" footprint="0603" pcbX={5} pcbY={-5} />
      <via
        name="via"
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.8mm"
        holeDiameter="0.4mm"
        pcbX={0}
        pcbY={0}
      />
      <via
        name="via2"
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.8mm"
        holeDiameter="0.4mm"
        pcbX={0}
        pcbY={-5}
      />
      <trace from=".via" to=".LED1 > .pos" />
      <trace from=".via2 > .top" to=".LED2 > .pos" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  const connectionErrors = circuitJson.filter(
    (c: AnyCircuitElement) => c.type === "source_trace_not_connected_error",
  )

  expect(connectionErrors).toHaveLength(1)
  expect(connectionErrors[0].message).toMatchInlineSnapshot(
    `"Could not find port for selector \".via\""`,
  )

  const sourceTraces = circuitJson.filter(
    (c: AnyCircuitElement) => c.type === "source_trace",
  )

  expect(sourceTraces).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
