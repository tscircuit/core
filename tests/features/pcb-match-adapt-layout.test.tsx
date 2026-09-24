import { expect, test } from "bun:test"

test("pcbLayout matchAdapt falls back to pack layout and prevents component stacking", async () => {
  const { Circuit } = await import("lib/index")

  const circuit = new Circuit()
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
  const circuitJson = circuit.getCircuitJson()

  const pcbComponents = circuitJson.filter((el) => el.type === "pcb_component")
  expect(pcbComponents.length).toBe(4)

  // Verify that components are not all stacked at (0, 0)
  const positions = pcbComponents.map((c: any) => `${c.center.x},${c.center.y}`)
  const uniquePositions = new Set(positions)
  expect(uniquePositions.size).toBe(4)

  // Verify no courtyard overlap errors are produced
  const overlapErrors = circuitJson.filter(
    (el) => el.type === "pcb_courtyard_overlap_error",
  )
  expect(overlapErrors.length).toBe(0)
})
