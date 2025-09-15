import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Inline minimal Connector and STC31_C_R3 from micromod-board (no commented code)
const Connector = (props: any) => (
  <chip
    footprint="m2host"
    pinLabels={{
      pin73: "V3_3",
      pin72: "VCC",
      pin71: "PWR_EN",
      pin70: "USB_VIN",
      pin37: "USBHOST_D_NEG",
      pin35: "USBHOST_D_POS",
      pin43: "CAN_TX",
      pin41: "CAN_RX",
      pin36: "EEPROM_A0",
      pin34: "EEPROM_A1",
      pin32: "EEPROM_A2",
      pin1: "GND",
      pin3: "SPI_SCK",
      pin7: "SPI_SDO",
      pin5: "SPI_SDI",
      pin23: "I2C_INT",
      pin21: "I2C_SCL",
      pin19: "I2C_SDA",
      pin15: "RX",
      pin13: "TX",
      pin18: "CTS",
      pin16: "RTS",
      pin38: "A0",
      pin47: ["G0", "INT"],
      pin49: ["G1", "CS"],
      pin51: ["G2", "PWM"],
      pin53: "G3",
      pin55: "G4",
      pin57: "G5",
      pin59: "G6",
      pin61: "G7",
    }}
    showPinAliases
    schPinArrangement={{
      leftSide: {
        pins: [
          "pin73",
          "pin72",
          "pin71",
          "pin70",
          "pin37",
          "pin35",
          "pin43",
          "pin41",
          "pin36",
          "pin34",
          "pin32",
          "pin1",
        ],
        direction: "top-to-bottom",
      },
      rightSide: {
        pins: [
          "pin3",
          "pin7",
          "pin5",
          "pin23",
          "pin21",
          "pin19",
          "pin15",
          "pin13",
          "pin18",
          "pin16",
          "pin38",
          "pin47",
          "pin49",
          "pin51",
          "pin53",
          "pin55",
          "pin57",
          "pin59",
          "pin61",
        ],
        direction: "top-to-bottom",
      },
    }}
    schPinStyle={{
      pin72: { marginBottom: 0.5 },
      pin71: { marginBottom: 0.5 },
      pin35: { marginBottom: 0.2 },
      pin41: { marginBottom: 0.2 },
      pin32: { marginBottom: 0.5 },
      pin5: { marginBottom: 0.2 },
      pin19: { marginBottom: 0.2 },
      pin16: { marginBottom: 0.2 },
      pin38: { marginBottom: 0.2 },
    }}
    {...props}
  />
)

const STC31_C_R3 = (props: any) => (
  <chip
    pinLabels={{
      pin1: ["VSS1"],
      pin2: ["NC1"],
      pin3: ["ADDR"],
      pin4: ["SCL"],
      pin5: ["VSS2"],
      pin6: ["VDD"],
      pin7: ["SDA"],
      pin8: ["NC2"],
      pin9: ["VSS3"],
      pin10: ["NC3"],
      pin11: ["VSS4"],
      pin12: ["NC4"],
      pin13: ["EPAD"],
    }}
    supplierPartNumbers={{ jlcpcb: ["C22396918"] }}
    schPinStyle={{ pin7: { marginTop: 0.2 } }}
    schPinArrangement={{
      leftSide: { pins: ["pin6", "pin3", "pin1"], direction: "top-to-bottom" },
      rightSide: { pins: ["pin4", "pin7"], direction: "top-to-bottom" },
    }}
    manufacturerPartNumber="STC31_C_R3"
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.8001000000000005mm"
          pcbY="-1.4175740000000019mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0mm"
          pcbY="-1.4175740000000019mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="0.8001000000000005mm"
          pcbY="-1.4175740000000019mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="1.6675100000000072mm"
          pcbY="-0.8001000000000147mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="1.6675100000000072mm"
          pcbY="-1.4210854715202004e-14mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="1.6675100000000072mm"
          pcbY="0.8000999999999863mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin7"]}
          pcbX="0.8001000000000005mm"
          pcbY="1.4175739999999877mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin8"]}
          pcbX="0mm"
          pcbY="1.4175739999999877mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin9"]}
          pcbX="-0.8001000000000005mm"
          pcbY="1.4175739999999877mm"
          width="0.38569899999999996mm"
          height="0.5849874mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin10"]}
          pcbX="-1.667509999999993mm"
          pcbY="0.8000999999999863mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin11"]}
          pcbX="-1.667509999999993mm"
          pcbY="-1.4210854715202004e-14mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin12"]}
          pcbX="-1.667509999999993mm"
          pcbY="-0.8001000000000147mm"
          width="0.5849874mm"
          height="0.38569899999999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin13"]}
          pcbX="0mm"
          pcbY="-1.4210854715202004e-14mm"
          width="2.2999954mm"
          height="1.7999964mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -1.1451589999999925, y: -1.576273200000017 },
            { x: -1.8261076000000003, y: -1.576273200000017 },
            { x: -1.8261076000000003, y: -1.1453114000000113 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.1451589999999925, y: 1.576120799999984 },
            { x: -1.8261076000000003, y: 1.576120799999984 },
            { x: -1.8261076000000003, y: 1.1451843999999767 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.1453368000000097, y: 1.576120799999984 },
            { x: 1.826285399999989, y: 1.576120799999984 },
            { x: 1.826285399999989, y: 1.1451843999999767 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.1453368000000097, y: -1.576273200000017 },
            { x: 1.826285399999989, y: -1.576273200000017 },
            { x: 1.826285399999989, y: -1.1453114000000113 },
          ]}
        />
      </footprint>
    }
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=81be6d0044f74aa08902af37c04cb07c&pn=C22396918",
      rotationOffset: { x: 0, y: 0, z: 0 },
      positionOffset: { x: 0, y: 0, z: 0 },
    }}
    {...props}
  />
)

