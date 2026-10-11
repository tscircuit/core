import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SignalTerminal } from "./fixtures/matched-bus-phase-split.fixture"

test("complete fanout escapes cannot hide a split matched global bus", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  const phaseOutputs: SimpleRouteJson[] = []
  const autorouters: string[] = []
  let fullRouteCalls = 0
  circuit.on("autorouting:start", (event) => {
    phaseInputs.push(event.simpleRouteJson)
    autorouters.push(event.autorouterName!)
  })
  circuit.on("autorouting:end", (event) => {
    phaseOutputs.push(event.simpleRouteJson)
  })
  circuit.add(
    <board
      width={30}
      height={18}
      layers={2}
      schematicDisabled
      routeRemaining={false}
    >
      {/* Saved escape points are fanout-local mm, +X right and +Y top. */}
      <fanout
        name="TX_ESCAPE"
        pcbRelative
        pcbX={-10}
        pcbTracePaths={[
          {
            connection: "TX0.pin1",
            route: [
              { route_type: "wire", x: 0, y: 3, layer: "top", width: 0.15 },
              { route_type: "wire", x: 3, y: 3, layer: "top", width: 0.15 },
            ],
          },
          {
            connection: "TX1.pin1",
            route: [
              { route_type: "wire", x: 0, y: -3, layer: "top", width: 0.15 },
              { route_type: "wire", x: 3, y: -3, layer: "top", width: 0.15 },
            ],
          },
        ]}
      >
        <SignalTerminal name="TX0" pcbX={0} pcbY={3} />
        <SignalTerminal name="TX1" pcbX={0} pcbY={-3} />
      </fanout>
      <SignalTerminal name="RX0" pcbX={10} pcbY={3} />
      <SignalTerminal name="RX1" pcbX={6} pcbY={-3} />
      <trace name="DATA0" from="TX0.pin1" to="RX0.pin1" routingPhaseIndex={0} />
      <trace name="DATA1" from="TX1.pin1" to="RX1.pin1" routingPhaseIndex={1} />
      <bus name="DATA" connections={["DATA0", "DATA1"]} maxLengthSkew={0.1} />
      <autoroutingphase
        name="FIRST_DATA"
        phaseIndex={0}
        autorouter="bus_lanes"
        algorithmFn={createBasicAutorouter(async () => {
          fullRouteCalls++
          return []
        })}
      />
      <autoroutingphase
        name="SECOND_DATA"
        phaseIndex={1}
        autorouter="bus_lanes"
      />
      <pcbnotetext
        pcbY={6}
        fontSize={0.4}
        text="DATA0: TX0 to RX0; DATA1: TX1 to RX1"
      />
      <pcbnotetext
        pcbY={-6.5}
        fontSize={0.35}
        text="Saved TX escapes finish; global DATA members split."
      />
      <pcbnotetext
        pcbY={-7.2}
        fontSize={0.35}
        text="0.1mm DATA limit stops FIRST_DATA; no routes committed."
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(autorouters).toEqual(["precomputed"])
  expect(fullRouteCalls).toBe(0)
  expect(phaseInputs[0].connections).toHaveLength(2)
  expect(phaseInputs[0].buses?.[0].connectionNames).toHaveLength(2)
  expect(phaseOutputs[0].traces).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.source_bus.list()[0].source_trace_ids).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message:
        'Length-matched bus "DATA" cannot be split across autorouting phases. Assign the complete bus to one routingPhaseIndex.',
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
