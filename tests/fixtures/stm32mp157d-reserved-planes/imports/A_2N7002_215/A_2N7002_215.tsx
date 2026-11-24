import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["G"],
  pin2: ["S"],
  pin3: ["D"],
} as const

export const A_2N7002_215 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0.12, y: -0.04 },
              { x: 0.12, y: 0.04 },
              { x: 0, y: 0 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#FEFEFE"
          />
          <schematicpath
            points={[
              { x: 0.4, y: 0.04 },
              { x: 0.34, y: -0.06 },
              { x: 0.46, y: -0.06 },
              { x: 0.4, y: 0.04 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#FEFEFE"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.14 },
              { x: 0.2, y: 0.14 },
              { x: 0.2, y: 0.2 },
              { x: 0.4, y: 0.2 },
              { x: 0.4, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0 },
              { x: 0.2, y: 0 },
              { x: 0.2, y: -0.2 },
              { x: 0.4, y: -0.2 },
              { x: 0.4, y: -0.06 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.2, y: -0.14 },
              { x: 0, y: -0.14 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.04, y: 0.18 },
              { x: -0.04, y: -0.18 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: 0.18 },
              { x: 0, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.04 },
              { x: 0, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.18 },
              { x: 0, y: -0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0 },
              { x: -0.04, y: 0 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.48, y: 0.04 },
              { x: 0.44, y: 0.04 },
              { x: 0.36, y: 0.04 },
              { x: 0.32, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["D"]}
            direction="up"
            schX={0.2}
            schY={0.4}
            schStemLength={0.2}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["G"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["S"]}
            direction="down"
            schX={0.2}
            schY={-0.4}
            schStemLength={0.2}
          />
          <schematictext
            schX={0.02}
            schY={0.64}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C65189"],
      }}
      manufacturerPartNumber="2N7002,215"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.149985mm"
            pcbY="0.94996mm"
            width="0.999998mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.149985mm"
            pcbY="0mm"
            width="0.999998mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.149985mm"
            pcbY="-0.94996mm"
            width="0.999998mm"
            height="0.5999988mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 0.6359398000000027 },
              { x: -0.6999731999999881, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 1.4999461999999966 },
              { x: 0.30005020000000115, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.7000239999999991, y: -0.31402020000000164 },
              { x: 0.7000239999999991, y: 0.31391859999999383 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: -0.6999731999999881, y: -0.6360414000000105 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: 0.30005020000000115, y: -1.5000478000000044 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.133223mm"
            pcbY="2.49606mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.8999840000000034, y: 1.6999589999999927 },
              { x: 1.8999840000000034, y: 1.6999589999999927 },
              { x: 1.8999840000000034, y: -1.700035200000002 },
              { x: -1.8999840000000034, y: -1.700035200000002 },
              { x: -1.8999840000000034, y: 1.6999589999999927 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C65189.obj?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C65189.step?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.00003809999999759839,
          y: -0.00003810000001180924,
          z: 0.050795,
        },
      }}
      {...props}
    />
  )
}
