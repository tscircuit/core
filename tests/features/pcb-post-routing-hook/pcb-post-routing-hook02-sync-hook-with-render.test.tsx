import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a sync hook runs inline, so a board without autorouting renders with circuit.render()", () => {
  const { circuit } = getTestFixture()
  let runs = 0
  circuit.add(
    <board
      width="10mm"
      height="10mm"
      pcbPostRoutingHook={() => {
        runs++
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )
  circuit.render()
  expect(runs).toBe(1)
})
