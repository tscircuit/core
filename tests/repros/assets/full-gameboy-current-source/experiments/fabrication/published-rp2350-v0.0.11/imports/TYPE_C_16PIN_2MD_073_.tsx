import type { ConnectorProps } from "@tscircuit/props"

const pinLabels = {
  pin13: ["EH1"],
  pin14: ["EH2"],
  pin15: ["pin13_alt1"],
  pin16: ["pin14_alt1"],
  pin17: ["A1B12"],
  pin18: ["A4B9"],
  pin19: ["B8"],
  pin20: ["A5"],
  pin21: ["B7"],
  pin22: ["A6"],
  pin23: ["A7"],
  pin24: ["B6"],
  pin25: ["A8"],
  pin26: ["B5"],
  pin27: ["B4A9"],
  pin28: ["B1A12"],
} as const

export const TYPE_C_16PIN_2MD_073_ = (props: ConnectorProps) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2765186"],
      }}
      manufacturerPartNumber="TYPE_C_16PIN_2MD_073_"
      footprint={
        <footprint>
          {/* Plastic locating pegs: non-plated 0.65 mm holes per the connector drawing.
    The copper keepouts reserve 0.2 mm hole-edge clearance on every layer. */}
          <hole
            pcbX="-2.889885mm"
            shape="circle"
            pcbY="1.05492555mm"
            diameter="0.65mm"
          />
          <hole
            pcbX="2.890139mm"
            shape="circle"
            pcbY="1.05492555mm"
            diameter="0.65mm"
          />
          <keepout
            shape="circle"
            pcbX="-2.889885mm"
            pcbY="1.05492555mm"
            radius="0.525mm"
            layers={["top", "inner1", "inner2", "bottom"]}
            excludeRefs={props.name ? [`.${props.name}`] : []}
          />
          <keepout
            shape="circle"
            pcbX="2.890139mm"
            pcbY="1.05492555mm"
            radius="0.525mm"
            layers={["top", "inner1", "inner2", "bottom"]}
            excludeRefs={props.name ? [`.${props.name}`] : []}
          />
          <platedhole
            portHints={["pin13"]}
            pcbX="-4.324985mm"
            pcbY="1.57511755mm"
            holeWidth="0.5999988mm"
            holeHeight="1.499997mm"
            outerWidth="1.0999978mm"
            outerHeight="1.999996mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin14"]}
            pcbX="4.324985mm"
            pcbY="1.57511755mm"
            holeWidth="0.5999988mm"
            holeHeight="1.499997mm"
            outerWidth="1.0999978mm"
            outerHeight="1.999996mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin15"]}
            pcbX="-4.324985mm"
            pcbY="-2.62502645mm"
            holeWidth="0.5999988mm"
            holeHeight="1.1999976mm"
            outerWidth="1.1999976mm"
            outerHeight="1.7999964mm"
            shape="pill"
          />
          <platedhole
            portHints={["pin16"]}
            pcbX="4.324985mm"
            pcbY="-2.62502645mm"
            holeWidth="0.5999988mm"
            holeHeight="1.1999976mm"
            outerWidth="1.1999976mm"
            outerHeight="1.7999964mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-3.200019mm"
            pcbY="2.12502755mm"
            width="0.5500116mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-2.399919mm"
            pcbY="2.12502755mm"
            width="0.5500116mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-1.749933mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-1.249807mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-0.749935mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-0.250063mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="0.250063mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="0.749935mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="1.250061mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="1.750187mm"
            pcbY="2.12502755mm"
            width="0.2999994mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="2.400173mm"
            pcbY="2.12502755mm"
            width="0.5500116mm"
            height="1.0999978mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="3.200019mm"
            pcbY="2.12502755mm"
            width="0.5500116mm"
            height="1.0999978mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 4.5720761999999695, y: -1.646948650000013 },
              { x: 4.5720761999999695, y: 0.34700214999986656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.5720761999999695, y: -5.0759740500000134 },
              { x: 4.5720761999999695, y: -3.6030026500000076 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.499914800000056, y: -1.6438244500001247 },
              { x: -4.499914800000056, y: 0.34390335000000505 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.499914800000056, y: -5.224970450000114 },
              { x: -4.499914800000056, y: -3.6061268500000097 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.5000671999999895, y: -5.224970450000114 },
              { x: -4.499914800000056, y: -5.224970450000114 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.006731mm"
            pcbY="3.68382755mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -5.184331000000043, y: 2.9338275499999327 },
              { x: 5.170869000000039, y: 2.9338275499999327 },
              { x: 5.170869000000039, y: -5.490972450000072 },
              { x: -5.184331000000043, y: -5.490972450000072 },
              { x: -5.184331000000043, y: 2.9338275499999327 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
