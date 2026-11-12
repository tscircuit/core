import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
const pinLabels = {
  pin1: ["TS"],
  pin2: ["BAT", "BAT1"],
  pin3: ["BAT2"],
  pin4: ["N_CE"],
  pin5: ["EN2"],
  pin6: ["EN1"],
  pin7: ["N_PGOOD"],
  pin8: ["VSS"],
  pin9: ["N_CHG"],
  pin10: ["OUT", "OUT1"],
  pin11: ["OUT2"],
  pin12: ["ILIM"],
  pin13: ["IN"],
  pin14: ["TMR"],
  pin15: ["ITERM"],
  pin16: ["ISET"],
  pin17: ["EP"],
} as const

export const exportedPorts = [
  { name: "VIN", pin: "IN", direction: "left" },
  { name: "EN1", pin: "EN1", direction: "left" },
  { name: "EN2", pin: "EN2", direction: "left" },
  { name: "CHARGE_EN_N", pin: "N_CE", direction: "left" },
  { name: "TS", pin: "TS", direction: "left" },
  { name: "SYS", pin: "OUT", direction: "right" },
  { name: "BAT", pin: "BAT", direction: "right" },
  { name: "PGOOD_N", pin: "N_PGOOD", direction: "right" },
  { name: "CHG_N", pin: "N_CHG", direction: "right" },
  { name: "GND", pin: "VSS", direction: "down" },
] as const

function ChargerExample() {
  return (
    <subcircuit
      name="CHARGER"
      schMaxTraceDistance={0.1}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["VIN", "EN1", "EN2", "CHARGE_EN_N", "TS"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["SYS", "BAT", "PGOOD_N", "CHG_N"],
        },
        bottomSide: { direction: "left-to-right", pins: ["GND"] },
      }}
    >
      {exportedPorts.map((p) => (
        <port
          name={p.name}
          direction={p.direction}
          connectsTo={`U1.${p.pin}`}
        />
      ))}
      <chip
        pinLabels={pinLabels}
        manufacturerPartNumber="BQ24074RGTR"
        name="U1"
        schX={0}
        schY={1.2}
        schWidth={4.5}
        schHeight={5.5}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["IN", "EN1", "EN2", "N_CE", "TS"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["OUT", "OUT2", "BAT", "BAT2", "N_PGOOD", "N_CHG"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["ITERM", "ILIM", "ISET", "TMR", "VSS", "EP"],
          },
        }}
        schPinStyle={{
          EN1: { topMargin: 0.5 },
          EN2: { topMargin: 0.5 },
          N_CE: { topMargin: 0.5 },
          TS: { topMargin: 0.5 },
          BAT: { topMargin: 0.5 },
          N_PGOOD: { topMargin: 0.5 },
          N_CHG: { topMargin: 0.5 },
          ILIM: { leftMargin: 0.45 },
          ISET: { leftMargin: 0.45 },
          TMR: { leftMargin: 0.45 },
          VSS: { leftMargin: 0.45 },
          EP: { leftMargin: 0.45 },
        }}
        connections={{
          IN: "net.VIN",
          OUT: "net.SYS",
          OUT2: "net.SYS",
          BAT: "net.BAT",
          BAT2: "net.BAT",
          EN1: "net.EN1",
          EN2: "net.EN2",
          N_CE: "net.CHARGE_EN_N",
          TS: "net.TS",
          N_PGOOD: "net.PGOOD_N",
          N_CHG: "net.CHG_N",
          ITERM: "net.ITERM",
          ILIM: "net.ILIM",
          ISET: "net.ISET",
          TMR: "net.GND",
          VSS: "net.GND",
          EP: "net.GND",
        }}
      />
      <capacitor
        footprint="0603"
        name="C_IN"
        capacitance="1uF"
        schX={-5.4}
        schY={4.2}
        schRotation={270}
        connections={{ pin1: "net.VIN", pin2: "net.GND" }}
      />
      <capacitor
        footprint="0603"
        name="C_SYS"
        capacitance="4.7uF"
        schX={5.4}
        schY={4.2}
        schRotation={270}
        connections={{ pin1: "net.SYS", pin2: "net.GND" }}
      />
      <capacitor
        footprint="0603"
        name="C_BAT"
        capacitance="4.7uF"
        schX={5.4}
        schY={-0.8}
        schRotation={270}
        connections={{ pin1: "net.BAT", pin2: "net.GND" }}
      />
      <resistor
        footprint="0603"
        name="R_ITERM"
        resistance="4.12k"
        schX={-3.6}
        schY={-5.2}
        schRotation={270}
        connections={{ pin1: "net.ITERM", pin2: "net.GND" }}
      />
      <resistor
        footprint="0603"
        name="R_ILIM"
        resistance="1.18k"
        schX={0}
        schY={-5.2}
        schRotation={270}
        connections={{ pin1: "net.ILIM", pin2: "net.GND" }}
      />
      <resistor
        footprint="0603"
        name="R_ISET"
        resistance="1.13k"
        schX={3.6}
        schY={-5.2}
        schRotation={270}
        connections={{ pin1: "net.ISET", pin2: "net.GND" }}
      />
    </subcircuit>
  )
}

test("standalone TI BQ24074 charger exports its declared public interface", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(<ChargerExample />)
  await circuit.renderUntilSettled()
  const group = circuit.db.schematic_group
    .list()
    .find((group) => group.show_boundary)!
  const ports = circuit.db.schematic_port
    .list()
    .filter((port) => port.schematic_group_id === group.schematic_group_id)
  expect(ports.map((port) => port.display_pin_label)).toEqual(
    exportedPorts.map((port) => port.name),
  )
  expect(circuit.db.schematic_component.list()).toHaveLength(7)
  expect(
    circuit.db.source_component
      .list()
      .find((component) => component.name === "U1")?.manufacturer_part_number,
  ).toBe("BQ24074RGTR")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
