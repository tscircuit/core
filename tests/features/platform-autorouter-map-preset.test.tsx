import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board autorouter preset resolves through platform autorouterMap", async () => {
  let createAutorouterCalled = false

  const { circuit } = getTestFixture({
    platform: {
      autorouterMap: {
        krt: {
          createAutorouter: (simpleRouteJson) => {
            createAutorouterCalled = true
            return new TscircuitAutorouter(simpleRouteJson) as any
          },
        },
      },
    },
  })

  circuit.add(
    <board width="20mm" height="20mm" autorouter="krt">
      <resistor name="R1" pcbX={-5} pcbY={0} resistance="1k" footprint="0402" />
      <led name="LED1" pcbX={5} pcbY={0} footprint="0603" />
      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(createAutorouterCalled).toBe(true)
})
