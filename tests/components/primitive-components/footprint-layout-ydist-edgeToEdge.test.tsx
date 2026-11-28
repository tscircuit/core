import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression for https://github.com/tscircuit/core/issues/4101
// `<constraint pcb edgeToEdge yDist=...>` must separate the *nearest* vertical
// edges of the two primitives by exactly yDist. The solver previously added the
// top primitive's half-height instead of subtracting it, causing an overlap.
test("footprint layout yDist edgeToEdge uses correct vertical offset", () => {
  const { circuit } = getTestFixture()

  const topHeight = 2
  const bottomHeight = 4
  const yDist = 1

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height={`${topHeight}mm`}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height={`${bottomHeight}mm`}
              portHints={["pin2"]}
            />
            <constraint
              pcb
              edgeToEdge
              yDist={`${yDist}mm`}
              top=".pin1"
              bottom=".pin2"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  expect(smtpads.length).toBe(2)

  const top = smtpads.find((p) => p.port_hints?.includes("pin1"))!
  const bottom = smtpads.find((p) => p.port_hints?.includes("pin2"))!

  // top is above bottom
  expect(top.y).toBeGreaterThan(bottom.y)

  const centerDistance = top.y - bottom.y
  const expectedCenterDistance = yDist + topHeight / 2 + bottomHeight / 2

  // 1mm gap + 1mm top half-height + 2mm bottom half-height = 4mm
  expect(centerDistance).toBeCloseTo(expectedCenterDistance, 3)

  // The nearest vertical edges are separated by exactly yDist
  const topBottomEdge = top.y - topHeight / 2
  const bottomTopEdge = bottom.y + bottomHeight / 2
  expect(topBottomEdge - bottomTopEdge).toBeCloseTo(yDist, 3)
})