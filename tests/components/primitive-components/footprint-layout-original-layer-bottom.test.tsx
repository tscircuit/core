import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout respects originalLayer on bottom footprints", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        layer="bottom"
        footprint={
          <footprint originalLayer="bottom">
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["pin2"]}
            />
            <constraint pcb edgeToEdge xDist="4mm" left=".pin1" right=".pin2" />
            <constraint sameY for={[".pin1", ".pin2"]} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const pin1 = pads.find((pad) => pad.port_hints?.includes("pin1"))
  const pin2 = pads.find((pad) => pad.port_hints?.includes("pin2"))

  expect(pin1).toBeDefined()
  expect(pin2).toBeDefined()

  expect(pin1!.x).toBeLessThan(pin2!.x)
  expect(Math.abs(pin1!.x - pin2!.x)).toBeCloseTo(5, 1)
})
