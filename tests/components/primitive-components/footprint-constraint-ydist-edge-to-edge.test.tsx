import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint constraint yDist edgeToEdge calculates correct gap without overlapping", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
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
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const pad1 = smtpads.find((p) => p.port_hints?.includes("pin1"))!
  const pad2 = smtpads.find((p) => p.port_hints?.includes("pin2"))!

  // pin1 height = 2mm (half-height = 1mm)
  // pin2 height = 4mm (half-height = 2mm)
  // edge-to-edge yDist = 1mm
  // Center-to-center separation should be 1 + 1 + 2 = 4mm
  const centerSeparation = pad1.y - pad2.y
  expect(centerSeparation).toBeCloseTo(4, 2)

  // Distance between nearest vertical edges:
  // pin1 bottom edge = pad1.y - 1mm
  // pin2 top edge = pad2.y + 2mm
  const edgeGap = pad1.y - pad1.height / 2 - (pad2.y + pad2.height / 2)
  expect(edgeGap).toBeCloseTo(1, 2)
})
