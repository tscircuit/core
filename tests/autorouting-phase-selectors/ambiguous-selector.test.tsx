import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("ambiguous-selector", async () => {
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
        connections={["R1.pin1"]}
      />
      <trace name="R1.pin1" from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'connection "R1.pin1" is ambiguous',
  )
})
