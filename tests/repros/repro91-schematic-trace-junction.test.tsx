import { it, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

const pinLabels = {
  pin1: ["OB2"],
  pin2: ["N_EN"],
  pin3: ["GND2"],
  pin4: ["CPO"],
  pin5: ["CPI"],
  pin6: ["VCP"],
  pin7: ["SPREAD"],
  pin8: ["VOUT"],
  pin9: ["MS1_AD0"],
  pin10: ["MS2_AD1"],
  pin11: ["DIAG"],
  pin12: ["INDEX"],
  pin13: ["CLK"],
  pin14: ["PDN_UART"],
  pin15: ["VCC_IO"],
  pin16: ["STEP"],
  pin17: ["VREF"],
  pin18: ["GND1"],
  pin19: ["DIR"],
  pin20: ["STDBY"],
  pin21: ["OA2"],
  pin22: ["VS1"],
  pin23: ["BRA"],
  pin24: ["OA1"],
  pin25: ["NC"],
  pin26: ["OB1"],
  pin27: ["BRB"],
  pin28: ["VS2"],
  pin29: ["EXP"],
} as const

const TMC2209_LA_T = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2150710"],
      }}
      manufacturerPartNumber="TMC2209_LA_T"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin29"]}
            pcbX="-0.00012699999999199463mm"
            pcbY="-0.0001270000000133109mm"
            width="3.4999930000000004mm"
            height="3.4999930000000004mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="-2.4999949999999984mm"
            pcbY="-1.5012670000000128mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="-2.4999949999999984mm"
            pcbY="-1.0008870000000059mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="-2.4999949999999984mm"
            pcbY="-0.5005070000000131mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="-2.4999949999999984mm"
            pcbY="-0.0001270000000133109mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-2.4999949999999984mm"
            pcbY="0.5002529999999865mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-2.4999949999999984mm"
            pcbY="1.0006329999999934mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-2.4999949999999984mm"
            pcbY="1.5010129999999933mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-1.5012669999999915mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-1.0008869999999987mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-0.5005069999999989mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-0.00012699999999199463mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="0.5002530000000007mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="1.0006330000000077mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="1.5010130000000004mm"
            pcbY="2.4999949999999984mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="2.4999949999999984mm"
            pcbY="1.5010129999999933mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="2.4999949999999984mm"
            pcbY="1.0006329999999934mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="2.4999949999999984mm"
            pcbY="0.5002529999999865mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="2.4999949999999984mm"
            pcbY="-0.0001270000000133109mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="2.4999949999999984mm"
            pcbY="-0.5005070000000131mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="2.4999949999999984mm"
            pcbY="-1.0008870000000059mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="2.4999949999999984mm"
            pcbY="-1.5012670000000128mm"
            width="0.8999982mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.5010130000000004mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.0006330000000077mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.5002530000000007mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.00012699999999199463mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.5005069999999989mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.0008869999999987mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.5012669999999915mm"
            pcbY="-2.4999950000000055mm"
            width="0.2800096mm"
            height="0.8999982mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.0001991999999973, y: -2.6500328000000053 },
              { x: -2.6501851999999957, y: -2.6500328000000053 },
              { x: -2.6501851999999957, y: -2.000046800000007 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.0001991999999973, y: 2.6499311999999975 },
              { x: -2.6501851999999957, y: 2.6499311999999975 },
              { x: -2.6501851999999957, y: 1.999945199999992 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.649778800000007, y: 1.999945199999992 },
              { x: 2.649778800000007, y: 2.6499311999999975 },
              { x: 1.9997927999999945, y: 2.6499311999999975 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.9997927999999945, y: -2.6500328000000053 },
              { x: 2.649778800000007, y: -2.6500328000000053 },
              { x: 2.649778800000007, y: -2.000046800000007 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.451303199999991, y: -2.9997908000000137 },
              { x: -2.600044255997652, y: -2.8491487702960825 },
              { x: -2.450033199999993, y: -2.6997713759852644 },
              { x: -2.300022144002334, y: -2.8491487702960825 },
              { x: -2.448763199999995, y: -2.9997908000000137 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=ae12e1b5ea7a411e8a6f7d8e9f5ed919&pn=C2150710",
        rotationOffset: { x: 0, y: 0, z: 90 },
        positionOffset: {
          x: -0.00007619999999519678,
          y: 0.00007619999998809135,
          z: 3.30999498,
        },
      }}
      {...props}
    />
  )
}

it(
  "repro91: schematic trace junction",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board>
        <TMC2209_LA_T
          name="U1"
          schWidth={2.2}
          schHeight={5.2}
          schPinStyle={{
            N_EN: {
              marginBottom: "0.3",
            },
            CLK: {
              marginBottom: "0.3",
              marginTop: "0.3",
            },
            CPO: {
              marginBottom: "0.3",
            },
            VCP: {
              marginBottom: "0.3",
            },
            VREF: {
              marginTop: "0.3",
            },
            INDEX: {
              marginBottom: "0.3",
              marginTop: "0.3",
            },
            BRA: {
              marginTop: "0.3",
            },
            BRB: {
              marginBottom: "0.3",
            },
          }}
          schPinArrangement={{
            leftSide: [
              "pin2",
              "pin16",
              "pin19",
              "pin9",
              "pin10",
              "pin13",
              "pin5",
              "pin4",
              "pin7",
              "pin14",
              "pin17",
              "pin20",
            ],
            rightSide: [
              "pin15",
              "pin22",
              "pin28",
              "pin8",
              "pin6",
              "pin11",
              "pin12",
              "pin24",
              "pin26",
              "pin21",
              "pin1",
              "pin23",
              "pin27",
              "pin25",
              "pin29",
              "pin18",
              "pin3",
            ],
          }}
          connections={{
            EXP: sel.net.GND,
            GND1: sel.net.GND,
            GND2: sel.net.GND,
            CLK: sel.net.GND,
            VS2: sel.U1.pin22,
          }}
        />

        <capacitor
          name="C9"
          capacitance="0.1uF"
          footprint="0402"
          connections={{
            pin1: "net.GND",
            pin2: "net.VCC_5",
          }}
        />
        <capacitor
          name="C12"
          capacitance="22nF"
          footprint="0402"
          connections={{
            pin1: sel.U1.pin5,
            pin2: sel.U1.pin4,
          }}
        />

        <resistor
          name="R2"
          resistance="100ohm"
          footprint="0402"
          connections={{
            pin1: "net.VCC_3",
            pin2: sel.U1.pin2,
          }}
        />

        <resistor
          name="R8"
          resistance="100ohm"
          footprint="0402"
          connections={{
            pin1: "net.VCC_5",
            pin2: sel.R10.pin1,
          }}
        />

        <solderjumper
          name="J1"
          pinCount={3}
          connections={{
            pin1: "net.VCC_3",
            pin2: sel.U1.pin9,
            pin3: "net.GND",
          }}
        />
        <solderjumper
          name="J2"
          pinCount={3}
          connections={{
            pin1: "net.VCC_3",
            pin2: sel.U1.pin10,
            pin3: "net.GND",
          }}
        />
        <solderjumper
          name="J3"
          pinCount={3}
          connections={{
            pin1: "net.VCC_3",
            pin2: sel.U1.pin7,
            pin3: "net.GND",
          }}
        />

        <potentiometer
          name="R10"
          maxResistance="20kohm"
          symbolName="potentiometer3_right"
          footprint="0402"
          connections={{
            pin2: sel.U1.pin17,
          }}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
  {
    timeout: 30_000,
  },
)
