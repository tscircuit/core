import type { CapacitorProps } from "@tscircuit/props"

export const GRM033R61A104KE15D = (
  props: Omit<CapacitorProps, "capacitance">,
) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100nF"
      supplierPartNumbers={{
        jlcpcb: ["C76934"],
      }}
      manufacturerPartNumber="GRM033R61A104KE15D"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.27432mm"
            pcbY="0mm"
            width="0.368427mm"
            height="0.3240024mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.27432mm"
            pcbY="0mm"
            width="0.368427mm"
            height="0.3240024mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.5346445999999787, y: 0.3906011999999919 },
              { x: 0.16619220000006862, y: 0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.16619220000006862, y: -0.3906011999999919 },
              { x: 0.5346445999999787, y: -0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.6870446000000356, y: -0.23820120000004863 },
              { x: 0.6870446000000356, y: 0.23820120000004863 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.5346446000000924, y: 0.3906011999999919 },
              { x: -0.16619220000006862, y: 0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.16619220000006862, y: -0.3906011999999919 },
              { x: -0.5346446000000924, y: -0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6870446000001493, y: -0.23820120000004863 },
              { x: -0.6870446000001493, y: 0.23820120000004863 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.5346445999999787, y: -0.3906011999998782 },
              { x: 0.6424076734527944, y: -0.3459642734528643 },
              { x: 0.6870446000000356, y: -0.23820120000004863 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.6870446000000356, y: 0.23820120000004863 },
              { x: 0.6424076734527944, y: 0.3459642734528643 },
              { x: 0.5346445999999787, y: 0.3906011999999919 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.5346446000000924, y: -0.3906011999998782 },
              { x: -0.6424076734529081, y: -0.3459642734528643 },
              { x: -0.6870446000001493, y: -0.23820120000004863 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6870446000001493, y: 0.23820120000004863 },
              { x: -0.6424076734529081, y: 0.3459642734528643 },
              { x: -0.5346446000000924, y: 0.3906011999999919 },
            ]}
          />
          <courtyardoutline
            outline={[
              { x: -0.935799999999972, y: 0.6309999999999718 },
              { x: 0.9358000000000857, y: 0.6309999999999718 },
              { x: 0.9358000000000857, y: -0.6563999999999623 },
              { x: -0.935799999999972, y: -0.6563999999999623 },
              { x: -0.935799999999972, y: 0.6309999999999718 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C76934.obj?uuid=c3e75c3d90204c70b153866ab54c789f",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C76934.step?uuid=c3e75c3d90204c70b153866ab54c789f",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.15 },
      }}
      {...restProps}
    />
  )
}
