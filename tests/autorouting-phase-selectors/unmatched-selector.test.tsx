import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("unmatched-selector", async () => {
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
        connections={["DDR_D0", "DDR_D00"]}
      />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Autorouting phase "DDR_FIRST": connection "DDR_D00" matched no trace or endpoint',
  )
  expect(
    (circuit.firstChild as Board).selectOne("trace.DDR_D0")?.props
      .routingPhaseIndex,
  ).toBeUndefined()
})
