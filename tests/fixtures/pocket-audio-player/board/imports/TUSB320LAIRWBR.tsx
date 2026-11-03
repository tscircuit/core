import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CC1"],
  pin2: ["CC2"],
  pin3: ["PORT"],
  pin4: ["VBUS_DET"],
  pin5: ["ADDR"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"],
  pin9: ["ID"],
  pin10: ["GND"],
  pin11: ["EN_N"],
  pin12: ["VDD"],
} as const

const pinAttributes = {
  pin10: { requiresGround: true },
  pin12: { requiresPower: true },
} as const

export const TUSB320LAIRWBR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      schMarginX="3mm"
      schMarginY="1mm"
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C132554"],
      }}
      manufacturerPartNumber="TUSB320LAIRWBR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin12"]}
            pcbX="-0.5999861mm"
            pcbY="0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-0.1998853mm"
            pcbY="0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="0.1998599mm"
            pcbY="0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0.5999607mm"
            pcbY="0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.7500493mm"
            pcbY="0.1998726mm"
            width="0.5050028mm"
            height="0.1999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.7500493mm"
            pcbY="-0.1998726mm"
            width="0.5050028mm"
            height="0.1999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.5999607mm"
            pcbY="-0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.1998599mm"
            pcbY="-0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.1998853mm"
            pcbY="-0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.5999861mm"
            pcbY="-0.7500366mm"
            width="0.1999996mm"
            height="0.5050028mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.7500493mm"
            pcbY="-0.1998726mm"
            width="0.5050028mm"
            height="0.1999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.7500493mm"
            pcbY="0.1998726mm"
            width="0.5050028mm"
            height="0.1999996mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.8598788999999982, y: -0.8699753999999871 },
              { x: 0.8098662999999959, y: -0.8699753999999871 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8598788999999982, y: -0.8698991999999919 },
              { x: 0.8598788999999982, y: -0.5099558000000002 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8598281000000014, y: 0.8700262000000123 },
              { x: -0.8598281000000014, y: 0.5099558000000002 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8598281000000014, y: 0.8700262000000123 },
              { x: -0.8098662999999959, y: 0.8700262000000123 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.859980500000006, y: -0.8698991999999919 },
              { x: -0.859980500000006, y: -0.5099558000000002 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.859980500000006, y: -0.8698991999999919 },
              { x: -0.8100440999999989, y: -0.8698991999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8598788999999982, y: 0.8700262000000123 },
              { x: 0.8099424999999911, y: 0.8700262000000123 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8598788999999982, y: 0.8700262000000123 },
              { x: 0.8598788999999982, y: 0.5099558000000002 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.2799187mm"
            pcbY="0.2000504mm"
            radius="0.07493mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1781175mm"
            pcbY="1.9945624mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.609217500000014, y: 1.2445624000000208 },
              { x: 1.2529825000000017, y: 1.2445624000000208 },
              { x: 1.2529825000000017, y: -1.262037599999985 },
              { x: -1.609217500000014, y: -1.262037599999985 },
              { x: -1.609217500000014, y: 1.2445624000000208 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C132554.obj?uuid=1b341723808e45ea90bc8e964704cc30",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C132554.step?uuid=1b341723808e45ea90bc8e964704cc30",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999999199463, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
