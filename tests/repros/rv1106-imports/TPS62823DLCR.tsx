import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EN"],
  pin2: ["FB"],
  pin3: ["AGND"],
  pin4: ["NC"],
  pin5: ["PGND"],
  pin6: ["SW"],
  pin7: ["VIN"],
  pin8: ["PG"],
} as const

const pinAttributes = {
  pin3: { requiresGround: true },
  pin4: { doNotConnect: true },
  pin5: { requiresGround: true },
  pin7: { requiresPower: true },
} as const

export const TPS62823DLCR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2693497"],
      }}
      manufacturerPartNumber="TPS62823DLCR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.750062mm"
            pcbY="-0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.249936mm"
            pcbY="-0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.249936mm"
            pcbY="-0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.750062mm"
            pcbY="-0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.750062mm"
            pcbY="0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.249936mm"
            pcbY="0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.249936mm"
            pcbY="0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-0.750062mm"
            pcbY="0.675132mm"
            width="0.2500122mm"
            height="0.5500116mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.1000232000001233, y: 0.750036600000044 },
              { x: -1.0999977999999828, y: -0.7500365999999303 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.1000232000000096, y: 0.750036600000044 },
              { x: 1.0999977999998691, y: -0.7500365999999303 },
            ]}
          />
          <silkscreencircle
            pcbX="-0.739902mm"
            pcbY="-1.299972mm"
            radius="0.102108mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="1.9398mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.3422000000001617, y: 1.189799999999991 },
              { x: 1.3675999999998112, y: 1.189799999999991 },
              { x: 1.3675999999998112, y: -1.6724000000000387 },
              { x: -1.3422000000001617, y: -1.6724000000000387 },
              { x: -1.3422000000001617, y: 1.189799999999991 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2693497.obj?uuid=2a9c0ec790e848cea22868c54671a1cb",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2693497.step?uuid=2a9c0ec790e848cea22868c54671a1cb",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
