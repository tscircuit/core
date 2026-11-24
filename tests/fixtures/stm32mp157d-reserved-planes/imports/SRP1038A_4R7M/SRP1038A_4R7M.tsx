import type { InductorProps } from "@tscircuit/props"

export const SRP1038A_4R7M = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="4.7uH"
      supplierPartNumbers={{
        jlcpcb: ["C2041319"],
      }}
      manufacturerPartNumber="SRP1038A-4R7M"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-4.750054mm"
            pcbY="0mm"
            width="3.499993mm"
            height="3.499993mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="4.750054mm"
            pcbY="0mm"
            width="3.499993mm"
            height="3.499993mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 5.0799745999999, y: 1.9049999999999727 },
              { x: 5.079999999999927, y: 4.9529999999999745 },
              { x: -5.080000000000041, y: 4.9529999999999745 },
              { x: -5.080000000000041, y: 1.9049999999999727 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -5.080000000000041, y: -1.9049999999999727 },
              { x: -5.080000000000041, y: -4.9529999999999745 },
              { x: 5.079999999999927, y: -4.9529999999999745 },
              { x: 5.079999999999927, y: -1.9049999999999727 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="6.0038mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -6.750050500000043, y: 5.254993799999966 },
              { x: 6.750050499999929, y: 5.254993799999966 },
              { x: 6.750050499999929, y: -5.254993799999966 },
              { x: -6.750050500000043, y: -5.254993799999966 },
              { x: -6.750050500000043, y: 5.254993799999966 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2041319.obj?uuid=f35714fc9b334edfba5c2c3e59f47626",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2041319.step?uuid=f35714fc9b334edfba5c2c3e59f47626",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.004999999999999893, z: -0.1 },
      }}
      {...props}
    />
  )
}
