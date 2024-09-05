import { test, expect } from "bun:test"
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
            <constraint pcb edgeToEdge xdist="4mm" left=".pin1" right=".pin2" />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list()

  expect(Math.abs(smtpads[0].x - smtpads[1].x)).toBeCloseTo(4, 1)

  // Should be centered about 0
  expect(Math.abs(smtpads[0].x + smtpads[1].x) / 2).toBeCloseTo(0, 1)

  const pcbPorts = circuit.db.pcb_port.list()

  expect(pcbPorts.length).toBe(2)

  expect(pcbPorts[0].x).toBeOneOf([-2, 2])
  expect(pcbPorts[1].x).toBeOneOf([-2, 2])

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
