import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout edgeToEdge yDist offset", () => {
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

  // In PCB coordinate system (Y-up):
  // Top pad (pin1) height = 2mm (halfHeight = 1mm)
  // Bottom pad (pin2) height = 4mm (halfHeight = 2mm)
  // edgeToEdge yDist = 1mm means bottom edge of pad1 minus top edge of pad2 = 1mm
  // Center-to-center difference: pad1.y - pad2.y = 1mm (gap) + 1mm (pad1 halfHeight) + 2mm (pad2 halfHeight) = 4mm
  expect(pad1.y - pad2.y).toBeCloseTo(4, 2)
})
