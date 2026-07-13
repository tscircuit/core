import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["EH2"],
  pin7: ["EH1"],
} as const

export const RK10J12E002L_SMD_PADS = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C231765"],
      }}
      manufacturerPartNumber="RK10J12E002L_SMD_PADS"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin7"]}
            pcbX="-4.99999mm"
            pcbY="5.3749892mm"
            width="1.5999968mm"
            height="2.1999956mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="4.99999mm"
            pcbY="5.3749892mm"
            width="1.5999968mm"
            height="2.1999956mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="3.999992mm"
            pcbY="-4.6249908mm"
            width="1.5999968mm"
            height="1.5999968mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.999996mm"
            pcbY="-4.6249908mm"
            width="1.5999968mm"
            height="1.5999968mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="1.999996mm"
            pcbY="-4.6249908mm"
            width="1.5999968mm"
            height="1.5999968mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-4.6249908mm"
            width="1.5999968mm"
            height="1.5999968mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-3.999992mm"
            pcbY="-4.6249908mm"
            width="1.5999968mm"
            height="1.5999968mm"
            shape="rect"
          />
          <silkscreenrect
            pcbX="0mm"
            pcbY="2.178196mm"
            width="14.4954mm"
            height="15.8162mm"
          />
          <silkscreencircle pcbX="0mm" pcbY="2.8751212mm" radius="2mm" />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="10.836296mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -7.2556248, y: 10.086296 },
              { x: 7.2397752, y: 10.086296 },
              { x: 7.2397752, y: -5.729904 },
              { x: -7.2556248, y: -5.729904 },
              { x: -7.2556248, y: 10.086296 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
