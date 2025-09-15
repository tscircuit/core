import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CS_N"],
  pin2: ["DO"],
  pin3: ["WP_N"],
  pin4: ["GND"],
  pin5: ["DI"],
  pin6: ["CLK"],
  pin7: ["HOLD_N"],
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
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["CS_N", "DO", "WP_N", "GND"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["VCC", "HOLD_N", "CLK", "DI"],
        },
      }}
      manufacturerPartNumber="W25Q16JVUXIQ"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.7500619999999572mm"
            pcbY="-1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.2499359999999342mm"
            pcbY="-1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.24993599999982052mm"
            pcbY="-1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.7500619999999572mm"
            pcbY="-1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-0.7500619999999572mm"
            pcbY="1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.2499359999999342mm"
            pcbY="1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.24993599999982052mm"
            pcbY="1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.7500619999999572mm"
            pcbY="1.5074899999999616mm"
            width="0.2800096mm"
            height="0.5999987999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.6999966mm"
            height="0.29999939999999997mm"
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
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=2b35e1c3dcc44b77887d4f445b51370a&pn=C2843335",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
