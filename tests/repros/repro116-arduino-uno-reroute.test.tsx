import { expect, test } from "bun:test"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const markerY = 8.4321

test("repro116: arduino uno circuit json can reroute imported traces", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  const rerouteConnectionNames: string[] = []

  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  const arduinoUnoCircuitJson = converter.getOutput()
  const importedTraceCount = arduinoUnoCircuitJson.filter(
    (element) => element.type === "pcb_trace",
  ).length

  const rerouteImportedRegion = createBasicAutorouter(
    async (simpleRouteJson: SimpleRouteJson) => {
      phaseInputs.push(structuredClone(simpleRouteJson))
      rerouteConnectionNames.push(
        ...simpleRouteJson.connections.map((connection) => connection.name),
      )

      return simpleRouteJson.connections.map(
        (connection): SimplifiedPcbTrace => {
          const [start, end] = connection.pointsToConnect
          const width =
            connection.nominalTraceWidth ??
            connection.width ??
            simpleRouteJson.minTraceWidth
          const layer = start.layer ?? end.layer ?? "top"

          return {
            type: "pcb_trace",
            pcb_trace_id: `${connection.name}_rerouted`,
            connection_name: connection.name,
            route: [
              {
                route_type: "wire",
                x: start.x,
                y: start.y,
                width,
                layer: start.layer ?? layer,
              },
              {
                route_type: "wire",
                x: (start.x + end.x) / 2,
                y: markerY,
                width,
                layer,
              },
              {
                route_type: "wire",
                x: end.x,
                y: end.y,
                width,
                layer: end.layer ?? layer,
              },
            ],
          }
        },
      )
    },
  )

  circuit.add(
    <board>
      <subcircuit circuitJson={arduinoUnoCircuitJson} />
      <autoroutingphase
        reroute
        region={{
          shape: "rect",
          minX: -11.63,
          maxX: -10.83,
          minY: 6.85,
          maxY: 7.65,
        }}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: rerouteImportedRegion,
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(phaseInputs).toHaveLength(1)
  expect(phaseInputs[0]!.connections.length).toBeGreaterThan(0)
  expect(phaseInputs[0]!.traces?.length).toBeGreaterThan(0)
  expect(
    rerouteConnectionNames.some((name) =>
      name.startsWith("source_trace_0_reroute_"),
    ),
  ).toBe(true)

  const finalTraces = circuit.db.pcb_trace.list()
  expect(finalTraces.length).toBeLessThan(importedTraceCount * 2)
  expect(new Set(finalTraces.map((trace) => trace.pcb_trace_id)).size).toBe(
    finalTraces.length,
  )
  expect(
    finalTraces.some(
      (trace) =>
        trace.source_trace_id === "source_trace_0" &&
        trace.route.some(
          (point) =>
            point.route_type === "wire" && Math.abs(point.y - markerY) < 1e-6,
        ),
    ),
  ).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 15_000)
