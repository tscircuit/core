import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a custom fanout algorithm replaces the built-in fanout pipeline", async () => {
  const { circuit } = getTestFixture()
  let customAlgorithmCallCount = 0
  let autoroutingStageCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStageCount++
  })

  const customFanoutAlgorithm = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      customAlgorithmCallCount++
      return simpleRouteJson.connections.map((connection) => {
        const [start, end] = connection.pointsToConnect
        return {
          type: "pcb_trace" as const,
          pcb_trace_id: `custom_fanout_${connection.name}`,
          connection_name: connection.name,
          route: [
            {
              route_type: "wire" as const,
              x: start.x,
              y: start.y,
              width:
                connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
              layer: start.layer,
            },
            {
              route_type: "wire" as const,
              x: end.x,
              y: end.y,
              width:
                connection.nominalTraceWidth ?? simpleRouteJson.minTraceWidth,
              layer: end.layer,
            },
          ],
        }
      })
    },
  )

  circuit.add(
    <board
      width="20mm"
      height="10mm"
      autorouter={{ preset: "fanout", algorithmFn: customFanoutAlgorithm }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(customAlgorithmCallCount).toBe(1)
  expect(autoroutingStageCount).toBe(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
