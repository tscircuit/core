import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import type { AutoroutingPreflightEvent } from "lib/events"

test("conservative permits a path on another layer", async () => {
  const { circuit } = getTestFixture()
  let calls = 0
  const events: AutoroutingPreflightEvent[] = []
  circuit.on("autorouting:preflight", (e) => events.push(e))
  circuit.add(
    <board
      width={10}
      height={10}
      preflightRoutingCheckPolicy="conservative"
      autorouter={{
        local: true,
        algorithmFn: createBasicAutorouter(async () => {
          calls++
          return []
        }),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <keepout shape="rect" width={2} height={10} layers={["top"]} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext pcbY={-4} text="BOTTOM LAYER AVAILABLE" fontSize={0.5} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(calls).toBe(1)
  expect(events).toHaveLength(1)
  expect(events[0].status).toBe("completed")
  expect(circuit.db.pcb_preflight_routing_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
