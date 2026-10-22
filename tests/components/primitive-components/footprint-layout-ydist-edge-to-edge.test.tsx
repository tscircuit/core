import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout yDist edgeToEdge constraint calculates correct center distance without overlap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="15mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="2mm"
              height="2mm"
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="2mm"
              height="4mm"
              portHints={["pin2"]}
            />
            <constraint pcb edgeToEdge yDist="1mm" top=".pin1" bottom=".pin2" />
            <constraint sameX for={[".pin1", ".pin2"]} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  expect(smtpads.length).toBe(2)

  const pad1 = smtpads.find((p) => p.height === 2)!
  const pad2 = smtpads.find((p) => p.height === 4)!

  // Edge to edge gap should be 1mm
  // Center-to-center distance should be: yDist (1mm) + pad1.height/2 (1mm) + pad2.height/2 (2mm) = 4mm
  const centerDistance = pad1.y - pad2.y
  expect(centerDistance).toBeCloseTo(4, 2)

  // Edge-to-edge bottom of pad1 to top of pad2
  const pad1BottomEdge = pad1.y - pad1.height / 2
  const pad2TopEdge = pad2.y + pad2.height / 2
  const edgeGap = pad1BottomEdge - pad2TopEdge
  expect(edgeGap).toBeCloseTo(1, 2)
})
