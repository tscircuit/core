import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol preserves 180-degree geometric rotation for oriented native opamp_with_power_left", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm" routingDisabled>
      <chip
        name="U"
        footprint="soic8"
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
        schX={0}
        schY={0}
        connections={{
          inp1: "U.IN_PLUS",
          inp2: "U.IN_MINUS",
          out: "U.OUT",
          "V-": "U.V_PLUS",
          "V+": "U.V_MINUS",
        }}
      />
      <resistor
        name="R_IN_M"
        resistance="10k"
        footprint="0402"
        schX={-3}
        schY={1.5}
      />
      <resistor
        name="R_IN_P"
        resistance="10k"
        footprint="0402"
        schX={-3}
        schY={-1.5}
      />
      <resistor
        name="R_OUT"
        resistance="1k"
        footprint="0402"
        schX={3}
        schY={0}
      />
      <trace from=".R_IN_M > .pin2" to=".U > .IN_MINUS" />
      <trace from=".R_IN_P > .pin2" to=".U > .IN_PLUS" />
      <trace from=".U > .OUT" to=".R_OUT > .pin1" />
      <trace from=".U > .V_PLUS" to="net.VNEG" />
      <trace from=".U > .V_MINUS" to="net.VPOS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schComp = circuit.db.schematic_component.list()[0]!
  expect(schComp).toBeDefined()
  expect(schComp.symbol_name).toBeUndefined()

  const getPortCenter = (pinLabel: string) => {
    const srcPort = circuit.db.source_port
      .list()
      .find((p) => p.name === pinLabel)!
    const schPort = circuit.db.schematic_port.list({
      source_port_id: srcPort.source_port_id,
    })[0]!
    return schPort.center
  }

  const inMinus = getPortCenter("IN_MINUS")
  const inPlus = getPortCenter("IN_PLUS")
  const out = getPortCenter("OUT")
  const supplyTop = getPortCenter("V_PLUS")
  const supplyBottom = getPortCenter("V_MINUS")

  // After rotating opamp_with_power_left geometrically by 180 degrees:
  // - triangle faces right (out on right, inputs on left)
  // - inverting inp2 (U.IN_MINUS) sits above non-inverting inp1 (U.IN_PLUS)
  // - former bottom V- port (mapped to U.V_PLUS) sits on top, V+ (U.V_MINUS) sits below
  expect(inMinus.x).toBeLessThan(schComp.center.x)
  expect(inPlus.x).toBeLessThan(schComp.center.x)
  expect(inMinus.y).toBeGreaterThan(inPlus.y)
  expect(out.x).toBeGreaterThan(schComp.center.x)
  expect(supplyTop.y).toBeGreaterThan(schComp.center.y)
  expect(supplyBottom.y).toBeLessThan(schComp.center.y)

  expect(circuit.db.schematic_path.list().length).toBeGreaterThan(0)
  expect(circuit.db.schematic_net_label.list().length).toBeGreaterThanOrEqual(2)
  expect(circuit.db.schematic_trace.list().length).toBeGreaterThanOrEqual(3)

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("schematicsymbol retains native symbol_name when library orientation rotation matches geometry", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm">
      <schematicsymbol
        name="U_NATIVE"
        symbolName="opamp_with_power_right"
        schRotation={90}
        schX={0}
        schY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schComp = circuit.db.schematic_component.list()[0]!
  expect(schComp.symbol_name).toBe("opamp_with_power_up")
})
