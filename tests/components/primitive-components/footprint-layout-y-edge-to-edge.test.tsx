import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint yDist edgeToEdge preserves the requested gap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        pcbX={-2}
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
      <pcbnotetext
        text="Expected 1mm vertical edge gap"
        pcbX={2}
        fontSize={0.5}
      />
    </board>,
  )

  circuit.render()

  const pads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const topPad = pads.find((pad) => pad.port_hints?.includes("pin1"))
  const bottomPad = pads.find((pad) => pad.port_hints?.includes("pin2"))

  expect(topPad).toBeDefined()
  expect(bottomPad).toBeDefined()

  const edgeGap =
    topPad!.y - topPad!.height / 2 - (bottomPad!.y + bottomPad!.height / 2)

  expect(topPad!.y - bottomPad!.y).toBeCloseTo(4)
  expect(edgeGap).toBeCloseTo(1)
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
