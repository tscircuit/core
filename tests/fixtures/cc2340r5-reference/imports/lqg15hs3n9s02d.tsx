import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const LQG15HS3N9S02D = (props: ChipProps<typeof pinLabels>) => {
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
            svgPath="M -0.3376 0.0014 A 0.08 0.078 0 1 0 -0.1784 0.0012"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.168 0.0014 A 0.08 0.078 0 1 0 -0.0088 0.0014"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.0014 0.0014 A 0.08 0.078 0 1 0 0.1606 0.0014"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.174 0.0014 A 0.08 0.078 0 1 0 0.3334 0.0012"
            strokeColor="#880000"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C77109"],
      }}
      manufacturerPartNumber="LQG15HS3N9S02D"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.419989mm"
            pcbY="0mm"
            width="0.540004mm"
            height="0.540004mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.419989mm"
            pcbY="0mm"
            width="0.540004mm"
            height="0.540004mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.12687300000004598, y: -0.5080000000000382 },
              { x: -0.9169654000000946, y: -0.5080000000000382 },
              { x: -1.0693908000000647, y: -0.3556253999998944 },
              { x: -1.0693908000000647, y: 0.3367785999998887 },
              { x: -0.9169654000000946, y: 0.4891532000000325 },
              { x: -0.12687300000004598, y: 0.4891532000000325 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.12712699999997312, y: -0.5080000000000382 },
              { x: 0.9170669999998609, y: -0.5080000000000382 },
              { x: 1.0694670000000315, y: -0.3555999999998676 },
              { x: 1.0694670000000315, y: 0.32766000000003714 },
              { x: 0.9069069999999329, y: 0.4902200000000221 },
              { x: 0.12712699999997312, y: 0.4902200000000221 },
            ]}
          />
          <courtyardoutline
            outline={[
              { x: -1.3168000000000575, y: 0.7326000000000477 },
              { x: 1.3168000000000575, y: 0.7326000000000477 },
              { x: 1.3168000000000575, y: -0.7580000000000382 },
              { x: -1.3168000000000575, y: -0.7580000000000382 },
              { x: -1.3168000000000575, y: 0.7326000000000477 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C77109.obj?uuid=c498e8771bc24312a11c6413631665a8",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C77109.step?uuid=c498e8771bc24312a11c6413631665a8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.25 },
      }}
      {...props}
    />
  )
}
