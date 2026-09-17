import type { FuseProps } from "@tscircuit/props"

type SMD1812P110TFProps = Omit<
  FuseProps,
  | "connections"
  | "currentRating"
  | "voltageRating"
  | "footprint"
  | "supplierPartNumbers"
  | "manufacturerPartNumber"
> & {
  connections?: { IN?: string; OUT?: string }
}

// PTTC SMD1812P110TF, JLCPCB C3102: 1.1 A hold, 2.2 A trip, 8 V PPTC.
export const SMD1812P110TF = (props: SMD1812P110TFProps) => {
  const { connections, ...restProps } = props
  return (
    <fuse
      {...restProps}
      currentRating="1.1A"
      voltageRating="8V"
      connections={{ pin1: connections?.IN, pin2: connections?.OUT }}
      supplierPartNumbers={{ jlcpcb: ["C3102"] }}
      manufacturerPartNumber="SMD1812P110TF"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.853438mm"
            pcbY="0mm"
            width="1.4066774mm"
            height="3.4992056mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.853438mm"
            pcbY="0mm"
            width="1.4066774mm"
            height="3.4992056mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.794, y: 1.7977612 },
              { x: -2.794, y: -1.7582388 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.794, y: 1.778 },
              { x: 2.794, y: -1.778 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="3.032mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.044, y: 2.282 },
              { x: 3.044, y: 2.282 },
              { x: 3.044, y: -2.282 },
              { x: -3.044, y: -2.282 },
              { x: -3.044, y: 2.282 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3102.obj?uuid=f8be6105a8d64dcca382e4bf731dc2b6",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3102.step?uuid=f8be6105a8d64dcca382e4bf731dc2b6",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.0000127, y: 0, z: 0 },
      }}
    />
  )
}
