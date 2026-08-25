import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["B", "BLUE_K"],
  pin2: ["A", "COMMON_ANODE"],
  pin3: ["G", "GREEN_K"],
  pin4: ["R", "RED_K"],
} as const

export const E6C0606RGBC3UDA = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C375569"],
      }}
      manufacturerPartNumber="E6C0606RGBC3UDA"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.620014mm"
            pcbY="-0.47498mm"
            width="0.6999986mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.620014mm"
            pcbY="0.47498mm"
            width="0.6999986mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.620014mm"
            pcbY="-0.47498mm"
            width="0.6999986mm"
            height="0.7500112mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.620014mm"
            pcbY="0.47498mm"
            width="0.6999986mm"
            height="0.7500112mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.1440159999998514, y: 0.8812530000002425 },
              { x: 1.1440159999998514, y: 1.1428730000000087 },
              { x: -1.2689840000001595, y: 1.1428730000000087 },
              { x: -1.2689840000001595, y: -1.1431269999999358 },
              { x: 1.1440159999998514, y: -1.1431269999999358 },
              { x: 1.1440159999998514, y: -0.8789669999999887 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.1429746000000023, y: 0.8801862000000256 },
              { x: 1.1429746000000023, y: 0.8890254000000368 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0560832mm"
            pcbY="2.1321288mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.5274168000000827, y: 1.382128800000146 },
              { x: 1.6395831999999473, y: 1.382128800000146 },
              { x: 1.6395831999999473, y: -1.4038711999999123 },
              { x: -1.5274168000000827, y: -1.4038711999999123 },
              { x: -1.5274168000000827, y: 1.382128800000146 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
