import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbLayout.matchAdapt does not collapse PCB components onto origin (#3136)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="40mm"
      routingDisabled
      pcbLayout={{ matchAdapt: true }}
    >
      <net name="V" />
      <net name="GND" />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0805"
        connections={{ pin1: "net.V", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0805"
        connections={{ pin1: "net.V", pin2: "net.GND" }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0805"
        connections={{ pin1: "net.V", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0805"
        connections={{ pin1: "net.V", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(4)

  // Verify that components are not all at (0, 0)
  const centers = pcbComponents.map((c) => `${c.center.x},${c.center.y}`)
  const uniqueCenters = new Set(centers)
  expect(uniqueCenters.size).toBe(4)

  // Verify no courtyard overlap errors
  const errors = circuit.db.pcb_error.list()
  const overlapErrors = errors.filter(
    (e) => (e as any).error_type === "pcb_courtyard_overlap_error",
  )
  expect(overlapErrors.length).toBe(0)
})
