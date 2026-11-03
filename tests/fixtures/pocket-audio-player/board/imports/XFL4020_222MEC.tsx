import type { InductorProps } from "@tscircuit/props"

export const XFL4020_222MEC = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="2.2uH"
      supplierPartNumbers={{
        jlcpcb: ["C122469"],
      }}
      manufacturerPartNumber="XFL4020-222MEC"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.18491mm"
            pcbY="0mm"
            width="0.999998mm"
            height="3.499993mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.18491mm"
            pcbY="0mm"
            width="0.999998mm"
            height="3.499993mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.99999600000001, y: 1.9999959999998964 },
              { x: 1.99999600000001, y: -1.9999959999998964 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.000021400000037, y: 1.9999959999998964 },
              { x: -2.000021400000037, y: -1.9999959999998964 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.000021400000037, y: -1.9999959999998964 },
              { x: 1.99999600000001, y: -1.9999959999998964 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.000021400000037, y: 1.9999959999998964 },
              { x: 1.99999600000001, y: 1.9999959999998964 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="3.0066mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.26929999999993, y: 2.2566000000000486 },
              { x: 2.2693000000001575, y: 2.2566000000000486 },
              { x: 2.2693000000001575, y: -2.282000000000039 },
              { x: -2.26929999999993, y: -2.282000000000039 },
              { x: -2.26929999999993, y: 2.2566000000000486 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C122469.obj?uuid=1ed55da782b2499680e541053787395e",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C122469.step?uuid=1ed55da782b2499680e541053787395e",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.2 },
      }}
      {...props}
    />
  )
}
