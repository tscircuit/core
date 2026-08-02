import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual breakout points preserve fanout for automatic plane drops", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="12mm" height="8mm" layers={4}>
      <copperpour layer="inner1" connectsTo="net.GND" />
      <breakout
        name="U1_BREAKOUT"
        pcbX={-3}
        width="4mm"
        height="4mm"
        fanoutPourNetMap={{ inner1: "GND" }}
        busFanoutDirections={{
          DATA_BUS: "center_right",
          GND_DROP: "center_left",
        }}
      >
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["GND"]}
                pcbY={0.5}
                shape="circle"
                radius="0.25mm"
              />
              <smtpad
                portHints={["DATA"]}
                pcbY={-0.5}
                shape="circle"
                radius="0.25mm"
              />
              <smtpad
                portHints={["MANUAL_GND"]}
                pcbX={0.5}
                shape="circle"
                radius="0.25mm"
              />
            </footprint>
          }
        />
        <breakoutpoint connection=".U1 > .DATA" pcbX={1.9999} pcbY={-0.5} />
        <trace name="GND_DROP" from=".U1 > .GND" to="net.GND" />
        <trace
          name="MANUAL_GND_DROP"
          from=".U1 > .MANUAL_GND"
          to="net.GND"
          pcbPathRelativeTo=".U1 > .MANUAL_GND"
          pcbPath={[
            {
              x: 0,
              y: 0,
              via: true,
              fromLayer: "top",
              toLayer: "inner1",
            },
          ]}
        />
      </breakout>

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} />
      <trace name="DATA" from=".U1 > .DATA" to=".R1 > .pin1" />
      <bus name="DATA_BUS" connections={["DATA"]} routingPhaseIndex={0} />
      <pcbnotetext
        text="Manual DATA exit + automatic GND plane fanout"
        pcbY={3.5}
        fontSize="0.2mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(3)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([1, 1, 1])
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
