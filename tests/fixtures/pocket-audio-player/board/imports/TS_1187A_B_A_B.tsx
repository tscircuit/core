import type { PushButtonProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A"],
  pin2: ["B"],
  pin3: ["C"],
  pin4: ["D"],
} as const

export const TS_1187A_B_A_B = (props: PushButtonProps<typeof pinLabels>) => {
  const { name = "SW1", ...restProps } = props

  return (
    <pushbutton
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C318884"],
      }}
      manufacturerPartNumber="TS-1187A-B-A-B"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.999994mm"
            pcbY="1.849882mm"
            width="0.999998mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="2.999994mm"
            pcbY="1.849882mm"
            width="0.999998mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-2.999994mm"
            pcbY="-1.849882mm"
            width="0.999998mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="2.999994mm"
            pcbY="-1.849882mm"
            width="0.999998mm"
            height="0.7500112mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.0007600000001275, y: 1.800860000000057 },
              { x: 0.899159999999938, y: 1.800860000000057 },
              { x: 1.8008599999999433, y: 0.899159999999938 },
              { x: 1.8008599999999433, y: -0.899159999999938 },
              { x: 0.8000999999999294, y: -1.8999199999999519 },
              { x: -0.8991600000000517, y: -1.8999199999999519 },
              { x: -1.800860000000057, y: -0.9982199999999466 },
              { x: -1.800860000000057, y: 1.0007600000000139 },
              { x: -1.0007600000001275, y: 1.800860000000057 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.2750800000000027, y: 2.550160000000119 },
              { x: 2.1701506000000563, y: 1.6550893999999516 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5501599999998916, y: 1.1684000000000196 },
              { x: 2.5501599999998916, y: -1.1684000000000196 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.1701506000000563, y: -1.6550893999999516 },
              { x: 1.2750800000000027, y: -2.5501600000000053 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5501600000000053, y: 1.1684000000000196 },
              { x: -2.5501600000000053, y: -1.1684000000000196 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.17015060000017, y: -1.6550893999999516 },
              { x: -1.2750800000000027, y: -2.5501600000000053 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.2750800000000027, y: 2.550160000000119 },
              { x: -2.17015060000017, y: 1.6550893999999516 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.2750800000000027, y: -2.5501600000000053 },
              { x: 1.2750800000000027, y: -2.5501600000000053 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.2750800000000027, y: 2.550160000000119 },
              { x: 1.2750800000000027, y: 2.550160000000119 },
            ]}
          />
          <silkscreencircle pcbX="0mm" pcbY="0mm" radius="1.27508mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="3.5908mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.755200000000059, y: 2.8407999999999447 },
              { x: 3.7551999999998316, y: 2.8407999999999447 },
              { x: 3.7551999999998316, y: -2.8661999999999352 },
              { x: -3.755200000000059, y: -2.8661999999999352 },
              { x: -3.755200000000059, y: 2.8407999999999447 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C318884.obj?uuid=91b67c1735f643ffb2e7226c23dd3492",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C318884.step?uuid=91b67c1735f643ffb2e7226c23dd3492",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.000012700000070253736,
          y: 0.0004999999999999449,
          z: -0.05,
        },
      }}
      {...restProps}
    />
  )
}
