import { expect, test } from "bun:test"
import type { AutoroutingEndEvent, AutoroutingStartEvent } from "lib/events"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unrepresentable output reports a reason without partial paths or input mutation", async () => {
  const { circuit } = getTestFixture()
  let start: AutoroutingStartEvent | undefined
  let end: AutoroutingEndEvent | undefined
  circuit.on("autorouting:start", (event) => {
    start = structuredClone(event)
  })
  circuit.on("autorouting:end", (event) => {
    end = structuredClone(event)
  })
  circuit.add(
    <board width={20} height={10}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from="R1.1" to="R2.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const group = circuit.firstChild as Group
  const before = JSON.stringify({ start, end })
  const result = getAutoroutingPhasePcbTracePaths({
    group,
    subcircuit: group,
    input: start!.simpleRouteJson,
    isFanout: false,
    traces: [
      ...end!.simpleRouteJson.traces!,
      {
        type: "pcb_trace",
        pcb_trace_id: "unsupported",
        route: [
          { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
          {
            route_type: "jumper",
            start: { x: 0, y: 0 },
            end: { x: 2, y: 0 },
            footprint: "0603",
            layer: "top",
          },
        ],
      },
    ],
  })
  expect(result.pcbTracePaths).toBeUndefined()
  expect(result.pcbTracePathsUnavailableReason).toContain("wire/via")
  expect(JSON.stringify({ start, end })).toBe(before)
})
