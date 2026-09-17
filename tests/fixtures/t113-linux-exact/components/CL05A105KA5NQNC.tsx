import type { CapacitorProps } from "@tscircuit/props"

export const CL05A105KA5NQNC = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      maxVoltageRating="25V"
      capacitance="1uF"
      supplierPartNumbers={{
        jlcpcb: ["C52923"],
      }}
      manufacturerPartNumber="CL05A105KA5NQNC"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.420116mm"
            pcbY="0mm"
            width="0.499999mm"
            height="0.540004mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.420116mm"
            pcbY="0mm"
            width="0.499999mm"
            height="0.540004mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.721385400000031, y: 0.49753519999990203 },
              { x: -0.22138640000002852, y: 0.49753519999990203 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8738108000000011, y: -0.34724340000002485 },
              { x: -0.8738108000000011, y: 0.3451606000000993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.22138640000002852, y: -0.4996433999999681 },
              { x: -0.721385400000031, y: -0.4996433999999681 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.7213853999999174, y: -0.4975097999999889 },
              { x: 0.22138639999991483, y: -0.4975097999999889 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22138639999991483, y: 0.49961800000005496 },
              { x: 0.7213853999999174, y: 0.49961800000005496 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8738108000000011, y: 0.34726880000005167 },
              { x: 0.8738108000000011, y: -0.3451606000000993 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.7213853999999174, y: 0.4996433999998544 },
              { x: 0.829148473452733, y: 0.4550064734527268 },
              { x: 0.8737853999998606, y: 0.34724340000002485 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.8737853999998606, y: -0.3451606000000993 },
              { x: 0.829148473452733, y: -0.4529236734526876 },
              { x: 0.7213853999999174, y: -0.49756059999992885 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.721385400000031, y: -0.4996433999997407 },
              { x: -0.829148473452733, y: -0.45500647345261314 },
              { x: -0.8737853999999743, y: -0.34724340000002485 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.8737853999999743, y: 0.3451606000000993 },
              { x: -0.829148473452733, y: 0.45292367345280127 },
              { x: -0.721385400000031, y: 0.49756060000004254 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="1.508mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.1136000000000195, y: 0.7580000000000382 },
              { x: 1.1389999999998963, y: 0.7580000000000382 },
              { x: 1.1389999999998963, y: -0.7326000000000477 },
              { x: -1.1136000000000195, y: -0.7326000000000477 },
              { x: -1.1136000000000195, y: 0.7580000000000382 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C52923.obj?uuid=32fe2cf9314f444ca2785a33c2db7189",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C52923.step?uuid=32fe2cf9314f444ca2785a33c2db7189",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.25 },
      }}
      {...restProps}
    />
  )
}
