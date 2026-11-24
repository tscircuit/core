import type { CapacitorProps } from "@tscircuit/props"

export const C3216X5R1V226MTJ00E = (
  props: Omit<CapacitorProps, "capacitance">,
) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="22uF"
      supplierPartNumbers={{
        jlcpcb: ["C342620"],
      }}
      manufacturerPartNumber="C3216X5R1V226MTJ00E"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.59258mm"
            pcbY="0mm"
            width="1.485011mm"
            height="1.7279874mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.59258mm"
            pcbY="0mm"
            width="1.485011mm"
            height="1.7279874mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 2.4111966000000393, y: 1.0926064000000224 },
              { x: 0.9262109999999666, y: 1.0926064000000224 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.9262109999999666, y: -1.0926063999999087 },
              { x: 2.4111966000000393, y: -1.0926063999999087 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5635965999999826, y: -0.9402063999999655 },
              { x: 2.5635965999999826, y: 0.9402063999999655 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.411196600000153, y: 1.0926064000000224 },
              { x: -0.9262109999999666, y: 1.0926064000000224 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.9262109999999666, y: -1.0926063999999087 },
              { x: -2.411196600000153, y: -1.0926063999999087 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5635966000000963, y: -0.9402063999999655 },
              { x: -2.5635966000000963, y: 0.9402063999999655 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.4111966000000393, y: -1.092606399999795 },
              { x: 2.5189596734527413, y: -1.0479694734526674 },
              { x: 2.5635965999999826, y: -0.9402063999999655 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5635965999999826, y: 0.9402063999999655 },
              { x: 2.5189596734527413, y: 1.0479694734527811 },
              { x: 2.4111966000000393, y: 1.092606399999795 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.411196600000153, y: -1.092606399999795 },
              { x: -2.518959673452855, y: -1.0479694734526674 },
              { x: -2.5635966000000963, y: -0.9402063999999655 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.5635966000000963, y: 0.9402063999999655 },
              { x: -2.518959673452855, y: 1.0479694734527811 },
              { x: -2.411196600000153, y: 1.092606399999795 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0mm"
            pcbY="2.0922mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.585085499999991, y: 1.1139937000000373 },
              { x: 2.5850854999998774, y: 1.1139937000000373 },
              { x: 2.5850854999998774, y: -1.1139937000000373 },
              { x: -2.585085499999991, y: -1.1139937000000373 },
              { x: -2.585085499999991, y: 1.1139937000000373 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C342620.obj?uuid=c6790e9475e1483991d2c64340b24e96",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C342620.step?uuid=c6790e9475e1483991d2c64340b24e96",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...restProps}
    />
  )
}
