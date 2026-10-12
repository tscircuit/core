// Exact PCB geometry from a TSCI JLCPCB import; the CAD model was omitted.
// See README.md for supplier numbers, provenance and the import command.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A"],
  pin2: ["K"],
  pin3: ["N"],
} as const

export const HL_C3535F5R3EA_ZW = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C540987"],
      }}
      manufacturerPartNumber="HL-C3535F5R3EA-ZW"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.42494mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="3.7999924mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.42494mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="3.7999924mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            points={[
              { x: "-0.6800088mm", y: "1.8999962mm" },
              { x: "-0.6800088mm", y: "0.08001mm" },
              { x: "-0.6800088mm", y: "0.0700024mm" },
              { x: "-0.4100068mm", y: "0.0700024mm" },
              { x: "-0.4100068mm", y: "-0.0700024mm" },
              { x: "-0.6800088mm", y: "-0.0700024mm" },
              { x: "-0.6800088mm", y: "-1.8999962mm" },
              { x: "0.6800088mm", y: "-1.8999962mm" },
              { x: "0.6800088mm", y: "-0.0700024mm" },
              { x: "0.4100068mm", y: "-0.0700024mm" },
              { x: "0.4100068mm", y: "0.0700024mm" },
              { x: "0.6800088mm", y: "0.0700024mm" },
              { x: "0.6800088mm", y: "1.8999962mm" },
              { x: "-0.6800088mm", y: "1.8999962mm" },
              { x: "-0.6800088mm", y: "1.8999962mm" },
            ]}
            shape="polygon"
          />
          <silkscreenpath
            route={[
              { x: -2.7679650000001175, y: 0.43251120000013543 },
              { x: -2.7679650000001175, y: -0.43248579999988124 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.1139892000001055, y: 1.1368683772161603e-13 },
              { x: -2.421991600000183, y: 1.1368683772161603e-13 },
            ]}
          />
          <silkscreenrect
            pcbX="0mm"
            pcbY="0mm"
            width="4.151884mm"
            height="4.151884mm"
            strokeWidth="0.254mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.5588mm"
            pcbY="3.0828mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -3.1979870000001256, y: -0.21602699999982633 },
              { x: -3.1979870000001256, y: 0.12997180000013486 },
              { x: -1.294993599999998, y: 0.12997180000013486 },
              { x: -1.294993599999998, y: -0.21602699999982633 },
              { x: -3.1979870000001256, y: -0.21602699999982633 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <fabricationnotepath
            route={[
              { x: -2.0244816000000583, y: -0.9670541999998932 },
              { x: -2.370480400000133, y: -0.9670541999998932 },
              { x: -2.370480400000133, y: 0.9359565364526361 },
              { x: -2.0244816000000583, y: 0.9359565364526361 },
              { x: -2.0244816000000583, y: -0.9670541999998932 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -2.0749392000001308, y: 2.149996200000146 },
              { x: 2.0749391999999034, y: 2.149996200000146 },
              { x: 2.0749391999999034, y: -2.1499961999999186 },
              { x: -2.0749392000001308, y: -2.1499961999999186 },
              { x: -2.0749392000001308, y: 2.149996200000146 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}
