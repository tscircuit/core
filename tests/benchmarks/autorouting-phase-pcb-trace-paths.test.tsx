import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { expect, test } from "bun:test"
import os from "node:os"
import type { AutoroutingEndEvent, AutoroutingStartEvent } from "lib/events"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { getAutoroutingPhasePcbTracePaths } from "lib/components/primitive-components/Group/get-autorouting-phase-pcb-trace-paths"
import { createDenseRp2040UnphasedCircuit } from "tests/features/autorouter-dense-rp2040-phases.fixture"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Opt-in measurement, not a timing assertion that would be flaky across CI hosts.
test.skipIf(!process.env.BENCHMARK_PCB_TRACE_PATHS)(
  "measure always-on PCB path export cost",
  async () => {
    console.log({
      runtime: `Bun ${Bun.version}`,
      cpu: os.cpus()[0]?.model,
      platform: `${os.platform()} ${os.arch()}`,
    })
    for (const size of [1, 18, 64]) {
      const { circuit } =
        size === 18
          ? createDenseRp2040UnphasedCircuit("beta_pipeline9")
          : getTestFixture()
      if (size === 64) circuit.schematicDisabled = true
      if (size !== 18)
        circuit.add(
          <board
            width={20}
            height={size * 2 + 4}
            routeRemaining
            autorouter={
              size === 64
                ? {
                    algorithmFn: createBasicAutorouter(async (input) =>
                      input.connections.map((connection) => ({
                        type: "pcb_trace",
                        pcb_trace_id: connection.name,
                        connection_name: connection.name,
                        route: connection.pointsToConnect.map((point) => ({
                          route_type: "wire",
                          x: point.x,
                          y: point.y,
                          layer: point.layer,
                          width: 0.2,
                        })),
                      })),
                    ),
                  }
                : undefined
            }
          >
            {Array.from({ length: size }, (_, row) => (
              <group key={row}>
                <resistor
                  name={`L${row}`}
                  resistance="1k"
                  footprint="0402"
                  pcbX={-5}
                  pcbY={row * 2 - size}
                />
                <resistor
                  name={`R${row}`}
                  resistance="1k"
                  footprint="0402"
                  pcbX={5}
                  pcbY={row * 2 - size}
                />
                <trace from={`L${row}.1`} to={`R${row}.1`} />
              </group>
            ))}
          </board>,
        )
      let start: AutoroutingStartEvent | undefined
      let end: AutoroutingEndEvent | undefined
      let startedAt = 0
      let routingMs = 0
      circuit.on("autorouting:start", (event) => {
        start = structuredClone(event)
        startedAt = performance.now()
      })
      circuit.on("autorouting:end", (event) => {
        end = structuredClone(event)
        routingMs = performance.now() - startedAt
      })
      await circuit.renderUntilSettled()
      if (!end)
        console.log(
          circuit
            .getCircuitJson()
            .filter((element) => element.type.includes("error")),
        )
      expect(end!.pcbTracePathsUnavailableReason).toBeUndefined()
      const group = circuit.firstChild as Group
      const convert = () =>
        getAutoroutingPhasePcbTracePaths({
          group,
          subcircuit: group,
          input: start!.simpleRouteJson,
          traces: end!.simpleRouteJson.traces!,
          isFanout: false,
        })
      for (let warmup = 0; warmup < 10; warmup++) convert()
      const conversionMs: number[] = []
      const serializationMs: number[] = []
      let jsonBytes = 0
      for (let repetition = 0; repetition < 100; repetition++) {
        const before = performance.now()
        const result = convert()
        const converted = performance.now()
        const json = JSON.stringify(result.pcbTracePaths)
        serializationMs.push(performance.now() - converted)
        conversionMs.push(converted - before)
        expect(result.pcbTracePathsUnavailableReason).toBeUndefined()
        expect(result.pcbTracePaths).toHaveLength(size)
        jsonBytes = Buffer.byteLength(json)
      }
      conversionMs.sort((a, b) => a - b)
      serializationMs.sort((a, b) => a - b)
      console.log(
        JSON.stringify({
          connections: size,
          synthetic: size === 64,
          routePoints: end!.pcbTracePaths!.reduce(
            (count, trace) => count + trace.route.length,
            0,
          ),
          routingMs,
          conversionMedianMs: conversionMs[50],
          conversionP95Ms: conversionMs[95],
          serializationMedianMs: serializationMs[50],
          serializationP95Ms: serializationMs[95],
          medianPercentOfRouting:
            size === 64 ? undefined : (100 * conversionMs[50]!) / routingMs,
          jsonBytes,
        }),
      )
    }
  },
  180_000,
)
