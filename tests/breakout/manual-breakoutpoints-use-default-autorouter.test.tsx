import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual breakout points use the default autorouter before global routing", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="12mm" height="8mm">
      <breakout name="U1_BREAKOUT" pcbX={-3} width="4mm" height="4mm">
        <chip
          name="U1"
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={0.5}
                width="0.5mm"
                height="0.5mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={-0.5}
                width="0.5mm"
                height="0.5mm"
                shape="rect"
              />
            </footprint>
          }
        />
        <breakoutpoint connection=".U1 > .pin1" pcbX={1.9999} pcbY={0.5} />
        <breakoutpoint connection=".U1 > .pin2" pcbX={1.9999} pcbY={-0.5} />
      </breakout>

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={3} pcbY={1} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={-1} />
      <trace name="D0" from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace name="D1" from=".U1 > .pin2" to=".R2 > .pin1" />
      <bus name="DATA" connections={["D0", "D1"]} routingPhaseIndex={0} />
      <pcbnotetext
        text="Manual breakout points: default autorouter, then global DATA bus"
        pcbY={3.5}
        fontSize="0.2mm"
        anchorAlignment="center"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(
    autoroutingPhaseIoStack.map(
      (phaseIo) => phaseIo.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual([2, 2])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("an explicit fanout autorouter is preserved with a manual breakout point", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true

  circuit.add(
    <board width="8mm" height="8mm">
      <breakout autorouter="fanout" width="4mm" height="4mm">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-0.75} />
        <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={0.75} />
        <trace from=".R1 > .pin2" to=".C1 > .pin1" />
        <breakoutpoint connection=".R1 > .pin1" pcbX={1.9} pcbY={1.5} />
      </breakout>
    </board>,
  )

  await circuit.renderUntilSettled()

  const routingPhasePlans = (
    circuit.firstChild as Group<any>
  )._getRoutingPhasePlans()
  expect(routingPhasePlans).toHaveLength(1)
  expect(routingPhasePlans[0]?.autorouter).toBe("fanout")
})
