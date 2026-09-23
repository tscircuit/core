import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("edgeToEdge yDist separates nearest vertical edges by the requested distance", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="2mm"
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="4mm"
              portHints={["pin2"]}
            />
            <constraint pcb edgeToEdge yDist="1mm" top=".pin1" bottom=".pin2" />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const topPad = smtpads.find((p) => p.height === 2)!
  const bottomPad = smtpads.find((p) => p.height === 4)!

  // 1mm gap + 1mm top half-height + 2mm bottom half-height = 4mm center separation
  expect(topPad.y - bottomPad.y).toBeCloseTo(4, 5)

  // Nearest vertical edges (top pad's bottom edge, bottom pad's top edge) are
  // exactly the requested yDist apart
  const nearestEdgeGap =
    topPad.y - topPad.height / 2 - (bottomPad.y + bottomPad.height / 2)
  expect(nearestEdgeGap).toBeCloseTo(1, 5)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
