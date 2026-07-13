import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CS"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["GND"],
  pin5: ["pin5"],
  pin6: ["CLK"],
  pin7: ["pin7"],
  pin8: ["VCC"],
  pin9: ["EP"],
} as const

export const W25Q16JVUXIQ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2843335"],
      }}
      manufacturerPartNumber="W25Q16JVUXIQ"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.750062mm"
            pcbY="-1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.249936mm"
            pcbY="-1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.249936mm"
            pcbY="-1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.750062mm"
            pcbY="-1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-0.750062mm"
            pcbY="1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.249936mm"
            pcbY="1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.249936mm"
            pcbY="1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.750062mm"
            pcbY="1.50749mm"
            width="0.2800096mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.6999966mm"
            height="0.2999994mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.0763249999998834, y: -1.5760446000000456 },
              { x: 1.0763249999998834, y: 1.5763240000001133 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0761472000000367, y: 1.5763240000001133 },
              { x: -1.0761472000000367, y: -1.5760446000000456 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.003556mm"
            pcbY="2.813306mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.3259439999999358, y: 2.0633060000000114 },
              { x: 1.333056000000056, y: 2.0633060000000114 },
              { x: 1.333056000000056, y: -2.3736939999998867 },
              { x: -1.3259439999999358, y: -2.3736939999998867 },
              { x: -1.3259439999999358, y: 2.0633060000000114 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2843335.obj?uuid=2b35e1c3dcc44b77887d4f445b51370a",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2843335.step?uuid=2b35e1c3dcc44b77887d4f445b51370a",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
