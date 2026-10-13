import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("phase names and endpoints select and deduplicate the requested traces", async () => {
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
      <trace name="DDR_D1" from=".R1 > .pin2" to=".R2 > .pin2" />
      <autoroutingphase
        name="DDR_FIRST"
        phaseIndex={0}
        connections={["DDR_D0", "trace.DDR_D0"]}
      />
      <pcbnotetext text="DDR_D0 selected first; DDR_D1 remaining" pcbY={3} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const plans = Group_getRoutingPhasePlans(circuit.firstChild as Board)
  expect(
    plans.find((p) => p.routingPhaseIndex === 0)?.traces.map((t) => t.name),
  ).toEqual(["DDR_D0"])
  expect(
    plans.find((p) => p.routingPhaseIndex === null)?.traces.map((t) => t.name),
  ).toEqual(["DDR_D1"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
