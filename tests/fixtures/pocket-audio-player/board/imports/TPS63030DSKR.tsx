import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VOUT"],
  pin2: ["L2"],
  pin3: ["PGND"],
  pin4: ["L1"],
  pin5: ["VIN"],
  pin6: ["EN"],
  pin7: ["pin7"],
  pin8: ["VINA"],
  pin9: ["GND"],
  pin10: ["FB"],
  pin11: ["EP"],
} as const

const pinAttributes = {
  pin3: { requiresGround: true },
  pin5: { requiresPower: true },
  pin9: { requiresGround: true },
} as const

export const TPS63030DSKR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C12462"],
      }}
      manufacturerPartNumber="TPS63030DSKR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.157478mm"
            pcbY="0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.157478mm"
            pcbY="0.499872mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.157478mm"
            pcbY="0mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.157478mm"
            pcbY="-0.500126mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.157478mm"
            pcbY="-0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.157478mm"
            pcbY="0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.157478mm"
            pcbY="0.499872mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.157478mm"
            pcbY="0mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.157478mm"
            pcbY="-0.500126mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.157478mm"
            pcbY="-0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.1999976mm"
            height="1.999996mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.326210200000105, y: 1.326210200000105 },
              { x: 1.3262101999999913, y: 1.326210200000105 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3262101999999913, y: -1.326210200000105 },
              { x: -1.326210200000105, y: -1.326210200000105 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.789938mm"
            pcbY="0.999998mm"
            radius="0.100076mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1905mm"
            pcbY="2.3208mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.129600000000096, y: 1.570799999999963 },
              { x: 1.7486000000000104, y: 1.570799999999963 },
              { x: 1.7486000000000104, y: -1.5708000000000766 },
              { x: -2.129600000000096, y: -1.5708000000000766 },
              { x: -2.129600000000096, y: 1.570799999999963 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C12462.obj?uuid=12c631ea46604e478703d8e42e76d1d7",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C12462.step?uuid=12c631ea46604e478703d8e42e76d1d7",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999842880061, z: 0 },
      }}
      {...props}
    />
  )
}
