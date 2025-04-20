import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { createUseComponent } from "@tscircuit/core"
import type { CommonLayoutProps } from "@tscircuit/props"
interface Props extends CommonLayoutProps {
  name: string
}
const pinLabels = {
  pin1: ["D0"],
  pin2: ["D1"],
  pin3: ["D2"],
  pin4: ["D3"],
  pin5: ["D4"],
  pin6: ["D5"],
  pin7: ["D6"],
  pin8: ["D7"],
  pin9: ["D8"],
  pin10: ["D9"],
  pin11: ["D10"],
  pin12: ["VCC"],
  pin13: ["GND"],
  pin14: ["VUSB"],
  pin15: ["BATPLUS"],
  pin16: ["BATMINUS"],
  pin17: ["MTDI"],
  pin18: ["MTDO"],
  pin19: ["EN"],
  pin20: ["GND2"],
  pin21: ["MTMS"],
  pin22: ["MTCK"],
  pin23: ["DPLUS"],
  pin24: ["DMINUS"],
  pin25: ["THERMAL"],
} as const

const xiaoFootprint = (
  <footprint>
    <silkscreentext text="XIAO S3" fontSize="1mm" pcbX={2} pcbY={-6} />
    <smtpad
      portHints={["1"]}
      pcbX="-8.061364mm"
      pcbY="7.573mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["2"]}
      pcbX="-8.061364mm"
      pcbY="5.033mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["3"]}
      pcbX="-8.061364mm"
      pcbY="2.493mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["4"]}
      pcbX="-8.061364mm"
      pcbY="-0.047mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["5"]}
      pcbX="-8.061364mm"
      pcbY="-2.587mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["6"]}
      pcbX="-8.061364mm"
      pcbY="-5.127mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["7"]}
      pcbX="-8.061364mm"
      pcbY="-7.667mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["8"]}
      pcbX="8.103636mm"
      pcbY="-7.667mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["9"]}
      pcbX="8.103636mm"
      pcbY="-5.127mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["10"]}
      pcbX="8.103636mm"
      pcbY="-2.587mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["11"]}
      pcbX="8.103636mm"
      pcbY="-0.047mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["12"]}
      pcbX="8.103636mm"
      pcbY="2.493mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["13"]}
      pcbX="8.103636mm"
      pcbY="5.033mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["14"]}
      pcbX="8.103636mm"
      pcbY="7.573mm"
      width="2.75mm"
      height="2mm"
      shape="rect"
    />
    <smtpad
      portHints={["15"]}
      pcbX="-4.451364mm"
      pcbY="0.335mm"
      width="2mm"
      height="1.1mm"
      shape="rect"
    />
    <smtpad
      portHints={["16"]}
      pcbX="-4.451364mm"
      pcbY="2.24mm"
      width="2mm"
      height="1.1mm"
      shape="rect"
    />
    <smtpad
      portHints={["17"]}
      pcbX="-1.276364mm"
      pcbY="8.585mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["18"]}
      pcbX="1.263636mm"
      pcbY="8.585mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["19"]}
      pcbX="-1.276364mm"
      pcbY="6.045mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["20"]}
      pcbX="1.263636mm"
      pcbY="6.045mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["21"]}
      pcbX="-1.276364mm"
      pcbY="3.505mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["22"]}
      pcbX="1.263636mm"
      pcbY="3.505mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["23"]}
      pcbX="-1.276364mm"
      pcbY="0.965mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["24"]}
      pcbX="1.263636mm"
      pcbY="0.965mm"
      radius="0.8mm"
      shape="circle"
    />
    <smtpad
      portHints={["25"]}
      pcbX="1.5mm"
      pcbY="-2.5mm"
      width="3mm"
      height="3mm"
      shape="rect"
    />
    <silkscreenpath
      route={[
        { x: -8.896364, y: -8.56 },
        { x: -8.896364, y: 8.585 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -6.991364, y: -10.465 },
        { x: 6.978636, y: -10.465 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -4.501364, y: 10.49 },
        { x: -4.497636, y: 11.500272 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -3.997636, y: 12 },
        { x: 3.997636, y: 12 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 4.497636, y: 11.5 },
        { x: 4.497636, y: 10.49 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 6.978636, y: 10.49 },
        { x: -6.991364, y: 10.49 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 8.883636, y: -8.56 },
        { x: 8.883636, y: 8.585 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -8.896364, y: 8.589 },
        { x: -8.641141964987211, y: 9.541499698293817 },
        { x: -7.943863698293818, y: 10.23877796498721 },
        { x: -6.991364, y: 10.494 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -6.991364, y: -10.465 },
        { x: -7.943863698293818, y: -10.209777964987211 },
        { x: -8.64114196498721, y: -9.512499698293817 },
        { x: -8.896363999999997, y: -8.56 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: -4.497636, y: 11.500272 },
        { x: -3.997636, y: 12 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 3.997636, y: 12 },
        { x: 4.497636, y: 11.5 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 6.978636, y: 10.49 },
        { x: 7.931135698293817, y: 10.23477796498721 },
        { x: 8.62841396498721, y: 9.537499698293818 },
        { x: 8.883636, y: 8.585 },
      ]}
    />
    <silkscreenpath
      route={[
        { x: 8.883636, y: -8.56 },
        { x: 8.62841396498721, y: -9.512499698293817 },
        { x: 7.931135698293818, y: -10.209777964987211 },
        { x: 6.978636, y: -10.465 },
      ]}
    />
  </footprint>
)

export const XIAO_S3 = (props: Props) => {
  return <chip {...props} footprint={xiaoFootprint} pinLabels={pinLabels} />
}
export const useXIAO_S3 = createUseComponent(XIAO_S3, pinLabels)
test("Schematic trace overlaps manufacturer label", async () => {
  const { circuit } = getTestFixture()

  const Xiao = useXIAO_S3("XI")
  const normalThickness = 0.2

  circuit.add(
    <board
      width="25mm"
      height="30mm"
      autorouter={{
        serverCacheEnabled: false,
        local: false,
      }}
      schTraceAutoLabelEnabled
      schAutoLayoutEnabled
    >
      <pinheader
        name="conn"
        pinCount={4}
        gender="male"
        pitch="3.5mm"
        showSilkscreenPinLabels={true}
        pinLabels={["+", "-"]}
        pcbRotation={90}
        footprint="pinrow4_p3.5mm"
      />

      <resistor name="R1" resistance="10k" footprint="1206" pcbRotation={180} />

      <Xiao />
      <trace from={Xiao.VCC} to=".R1 > .pin1" thickness={normalThickness} />
      <trace from={Xiao.D1} to=".R1 > .pin2" thickness={normalThickness} />
      <trace
        from=".R1 > .pin2"
        to=".conn > .pin1"
        thickness={normalThickness}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
