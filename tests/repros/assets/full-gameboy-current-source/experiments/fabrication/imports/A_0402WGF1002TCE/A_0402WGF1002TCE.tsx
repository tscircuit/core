import type { ResistorProps } from "@tscircuit/props"

export const A_0402WGF1002TCE = (props: Omit<ResistorProps, "resistance">) => {
  const { name = "R1", ...restProps } = props

  return (
    <resistor
      name={name}
      resistance="10kohm"
      supplierPartNumbers={{
        jlcpcb: ["C25744"],
      }}
      manufacturerPartNumber="0402WGF1002TCE"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.432816mm"
            pcbY="0mm"
            width="0.565658mm"
            height="0.540004mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.432816mm"
            pcbY="0mm"
            width="0.565658mm"
            height="0.540004mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.22621240000012222, y: -0.4986020000000053 },
              { x: -0.9442450000001372, y: -0.4986020000000053 },
              { x: -0.9442450000001372, y: 0.498602000000119 },
              { x: -0.22621240000012222, y: 0.498602000000119 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22621240000000853, y: -0.4986020000000053 },
              { x: 0.9442449999999099, y: -0.4986020000000053 },
              { x: 0.9442449999999099, y: 0.498602000000119 },
              { x: 0.22621240000000853, y: 0.498602000000119 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="1.508mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.1897999999998774, y: 0.7580000000000382 },
              { x: 1.189799999999991, y: 0.7580000000000382 },
              { x: 1.189799999999991, y: -0.7326000000000477 },
              { x: -1.1897999999998774, y: -0.7326000000000477 },
              { x: -1.1897999999998774, y: 0.7580000000000382 },
            ]}
          />
        </footprint>
      }
      {...restProps}
    />
  )
}
