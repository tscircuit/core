import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["OUT"],
} as const

const pinAttributes = {
  pin2: { requiresGround: true },
  pin4: { doNotConnect: true },
} as const

export const TLV75533PDBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C404027"],
      }}
      manufacturerPartNumber="TLV75533PDBVR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.300099mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.300099mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="1.300099mm"
            pcbY="0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.300099mm"
            pcbY="-0mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.300099mm"
            pcbY="-0.94996mm"
            width="1.0999978mm"
            height="0.5999988mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.8999728000000005, y: -1.404111999999941 },
              { x: 0.8999728000000005, y: -1.5500604000000067 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8999728000000005, y: -0.45412660000010874 },
              { x: 0.8999728000000005, y: -0.4958079999998972 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8999728000000005, y: 0.4958079999998972 },
              { x: 0.8999728000000005, y: 0.45415200000002187 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8999728000000005, y: 1.5499587999998994 },
              { x: 0.8999728000000005, y: 1.404111999999941 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9000489999999672, y: -1.404111999999941 },
              { x: -0.9000489999999672, y: -1.5500604000000067 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9000489999999672, y: 0.4958079999998972 },
              { x: -0.9000489999999672, y: -0.4958334000000377 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9000489999999672, y: 1.5499587999998994 },
              { x: -0.9000489999999672, y: 1.4040866000000278 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9000489999999672, y: 1.5499587999998994 },
              { x: 0.8999728000000005, y: 1.5499587999998994 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9000489999999672, y: -1.5500604000000067 },
              { x: 0.8999728000000005, y: -1.5500604000000067 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.012319mm"
            pcbY="2.562354mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.091880999999944, y: 1.8123540000000276 },
              { x: 2.1165190000000393, y: 1.8123540000000276 },
              { x: 2.1165190000000393, y: -1.786446000000069 },
              { x: -2.091880999999944, y: -1.786446000000069 },
              { x: -2.091880999999944, y: 1.8123540000000276 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C404027.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C404027.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0,
          y: -0.000012700000070253736,
          z: -0.049083,
        },
      }}
      {...props}
    />
  )
}
