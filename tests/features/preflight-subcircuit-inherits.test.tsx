import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

test("undefined policy inherits conservative from the board", async () => {
  const { circuit } = getTestFixture()
  let calls = 0
  circuit.add(
    <board
      width={12}
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
      <group preflightRoutingCheckPolicy={undefined}>
        <group subcircuit name="child" preflightRoutingCheckPolicy={undefined}>
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
          <keepout
            shape="rect"
            width={2}
            height={10}
            layers={["top", "bottom"]}
          />
          <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        </group>
      </group>
      <pcbnotetext
        pcbY={-4}
        text="CHILD INHERITS CONSERVATIVE"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(calls).toBe(0)
  expect(circuit.db.pcb_preflight_routing_error.list()).toMatchObject([
    { error_code: "fixed_obstacle_disconnect" },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
