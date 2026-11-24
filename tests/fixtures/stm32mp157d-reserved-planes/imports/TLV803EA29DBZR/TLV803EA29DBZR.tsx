import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["N_RESET"],
  pin3: ["VDD"],
} as const

const pinAttributes = {
  pin1: { requiresGround: true },
  pin3: { requiresPower: true },
} as const

export const TLV803EA29DBZR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C1852114"],
      }}
      manufacturerPartNumber="TLV803EA29DBZR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="0.999998mm"
            pcbY="-0.94996mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.999998mm"
            pcbY="0.94996mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.999998mm"
            pcbY="0mm"
            width="0.999998mm"
            height="0.6500114mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: 1.5262098000000606 },
              { x: -0.726211400000011, y: 1.5262098000000606 },
              { x: -0.726211400000011, y: 0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: -1.5262097999999469 },
              { x: -0.726211400000011, y: -1.5262097999999469 },
              { x: -0.726211400000011, y: -0.49458879999997407 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.726211400000011, y: 0.45539659999997184 },
              { x: 0.726211400000011, y: -0.45539659999985815 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0254mm"
            pcbY="2.524mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.7499969999998939, y: 1.6999844000000621 },
              { x: 1.7499969999998939, y: 1.6999844000000621 },
              { x: 1.7499969999998939, y: -1.7000097999999753 },
              { x: -1.7499969999998939, y: -1.7000097999999753 },
              { x: -1.7499969999998939, y: 1.6999844000000621 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1852114.obj?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C1852114.step?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.000012700000070253736,
          y: -0.000012699999956566899,
          z: 0.050795,
        },
      }}
      {...props}
    />
  )
}
