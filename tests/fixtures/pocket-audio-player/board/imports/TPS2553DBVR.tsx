import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["pin4"],
  pin5: ["ILIM"],
  pin6: ["OUT"],
} as const

export const TPS2553DBVR = (props: ChipProps<typeof pinLabels>) => {
  const { name = "SW1", ...restProps } = props

  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      name={name}
      pinLabels={pinLabels}
      pinAttributes={{
        pin1: { requiresPower: true },
        pin2: { requiresGround: true },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C55266"],
      }}
      manufacturerPartNumber="TPS2553DBVR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3"]}
            pcbX="1.35001mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.35001mm"
            pcbY="-0mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.35001mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-1.35001mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.35001mm"
            pcbY="-0mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.35001mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.899998200000141, y: 1.5499080000000731 },
              { x: 0.9000236000000541, y: 1.5499080000000731 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.899998200000141, y: -1.5501111999999466 },
              { x: 0.9000236000000541, y: -1.5501111999999466 },
            ]}
          />
          <silkscreencircle pcbX="1.397mm" pcbY="-1.651mm" radius="0.127mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0.012446mm"
            pcbY="2.562354mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.1425540000000183, y: 1.8123540000000276 },
              { x: 2.167445999999927, y: 1.8123540000000276 },
              { x: 2.167445999999927, y: -2.015045999999984 },
              { x: -2.1425540000000183, y: -2.015045999999984 },
              { x: -2.1425540000000183, y: 1.8123540000000276 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C55266.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C55266.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.000025399999913133797,
          y: -0.0000889000000370288,
          z: -0.048939,
        },
      }}
      {...restProps}
    />
  )
}
