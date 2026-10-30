import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbLayout.matchAdapt falls back to pack layout", async () => {
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

  // Verify components are not all collapsed at (0, 0)
  const positions = pcbComponents.map((c) => ({ x: c.center.x, y: c.center.y }))
  const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`))
  expect(uniquePositions.size).toBe(4)

  // Verify no courtyard overlap errors
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_courtyard_overlap_error")
  expect(errors.length).toBe(0)
})

test("board matchAdapt falls back to pack layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled matchAdapt>
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
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents.length).toBe(2)

  const positions = pcbComponents.map((c) => ({ x: c.center.x, y: c.center.y }))
  const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`))
  expect(uniquePositions.size).toBe(2)

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_courtyard_overlap_error")
  expect(errors.length).toBe(0)
})
