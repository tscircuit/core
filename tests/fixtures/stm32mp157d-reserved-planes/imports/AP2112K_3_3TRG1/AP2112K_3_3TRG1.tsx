import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["VOUT"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin2: { requiresGround: true },
  pin4: { doNotConnect: true },
} as const

export const AP2112K_3_3TRG1 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C51118"],
      }}
      manufacturerPartNumber="AP2112K-3.3TRG1"
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
              { x: -1.9027377800492786, y: -1.3963714714953994 },
              { x: -1.7782793999998603, y: -1.2725464797605355 },
              { x: -1.6538210199506693, y: -1.3963714714953994 },
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
              { x: -1.6999843999999484, y: 2.102422000000047 },
              { x: 1.700009800000089, y: 2.102422000000047 },
              { x: 1.700009800000089, y: -2.102422000000047 },
              { x: -1.6999843999999484, y: -2.102422000000047 },
              { x: -1.6999843999999484, y: 2.102422000000047 },
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
