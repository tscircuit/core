import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["K"],
  pin2: ["A"],
} as const

type SMAJ5_0AProps = Omit<
  DiodeProps,
  | "connections"
  | "pinLabels"
  | "variant"
  | "footprint"
  | "supplierPartNumbers"
  | "manufacturerPartNumber"
> & {
  connections?: { K?: string; A?: string }
}

// LRC SMAJ5.0A, JLCPCB C140902. The cathode connects to USB VBUS.
export const SMAJ5_0A = (props: SMAJ5_0AProps) => {
  const { connections, ...restProps } = props
  return (
    <diode
      {...restProps}
      variant="tvs"
      pinLabels={{
        pin1: ["cathode", "neg", ...pinLabels.pin1],
        pin2: ["anode", "pos", ...pinLabels.pin2],
      }}
      connections={{ cathode: connections?.K, anode: connections?.A }}
      supplierPartNumbers={{ jlcpcb: ["C140902"] }}
      manufacturerPartNumber="SMAJ5.0A"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.403983mm"
            pcbY="-0.009398mm"
            width="2.0463764mm"
            height="1.620012mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="2.403983mm"
            pcbY="0.009398mm"
            width="2.0463764mm"
            height="1.620012mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.085088, y: 1.3637006 },
              { x: -1.085088, y: -1.3637006 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5035002, y: -1.363726 },
              { x: 2.164842, y: -1.363726 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5260046, y: 1.3636752 },
              { x: 2.158873, y: 1.3462 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.000127mm"
            pcbY="2.4478mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.679127, y: 1.6978 },
              { x: 3.678873, y: 1.6978 },
              { x: 3.678873, y: -1.6724 },
              { x: -3.679127, y: -1.6724 },
              { x: -3.679127, y: 1.6978 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C140902.obj?uuid=c45541be4ee342138706b28195cdf845",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C140902.step?uuid=c45541be4ee342138706b28195cdf845",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -1.17 },
      }}
    />
  )
}
