import { createUseComponent } from "../../../lib"
import type { CommonLayoutProps } from "@tscircuit/props"

const pinLabels = {
  pin1: "pin1",
  pin2: "pin2",
  pin3: "pin3",
  pin4: "pin4",
} as const
const pinNames = Object.values(pinLabels)

interface Props extends CommonLayoutProps {
  name: string
}

export const PushButton = (props: Props) => {
  return (
    <pushbutton
      {...props}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=6ef04b62f1e945518af209609f65fa6f&pn=C110153",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 3.1 },
      }}
      pinLabels={pinLabels}
      schPinSpacing={0.75}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1, 3],
        },
        rightSide: {
          direction: "bottom-to-top",
          pins: [4, 2],
        },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C110153"],
      }}
      footprint={
        <footprint>
          <platedhole
            portHints={["4"]}
            pcbX="3.2499299999998357mm"
            pcbY="-2.249932000000058mm"
            outerDiameter="1.9999959999999999mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <platedhole
            portHints={["2"]}
            pcbX="3.2499299999998357mm"
            pcbY="2.249932000000058mm"
            outerDiameter="1.9999959999999999mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <platedhole
            portHints={["1"]}
            pcbX="-3.2499299999999494mm"
            pcbY="2.249932000000058mm"
            outerDiameter="1.9999959999999999mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <platedhole
            portHints={["3"]}
            pcbX="-3.2499299999999494mm"
            pcbY="-2.249932000000058mm"
            outerDiameter="1.9999959999999999mm"
            holeDiameter="1.3000228mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: -2.2743160000001126, y: -2.999994000000015 },
              { x: 2.274315999999999, y: -2.999994000000015 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.999994000000129, y: 1.0999978000000965 },
              { x: -2.999994000000129, y: -0.999998000000005 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.0999937999998792, y: 1.0279888000000028 },
              { x: 3.0999937999998792, y: -1.0999977999999828 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.99999600000001, y: 2.999994000000015 },
              { x: 2.274315999999999, y: 2.999994000000015 },
            ]}
          />
        </footprint>
      }
    />
  )
}

export const usePushButton = createUseComponent(PushButton, pinNames)
