import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels1 = {
  1: ["GND1", "A1"],
  2: ["GND2", "B12"],
  3: ["VBUS1", "A4"],
  4: ["VBUS2", "B9"],
  5: ["SBU2", "B8"],
  6: ["CC1", "A5"],
  7: ["DM2", "B7"],
  8: ["DP1", "A6"],
  9: ["DM1", "A7"],
  10: ["DP2", "B6"],
  11: ["SBU1", "A8"],
  12: ["CC2", "B5"],
  13: ["VBUS1", "A9"],
  14: ["VBUS2", "B4"],
  15: ["GND1", "A12"],
  16: ["GND2", "B1"],
} as const

interface Props extends ChipProps<typeof pinLabels1> {
  name: string
}

/**
 * USB Type C connector (C165948)
 */
export const SmdUsbC = (props: Props) => {
  return (
    <chip
      {...props}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=2a4bc2358b36497d9ab2a66ab6419ba3&pn=C165948",
        rotationOffset: { x: 0, y: 0, z: 180 },
        positionOffset: { x: 0, y: -2.5, z: 0 },
      }}
      pinLabels={pinLabels1}
      supplierPartNumbers={{
        jlcpcb: ["C165948"],
      }}
      schPortArrangement={{
        leftSide: {
          pins: [],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [
            "VBUS1",
            "VBUS2",
            "DP1",
            "DP2",
            "DM1",
            "DM2",
            "CC1",
            "CC2",
            "SBU1",
            "SBU2",
          ],
          direction: "top-to-bottom",
        },
        bottomSide: {
          pins: ["GND1", "GND2"],
          direction: "left-to-right",
        },
      }}
      schPinStyle={{
        pin8: { topMargin: 0.4 },
        pin6: { topMargin: 0.4 },
        pin11: { topMargin: 0.2 },
        pin2: {
          rightMargin: 1,
        },
      }}
      manufacturerPartNumber="TYPE-C-31-M-12"
      footprint={
        <footprint>
          <hole
            pcbX="-2.8999180000000706mm"
            pcbY="1.180611049999925mm"
            diameter="0.7500111999999999mm"
          />
          <hole
            pcbX="2.8999180000000706mm"
            pcbY="1.180611049999925mm"
            diameter="0.7500111999999999mm"
          />
          <platedhole
            portHints={["alt_2"]}
            pcbX="4.32511199999999mm"
            pcbY="-2.7740863499999477mm"
            outerHeight="1.7999964mm"
            outerWidth="1.1999975999999999mm"
            innerHeight="1.3999972mm"
            innerWidth="0.7999983999999999mm"
            //@ts-ignore
            height="1.3999972mm"
            shape="pill"
          />
          <platedhole
            portHints={["alt_1"]}
            pcbX="4.32511199999999mm"
            pcbY="1.4057376499998782mm"
            outerHeight="1.9999959999999999mm"
            outerWidth="1.1999975999999999mm"
            innerHeight="1.5999968mm"
            innerWidth="0.7999983999999999mm"
            //@ts-ignore
            height="1.5999968mm"
            shape="pill"
          />
          <platedhole
            portHints={["alt_0"]}
            pcbX="-4.32511199999999mm"
            pcbY="1.4057376499998782mm"
            outerHeight="1.9999959999999999mm"
            outerWidth="1.1999975999999999mm"
            innerHeight="1.5999968mm"
            innerWidth="0.7999983999999999mm"
            //@ts-ignore
            height="1.5999968mm"
            shape="pill"
          />
          <platedhole
            portHints={["alt_3"]}
            pcbX="-4.32511199999999mm"
            pcbY="-2.7740863499999477mm"
            outerHeight="1.7999964mm"
            outerWidth="1.1999975999999999mm"
            innerHeight="1.3999972mm"
            innerWidth="0.7999983999999999mm"
            //@ts-ignore
            height="1.3999972mm"
            shape="pill"
          />
          <smtpad
            portHints={["B8"]}
            pcbX="-1.7500600000000759mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A5"]}
            pcbX="-1.2499339999999393mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B7"]}
            pcbX="-0.7500619999999572mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A6"]}
            pcbX="-0.2499359999999342mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A7"]}
            pcbX="0.2499359999999342mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B6"]}
            pcbX="0.7500619999999572mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A8"]}
            pcbX="1.2496799999998984mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B5"]}
            pcbX="1.7500600000000759mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A1"]}
            pcbX="-3.3500060000000076mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B12"]}
            pcbX="-3.0500319999999874mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A4"]}
            pcbX="-2.5499059999999645mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B9"]}
            pcbX="-2.249932000000058mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B4"]}
            pcbX="2.249932000000058mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A9"]}
            pcbX="2.5501600000000053mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["B1"]}
            pcbX="3.050032000000101mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["A12"]}
            pcbX="3.3500060000000076mm"
            pcbY="2.449087049999889mm"
            width="0.29999939999999997mm"
            height="1.2999973999999999mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -4.4689776000000165, y: -1.40071475000002 },
              { x: -4.4689776000000165, y: 0.4621974499998487 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.471009600000116, y: -5.119096950000085 },
              { x: -4.4689776000000165, y: -5.119096950000085 },
              { x: -4.4689776000000165, y: -3.6377943500000356 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.471009600000116, y: -1.4010703500000545 },
              { x: 4.471009600000116, y: 0.4625530499999968 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.471009600000116, y: -5.119096950000085 },
              { x: 4.471009600000116, y: -3.6374387500002285 },
            ]}
          />
        </footprint>
      }
    />
  )
}

