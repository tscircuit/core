import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("reroute-selector", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        schX={-3}
      />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} schX={3} />
      <trace name="DDR_D0" from=".R1 > .pin1" to=".R2 > .pin1" />
      <autoroutingphase
        name="DDR_FIRST"
        phaseIndex={0}
        connections={["DDR_D0"]}
      />
      <autoroutingphase
        name="SECOND"
        phaseIndex={1}
        connections={["trace.DDR_D0"]}
        reroute
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.firstChild as Board
  const plans = Group_getRoutingPhasePlans(board)
  expect(
    plans
      .filter((p) => p.traces.some((t) => t.name === "DDR_D0"))
      .map((p) => p.routingPhaseIndex),
  ).toEqual([0, 1])
})
