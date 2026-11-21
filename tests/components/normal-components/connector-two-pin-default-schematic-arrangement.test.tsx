import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("two-pin connector on power rails is not drawn as a horizontal two-terminal part", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <net name="VM" isPowerNet />
      <net name="GND" isGroundNet />
      <connector
        name="J1"
        footprint="jst2_p2.5mm_xh"
        pinLabels={{ pin1: "VM", pin2: "GND" }}
        connections={{ pin1: "net.VM", pin2: "net.GND" }}
        schX={-3}
      />
      <connector
        name="J2"
        footprint="jst2_p2.5mm_xh"
        connections={{ pin1: "net.VM", pin2: "net.GND" }}
        schX={3}
        pcbY={8}
      />
      {/* An explicit arrangement is left alone. */}
      <connector
        name="J3"
        footprint="jst2_p2.5mm_xh"
        pinLabels={{ pin1: "VM", pin2: "GND" }}
        schPinArrangement={{ topSide: ["VM"], bottomSide: ["GND"] }}
        connections={{ pin1: "net.VM", pin2: "net.GND" }}
        schX={0}
        schY={3}
        pcbY={-8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson() as any[]

  const getPorts = (name: string) => {
    const sourceComponent = circuitJson.find(
      (element) => element.type === "source_component" && element.name === name,
    )
    const schematicComponent = circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.source_component_id === sourceComponent.source_component_id,
    )
    return circuitJson
      .filter(
        (element) =>
          element.type === "schematic_port" &&
          element.schematic_component_id ===
            schematicComponent.schematic_component_id,
      )
      .sort((a, b) => a.pin_number - b.pin_number)
  }

  for (const name of ["J1", "J2"]) {
    const [pin1, pin2] = getPorts(name)
    expect(pin1.side_of_component).toBe("right")
    expect(pin2.side_of_component).toBe("right")
    expect(pin1.facing_direction).toBe("right")
    expect(pin2.facing_direction).toBe("right")
    // pin1 is drawn above pin2
    expect(pin1.center.y).toBeGreaterThan(pin2.center.y)
  }

  expect(getPorts("J3").map((port) => port.side_of_component)).toEqual([
    "top",
    "bottom",
  ])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
