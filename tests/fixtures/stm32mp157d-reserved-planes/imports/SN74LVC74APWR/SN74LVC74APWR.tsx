import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_1CLR"],
  pin2: ["1D"],
  pin3: ["1CLK"],
  pin4: ["N_1PRE"],
  pin5: ["1Q"],
  pin6: ["N_1Q"],
  pin7: ["GND"],
  pin8: ["N_2Q"],
  pin9: ["2Q"],
  pin10: ["N_2PRE"],
  pin11: ["2CLK"],
  pin12: ["2D"],
  pin13: ["N_2CLR"],
  pin14: ["VCC"],
} as const

const pinAttributes = {
  pin7: { requiresGround: true },
  pin14: { requiresPower: true },
} as const

export const SN74LVC74APWR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C350561"],
      }}
      manufacturerPartNumber="SN74LVC74APWR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.949958mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.299972mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.649986mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.649986mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.299972mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.949958mm"
            pcbY="-2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.949958mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.299972mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="0.649986mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-0.649986mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-1.299972mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-1.949958mm"
            pcbY="2.925064mm"
            width="0.3048mm"
            height="0.9906mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 2.4999949999999984, y: 2.199995599999994 },
              { x: -2.499994999999984, y: 2.199995599999994 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.4999949999999984, y: 2.199995599999994 },
              { x: 2.4999949999999984, y: -2.1999956000000083 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.499994999999984, y: -2.1999956000000083 },
              { x: -2.499994999999984, y: 2.199995599999994 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.499994999999984, y: -2.1999956000000083 },
              { x: 2.4999949999999984, y: -2.1999956000000083 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.6256mm"
            pcbY="-1.2192mm"
            radius="0.150114mm"
          />
          <silkscreencircle
            pcbX="-2.53619mm"
            pcbY="-2.916936mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1016mm"
            pcbY="4.429mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.749994999999984, y: 3.6703640000000064 },
              { x: 2.7499949999999984, y: 3.6703640000000064 },
              { x: 2.7499949999999984, y: -3.6703640000000206 },
              { x: -2.749994999999984, y: -3.6703640000000206 },
              { x: -2.749994999999984, y: 3.6703640000000064 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C350561.obj?uuid=5377177da492449fa1a3111d646cac17",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C350561.step?uuid=5377177da492449fa1a3111d646cac17",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0.000012700000013410317, y: 0, z: -0.069083 },
      }}
      {...props}
    />
  )
}
