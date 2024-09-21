import { test, expect } from "bun:test"
import type { PcbHole, PcbHoleCircleOrSquare } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole in footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <hole pcbX="2mm" pcbY="0mm" diameter="1mm" />
            <smtpad
              portHints={["1"]}
              pcbX="0mm"
              pcbY="0mm"
              shape="rect"
              width="1mm"
              height="1mm"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const hole = circuit.db.pcb_hole.list()[0]!

  expect(hole.hole_shape).toBe("circle")
  expect((hole as PcbHoleCircleOrSquare).hole_diameter).toBeCloseTo(1)
})
