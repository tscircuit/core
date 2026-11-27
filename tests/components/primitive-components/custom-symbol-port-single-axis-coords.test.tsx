import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol ports default omitted schX or schY axis to 0 instead of falling back to generic box ports", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="0402"
        symbol={
          <symbol name="MyPart">
            <schematicrect width={1} height={1} />
            <port name="pin1" pinNumber={1} direction="left" schX={-0.5} />
            <port name="pin2" pinNumber={2} direction="up" schY={0.5} />
          </symbol>
        }
      />
      <resistor
        name="R1"
        resistance="10k"
        schX={-3}
        connections={{ pin2: "U1.pin1" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        schY={3}
        connections={{ pin1: "U1.pin2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const u1Component = circuit.db.schematic_component
    .list()
    .find(
      (c) =>
        c.source_component_id !== undefined &&
        circuit.db.source_component.get(c.source_component_id)?.name === "U1",
    )!
  const u1Ports = circuit.db.schematic_port
    .list()
    .filter(
      (p) => p.schematic_component_id === u1Component.schematic_component_id,
    )
    .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))

  expect(u1Ports).toHaveLength(2)
  expect(u1Ports[0]?.center).toEqual({ x: -0.5, y: 0 })
  expect(u1Ports[0]?.facing_direction).toBe("left")
  expect(u1Ports[0]?.side_of_component).toBe("left")

  expect(u1Ports[1]?.center).toEqual({ x: 0, y: 0.5 })
  expect(u1Ports[1]?.facing_direction).toBe("up")
  expect(u1Ports[1]?.side_of_component).toBe("top")

  const traces = circuit.db.schematic_trace.list()
  expect(traces).toHaveLength(2)
})
