import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("a resolved breakout trace stays owned by its breakout", async () => {
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
      <breakout name="ESCAPE">
        <trace name="DDR_D0" from=".R1 > .pin1" to=".R2 > .pin1" />
      </breakout>
      <autoroutingphase name="DDR_FIRST" phaseIndex={0} connection="DDR_D0" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const plans = Group_getRoutingPhasePlans(circuit.firstChild as Board)
  expect(plans.find((p) => p.routingPhaseIndex === 0)?.traces).toEqual([])
  expect(
    plans.filter((p) => p.traces.some((t) => t.name === "DDR_D0")),
  ).toHaveLength(1)
})
