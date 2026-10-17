import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol preserves symbolName and applies geometric rotation for oriented native symbols", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U"
        pinLabels={{
          pin1: "IN_PLUS",
          pin2: "IN_MINUS",
          pin3: "V_MINUS",
          pin4: "OUT",
          pin5: "V_PLUS",
        }}
        noSchematicRepresentation
      />
      <schematicsymbol
        name="U1"
        chipRef=".U"
        symbolName="opamp_with_power_left"
        schRotation={180}
        connections={{
          inp1: "U.IN_PLUS",
          inp2: "U.IN_MINUS",
          out: "U.OUT",
          "V-": "U.V_PLUS",
          "V+": "U.V_MINUS",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const components = circuit.db.schematic_component.list()
  expect(components).toHaveLength(1)
  expect(components[0]?.symbol_name).toBe("opamp_with_power_left")

  const ports = circuit.db.schematic_port.list()
  expect(ports).toHaveLength(5)

  const inp1 = ports.find((p) => p.display_pin_label === "inp1")!
  const inp2 = ports.find((p) => p.display_pin_label === "inp2")!
  const out = ports.find((p) => p.display_pin_label === "out")!
  const vMinus = ports.find((p) => p.display_pin_label === "V-")!
  const vPlus = ports.find((p) => p.display_pin_label === "V+")!

  expect(inp2.center.y).toBeGreaterThan(0)
  expect(inp2.center.x).toBeLessThan(0)
  expect(inp2.facing_direction).toBe("left")

  expect(inp1.center.y).toBeLessThan(0)
  expect(inp1.center.x).toBeLessThan(0)
  expect(inp1.facing_direction).toBe("left")

  expect(out.center.x).toBeGreaterThan(0)
  expect(out.facing_direction).toBe("right")

  expect(vMinus.center.y).toBeGreaterThan(0)
  expect(vMinus.facing_direction).toBe("up")

  expect(vPlus.center.y).toBeLessThan(0)
  expect(vPlus.facing_direction).toBe("down")
})
