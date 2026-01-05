import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CommonLayoutProps } from "@tscircuit/props"

const SmdDiode = (props: Props2) => {
  return (
    <diode
      {...props}
      footprint={
        <footprint>
          <smtpad
            portHints={["1"]}
            pcbX="-1.1725910000000113mm"
            pcbY="0mm"
            width="0.9999979999999999mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["2"]}
            pcbX="1.1725910000000113mm"
            pcbY="0mm"
            width="0.9999979999999999mm"
            height="0.7500112mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.9012427999999773, y: -0.726211400000011 },
              { x: 0.9012427999999773, y: -0.5199887999999646 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.9012427999999773, y: 0.726211400000011 },
              { x: 0.9012427999999773, y: 0.5299964000000728 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8512047999998913, y: 0.726211400000011 },
              { x: 0.9012427999999773, y: 0.726211400000011 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8512047999998913, y: -0.726211400000011 },
              { x: 0.9012427999999773, y: -0.726211400000011 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.44676059999994777, y: 0.726211400000011 },
              { x: -0.44676059999994777, y: -0.726211400000011 },
            ]}
          />
        </footprint>
      }
      supplierPartNumbers={{
        jlcpcb: ["C57759"],
      }}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=973acf8a660c48b1975f1ba1c890421a&pn=C57759",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
    />
  )
}

interface Props extends CommonLayoutProps {
  name: string
}

const pinLabels1 = {
  "1": "pin1",
  "2": "pin2",
} as const
const pinNames1 = Object.values(pinLabels1)

interface Props extends CommonLayoutProps {
  name: string
  connections: { pin1?: string; pin2?: string } | undefined
}

const KeyHotSocket = (props: Props) => {
  return (
    <pushbutton
      layer="bottom"
      {...props}
      footprint={
        <footprint>
          <hole
            pcbX="3.1749999999999545mm"
            pcbY="-1.2699999999999818mm"
            diameter="2.9999939999999996mm"
          />
          <hole
            pcbX="-3.1749999999999545mm"
            pcbY="1.2700000000000955mm"
            diameter="2.9999939999999996mm"
          />
          <smtpad
            portHints={["2"]}
            pcbX="6.724904000000038mm"
            pcbY="-1.2699999999999818mm"
            width="2.8999941999999996mm"
            height="2.4999949999999997mm"
            shape="rect"
          />
          <smtpad
            portHints={["1"]}
            pcbX="-6.724904000000038mm"
            pcbY="1.2699999999999818mm"
            width="2.8999941999999996mm"
            height="2.4999949999999997mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -5.461000000000013, y: -0.4611370000000079 },
              { x: -5.461000000000013, y: -2.9209999999999354 },
              { x: -5.461000000000013, y: -2.9209999999999354 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.4500017999999955, y: -2.950006799999869 },
              { x: -5.461000000000013, y: -2.950006799999869 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.18298159999994823, y: 1.0549889999999778 },
              { x: 5.450027199999909, y: 1.0549889999999778 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 5.450027199999909, y: 1.0549889999999778 },
              { x: 5.450027199999909, y: 0.4611370000000079 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.944114000000127, y: 2.9450030000000424 },
              { x: -5.461000000000013, y: 2.9450030000000424 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.707006999999976, y: 2.9450030000000424 },
              { x: -2.944114000000127, y: 2.9450030000000424 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.707006999999976, y: 2.9450030000000424 },
              { x: -1.460311886129034, y: 2.9288336092640748 },
              { x: -1.2178378661753868, y: 2.8806021044970294 },
              { x: -0.9837338087377248, y: 2.801133754218995 },
              { x: -0.762005367588813, y: 2.6917883071702136 },
              { x: -0.5564464426572613, y: 2.5544367262343712 },
              { x: -0.37057426423848483, y: 2.3914291751993915 },
              { x: -0.20756921118118044, y: 2.2055548061152876 },
              { x: -0.07022039279377168, y: 1.9999940353145576 },
              { x: 0.03912207440475868, y: 1.7782641246765252 },
              { x: 0.11858727851722506, y: 1.5441589992735771 },
              { x: 0.1668155246366041, y: 1.301684331151364 },
              { x: 0.18298159999994823, y: 1.0549889999999778 },
            ]}
          />
        </footprint>
      }
      supplierPartNumbers={{
        jlcpcb: ["C41430893"],
      }}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=c886ec2b42464573a88fc1f647577a49&pn=C5184526",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels}
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
    />
  )
}

const pinLabels = {
  "1": "pin1",
  "2": "pin2",
} as const
const pinNames = Object.values(pinLabels)

const pinLabels2 = {
  "1": "pin1",
  "2": "pin2",
} as const
const pinNames2 = Object.values(pinLabels2)

interface Props2 extends CommonLayoutProps {
  name: string
}

