import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board autorouter preset resolves through platform autorouterMap", async () => {
  let createAutorouterCalled = false

  const { circuit } = getTestFixture({
    platform: {
      autorouterMap: {
        krt: {
          createAutorouter: (simpleRouteJson) => {
            createAutorouterCalled = true
            return new TscircuitAutorouter(simpleRouteJson) as any
          },
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="20mm" autorouter="krt">
      <resistor name="R1" pcbX={-5} pcbY={0} resistance="1k" footprint="0402" />
      <led name="LED1" pcbX={5} pcbY={0} footprint="0603" />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(createAutorouterCalled).toBe(true)
})

test("krt preset receives default nominal trace width", async () => {
  let capturedSimpleRouteJson: SimpleRouteJson | undefined

  const { circuit } = getTestFixture({
    platform: {
      autorouterMap: {
        krt: {
          createAutorouter: (simpleRouteJson) => {
            capturedSimpleRouteJson = simpleRouteJson
            return new TscircuitAutorouter(simpleRouteJson) as any
          },
        },
      },
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" autorouter="krt">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C2" />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      <trace from=".R1 > .pin1" to=".C2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(capturedSimpleRouteJson?.minTraceWidth).toBe(0.15)
  expect(capturedSimpleRouteJson?.nominalTraceWidth).toBe(0.15)
  const routeWidths = pcbTraces.flatMap((trace) =>
    trace.route
      .filter((point) => point.route_type === "wire")
      .map((point) => point.width),
  )
  expect(routeWidths).toEqual(expect.arrayContaining([0.15]))
  expect(routeWidths.every((width) => Number.isFinite(width))).toBe(true)
  expect(pcbTraces.length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