const pinLabels2 = {
  "1": "pos",
  "2": "neg",
} as const
const pinNames2 = Object.values(pinLabels2)

interface Props extends CommonLayoutProps {
  name: string
}

export const RedLed = (props: Props) => {
  return (
    <led
      {...props}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=d0740cb8891c49a88b6949cb978926f3&pn=C965799",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      // @ts-ignore
      pinLabels={pinLabels2}
      schPinSpacing={0.75}
      schPortArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1],
        },
        rightSide: {
          direction: "bottom-to-top",
          pins: [2],
        },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C965799"],
      }}
      footprint={
        <footprint>
          <smtpad
            portHints={["2"]}
            pcbX="-0.7995919999999614mm"
            pcbY="-0.003428999999982807mm"
            width="0.7999983999999999mm"
            height="0.7999983999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["1"]}
            pcbX="0.7995919999999614mm"
            pcbY="0.003428999999982807mm"
            width="0.7999983999999999mm"
            height="0.7999983999999999mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: -0.3235452000000123 },
              { x: 0.2105660000000853, y: -0.3235452000000123 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.3564890000001242 },
              { x: 0.22047200000019984, y: 0.3464814000001297 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.3564890000001242 },
              { x: 0.22047200000019984, y: -0.3235452000000123 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.24051260000010188, y: 0.7565136000000621 },
              { x: 1.3905738000000838, y: 0.7565136000000621 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.24051260000010188, y: -0.7436103999999659 },
              { x: 1.3905738000000838, y: -0.7436103999999659 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3905738000000838, y: 0.7564628000000084 },
              { x: 1.3905738000000838, y: -0.7235189999998966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1394967999997334, y: -0.7458963999999924 },
              { x: -1.1896089999999049, y: -0.7458963999999924 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: -0.345795599999974 },
              { x: -1.4895575999997845, y: -0.4458207999998649 },
              { x: -1.1896089999999049, y: -0.7458963999999924 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: 0.3541268000000173 },
              { x: -1.4895575999997845, y: -0.345795599999974 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: 0.3541268000000173 },
              { x: -1.4895575999997845, y: 0.4542790000000423 },
              { x: -1.1896089999999049, y: 0.7542276000000356 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1394967999997334, y: 0.7542276000000356 },
              { x: -1.1896089999999049, y: 0.7542276000000356 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.006477000000018052 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
        </footprint>
      }
    />
  )
}
import type { CommonLayoutProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["TRIG"],
  pin3: ["OUT"],
  pin4: ["RESET"],
  pin8: ["VCC"],
  pin7: ["DISCH"],
  pin6: ["THRES"],
  pin5: ["CONT"],
} as const
const pinNames = Object.values(pinLabels)

interface Props extends CommonLayoutProps {
  name: string
}

