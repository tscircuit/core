import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout yDist edgeToEdge separates differently sized pads by the requested gap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="12mm">
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
  expect(smtpads).toHaveLength(2)

  const topPad = smtpads.find((pad) => pad.port_hints?.includes("pin1"))!
  const bottomPad = smtpads.find((pad) => pad.port_hints?.includes("pin2"))!

  // Center-to-center distance = 1mm gap + 1mm top half-height + 2mm bottom half-height = 4mm
  expect(topPad.y - bottomPad.y).toBeCloseTo(4, 5)

  const topBottomEdge = topPad.y - topPad.height / 2
  const bottomTopEdge = bottomPad.y + bottomPad.height / 2
  expect(topBottomEdge - bottomTopEdge).toBeCloseTo(1, 5)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
