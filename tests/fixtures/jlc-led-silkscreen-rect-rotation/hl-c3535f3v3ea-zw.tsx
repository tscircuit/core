// Exact PCB geometry from a TSCI JLCPCB import; the CAD model was omitted.
// See README.md for supplier numbers, provenance and the import command.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["_NEG"],
  pin2: ["_POS"],
  pin3: ["pin3"],
} as const

export const HL_C3535F3V3EA_ZW = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C540985"],
      }}
      manufacturerPartNumber="HL-C3535F3V3EA-ZW"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.4248638mm"
            pcbY="-0.0000254mm"
            width="0.7999984mm"
            height="3.7999924mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.4250162mm"
            pcbY="-0.0000254mm"
            width="0.7999984mm"
            height="3.7999924mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            points={[
              { x: "-0.679958mm", y: "1.8999708mm" },
              { x: "-0.679958mm", y: "0.0799846mm" },
              { x: "-0.679958mm", y: "0.0700024mm" },
              { x: "-0.409956mm", y: "0.0700024mm" },
              { x: "-0.409956mm", y: "-0.0700278mm" },
              { x: "-0.679958mm", y: "-0.0700278mm" },
              { x: "-0.679958mm", y: "-1.9000216mm" },
              { x: "0.680085mm", y: "-1.9000216mm" },
              { x: "0.680085mm", y: "-0.0700278mm" },
              { x: "0.4100576mm", y: "-0.0700278mm" },
              { x: "0.4100576mm", y: "0.0700024mm" },
              { x: "0.680085mm", y: "0.0700024mm" },
              { x: "0.680085mm", y: "1.8999708mm" },
              { x: "-0.679958mm", y: "1.8999708mm" },
              { x: "-0.679958mm", y: "1.8999708mm" },
            ]}
            shape="polygon"
          />
          <silkscreenpath
            route={[
              { x: -2.76786340000001, y: 0.4324857999999949 },
              { x: -2.76786340000001, y: -0.43251119999990806 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.113913000000025, y: -0.00005079999993995443 },
              { x: -2.4219154000001026, y: -0.00005079999993995443 },
            ]}
          />
          <silkscreencircle pcbX="-2.54mm" pcbY="1.778mm" radius="0.127mm" />
          <silkscreenrect
            pcbX="0mm"
            pcbY="0mm"
            width="4.151884mm"
            height="4.151884mm"
            strokeWidth="0.254mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.5512308mm"
            pcbY="3.0774406mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -3.1979107999999314, y: -0.21605239999996684 },
              { x: -3.1979107999999314, y: 0.12994639999999436 },
              { x: -1.2949173999999175, y: 0.12994639999999436 },
              { x: -1.2949173999999175, y: -0.21605239999996684 },
              { x: -3.1979107999999314, y: -0.21605239999996684 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: -2.0244054000000915, y: -0.96707959999992 },
              { x: -2.3704042000000527, y: -0.96707959999992 },
              { x: -2.3704042000000527, y: 0.9359392000001208 },
              { x: -2.0244054000000915, y: 0.9359392000001208 },
              { x: -2.0244054000000915, y: -0.96707959999992 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -2.074863000000164, y: 2.149970800000119 },
              { x: 2.075015399999984, y: 2.149970800000119 },
              { x: 2.075015399999984, y: -2.1500215999999455 },
              { x: -2.074863000000164, y: -2.1500215999999455 },
              { x: -2.074863000000164, y: 2.149970800000119 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
