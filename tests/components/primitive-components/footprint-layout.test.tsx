import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint layout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
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
            <platedhole
              name="H1"
              holeDiameter="0.75mm"
              outerDiameter="1mm"
              shape="circle"
              portHints={["pin3"]}
            />
            <constraint pcb edgeToEdge xDist="4mm" left=".pin1" right=".pin2" />
            <constraint
              pcb
              centerToCenter
              xDist="2.5mm"
              left=".pin1"
              right=".H1"
            />
            <constraint centerToCenter yDist="2.5mm" top=".pin1" bottom=".H1" />
            <constraint sameY for={[".pin1", ".pin2"]} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]

  // center to center distance will be 5mm (4mm plus the half widths of the pads)
  expect(Math.abs(smtpads[0].x - smtpads[1].x)).toBeCloseTo(5, 1)

  // Should be centered about 0
  expect(Math.abs(smtpads[0].x + smtpads[1].x) / 2).toBeCloseTo(0, 1)

  const pcbPorts = circuit.db.pcb_port.list()

  expect(pcbPorts.length).toBe(3)

  const portXPositions = pcbPorts.map((p) => p.x).sort()

  expect(portXPositions).toEqual([-2.5, 0, 2.5])

  // Check hole position
  const hole = circuit.db.pcb_plated_hole.list()[0]

  expect(hole.x).toBeCloseTo(0, 1)
  expect(hole.y).toBeCloseTo(-1.25, 1)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
