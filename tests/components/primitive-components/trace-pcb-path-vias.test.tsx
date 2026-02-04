import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace pcbPath supports vias with inner layer transitions", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm" layers={4}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={
          [
            { x: 1, y: 0, via: true, fromLayer: "top", toLayer: "inner1" },
            { x: 1, y: 2 },
            { x: 5, y: 2, via: true, fromLayer: "inner1", toLayer: "inner2" },
            { x: 5, y: -2 },
            { x: 9, y: -2, via: true, fromLayer: "inner2", toLayer: "top" },
          ] as Array<{
            x: number
            y: number
            via?: boolean
            fromLayer?: "top" | "inner1" | "inner2" | "bottom"
            toLayer?: "top" | "inner1" | "inner2" | "bottom"
          }>
        }
      />
      <silkscreentext
        pcbX={0}
        pcbY={-3}
        anchorAlignment="center"
        fontSize={0.6}
        text="Should have inner1/inner2 traces"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
