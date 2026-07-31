import { expect, test } from "bun:test"
import { getDecouplingCapacitorRelationships } from "lib/utils/decoupling-capacitors/get-decoupling-capacitor-relationships"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic decoupling placement compared with an explicit opt-out", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled width="24mm" height="12mm">
      <chip
        name="U_AUTO"
        footprint="soic8"
        pcbX={-6}
        layer="bottom"
        pinLabels={{ 1: "VCC", 4: "GND" }}
      />
      <capacitor name="C_AUTO" capacitance="100nF" footprint="0402" />
      <chip
        name="U_HOLD"
        footprint="soic8"
        pcbX={6}
        pinLabels={{ 1: "VBAT", 4: "GND" }}
        pinAttributes={{
          VBAT: {
            requiresPower: true,
            shouldHaveDecouplingCapacitor: false,
          },
        }}
      />
      <capacitor name="C_HOLD" capacitance="100uF" footprint="1210" />

      <trace from=".U_AUTO > .VCC" to=".C_AUTO > .1" />
      <trace from=".C_AUTO > .2" to="net.GND_AUTO" />
      <trace from=".U_AUTO > .GND" to="net.GND_AUTO" />
      <trace from=".U_HOLD > .VBAT" to=".C_HOLD > .1" />
      <trace from=".C_HOLD > .2" to="net.GND_HOLD" />
      <trace from=".U_HOLD > .GND" to="net.GND_HOLD" />

      <pcbnotetext
        pcbX={0}
        pcbY={-5.2}
        fontSize={0.7}
        text="C_AUTO: inferred VCC decoupling on bottom; C_HOLD: VBAT opt-out on top"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const relationships = getDecouplingCapacitorRelationships(circuit.db)
  expect(relationships).toHaveLength(1)
  const autoSourceComponent = circuit.db.source_component.getWhere({
    name: "C_AUTO",
  })!
  const autoChipSourceComponent = circuit.db.source_component.getWhere({
    name: "U_AUTO",
  })!
  const holdSourceComponent = circuit.db.source_component.getWhere({
    name: "C_HOLD",
  })!
  const holdChipSourceComponent = circuit.db.source_component.getWhere({
    name: "U_HOLD",
  })!
  const autoPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: autoSourceComponent.source_component_id,
  })!
  const autoChipPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: autoChipSourceComponent.source_component_id,
  })!
  const holdChipPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: holdChipSourceComponent.source_component_id,
  })!
  const holdPcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: holdSourceComponent.source_component_id,
  })!
  const autoChipPowerPcbPort = circuit.db.pcb_port.getWhere({
    source_port_id: relationships[0].chipPowerSourcePort.source_port_id,
  })!
  const autoChipPowerSmtPad = circuit.db.pcb_smtpad
    .list()
    .find(
      (pcbSmtPad) => pcbSmtPad.pcb_port_id === autoChipPowerPcbPort.pcb_port_id,
    )!
  const autoChipPowerPadCenter =
    "x" in autoChipPowerSmtPad
      ? { x: autoChipPowerSmtPad.x, y: autoChipPowerSmtPad.y }
      : {
          x:
            autoChipPowerSmtPad.points.reduce(
              (sum, point) => sum + point.x,
              0,
            ) / autoChipPowerSmtPad.points.length,
          y:
            autoChipPowerSmtPad.points.reduce(
              (sum, point) => sum + point.y,
              0,
            ) / autoChipPowerSmtPad.points.length,
        }
  const autoCadComponent = circuit.db.cad_component.getWhere({
    pcb_component_id: autoPcbComponent.pcb_component_id,
  })!
  const holdCadComponent = circuit.db.cad_component.getWhere({
    pcb_component_id: holdPcbComponent.pcb_component_id,
  })!

  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(
    [autoChipPcbComponent, holdChipPcbComponent].map(
      ({ center, position_mode }) => ({ center, position_mode }),
    ),
  ).toEqual([
    {
      center: { x: -6, y: 0 },
      position_mode: "relative_to_group_anchor",
    },
    {
      center: { x: 6, y: 0 },
      position_mode: "relative_to_group_anchor",
    },
  ])
  expect(relationships[0].capacitorSourceComponent.source_component_id).toBe(
    autoSourceComponent.source_component_id,
  )
  expect(
    Math.hypot(
      autoPcbComponent.center.x - autoChipPowerPadCenter.x,
      autoPcbComponent.center.y - autoChipPowerPadCenter.y,
    ),
  ).toBeLessThan(
    Math.hypot(
      holdPcbComponent.center.x - autoChipPowerPadCenter.x,
      holdPcbComponent.center.y - autoChipPowerPadCenter.y,
    ),
  )

  const autoSmtPads = circuit.db.pcb_smtpad
    .list()
    .filter(
      (pcbSmtPad) =>
        pcbSmtPad.pcb_component_id === autoPcbComponent.pcb_component_id,
    )
  const autoPcbPorts = circuit.db.pcb_port
    .list()
    .filter(
      (pcbPort) =>
        pcbPort.pcb_component_id === autoPcbComponent.pcb_component_id,
    )
  const holdSmtPads = circuit.db.pcb_smtpad
    .list()
    .filter(
      (pcbSmtPad) =>
        pcbSmtPad.pcb_component_id === holdPcbComponent.pcb_component_id,
    )
  const holdPcbPorts = circuit.db.pcb_port
    .list()
    .filter(
      (pcbPort) =>
        pcbPort.pcb_component_id === holdPcbComponent.pcb_component_id,
    )
  const autoSilkscreenElements = circuit.db
    .toArray()
    .filter(
      (element) =>
        element.type.startsWith("pcb_silkscreen_") &&
        "pcb_component_id" in element &&
        element.pcb_component_id === autoPcbComponent.pcb_component_id,
    )

  expect(
    [
      autoSmtPads.length,
      autoPcbPorts.length,
      autoSilkscreenElements.length,
      holdSmtPads.length,
      holdPcbPorts.length,
    ].every((primitiveCount) => primitiveCount > 0),
  ).toBe(true)
  expect(autoPcbComponent.layer).toBe("bottom")
  expect(autoSmtPads.every((pcbSmtPad) => pcbSmtPad.layer === "bottom")).toBe(
    true,
  )
  expect(
    autoPcbPorts.every((pcbPort) => pcbPort.layers.includes("bottom")),
  ).toBe(true)
  expect(
    autoSilkscreenElements.every(
      (element) => "layer" in element && element.layer === "bottom",
    ),
  ).toBe(true)
  expect(autoCadComponent.pcb_component_id).toBe(
    autoPcbComponent.pcb_component_id,
  )
  expect(autoCadComponent.position.z).toBeLessThan(0)
  expect(autoCadComponent.rotation?.y).toBe(180)
  expect(holdPcbComponent.layer).toBe("top")
  expect(holdSmtPads.every((pcbSmtPad) => pcbSmtPad.layer === "top")).toBe(true)
  expect(holdPcbPorts.every((pcbPort) => pcbPort.layers.includes("top"))).toBe(
    true,
  )
  expect(holdCadComponent.position.z).toBeGreaterThan(0)
  expect(holdCadComponent.rotation?.y).toBe(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
