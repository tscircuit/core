import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["VOUT"],
} as const

export const AP2112K_3_3TRG1 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C51118"],
      }}
      manufacturerPartNumber="AP2112K_3_3TRG1"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin4"]}
            pcbX="0.949706mm"
            pcbY="1.299972mm"
            width="0.6223mm"
            height="1.1049mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.949706mm"
            pcbY="1.299972mm"
            width="0.6223mm"
            height="1.1049mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.949706mm"
            pcbY="-1.299972mm"
            width="0.6223mm"
            height="1.1049mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.000508mm"
            pcbY="-1.299972mm"
            width="0.6223mm"
            height="1.1049mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.949706mm"
            pcbY="-1.299972mm"
            width="0.6223mm"
            height="1.1049mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.41193520000013, y: -0.5003799999999501 },
              { x: -1.3871447999999873, y: -0.5003799999999501 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3871447999999873, y: -0.5003799999999501 },
              { x: -1.3871447999999873, y: 0.5003799999999501 },
              { x: 1.41193520000013, y: 0.5003799999999501 },
              { x: 1.41193520000013, y: -0.5003799999999501 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.779549399999837, y: -1.5214599999999336 },
              { x: -1.9027377800492786, y: -1.6465485285044679 },
              { x: -1.7782793999998603, y: -1.7703735202394455 },
              { x: -1.6538210199506693, y: -1.6465485285045816 },
              { x: -1.7770093999999972, y: -1.5214599999999336 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.228854mm"
            pcbY="2.8542mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.1552539999999, y: 2.1042000000001053 },
              { x: 1.6975460000001021, y: 2.1042000000001053 },
              { x: 1.6975460000001021, y: -2.104199999999878 },
              { x: -2.1552539999999, y: -2.104199999999878 },
              { x: -2.1552539999999, y: 2.1042000000001053 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C51118.obj?uuid=6d166d1d6c064b99aa79465714e989c1",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C51118.step?uuid=6d166d1d6c064b99aa79465714e989c1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: -0.15 },
      }}
      {...props}
    />
  )
}
