import { expect, test } from "bun:test"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getUndersizedTrace = (
  simpleRouteJson: SimpleRouteJson,
): SimplifiedPcbTrace => {
  const connection = simpleRouteJson.connections[0]!
  return {
    type: "pcb_trace",
    pcb_trace_id: "undersized_trace",
    connection_name: connection.name,
    route: connection.pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: 0.1,
      layer: point.layer,
    })),
  }
}

test("autorouter rejects an undersized cached result", async () => {
  let capturedSimpleRouteJson: SimpleRouteJson | undefined
  let cacheGetCount = 0
  let cacheSetCount = 0
  const localCacheEngine: LocalCacheEngine = {
    getItem: () => {
      cacheGetCount++
      if (!capturedSimpleRouteJson) return null
      return JSON.stringify({
        ...capturedSimpleRouteJson,
        traces: [getUndersizedTrace(capturedSimpleRouteJson)],
      })
    },
    setItem: () => {
      cacheSetCount++
    },
  }
  const { circuit } = getTestFixture({ platform: { localCacheEngine } })
  let autoroutingEndCount = 0
  circuit.on("autorouting:start", (event) => {
    capturedSimpleRouteJson = event.simpleRouteJson
  })
  circuit.on("autorouting:end", () => {
    autoroutingEndCount++
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} />
      <trace
        name="WIDE_CACHED_SIGNAL"
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        width="0.5mm"
      />
      <pcbnotetext
        pcbY={3}
        fontSize={0.5}
        text="Reject cached 0.1mm route for 0.5mm source trace"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(cacheGetCount).toBe(1)
  expect(cacheSetCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toEqual([])
  expect(autoroutingEndCount).toBe(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()[0]?.message).toContain(
    'Autorouter output trace "undersized_trace" has maximum width 0.1mm, below min_trace_thickness 0.5mm',
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
