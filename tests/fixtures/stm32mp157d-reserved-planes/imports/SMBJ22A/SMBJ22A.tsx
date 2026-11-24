import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["K"],
  pin2: ["A"],
} as const

export const SMBJ22A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin2"
            pinNumber={2}
            aliases={["A"]}
            direction="right"
            schX={0.4}
            schY={0}
            schStemLength={0.3}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["K"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.3}
          />
          <schematicpath
            points={[
              { x: -0.16, y: 0.12 },
              { x: -0.16, y: 0.14 },
              { x: -0.12, y: 0.14 },
              { x: -0.12, y: -0.16 },
              { x: -0.08, y: -0.16 },
              { x: -0.08, y: -0.14 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.1 0.12 L -0.1 0 L 0.1 -0.14 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematictext
            schX={-0.001}
            schY={0.34}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C224015"],
      }}
      manufacturerPartNumber="SMBJ22A"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="2.360676mm"
            pcbY="0mm"
            width="2.047494mm"
            height="2.192401mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.360676mm"
            pcbY="0mm"
            width="2.047494mm"
            height="2.192401mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.0160000000000764, y: 1.8862040000000206 },
              { x: -1.0160000000000764, y: -1.886203999999907 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7437080000000833, y: 1.8862040000000206 },
              { x: 2.7437079999999696, y: 1.8862040000000206 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.7437080000000833, y: -1.886203999999907 },
              { x: 2.7437079999999696, y: -1.886203999999907 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.7437079999999696, y: 1.8862040000000206 },
              { x: 2.7437079999999696, y: 1.2993877999999768 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.7437079999999696, y: -1.886203999999907 },
              { x: 2.7437079999999696, y: -1.2993877999999768 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="2.9558mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -2.396007400000144, y: -0.13573759999997037 },
              { x: -2.396007400000144, y: 0.13573760000008406 },
              { x: -1.3100049999999328, y: 0.13573760000008406 },
              { x: -1.3100049999999328, y: -0.13573759999997037 },
              { x: -2.396007400000144, y: -0.13573759999997037 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: 2.396007400000144, y: -0.13573759999997037 },
              { x: 2.396007400000144, y: 0.13573760000008406 },
              { x: 1.3100049999999328, y: 0.13573760000008406 },
              { x: 1.3100049999999328, y: -0.13573759999997037 },
              { x: 2.396007400000144, y: -0.13573759999997037 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: 1.988743799999952, y: -0.9050019999999677 },
              { x: 1.988743799999952, y: 0.9050020000000814 },
              { x: 1.7172431999999844, y: 0.9050020000000814 },
              { x: 1.7172431999999844, y: -0.9050019999999677 },
              { x: 1.988743799999952, y: -0.9050019999999677 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -3.6344230000000834, y: 2.0499964000000546 },
              { x: 3.6344229999999698, y: 2.0499964000000546 },
              { x: 3.6344229999999698, y: -2.049996399999941 },
              { x: -3.6344230000000834, y: -2.049996399999941 },
              { x: -3.6344230000000834, y: 2.0499964000000546 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C224015.obj?uuid=892cc756ed79448ab4afad0e5bfcdfa6",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C224015.step?uuid=892cc756ed79448ab4afad0e5bfcdfa6",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.1 },
      }}
      {...props}
    />
  )
}
