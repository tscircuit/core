import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const LQM18DN100M70L = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicpath
            svgPath="M 0.174 0.00138 A 0.08 0.078 0 1 0 0.3333 0.00128"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.00134 0.00142 A 0.08 0.078 0 1 0 0.16064 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.168 0.00142 A 0.08 0.078 0 1 0 -0.0087 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.33766 0.00136 A 0.08 0.078 0 1 0 -0.17836 0.00128"
            strokeColor="#880000"
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
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="right"
            schX={0.4}
            schY={0}
            schStemLength={0.06}
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C713281"],
      }}
      manufacturerPartNumber="LQM18DN100M70L"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.699897mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8640064mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.699897mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8640064mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.2700000000000955, y: -0.6513575999998693 },
              { x: -1.4241018000001304, y: -0.499008399999866 },
              { x: -1.4241018000001304, y: 0.5174234000000979 },
              { x: -1.2700000000000955, y: 0.6499860000001263 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2699999999998681, y: 0.6499860000001263 },
              { x: 1.4241525999999567, y: 0.49898300000006657 },
              { x: 1.4241525999999567, y: -0.5174487999998973 },
              { x: 1.2699999999998681, y: -0.6500114000000394 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.272006600000168, y: 0.6499860000001263 },
              { x: -0.5100066000001107, y: 0.6499860000001263 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2720573999999942, y: -0.6500114000000394 },
              { x: 0.5100573999999369, y: -0.6500114000000394 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.272006600000168, y: -0.6500114000000394 },
              { x: -0.5100066000001107, y: -0.6500114000000394 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2720573999999942, y: 0.6499860000001263 },
              { x: 0.5100573999999369, y: 0.6499860000001263 },
            ]}
          />
          <courtyardoutline
            outline={[
              { x: -1.6628750000002128, y: 0.8875400000000582 },
              { x: 1.6819249999998647, y: 0.8875400000000582 },
              { x: 1.6819249999998647, y: -0.9078599999998005 },
              { x: -1.6628750000002128, y: -0.9078599999998005 },
              { x: -1.6628750000002128, y: 0.8875400000000582 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C713281.obj?uuid=a7f84688c5004aa68dbcbddc99bd5473",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C713281.step?uuid=a7f84688c5004aa68dbcbddc99bd5473",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.0023875999999063424,
          y: 0.015976600000044527,
          z: -0.25,
        },
      }}
      {...props}
    />
  )
}
