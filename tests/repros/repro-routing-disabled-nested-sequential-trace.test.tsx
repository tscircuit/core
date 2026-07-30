import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested sequential trace inherits routingDisabled", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="8mm"
      routingDisabled
      autorouter="sequential_trace"
    >
      <subcircuit name="child">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </subcircuit>
      <pcbnotetext
        text="routingDisabled prevents child routing"
        fontSize={0.4}
        pcbY={-3}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
