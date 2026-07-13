import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A0"],
  pin3: ["N_ALERT"],
  pin4: ["SDA"],
  pin5: ["SCL"],
  pin6: ["VS"],
  pin7: ["GND"],
  pin8: ["VBUS"],
  pin9: ["IN_NEG", "INN"],
  pin10: ["IN_POS", "INP"],
} as const

const INA237AQDGSRQ1 = (_props: any) => {
  return (
    <chip
      name="U1"
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2866496"],
      }}
      manufacturerPartNumber="INA237AQDGSRQ1"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.999871mm"
            pcbY="-2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.499999mm"
            pcbY="-2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.000127mm"
            pcbY="-2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.499999mm"
            pcbY="-2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.000125mm"
            pcbY="-2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.999871mm"
            pcbY="2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.499999mm"
            pcbY="2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.000127mm"
            pcbY="2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-0.499999mm"
            pcbY="2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-1.000125mm"
            pcbY="2.350008mm"
            width="0.2999994mm"
            height="1.2999974mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.5784830000000056, y: 1.5365221999999932 },
              { x: 1.5215869999999967, y: 1.5365221999999932 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.5215869999999967, y: -1.5635478000000091 },
              { x: 1.5215869999999967, y: 1.5365221999999932 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5784830000000056, y: -1.562277800000004 },
              { x: 1.5215869999999967, y: -1.562277800000004 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6026130000000052, y: 1.5365221999999932 },
              { x: -1.6026130000000052, y: 0.6983222000000069 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6026130000000052, y: -0.7240778000000034 },
              { x: -1.6026130000000052, y: -1.562277800000004 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6026130000000052, y: 0.6729222000000021 },
              { x: -1.3955278102578177, y: 0.570256723115321 },
              { x: -1.2308116008042873, y: 0.40810541631279307 },
              { x: -1.1249090052417472, y: 0.20265684316703414 },
              { x: -1.0883929318913914, y: -0.025577799999993545 },
              { x: -1.1249090052417472, y: -0.25381244316703544 },
              { x: -1.2308116008042873, y: -0.45926101631278016 },
              { x: -1.3955278102578177, y: -0.6214123231153224 },
              { x: -1.6026130000000052, y: -0.7240778000000034 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4237969999999933, y: -1.9812000000000012 },
              { x: -1.427207007008306, y: -2.0071015747576837 },
              { x: -1.437204641690883, y: -2.031238000000002 },
              { x: -1.4531085817659886, y: -2.0519644182340073 },
              { x: -1.4738350000000082, y: -2.067868358309127 },
              { x: -1.4979714252423264, y: -2.07786599299169 },
              { x: -1.5238729999999947, y: -2.0812759999999884 },
              { x: -1.5497745747576914, y: -2.07786599299169 },
              { x: -1.5739110000000096, y: -2.067868358309127 },
              { x: -1.5946374182340293, y: -2.0519644182340073 },
              { x: -1.6105413583091348, y: -2.031238000000002 },
              { x: -1.6205389929917118, y: -2.0071015747576837 },
              { x: -1.6239490000000103, y: -1.9812000000000012 },
              { x: -1.6205389929917118, y: -1.9552984252423187 },
              { x: -1.6105413583091348, y: -1.9311620000000005 },
              { x: -1.5946374182340293, y: -1.9104355817659808 },
              { x: -1.5739110000000096, y: -1.8945316416908753 },
              { x: -1.5497745747576914, y: -1.8845340070082983 },
              { x: -1.5238729999999947, y: -1.8811239999999856 },
              { x: -1.4979714252423264, y: -1.8845340070082983 },
              { x: -1.4738350000000082, y: -1.8945316416908753 },
              { x: -1.4531085817659886, y: -1.9104355817659808 },
              { x: -1.437204641690883, y: -1.9311620000000005 },
              { x: -1.427207007008306, y: -1.9552984252423187 },
              { x: -1.4237969999999933, y: -1.9812000000000012 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.053213mm"
            pcbY="4.004312mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.8780129999999957, y: 3.2543119999999988 },
              { x: 1.7715869999999967, y: 3.2543119999999988 },
              { x: 1.7715869999999967, y: -3.240088 },
              { x: -1.8780129999999957, y: -3.240088 },
              { x: -1.8780129999999957, y: 3.2543119999999988 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2866496.obj?uuid=854098f5cce54b6caab82164a7d3deef",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2866496.step?uuid=854098f5cce54b6caab82164a7d3deef",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0.000012699999999199463, y: 0, z: -0.149083 },
      }}
    />
  )
}

