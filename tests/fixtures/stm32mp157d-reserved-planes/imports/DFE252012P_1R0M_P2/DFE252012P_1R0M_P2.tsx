import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

export const DFE252012P_1R0M_P2 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicpath
            svgPath="M 0.174 0.00138 A 0.08 0.078 0 1 0 0.3333 0.00128"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M 0.00134 0.00142 A 0.08 0.078 0 1 0 0.16064 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.168 0.00142 A 0.08 0.078 0 1 0 -0.0087 0.00132"
            strokeColor="#880000"
          />
          <schematicpath
            svgPath="M -0.33766 0.00136 A 0.08 0.078 0 1 0 -0.17836 0.00128"
            strokeColor="#880000"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["1"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.06}
          />
          <port
            name="pin2"
            pinNumber={2}
            aliases={["2"]}
            direction="right"
            schX={0.4}
            schY={0}
            schStemLength={0.06}
          />
          <schematictext
            schX={-0.001}
            schY={0.286}
            text="{NAME}"
            fontSize={0.2}
            anchor="bottom_center"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C882955"],
      }}
      manufacturerPartNumber="DFE252012P-1R0M=P2"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.167511mm"
            pcbY="0mm"
            width="1.634998mm"
            height="2.1599906mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.167511mm"
            pcbY="0mm"
            width="1.634998mm"
            height="2.1599906mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.6349999999999909, y: 1.2953999999999724 },
              { x: 0.6349999999999909, y: 1.2953999999999724 },
              { x: 2.032000000000039, y: 1.2953999999999724 },
              { x: 2.2732999999998356, y: 1.0541000000000622 },
              { x: 2.2732999999998356, y: -1.0032999999998538 },
              { x: 2.0066000000000486, y: -1.2699999999999818 },
              { x: 0.6349999999999909, y: -1.2699999999999818 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.635127000000125, y: -1.2699999999999818 },
              { x: -0.635127000000125, y: -1.2699999999999818 },
              { x: -2.0321270000000595, y: -1.2699999999999818 },
              { x: -2.2734270000000834, y: -1.028699999999958 },
              { x: -2.2734270000000834, y: 1.0287000000000717 },
              { x: -2.006727000000069, y: 1.2953999999999724 },
              { x: -0.635127000000125, y: 1.2953999999999724 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.012573mm"
            pcbY="2.2954mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.2350099999999884, y: 1.3299952999999505 },
              { x: 2.2350099999999884, y: 1.3299952999999505 },
              { x: 2.2350099999999884, y: -1.3299952999999505 },
              { x: -2.2350099999999884, y: -1.3299952999999505 },
              { x: -2.2350099999999884, y: 1.3299952999999505 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C882955.obj?uuid=8f47eb01ab4b4bacaa4f20f2f35bc0ed",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C882955.step?uuid=8f47eb01ab4b4bacaa4f20f2f35bc0ed",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
