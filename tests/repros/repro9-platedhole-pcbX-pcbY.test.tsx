import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board with resistor being passed schX and pcbX in mm", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance={10}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="-4"
              pcbY="0"
              shape="circle"
              outerDiameter={1.2}
              holeDiameter={1}
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="3"
              pcbY="0"
              shape="circle"
              outerDiameter={2.2}
              holeDiameter={2}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
