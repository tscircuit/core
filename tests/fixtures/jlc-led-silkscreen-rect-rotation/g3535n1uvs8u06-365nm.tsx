// Exact PCB geometry from a TSCI JLCPCB import; the CAD model was omitted.
// See README.md for supplier numbers, provenance and the import command.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A2"],
  pin3: ["C"],
} as const

export const G3535N1UVS8U06_365NM = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin2"
            pinNumber={2}
            aliases={["A2"]}
            direction="down"
            schX={0}
            schY={-0.2}
            schStemLength={0.2}
          />
          <schematicpath
            svgPath="M 0.1 -0.12 L -0.1 0 L 0.1 0.14 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.1, y: 0.16 },
              { x: -0.1, y: -0.16 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["A1"]}
            direction="right"
            schX={0.4}
            schY={0}
            schStemLength={0.3}
          />
          <schematicpath
            points={[
              { x: -0.08, y: 0.2 },
              { x: -0.22, y: 0.34 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.16, y: 0.12 },
              { x: -0.3, y: 0.26 },
            ]}
            strokeColor="#880000"
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["C"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.3}
          />
          <schematicpath
            svgPath="M -0.22 0.34 L -0.14 0.3 L -0.18 0.26 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematicpath
            svgPath="M -0.3 0.26 L -0.22 0.22 L -0.26 0.18 Z"
            strokeColor="#880000"
            isFilled
            fillColor="#880000"
          />
          <schematictext
            schX={0}
            schY={0.54}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C2915611"],
      }}
      manufacturerPartNumber="G3535N1UVS8U06 365NM"
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
