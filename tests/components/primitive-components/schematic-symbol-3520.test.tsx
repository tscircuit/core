import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

async function renderOpamp(rotation: number) {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
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
        schRotation={rotation}
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

  const soup = circuit.getCircuitJson()
  const ports = soup.filter((el: any) => el.type === "schematic_port") as any[]

  const portByLabel = (label: string) =>
    ports.find((p) => p.display_pin_label === label)

  return {
    symbolName: (soup.find((el: any) => el.type === "schematic_component") as any)
      .symbol_name,
    inp1: portByLabel("inp1"),
    inp2: portByLabel("inp2"),
  }
}

test("schematic-symbol #3520: schRotation=180 preserves directional name and rotates ports geometrically", async () => {
  const rot0 = await renderOpamp(0)
  const rot180 = await renderOpamp(180)

  // The directional symbol name must be preserved (NOT substituted with the
  // mirrored variant `opamp_with_power_right`, which would lose the rotation)
  expect(rot180.symbolName).toBe("opamp_with_power_left")

  expect(rot0.inp1).toBeDefined()
  expect(rot0.inp2).toBeDefined()
  expect(rot180.inp1).toBeDefined()
  expect(rot180.inp2).toBeDefined()

  // A true 180° rotation flips the vertical order of the two input ports.
  // With schRotation=0 inp1 and inp2 have one ordering; with 180° the sign of
  // (inp1.y - inp2.y) must invert.
  const order0 = rot0.inp1.center.y - rot0.inp2.center.y
  const order180 = rot180.inp1.center.y - rot180.inp2.center.y

  expect(Math.sign(order0)).not.toBe(0)
  expect(Math.sign(order180)).toBe(-Math.sign(order0))
})

test("schematic-symbol #3520: faithful rotation family (mosfet horz->vert) still substitutes the name", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="Q"
        pinLabels={{ pin1: "G", pin2: "D", pin3: "S" }}
        noSchematicRepresentation
      />
      <schematicsymbol
        name="Q1"
        chipRef=".Q"
        symbolName="n_channel_e_mosfet_transistor_horz"
        schRotation={90}
        connections={{
          gate: "Q.G",
          drain: "Q.D",
          source: "Q.S",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const soup = circuit.getCircuitJson()
  const comp = soup.find((el: any) => el.type === "schematic_component") as any
  expect(comp.symbol_name).toBe("n_channel_e_mosfet_transistor_vert")
})