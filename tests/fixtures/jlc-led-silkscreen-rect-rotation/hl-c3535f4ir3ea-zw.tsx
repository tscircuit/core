// Exact PCB geometry from a TSCI JLCPCB import; the CAD model was omitted.
// See README.md for supplier numbers, provenance and the import command.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A2"],
  pin3: ["C"],
} as const

export const HL_C3535F4IR3EA_ZW = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C540986"],
      }}
      manufacturerPartNumber="HL-C3535F4IR3EA-ZW"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0mm"
            pcbY="-1.42494mm"
            width="3.4500058mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0mm"
            pcbY="1.42494mm"
            width="3.4500058mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0mm"
            pcbY="0mm"
            width="3.4500058mm"
            height="1.35001mm"
            shape="rect"
          />
          <silkscreencircle pcbX="-2.413mm" pcbY="-2.413mm" radius="0.127mm" />
          <silkscreenrect
            pcbX="0mm"
            pcbY="0mm"
            width="4.064mm"
            height="4.064mm"
            strokeWidth="0.254mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.26924mm"
            pcbY="3.032mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -0.6348983999999973, y: -1.2700508000000355 },
              { x: 0.6351015999999845, y: -1.2700508000000355 },
              { x: 0.6351015999999845, y: -1.5240508000000546 },
              { x: -0.6348983999999973, y: -1.5240508000000546 },
              { x: -0.6348983999999973, y: -1.2700508000000355 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: -0.1268984000000728, y: -0.38105080000002545 },
              { x: 0.1271015999999463, y: -0.38105080000002545 },
              { x: 0.1271015999999463, y: -2.4130508000000646 },
              { x: -0.1268984000000728, y: -2.4130508000000646 },
              { x: -0.1268984000000728, y: -0.38105080000002545 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: -0.6348983999999973, y: 1.5798291999999492 },
              { x: 0.6351015999999845, y: 1.5798291999999492 },
              { x: 0.6351015999999845, y: 1.32582919999993 },
              { x: -0.6348983999999973, y: 1.32582919999993 },
              { x: -0.6348983999999973, y: 1.5798291999999492 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -1.9750029000001632, y: 1.9749394000000393 },
              { x: 1.9750917999999729, y: 1.9749394000000393 },
              { x: 1.9750917999999729, y: -1.9750409999999192 },
              { x: -1.9750029000001632, y: -1.9750409999999192 },
              { x: -1.9750029000001632, y: 1.9749394000000393 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