const INA237Subcircuit = () => (
  <subcircuit width={100} height={100}>
    <INA237AQDGSRQ1
      schX={0}
      schY={0}
      schWidth={2.5}
      schHeight={2.8}
      showPinAliases={false}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["VS", "VBUS", "IN_POS", "IN_NEG", "GND"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["A0", "A1", "SCL", "SDA", "N_ALERT"],
        },
      }}
      schPinStyle={{
        VBUS: { marginTop: 0.15 },
        IN_POS: { marginTop: 0.15 },
        IN_NEG: { marginTop: 0.15 },
        GND: { marginTop: 0.15 },
        A1: { marginTop: 0.15 },
        SCL: { marginTop: 0.3 },
        SDA: { marginTop: 0.15 },
        N_ALERT: { marginTop: 0.15 },
      }}
      connections={{
        VS: "net.VS",
        VBUS: "net.BUS_HIGH",
        IN_POS: "net.BUS_HIGH",
        IN_NEG: "net.LOAD_CHARGER",
        GND: "net.GND",
        A0: "net.GND",
        A1: "net.GND",
        SCL: "net.SCL",
        SDA: "net.SDA",
        N_ALERT: "net.N_ALERT",
      }}
    />

    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0402"
      schX={-3.75}
      schY={2.05}
      schRotation="180deg"
      connections={{
        pin1: "net.VS",
        pin2: "net.GND",
      }}
    />

    <battery
      name="B1"
      voltage="48V"
      footprint="pinrow2"
      schX={-8.75}
      schY={-1.35}
      schRotation="270deg"
    />

    <resistor
      name="R_SHUNT"
      resistance="0.001"
      footprint="2512"
      schX={-5.95}
      schY={-0.25}
      schRotation="270deg"
      connections={{
        pin1: "net.BUS_HIGH",
        pin2: "net.LOAD_CHARGER",
      }}
    />

    <resistor
      name="R_LOAD"
      resistance="10"
      footprint="1206"
      schX={-7}
      schY={-3.3}
      schRotation="270deg"
      connections={{
        pin1: "net.LOAD_CHARGER",
        pin2: "net.GND",
      }}
    />

    <voltagesource
      name="CHARGER"
      voltage="12V"
      footprint="pinrow2"
      schX={-4.1}
      schY={-3.3}
      schRotation="270deg"
    />

    <trace from=".B1 > .pin2" to={"net.BUS_HIGH"} />
    <trace from=".B1 > .pin1" to={"net.GND"} />
    <trace from=".CHARGER > .pin2" to={"net.LOAD_CHARGER"} />
    <trace from=".CHARGER > .pin1" to={"net.GND"} />

    <resistor
      name="R1"
      resistance="10k"
      footprint="0402"
      schX={4.1}
      schY={2.2}
      schRotation="270deg"
      connections={{
        pin1: "net.VS",
        pin2: "net.SCL",
      }}
    />
    <resistor
      name="R2"
      resistance="10k"
      footprint="0402"
      schX={5.0}
      schY={2.2}
      schRotation="270deg"
      connections={{
        pin1: "net.VS",
        pin2: "net.SDA",
      }}
    />
    <resistor
      name="R3"
      resistance="10k"
      footprint="0402"
      schX={5.9}
      schY={2.2}
      schRotation="270deg"
      connections={{
        pin1: "net.VS",
        pin2: "net.N_ALERT",
      }}
    />

    <chip
      name="J1"
      manufacturerPartNumber="MCU I2C Interface"
      footprint="pinrow4"
      schX={8.25}
      schY={-0.55}
      schWidth={2.3}
      schHeight={2.9}
      pinLabels={{
        pin1: "SCL",
        pin2: "SDA",
        pin3: "N_ALERT",
        pin4: "GND",
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["pin1", "pin2", "pin3", "pin4"],
        },
      }}
      schPinStyle={{
        pin3: { marginTop: 0.25 },
      }}
      connections={{
        pin1: "net.SCL",
        pin2: "net.SDA",
        pin3: "net.N_ALERT",
        pin4: "net.GND",
      }}
    />

    <netlabel net="VS" connectsTo="U1.VS" schX={-3.15} schY={2.95} />
    <netlabel net="GND" connectsTo="U1.GND" schX={-2.55} schY={-2.15} />
    {/* <netlabel net="GND" connectsTo="U1.A0" schX={2.65} schY={1.45} />
    <netlabel net="GND" connectsTo="U1.A1" schX={2.65} schY={0.75} /> */}
    <netlabel net="GND" connectsTo="B1.pin1" schX={-8.75} schY={-4.05} />
    <netlabel net="VS" connectsTo="R2.pin1" schX={5.0} schY={3.55} />

    <schematictext
      text="VS = 2.7V - 5.5V"
      schX={-3.1}
      schY={3.55}
      fontSize={0.2}
      anchor="center"
    />
    <schematictext
      text="48V BATT"
      schX={-9.65}
      schY={0.0}
      fontSize={0.22}
      anchor="center"
    />
    <schematictext
      text="I2C ADDR: 0x40"
      schX={1.55}
      schY={-2.2}
      fontSize={0.2}
      anchor="center"
    />
    <schematictext
      text="To MCU"
      schX={9.95}
      schY={-0.55}
      fontSize={0.24}
      anchor="center"
    />
  </subcircuit>
)

test("repro130: missing junction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<INA237Subcircuit />)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
