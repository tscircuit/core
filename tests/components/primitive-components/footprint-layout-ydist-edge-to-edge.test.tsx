import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout edgeToEdge yDist", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
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
            <constraint sameX for={[".pin1", ".pin2"]} />
            <constraint pcb edgeToEdge yDist="1mm" top=".pin1" bottom=".pin2" />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const pin1Pad = smtpads.find((pad) => pad.port_hints?.includes("pin1"))!
  const pin2Pad = smtpads.find((pad) => pad.port_hints?.includes("pin2"))!

  expect(pin1Pad.y - pin2Pad.y).toBeCloseTo(4, 3)
  expect(
    pin1Pad.y - pin1Pad.height / 2 - (pin2Pad.y + pin2Pad.height / 2),
  ).toBeCloseTo(1, 3)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
