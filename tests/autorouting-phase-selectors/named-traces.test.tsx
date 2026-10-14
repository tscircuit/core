import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import type { Board } from "lib/components/normal-components/Board/Board"

test("phase names and endpoints select and deduplicate the requested traces", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={28} height={18} autorouter="local">
      <pcbnotetext text="Named trace selection" pcbY={7} fontSize={1} />
      <pcbnotetext
        text='["DDR_D0", "trace.DDR_D0"] selects one trace'
        pcbY={5.5}
        fontSize={0.65}
      />
      <resistor name="R1" resistance="1k" footprint="1206" pcbX={-8} pcbY={2} />
      <resistor name="R2" resistance="1k" footprint="1206" pcbX={8} pcbY={2} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="1206"
        pcbX={-8}
        pcbY={-3}
      />
      <resistor name="R4" resistance="1k" footprint="1206" pcbX={8} pcbY={-3} />
      <trace name="DDR_D0" from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace name="DDR_D1" from=".R3 > .pin2" to=".R4 > .pin1" />
      <autoroutingphase
        name="DDR_FIRST"
        phaseIndex={0}
        connections={["DDR_D0", "trace.DDR_D0"]}
      />
      <pcbnotetext text="DDR_D0" pcbY={3} fontSize={0.8} />
      <pcbnotetext text="Phase 0: DDR_FIRST" pcbY={0.5} fontSize={0.7} />
      <pcbnotetext text="DDR_D1" pcbY={-2} fontSize={0.8} />
      <pcbnotetext
        text="Default phase: remaining trace"
        pcbY={-4.5}
        fontSize={0.7}
      />
      <pcbnotetext
        text="Duplicate selectors do not duplicate routing"
        pcbY={-7}
        fontSize={0.6}
      />
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
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showDebugObjects: false,
  })
})