export const NE555P = (props: Props) => {
  return (
    <chip
      {...props}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=5e8e9a2e75ff40abab9e1f1cacdd2cbb&pn=C46749",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels}
      schPinSpacing={0.75}
      supplierPartNumbers={{
        lcsc: ["C46749"],
      }}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            pcbX="-3.810000000000059mm"
            pcbY="-3.8099999999999454mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="-1.2699999999999818mm"
            pcbY="-3.8099999999999454mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin3"]}
            pcbX="1.2699999999999818mm"
            pcbY="-3.8099999999999454mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin4"]}
            pcbX="3.8099999999999454mm"
            pcbY="-3.8099999999999454mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin8"]}
            pcbX="-3.810000000000059mm"
            pcbY="3.810000000000059mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin7"]}
            pcbX="-1.2699999999999818mm"
            pcbY="3.810000000000059mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin6"]}
            pcbX="1.2699999999999818mm"
            pcbY="3.810000000000059mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin5"]}
            pcbX="3.8099999999999454mm"
            pcbY="3.810000000000059mm"
            outerDiameter="1.499997mm"
            holeDiameter="0.9000235999999999mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: -4.9399951999999985, y: 0.640003800000045 },
              { x: -4.940299999999979, y: 0.6350000000001046 },
              { x: -4.940299999999979, y: 2.649220000000014 },
              { x: 4.960620000000063, y: 2.649220000000014 },
              { x: 4.960620000000063, y: -2.6492199999999 },
              { x: -4.940299999999979, y: -2.6492199999999 },
              { x: -4.940299999999979, y: -0.6349999999999909 },
              { x: -4.9399951999999985, y: -0.6400037999999313 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.9399951999999985, y: -0.6400037999999313 },
              { x: -4.6969912204483535, y: -0.5916673031445043 },
              { x: -4.490982393946524, y: -0.4540166060533011 },
              { x: -4.353331696855321, y: -0.24800777955169906 },
              { x: -4.304995200000121, y: -0.005003799999826697 },
              { x: -4.353331696855321, y: 0.2380001795518183 },
              { x: -4.490982393946524, y: 0.4440090060536477 },
              { x: -4.6969912204483535, y: 0.5816597031448509 },
              { x: -4.9399951999999985, y: 0.6299962000000505 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.234940000000051, y: -3.8099999999999454 },
              { x: -5.109318043912481, y: -3.933721786962792 },
              { x: -4.984959652107364, y: -3.808729999999855 },
              { x: -5.109318043912481, y: -3.6837382130370315 },
              { x: -5.234940000000051, y: -3.8074599999997645 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.450080000000071, y: -1.65099999999984 },
              { x: -4.360871640570167, y: -1.8619343786078844 },
              { x: -4.148821341500593, y: -1.9484567117675624 },
              { x: -3.9375112001708885, y: -1.8601421170388903 },
              { x: -3.85009195288103, y: -1.6484599999998863 },
              { x: -3.937511200171002, y: -1.4367778829607687 },
              { x: -4.148821341500707, y: -1.3484632882322103 },
              { x: -4.360871640570167, y: -1.4349856213918883 },
              { x: -4.450080000000071, y: -1.6459199999999328 },
            ]}
          />
        </footprint>
      }
    />
  )
}

export const A555Timer = NE555P

// @ts-ignore
export const useNE555P = createUseComponent(NE555P, pinNames)

test("repro87 trace overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" schAutoLayoutEnabled>
      <SmdUsbC name="USBC" pcbX={-10} pcbY={-10} />
      <A555Timer name="B1" />
      <resistor name="R1" resistance="1K" footprint="0805" pcbX={-8} pcbY={8} />
      <resistor
        name="R2"
        resistance="470K"
        footprint="0805"
        pcbX={0}
        pcbY={-8}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0805"
        pcbX={2.5}
        pcbY={8}
      />

      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0805"
        pcbX={-2.5}
        pcbY={8}
      />

      <RedLed name="LED" pcbX={5} pcbY={10} />

      <trace from=".USBC > .VBUS1" to=".R1 > .left" />
      <trace from=".R1 > .right" to=".R2 > .left" />
      <trace from=".R2 > .right" to=".C1 > .left" />
      <trace from=".C1 > .right" to=".USBC > .GND1" />
      <trace from=".B1 > .pin7" to=".R1 > .right" />
      <trace from=".B1 > .pin6" to=".R2 > .right" />
      <trace from=".B1 > .pin2" to=".R2 > .right" />
      <trace from=".B1 > .pin3" to=".R3 > .left" />
      <trace from=".R3 > .right" to=".LED > .pos" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  // Verify that false positive DRC errors are not generated
  // Previously, traces overlapping with pads/holes on the same net were
  // incorrectly flagged as errors because the connectivity map couldn't
  // establish the connection (route segments were missing port IDs).
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))

  // Only 2 legitimate errors should remain:
  // - source_trace_0 overlapping with adjacent USBC pads on different nets
  expect(errors.length).toBe(2)

  const svg = convertCircuitJsonToPcbSvg(circuitJson)
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
