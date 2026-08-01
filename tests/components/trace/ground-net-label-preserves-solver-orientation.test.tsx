import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ground labels preserve a solver fallback away from adjacent pins", () => {
  const { circuit } = getTestFixture()
  let schematicTraceSolverInput: any
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      schematicTraceSolverInput = event.solverParams
    }
  })

  circuit.add(
    <board width="14mm" height="8mm" routingDisabled>
      <net name="GND" isGroundNet />
      <net name="USB_5V" isPowerNet />
      <net name="LOGIC_3V3" isPowerNet />
      <net name="VMOT" isPowerNet />
      <chip
        name="U_MCU"
        schX={-4}
        schWidth={1.675}
        schHeight={1.6}
        pinLabels={{
          pin1: ["5V"],
          pin2: ["D0"],
          pin3: ["D1"],
          pin4: ["D2"],
          pin5: ["D3"],
          pin6: ["D4"],
          pin7: ["D5"],
          pin8: ["D6"],
          pin9: ["D7"],
          pin10: ["D8"],
          pin11: ["D9"],
          pin12: ["D10"],
          pin13: ["3V3"],
          pin14: ["GND"],
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["D0", "D1", "D2", "D3", "D4", "D5", "D6"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["5V", "GND", "3V3", "D10", "D9", "D8", "D7"],
          },
        }}
      />
      <chip
        name="U_DRIVER"
        schX={1}
        schWidth={2}
        schHeight={1.8}
        pinLabels={{
          pin1: ["ENABLE"],
          pin2: ["VMOT"],
          pin3: ["GND_MOTOR", "GND"],
          pin4: ["2B"],
          pin5: ["2A"],
          pin6: ["1A"],
          pin7: ["1B"],
          pin8: ["VDD"],
          pin9: ["GND_LOGIC", "GND"],
          pin10: ["DIR"],
          pin11: ["STEP"],
          pin12: ["SLEEP"],
          pin13: ["RESET"],
          pin14: ["MS3"],
          pin15: ["MS2"],
          pin16: ["MS1"],
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: [
              "ENABLE",
              "MS1",
              "MS2",
              "MS3",
              "RESET",
              "SLEEP",
              "STEP",
              "DIR",
            ],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: [
              "VMOT",
              "GND_MOTOR",
              "2B",
              "2A",
              "1A",
              "1B",
              "VDD",
              "GND_LOGIC",
            ],
          },
        }}
      />
      <pinheader
        name="MOTOR_POWER"
        pinCount={2}
        pinLabels={["VMOT", "GND"]}
        schX={5}
        schY={-2}
      />
      <pinheader
        name="STEPPER_MOTOR"
        pinCount={4}
        pinLabels={["1A", "1B", "2A", "2B"]}
        schX={5}
        schY={1}
        schWidth={0.39}
      />
      <capacitor name="C_VMOT" capacitance="100uF" schX={2.5} schY={-2.5} />

      <trace name="step" from=".U_MCU > .D0" to=".U_DRIVER > .STEP" />
      <trace name="direction" from=".U_MCU > .D1" to=".U_DRIVER > .DIR" />
      <trace name="enable" from=".U_MCU > .D2" to=".U_DRIVER > .ENABLE" />
      <trace name="usb_5v" from=".U_MCU > .5V" to="net.USB_5V" />
      <trace name="logic_3v3_source" from=".U_MCU > .3V3" to="net.LOGIC_3V3" />
      <trace
        name="driver_logic_power"
        from=".U_DRIVER > .VDD"
        to="net.LOGIC_3V3"
      />
      <trace name="reset_high" from=".U_DRIVER > .RESET" to="net.LOGIC_3V3" />
      <trace name="sleep_high" from=".U_DRIVER > .SLEEP" to="net.LOGIC_3V3" />
      <trace name="mcu_ground" from=".U_MCU > .GND" to="net.GND" />
      <trace
        name="driver_logic_ground"
        from=".U_DRIVER > .GND_LOGIC"
        to="net.GND"
      />
      <trace
        name="driver_motor_ground"
        from=".U_DRIVER > .GND_MOTOR"
        to="net.GND"
      />
      <trace name="full_step_ms1" from=".U_DRIVER > .MS1" to="net.GND" />
      <trace name="full_step_ms2" from=".U_DRIVER > .MS2" to="net.GND" />
      <trace name="full_step_ms3" from=".U_DRIVER > .MS3" to="net.GND" />
      <trace
        name="motor_power_ground"
        from=".MOTOR_POWER > .GND"
        to="net.GND"
      />
      <trace name="bulk_cap_ground" from=".C_VMOT > .neg" to="net.GND" />
      <trace
        name="motor_power_input"
        from=".MOTOR_POWER > .VMOT"
        to="net.VMOT"
      />
      <trace name="driver_motor_power" from=".U_DRIVER > .VMOT" to="net.VMOT" />
      <trace name="bulk_cap_power" from=".C_VMOT > .pos" to="net.VMOT" />
      <trace name="motor_1a" from=".U_DRIVER > .1A" to=".STEPPER_MOTOR > .1A" />
      <trace name="motor_1b" from=".U_DRIVER > .1B" to=".STEPPER_MOTOR > .1B" />
      <trace name="motor_2a" from=".U_DRIVER > .2A" to=".STEPPER_MOTOR > .2A" />
      <trace name="motor_2b" from=".U_DRIVER > .2B" to=".STEPPER_MOTOR > .2B" />
      <schematictext
        text="GND avoids adjacent 3V3 and D10 pins"
        schX={0}
        schY={-3.5}
        fontSize={0.18}
      />
    </board>,
  )

  circuit.render()

  expect(schematicTraceSolverInput).toBeDefined()

  const mcu = circuit.db.source_component
    .list()
    .find(({ name }) => name === "U_MCU")
  const mcuGndSourcePort = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === mcu?.source_component_id &&
        port.name === "GND",
    )
  const mcuGndSchematicPort = circuit.db.schematic_port
    .list()
    .find((port) => port.source_port_id === mcuGndSourcePort?.source_port_id)
  const mcuGndLabel = circuit.db.schematic_net_label
    .list()
    .find(
      (label) =>
        label.text === "GND" &&
        label.anchor_position?.x === mcuGndSchematicPort?.center.x &&
        label.anchor_position?.y === mcuGndSchematicPort?.center.y,
    )

  expect(mcuGndLabel?.anchor_side).toBe("left")
  expect(mcuGndLabel?.symbol_name).toBeUndefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
