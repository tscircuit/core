import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbLayout.matchAdapt falls back to pack layout without collapsing PCB components at origin", async () => {
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
  expect(pcbComponents).toHaveLength(4)

  const uniquePositions = new Set(
    pcbComponents.map((c) => `${c.center.x},${c.center.y}`),
  )
  expect(uniquePositions.size).toBe(4)

  const overlapErrors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_courtyard_overlap_error")
  expect(overlapErrors).toHaveLength(0)
})

test("board matchAdapt shorthand falls back to pack layout on PCB", async () => {
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
  expect(pcbComponents).toHaveLength(2)

  const uniquePositions = new Set(
    pcbComponents.map((c) => `${c.center.x},${c.center.y}`),
  )
  expect(uniquePositions.size).toBe(2)

  const overlapErrors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_courtyard_overlap_error")
  expect(overlapErrors).toHaveLength(0)
})
