import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const LQP03TN2N8B02D = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="right"
            schX={0.4}
            schY={0}
            schStemLength={0.06}
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["1"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.06}
          />
          <schematicpath
            svgPath="M -0.33766 0.00136 A 0.08 0.078 0 1 0 -0.17836 0.00128"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.168 0.00142 A 0.08 0.078 0 1 0 -0.0087 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.00134 0.00142 A 0.08 0.078 0 1 0 0.16064 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.174 0.00138 A 0.08 0.078 0 1 0 0.3333 0.00128"
            strokeColor="#880000"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C206433"],
      }}
      manufacturerPartNumber="LQP03TN2N8B02D"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.27432mm"
            pcbY="0mm"
            width="0.368427mm"
            height="0.3240024mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.27432mm"
            pcbY="0mm"
            width="0.368427mm"
            height="0.3240024mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.16619220000006862, y: -0.3906011999999919 },
              { x: 0.5346445999999787, y: -0.3906011999999919 },
              { x: 0.6870446000000356, y: -0.23820120000004863 },
              { x: 0.6870446000000356, y: 0.23820120000004863 },
              { x: 0.5346445999999787, y: 0.3906011999999919 },
              { x: 0.16619220000006862, y: 0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.16619220000006862, y: -0.3906011999999919 },
              { x: -0.5346446000000924, y: -0.3906011999999919 },
              { x: -0.6870446000001493, y: -0.23820120000004863 },
              { x: -0.6870446000001493, y: 0.23820120000004863 },
              { x: -0.5346446000000924, y: 0.3906011999999919 },
              { x: -0.16619220000006862, y: 0.3906011999999919 },
            ]}
          />
          <courtyardoutline
            outline={[
              { x: -0.935799999999972, y: 0.6309999999999718 },
              { x: 0.9358000000000857, y: 0.6309999999999718 },
              { x: 0.9358000000000857, y: -0.6563999999999623 },
              { x: -0.935799999999972, y: -0.6563999999999623 },
              { x: -0.935799999999972, y: 0.6309999999999718 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C206433.obj?uuid=fa57e36e003e4ee2b14b14feaebd32e1",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C206433.step?uuid=fa57e36e003e4ee2b14b14feaebd32e1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999956566899, z: -0.01 },
      }}
      {...props}
    />
  )
}
