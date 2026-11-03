import type { InductorProps } from "@tscircuit/props"

export const XFL4020_102MEC = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="1uH"
      supplierPartNumbers={{
        jlcpcb: ["C5355380"],
      }}
      manufacturerPartNumber="XFL4020-102MEC"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="1.188974mm"
            pcbY="0mm"
            width="1.1999976mm"
            height="3.7999924mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.188974mm"
            pcbY="0mm"
            width="1.1999976mm"
            height="3.7999924mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.99999600000001, y: 2.099995799999988 },
              { x: 2.099995799999988, y: 2.099995799999988 },
              { x: 2.099995799999988, y: -2.1999955999999656 },
              { x: -2.0999958000001016, y: -2.1999955999999656 },
              { x: -2.0999958000001016, y: 2.099995799999988 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.3429mm"
            pcbY="3.1082mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: 1.3999972000000298, y: 1.4999970000000076 },
              { x: 1.299997400000052, y: 1.4999970000000076 },
              { x: 1.299997400000052, y: -1.4999970000000076 },
              { x: 1.3999972000000298, y: -1.4999970000000076 },
              { x: 1.3999972000000298, y: 1.4999970000000076 },
            ]}
            strokeWidth="0.254mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.3582000000000107, y: 2.3582000000001244 },
              { x: 3.043999999999869, y: 2.3582000000001244 },
              { x: 3.043999999999869, y: -2.4343999999998687 },
              { x: -2.3582000000000107, y: -2.4343999999998687 },
              { x: -2.3582000000000107, y: 2.3582000000001244 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C5355380.obj?uuid=a4215dfa2df94cd4ba1c46c873cef5a8",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C5355380.step?uuid=a4215dfa2df94cd4ba1c46c873cef5a8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.00498729999992964, z: -0.2 },
      }}
      {...props}
    />
  )
}