const KeyShaftForHotSocket = (props: Props2) => {
  return (
    <chip
      {...props}
      noSchematicRepresentation
      schWidth={0.1}
      schHeight={0.1}
      supplierPartNumbers={{
        jlcpcb: ["C400227"],
      }}
      footprint={
        <footprint>
          <hole
            pcbX="0.6349999999999909mm"
            pcbY="-3.1149987999999666mm"
            diameter="4.1999916mm"
          />
          {/* <platedhole
            portHints={["1"]}
            pcbX="-3.1749999999999545mm"
            pcbY="-0.574998800000003mm"
            outerDiameter="2.3999951999999998mm"
            holeDiameter="1.5999967999999998mm"
            shape="circle"
          />
          <platedhole
            portHints={["2"]}
            pcbX="3.1749999999999545mm"
            pcbY="1.9650012000000743mm"
            outerDiameter="2.3999951999999998mm"
            holeDiameter="1.5999967999999998mm"
            shape="circle"
          /> */}
          <silkscreenpath
            route={[
              { x: -7.165009800000007, y: 4.685011000000031 },
              { x: 8.435009799999989, y: 4.685011000000031 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.165009800000007, y: -10.915008600000078 },
              { x: 8.435009799999989, y: -10.915008600000078 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -7.165009800000007, y: 4.685011000000031 },
              { x: -7.165009800000007, y: -10.915008600000078 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 8.435009799999989, y: 4.685011000000031 },
              { x: 8.435009799999989, y: -10.915008600000078 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=c00f29e7afb64c29bc388e168980ded2&pn=C400227",
        rotationOffset: { x: 0, y: 0, z: 90 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels2}
      schPinSpacing={0.75}
      schPortArrangement={{}}
    />
  )
}

const Key = (props: {
  pcbX?: number
  pcbY?: number
  schX?: number
  schY?: number
  name: string
  connections?: {
    pin1?: string
    pin2?: string
  }
}) => {
  return (
    <group
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      schX={props.schX}
      schY={props.schY}
    >
      <KeyHotSocket name={props.name} connections={props.connections} />
      <KeyShaftForHotSocket
        name={`${props.name}_shaft`}
        pcbX={0}
        pcbY={-0.52}
      />
      <footprint>
        <silkscreentext text={props.name} pcbY={5} />
      </footprint>
    </group>
  )
}
const Pico2 = (props: { name: string; pcbX: string | number }) => (
  <chip
    {...props}
    pinLabels={{
      "1": "GP0",
      "2": "GP1",
      "3": "GND1",
      "4": "GP2",
      "5": "GP3",
      "6": "GP4",
      "7": "GP5",
      "8": "GND",
      "9": "GP6",
      "10": "GP7",
      "11": "GP8",
      "12": "GP9",
      "13": "GND2",
      "14": "GP10",
      "15": "GP11",
      "16": "GP12",
      "17": "GP13",
      "18": "GND3",
      "19": "GP14",
      "20": "GP15",
      "21": "GP16",
      "22": "GP17",
      "23": "GND4",
      "24": "GP18",
      "25": "GP19",
      "26": "GP20",
      "27": "GP21",
      "28": "GND5",
      "29": "GP22",
      "30": "RUN",
      "31": "GP26",
      "32": "GP27",
      "33": "GND6",
      "34": "GP28",
      "35": "ADC_VREF",
      "36": "V3V3",
      "37": "V3V3_EN",
      "38": "GND7",
      "39": "VSYS",
      "40": "VBUS",
    }}
    footprint="soic40_w22.58mm_p2.54mm_pl3.8_ph2.2"
  />
)

const rowToMicroPin: Record<number, string> = {
  0: "GP0",
  1: "GP1",
  2: "GP10",
}
const colToMicroPin: Record<number, string> = {
  0: "GP19",
  1: "GP17",
  2: "GP5",
}

test("repro77 nine key keyboard", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="100mm"
      height="60mm"
      outlineOffsetY={-4}
      schTraceAutoLabelEnabled
    >
      <Pico2 name="U1" pcbX={-30} />
      {grid({ sizeX: 3, sizeY: 3, pitch: 19.05, offset: { x: 20, y: 0 } }).map(
        ({ x, y, row, col }, index) => {
          const schOffX = 5 + x / 6
          const schOffY = -y / 8
          return (
            <group key={`${x}-${y}`}>
              <Key
                pcbX={x}
                pcbY={y}
                schX={schOffX}
                schY={schOffY + 0.5}
                name={`K${index + 1}`}
              />
              <SmdDiode
                pcbX={x}
                pcbY={y - 13}
                schX={schOffX}
                schY={schOffY}
                layer="bottom"
                name={`D${index + 1}`}
              />
              <trace
                from={`.D${index + 1} .pin1`}
                to={`.K${index + 1} .pin1`}
              />
              <trace
                from={`.D${index + 1} .pin2`}
                to={`.U1 .${rowToMicroPin[row]}`}
              />
              <trace
                from={`.K${index + 1} .pin2`}
                to={`.U1 .${colToMicroPin[col]}`}
              />
            </group>
          )
        },
      )}
    </board>,
  )
  function grid(opts: {
    sizeX: number
    sizeY: number
    pitch: number
    offset?: { x: number; y: number }
  }): Array<{ x: number; y: number; row: number; col: number }> {
    const { sizeX, sizeY, pitch, offset = { x: 0, y: 0 } } = opts
    const points: Array<{ x: number; y: number; row: number; col: number }> = []
    const startX = (-(sizeX - 1) * pitch) / 2
    const startY = (-(sizeY - 1) * pitch) / 2
    for (let row = 0; row < sizeY; row++) {
      for (let col = 0; col < sizeX; col++) {
        points.push({
          x: startX + col * pitch + offset.x,
          y: startY + row * pitch + offset.y,
          row,
          col,
        })
      }
    }
    return points
  }
  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
