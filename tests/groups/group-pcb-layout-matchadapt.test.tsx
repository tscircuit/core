import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: `pcbLayout={{ matchAdapt: true }}` is a valid PCB layout config,
// but there is no dedicated PCB match-adapt layout. The mode previously fell
// through the pcb layout dispatch (which only handled grid/pack/flex), so no
// layout ran and every component stayed stacked on the group origin, producing
// overlapping footprints. It should fall back to packing so the board is laid
// out. Schematic match-adapt is unaffected.
test("pcbLayout matchAdapt falls back to pcb packing", async () => {
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

  // Components must be laid out, not collapsed onto a single origin point.
  const distinctCenters = new Set(
    pcbComponents.map(
      (c) => `${c.center.x.toFixed(2)},${c.center.y.toFixed(2)}`,
    ),
  )
  expect(distinctCenters.size).toBe(pcbComponents.length)

  // Packing keeps footprints apart, so there should be no overlap DRC errors.
  const overlapErrors = (circuit.getCircuitJson() as any[]).filter(
    (el) =>
      el.type === "pcb_courtyard_overlap_error" ||
      el.type === "pcb_footprint_overlap_error",
  )
  expect(overlapErrors).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
