import { expect, test } from "bun:test"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a BGA ground fanout leaves the other ground pads for ordinary routing", async () => {
  const { circuit } = getTestFixture()
  const stages = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="14mm"
      height="9mm"
      layers={4}
      minTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaPadDiameter="0.45mm"
      minViaHoleDiameter="0.2mm"
      routeRemaining
      schematicDisabled
    >
      <autoroutingphase
        name="BGA ground fanout"
        connections={["GroundEscape"]}
        phaseIndex={0}
        autorouter="fanout"
        fanoutRoutingLayers={["inner1"]}
        fanoutPourNetMap={{ inner1: "GND" }}
      />
      <chip
        name="U1"
        pcbX={-3}
        footprint={
          <footprint>
            {Array.from({ length: 16 }, (_, index) => (
              <Fragment key={index}>
                <smtpad
                  shape="circle"
                  radius="0.175mm"
                  portHints={[`pin${index + 1}`]}
                  pcbX={((index % 4) - 1.5) * 0.8}
                  pcbY={(Math.floor(index / 4) - 1.5) * 0.8}
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
      <chip
        name="J1"
        pcbX={2}
        pcbY={-1.5}
        footprint={
          <platedhole
            shape="circle"
            outerDiameter={1.1}
            holeDiameter={0.6}
            portHints={["pin1"]}
          />
        }
      />
      <chip
        name="TP1"
        pcbX={5}
        pcbY={1.5}
        footprint={
          <smtpad shape="rect" width={0.8} height={0.8} portHints={["pin1"]} />
        }
      />
      <net name="GND" connectsTo={[".J1 > .pin1", ".TP1 > .pin1"]} />
      <trace name="GroundEscape" from=".U1 > .pin6" to="net.GND" />
      <copperpour
        layer="inner1"
        connectsTo="net.GND"
        clearance={0.15}
        boardEdgeMargin={0.2}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(stages).toHaveLength(2)
  expect(stages[0]?.startSimpleRouteJson?.traces ?? []).toHaveLength(0)
  expect(
    stages[0]?.startSimpleRouteJson?.connections[0]?.pointsToConnect,
  ).toHaveLength(1)
  expect(
    stages[1]?.startSimpleRouteJson?.connections.map(
      (connection) => connection.pointsToConnect.length,
    ),
  ).toEqual([1, 1])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
