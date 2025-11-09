import { test, expect } from "bun:test"
import type { PcbHole, PcbHoleCircleOrSquare } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole component with rect shape", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <hole pcbX="0mm" pcbY="0mm" diameter="1mm" />
            <hole pcbX="2mm" pcbY="0mm" width="1mm" height="1mm" shape="rect" />
            <hole
              pcbX="-3mm"
              pcbY="0mm"
              width="3mm"
              height="2mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
