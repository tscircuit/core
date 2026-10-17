import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPaths stay fixed through routing and simplification", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  let originalManualTraces: PcbTrace[] | undefined
  circuit.on("autorouting:start", (event) => {
    originalManualTraces ??= structuredClone(circuit.db.pcb_trace.list())
    phaseInputs.push(event.simpleRouteJson)
  })

  circuit.add(
    <board
      width={26}
      height={20}
      layers={1}
      schematicDisabled
      autorouter="beta-pipeline9"
    >
      <pcbnotetext
        pcbY={8}
        fontSize={0.6}
        text="Manual pcbPaths stay fixed after simplify"
      />
      <pcbnotetext
        pcbY={-8}
        fontSize={0.5}
        text="Preserve the 30 mm meander and its separate branch"
      />
      <testpoint name="M1" pcbX={-4} pcbY={3} padDiameter={0.7} />
      <testpoint name="M2" pcbX={4} pcbY={3} padDiameter={0.7} />
      <testpoint name="M3" pcbX={-8} pcbY={-5} padDiameter={0.7} />
      <trace
        name="MANUAL"
        path={["M1.pin1", "M2.pin1", "M3.pin1"]}
        thickness={0.3}
        pcbPathRelativeTo="M1.pin1"
        pcbPaths={[
          [
            "M1.pin1",
            { x: 0, y: -6 },
            { x: 2, y: -6 },
            { x: 2, y: -1 },
            { x: 4, y: -1 },
            { x: 4, y: -6 },
            { x: 6, y: -6 },
            { x: 6, y: -1 },
            { x: 8, y: -1 },
            "M2.pin1",
          ],
          ["M1.pin1", { x: -4, y: 0 }, "M3.pin1"],
        ]}
      />
      <testpoint name="LEFT" pcbX={-10} pcbY={6} padDiameter={0.7} />
      <testpoint name="RIGHT" pcbX={10} pcbY={6} padDiameter={0.7} />
      <autoroutingphase phaseIndex={0} connection="LEFT.pin1" />
      <autoroutingphase reroute autorouter="simplify" />
      <trace name="AUTO" from="LEFT.pin1" to="RIGHT.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(originalManualTraces).toHaveLength(2)
  expect(phaseInputs).toHaveLength(2)
  for (const originalTrace of originalManualTraces!) {
    expect(circuit.db.pcb_trace.get(originalTrace.pcb_trace_id)?.route).toEqual(
      originalTrace.route,
    )
    for (const input of phaseInputs) {
      expect(
        input.traces?.some(
          (trace) => trace.pcb_trace_id === originalTrace.pcb_trace_id,
        ) ?? false,
      ).toBe(false)
    }
  }
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
  })
})