test("CO2 pcbPack should not rotate or move FunctionConnector group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled width="2550mil" height="1500mil">
      <group name="FunctionConnector" pcbX={-33} pcbY={2} schX={-10} schY={2}>
        <Connector
          name="J1"
          connections={{
            pin72: "net.VCC",
            pin71: "net.EN",
            pin21: "net.SCL",
            pin19: "net.SDA",
          }}
        />
        <chip
          pcbX={8}
          name="U2"
          footprint="soic8"
          pinLabels={{
            pin1: "A0",
            pin2: "A1",
            pin3: "A2",
            pin4: "GND",
            pin5: "SDA",
            pin6: "SCL",
            pin7: "WP",
            pin8: "VCC",
          }}
          schX={-4}
          schY={-1}
          connections={{
            pin1: "J1.pin36",
            pin2: "J1.pin34",
            pin3: "J1.pin32",
            pin4: "J1.pin1",
            pin5: "net.SDA",
            pin6: "net.SCL",
            pin7: "net.GND",
            pin8: "net.V3_3",
          }}
          schPinArrangement={{
            leftSide: {
              pins: ["pin8", "pin7", "pin6", "pin5"],
              direction: "top-to-bottom",
            },
            rightSide: {
              pins: ["pin1", "pin2", "pin3", "pin4"],
              direction: "top-to-bottom",
            },
          }}
        />
      </group>

      <group name="CO2" schX={10} schY={3} pcbPack>
        <STC31_C_R3
          name="U5"
          connections={{
            VDD: "net.V3_3",
            SCL: "net.SCL",
            SDA: "net.SDA",
            VSS1: "net.GND",
            ADDR: "net.ADDR",
          }}
        />
        <capacitor
          capacitance="0.1uF"
          footprint="0402"
          name="C4"
          schX={-4}
          schRotation={"90deg"}
          connections={{ pin2: "net.V3_3", pin1: "net.GND" }}
        />
        <group schX={4} schY={0}>
          <resistor
            resistance="1k"
            footprint="0402"
            name="R4"
            schX={0}
            connections={{ pin2: "J_0X2A.pin1", pin1: "net.V3_3" }}
          />
          <solderjumper
            name="J_0X2A"
            footprint="solderjumper2_bridged12"
            pinCount={2}
            schX={1.4}
            bridgedPins={[["1", "2"]]}
            connections={{ pin2: "net.ADDR" }}
          />
          <resistor
            resistance="1k"
            footprint="0402"
            name="R5"
            schX={0}
            schY={-1}
            connections={{ pin2: "J_0X2B.pin1", pin1: "R4.pin1" }}
          />
          <solderjumper
            name="J_0X2B"
            footprint="solderjumper2_bridged12"
            pinCount={2}
            schX={1.4}
            schY={-1}
            bridgedPins={[["1", "2"]]}
            connections={{ pin2: "J_0X2A.pin2" }}
          />
          <resistor
            resistance="1k"
            footprint="0402"
            name="R6"
            schX={0}
            schY={-2}
            connections={{ pin2: "J_0X2C.pin1", pin1: "R5.pin1" }}
          />
          <solderjumper
            name="J_0X2C"
            footprint="solderjumper2_bridged12"
            pinCount={2}
            schX={1.4}
            schY={-2}
            bridgedPins={[["1", "2"]]}
            connections={{ pin2: "J_0X2B.pin2" }}
          />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceGroup = circuit.db.source_group
    .list()
    .find((g) => g.name === "FunctionConnector")!
  const pcbGroup = circuit.db.pcb_group
    .list()
    .find((g) => g.source_group_id === sourceGroup.source_group_id)!

  // If bug occurs, these will fail due to move/flip
  expect(pcbGroup.center.x).toBeCloseTo(-33, 2)
  expect(pcbGroup.center.y).toBeCloseTo(2, 2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
