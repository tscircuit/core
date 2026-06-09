type ChipProps<TPinLabels = any> = any
type DiodeProps = any

const B2B_PH_SM4_TBT_LF__SN_PinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
} as const

const B2B_PH_SM4_TBT_LF__SN_ = (
  props: ChipProps<typeof B2B_PH_SM4_TBT_LF__SN_PinLabels>,
) => {
  return (
    <chip
      pinLabels={B2B_PH_SM4_TBT_LF__SN_PinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C265003"],
      }}
      manufacturerPartNumber="B2B_PH_SM4_TBT_LF__SN_"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.000125mm"
            pcbY="-0.49996725mm"
            width="0.999998mm"
            height="5.499989mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.999871mm"
            pcbY="-0.49996725mm"
            width="0.999998mm"
            height="5.499989mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="3.499993mm"
            pcbY="1.74996475mm"
            width="1.999996mm"
            height="2.999994mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-3.499993mm"
            pcbY="1.74996475mm"
            width="1.999996mm"
            height="2.999994mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -4.000119000000041, y: 4.25001055000007 },
              { x: 3.999864999999886, y: 4.25001055000007 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.000119000000041, y: -0.7500048499999821 },
              { x: -1.7312640000001238, y: -0.7500048499999821 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.2689860000000408, y: -0.7500048499999821 },
              { x: 0.26873199999999997, y: -0.7500048499999821 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.7310099999999693, y: -0.7500048499999821 },
              { x: 3.999864999999886, y: -0.7500048499999821 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.999864999999886, y: -0.7500048499999821 },
              { x: 3.999864999999886, y: 0.018878549999953975 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.999864999999886, y: 3.4811525499999334 },
              { x: 3.999864999999886, y: 4.25001055000007 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.000119000000041, y: 4.25001055000007 },
              { x: -4.000119000000041, y: 3.4811525499999334 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.000119000000041, y: 0.018878549999953975 },
              { x: -4.000119000000041, y: -0.7500048499999821 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.000127mm"
            pcbY="5.24983275mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.7459270000000515, y: 4.499832749999996 },
              { x: 4.745673000000011, y: 4.499832749999996 },
              { x: 4.745673000000011, y: -3.4931672500001696 },
              { x: -4.7459270000000515, y: -3.4931672500001696 },
              { x: -4.7459270000000515, y: 4.499832749999996 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C265003.obj?uuid=fa51a0cf3e2c44c08b08b17a4ed903b6",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C265003.step?uuid=fa51a0cf3e2c44c08b08b17a4ed903b6",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 1, y: -1.2770000000000001, z: 0 },
      }}
      {...props}
    />
  )
}

const B5819W_SL = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      supplierPartNumbers={{
        jlcpcb: ["C8598"],
      }}
      manufacturerPartNumber="B5819W_SL"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.700022mm"
            pcbY="0mm"
            width="1.1999976mm"
            height="0.9500108mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.700022mm"
            pcbY="0mm"
            width="1.1999976mm"
            height="0.9500108mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.3462000000000103, y: -0.7061453999999969 },
              { x: 1.3462000000000103, y: -0.850010999999995 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3462000000000103, y: 0.8500110000000092 },
              { x: 1.3462000000000103, y: 0.7061454000000111 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.346199999999996, y: -0.850010999999995 },
              { x: -1.6379698000000076, y: -0.850010999999995 },
              { x: -1.6389857999999862, y: -0.848994999999988 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.346199999999996, y: 0.8500110000000092 },
              { x: -1.6429735999999764, y: 0.8500110000000092 },
              { x: -1.6439895999999976, y: 0.8489950000000022 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.346199999999996, y: 0.8500110000000092 },
              { x: 1.3462000000000103, y: 0.8500110000000092 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.406400000000005, y: 0.406400000000005 },
              { x: 0.406400000000005, y: -0.40639999999999077 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.406400000000005, y: 0.0002539999999982001 },
              { x: 0.720089999999999, y: 0.0002539999999982001 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.28000959999999964, y: 0 },
              { x: -0.610006399999989, y: 0 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.2540000000000049, y: 0.5080000000000098 },
              { x: -0.2540000000000049, y: -0.5079999999999956 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.17779999999999063, y: 0 },
              { x: 0.406400000000005, y: 0.406400000000005 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.406400000000005, y: -0.40639999999999077 },
              { x: -0.17779999999999063, y: 0 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3462000000000103, y: -0.850010999999995 },
              { x: -1.346199999999996, y: -0.850010999999995 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0127mm"
            pcbY="1.9652mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.561400000000006, y: 1.21520000000001 },
              { x: 2.5360000000000014, y: 1.21520000000001 },
              { x: 2.5360000000000014, y: -1.2405999999999864 },
              { x: -2.561400000000006, y: -1.2405999999999864 },
              { x: -2.561400000000006, y: 1.21520000000001 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8598.obj?uuid=e9d505c99b6c436aaf827a29c5ba4f84",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C8598.step?uuid=e9d505c99b6c436aaf827a29c5ba4f84",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012699999999199463, z: -0.6 },
      }}
      {...restProps}
    />
  )
}

const BQ24650RVARPinLabels = {
  pin1: ["VCC"],
  pin2: ["MPPSET"],
  pin3: ["STAT1"],
  pin4: ["TS"],
  pin5: ["STAT2"],
  pin6: ["VREF"],
  pin7: ["TERM_EN"],
  pin8: ["VFB"],
  pin9: ["SRN"],
  pin10: ["SRP"],
  pin11: ["GND"],
  pin12: ["REGN"],
  pin13: ["LODRV"],
  pin14: ["PH"],
  pin15: ["HIDRV"],
  pin16: ["BTST"],
  pin17: ["EP"],
} as const

const BQ24650RVAR = (props: ChipProps<typeof BQ24650RVARPinLabels>) => {
  return (
    <chip
      pinLabels={BQ24650RVARPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C53712"],
      }}
      manufacturerPartNumber="BQ24650RVAR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.750062mm"
            pcbY="-1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.249936mm"
            pcbY="-1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.249936mm"
            pcbY="-1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.750062mm"
            pcbY="-1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.657604mm"
            pcbY="-0.750062mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.657604mm"
            pcbY="-0.249936mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.657604mm"
            pcbY="0.249936mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.657604mm"
            pcbY="0.750062mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0.750062mm"
            pcbY="1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="0.249936mm"
            pcbY="1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-0.249936mm"
            pcbY="1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-0.750062mm"
            pcbY="1.657604mm"
            width="0.2800096mm"
            height="0.6649974mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-1.657604mm"
            pcbY="0.750062mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-1.657604mm"
            pcbY="0.249936mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-1.657604mm"
            pcbY="-0.249936mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-1.657604mm"
            pcbY="-0.750062mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="0mm"
            pcbY="0mm"
            width="2.1400008mm"
            height="2.1400008mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.8262092000001076, y: 1.0804906000000756 },
              { x: -1.8262092000001076, y: 1.8262091999999939 },
              { x: -1.0804906000000756, y: 1.8262091999999939 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.8262091999999939, y: 1.0804906000000756 },
              { x: 1.8262091999999939, y: 1.8262091999999939 },
              { x: 1.0804905999999619, y: 1.8262091999999939 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.8262092000001076, y: -1.0804906000000756 },
              { x: -1.8262092000001076, y: -1.8262091999999939 },
              { x: -1.0804906000000756, y: -1.8262091999999939 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.8262091999999939, y: -1.0804906000000756 },
              { x: 1.8262091999999939, y: -1.8262091999999939 },
              { x: 1.0804905999999619, y: -1.8262091999999939 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="2.9812mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.231200000000058, y: 2.2312000000001717 },
              { x: 2.256599999999935, y: 2.2312000000001717 },
              { x: 2.256599999999935, y: -2.612199999999916 },
              { x: -2.231200000000058, y: -2.612199999999916 },
              { x: -2.231200000000058, y: 2.2312000000001717 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C53712.obj?uuid=0248695823ff4ca7a70eb2f6fde20dd2",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C53712.step?uuid=0248695823ff4ca7a70eb2f6fde20dd2",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: -0.02 },
      }}
      {...props}
    />
  )
}

const CL10A106MA8NRNCPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

const CL10A106MA8NRNC = (props: ChipProps<typeof CL10A106MA8NRNCPinLabels>) => {
  return (
    <chip
      pinLabels={CL10A106MA8NRNCPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C96446"],
      }}
      manufacturerPartNumber="CL10A106MA8NRNC"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.700024mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.700024mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8999982mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.2801873999999316, y: -0.7095743999998376 },
              { x: -1.080160400000068, y: -0.7095743999998376 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.28026359999989836, y: -0.7100315999998656 },
              { x: 1.080236599999921, y: -0.7100315999998656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.2801873999999316, y: 0.7101078000000598 },
              { x: -1.080160400000068, y: 0.7101078000000598 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.28026359999989836, y: 0.7096252000001186 },
              { x: 1.080236599999921, y: 0.7096252000001186 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3899134000000686, y: -0.3997452000000976 },
              { x: -1.3899134000000686, y: 0.40030400000000554 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3900149999998348, y: 0.39977060000001075 },
              { x: 1.3900149999998348, y: -0.4002531999999519 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.080185799999981, y: 0.7096252000001186 },
              { x: 1.299277109074751, y: 0.6188693482574763 },
              { x: 1.3900149999998348, y: 0.39977060000001075 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3900149999998348, y: -0.40020240000012564 },
              { x: 1.2992681283295724, y: -0.6192847283296032 },
              { x: 1.080185799999981, y: -0.7100315999998656 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0801096000000143, y: -0.7095743999998376 },
              { x: -1.2991755087698493, y: -0.6188185485625581 },
              { x: -1.3899134000000686, y: -0.3997452000000976 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3899134000000686, y: 0.40022780000003877 },
              { x: -1.2991934705021322, y: 0.6193339880503572 },
              { x: -1.0801096000000143, y: 0.7101078000000598 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0127mm"
            pcbY="1.7112mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.647000000000162, y: 0.9612000000000762 },
              { x: 1.6216000000000577, y: 0.9612000000000762 },
              { x: 1.6216000000000577, y: -0.9611999999999625 },
              { x: -1.647000000000162, y: -0.9611999999999625 },
              { x: -1.647000000000162, y: 0.9612000000000762 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C96446.obj?uuid=ac9b32e974bc448eab36b1293f859dcb",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C96446.step?uuid=ac9b32e974bc448eab36b1293f859dcb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...props}
    />
  )
}

const CL31A107MQHNNNEPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

const CL31A107MQHNNNE = (props: ChipProps<typeof CL31A107MQHNNNEPinLabels>) => {
  return (
    <chip
      pinLabels={CL31A107MQHNNNEPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C15008"],
      }}
      manufacturerPartNumber="CL31A107MQHNNNE"
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
              { x: -2.815400000000068, y: 1.342200000000048 },
              { x: 2.815399999999954, y: 1.342200000000048 },
              { x: 2.815399999999954, y: -1.3421999999999343 },
              { x: -2.815400000000068, y: -1.3421999999999343 },
              { x: -2.815400000000068, y: 1.342200000000048 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C15008.obj?uuid=c6790e9475e1483991d2c64340b24e96",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C15008.step?uuid=c6790e9475e1483991d2c64340b24e96",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...props}
    />
  )
}

const DMG3404L_7PinLabels = {
  pin1: ["G"],
  pin2: ["S"],
  pin3: ["D"],
} as const

const DMG3404L_7 = (props: ChipProps<typeof DMG3404L_7PinLabels>) => {
  return (
    <chip
      pinLabels={DMG3404L_7PinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C96615"],
      }}
      manufacturerPartNumber="DMG3404L_7"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="1.149985mm"
            pcbY="0.94996mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.149985mm"
            pcbY="0mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.149985mm"
            pcbY="-0.94996mm"
            width="0.999998mm"
            height="0.7999984mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 0.6359398000000027 },
              { x: -0.6999731999999881, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: 1.4999461999999966 },
              { x: 0.30005020000000115, y: 1.4999461999999966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.7000239999999991, y: -0.31402020000000164 },
              { x: 0.7000239999999991, y: 0.31391859999999383 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: -0.6999731999999881, y: -0.6360414000000105 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.6999731999999881, y: -1.5000478000000044 },
              { x: 0.30005020000000115, y: -1.5000478000000044 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.133223mm"
            pcbY="2.49606mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.8947769999999906, y: 1.74606 },
              { x: 2.161223000000021, y: 1.74606 },
              { x: 2.161223000000021, y: -1.7511400000000066 },
              { x: -1.8947769999999906, y: -1.7511400000000066 },
              { x: -1.8947769999999906, y: 1.74606 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C96615.obj?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C96615.step?uuid=d777607a152f4f3aac9bb0d0c14ed6fd",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: 0, z: 0.050795 },
      }}
      {...props}
    />
  )
}

const LT1129CS8_3_3_PBFPinLabels = {
  pin1: ["OUTPUT"],
  pin2: ["SENSE"],
  pin3: ["GND1"],
  pin4: ["NC"],
  pin5: ["SHDN"],
  pin6: ["GND2"],
  pin7: ["GND3"],
  pin8: ["VIN"],
} as const

const LT1129CS8_3_3_PBF = (
  props: ChipProps<typeof LT1129CS8_3_3_PBFPinLabels>,
) => {
  return (
    <chip
      pinLabels={LT1129CS8_3_3_PBFPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C661687"],
      }}
      manufacturerPartNumber="LT1129CS8_3_3_PBF"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin3"]}
            pcbX="0.635mm"
            pcbY="-2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="1.905mm"
            pcbY="-2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.635mm"
            pcbY="-2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.905mm"
            pcbY="-2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="1.905mm"
            pcbY="2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0.635mm"
            pcbY="2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-0.635mm"
            pcbY="2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-1.905mm"
            pcbY="2.450084mm"
            width="0.5999988mm"
            height="1.7999964mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.5400000000000773, y: 1.9049999999999727 },
              { x: -2.5400000000000773, y: -1.9049999999999727 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5399999999999636, y: 1.9049999999999727 },
              { x: 2.5399999999999636, y: -1.9049999999999727 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.4572mm"
            pcbY="4.3528mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -3.704400000000078, y: 3.6027999999998883 },
              { x: 2.7899999999999636, y: 3.6027999999998883 },
              { x: 2.7899999999999636, y: -3.704399999999964 },
              { x: -3.704400000000078, y: -3.704399999999964 },
              { x: -3.704400000000078, y: 3.6027999999998883 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C661687.obj?uuid=e3b253c99fe6456e9f120c6035859cd8",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C661687.step?uuid=e3b253c99fe6456e9f120c6035859cd8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.85 },
      }}
      {...props}
    />
  )
}

const MCP73113T_06SI_MFPinLabels = {
  pin1: ["VDD1"],
  pin2: ["VDD2"],
  pin3: ["VBAT1"],
  pin4: ["VBAT2"],
  pin5: ["NC1"],
  pin6: ["NC2"],
  pin7: ["STAT"],
  pin8: ["VSS1"],
  pin9: ["VSS2"],
  pin10: ["PROG"],
  pin11: ["EP"],
} as const

const MCP73113T_06SI_MF = (
  props: ChipProps<typeof MCP73113T_06SI_MFPinLabels>,
) => {
  return (
    <chip
      pinLabels={MCP73113T_06SI_MFPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C623827"],
      }}
      manufacturerPartNumber="MCP73113T_06SI_MF"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.407414mm"
            pcbY="0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-1.407414mm"
            pcbY="0.499872mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.407414mm"
            pcbY="0mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.407414mm"
            pcbY="-0.500126mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.407414mm"
            pcbY="-0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.407414mm"
            pcbY="-0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.407414mm"
            pcbY="-0.500126mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.407414mm"
            pcbY="0mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.407414mm"
            pcbY="0.499872mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.407414mm"
            pcbY="0.999998mm"
            width="0.6649974mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.6400018mm"
            height="2.3800054mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.5761969999999934, y: 1.5761969999999934 },
              { x: 1.5761969999999792, y: 1.5761969999999934 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5761969999999934, y: -1.5761969999999934 },
              { x: 1.5761969999999792, y: -1.5761969999999934 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1397mm"
            pcbY="2.6256mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.2565999999999917, y: 1.8756000000000057 },
              { x: 1.9772000000000105, y: 1.8756000000000057 },
              { x: 1.9772000000000105, y: -1.8247999999999962 },
              { x: -2.2565999999999917, y: -1.8247999999999962 },
              { x: -2.2565999999999917, y: 1.8756000000000057 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C623827.obj?uuid=c995bf3d85654ebb8e160662de6e24f5",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C623827.step?uuid=c995bf3d85654ebb8e160662de6e24f5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.05 },
      }}
      {...props}
    />
  )
}

const SPH202012H100MTPinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
} as const

const SPH202012H100MT = (props: ChipProps<typeof SPH202012H100MTPinLabels>) => {
  return (
    <chip
      pinLabels={SPH202012H100MTPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C383082"],
      }}
      manufacturerPartNumber="SPH202012H100MT"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.905002mm"
            pcbY="0mm"
            width="0.999998mm"
            height="1.999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.905002mm"
            pcbY="0mm"
            width="0.999998mm"
            height="1.999996mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.100023199999896, y: 1.1999976000000743 },
              { x: 1.0999724000000697, y: 1.1999976000000743 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.100023199999896, y: -1.1999975999999606 },
              { x: 1.0999977999999828, y: -1.1999975999999606 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.010922mm"
            pcbY="2.1938mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.648777999999993, y: 1.4438000000000102 },
              { x: 1.670622000000094, y: 1.4438000000000102 },
              { x: 1.670622000000094, y: -1.4438000000001239 },
              { x: -1.648777999999993, y: -1.4438000000001239 },
              { x: -1.648777999999993, y: 1.4438000000000102 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C383082.obj?uuid=a7d89db24fa0448bb45d234d55204b87",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C383082.step?uuid=a7d89db24fa0448bb45d234d55204b87",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}

const STC3117IJTPinLabels = {
  pin1: ["A1"],
  pin2: ["B1"],
  pin3: ["C1"],
  pin4: ["A2"],
  pin5: ["B2"],
  pin6: ["C2"],
  pin7: ["A3"],
  pin8: ["B3"],
  pin9: ["C3"],
} as const

const STC3117IJT = (props: ChipProps<typeof STC3117IJTPinLabels>) => {
  return (
    <chip
      pinLabels={STC3117IJTPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2971699"],
      }}
      manufacturerPartNumber="STC3117IJT"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.40005mm"
            pcbY="0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.40005mm"
            pcbY="-0mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.40005mm"
            pcbY="-0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0mm"
            pcbY="0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="-0mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="0mm"
            pcbY="-0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.40005mm"
            pcbY="0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.40005mm"
            pcbY="-0mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="0.40005mm"
            pcbY="-0.40005mm"
            width="0.2080006mm"
            height="0.2080006mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.8061959999999999, y: 0.8732011999999827 },
              { x: 0.8061959999999999, y: 0.8732011999999827 },
              { x: 0.8061959999999999, y: -0.8431783999999993 },
              { x: -0.8061959999999999, y: -0.8431783999999993 },
              { x: -0.8061959999999999, y: 0.8732011999999827 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0000488000000018, y: 0.4150613999999848 },
              { x: -1.0000488000000018, y: 1.0650473999999974 },
              { x: -0.40004999999999313, y: 1.0650473999999974 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0889mm"
            pcbY="2.0668mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.2405999999999864, y: 1.3167999999999864 },
              { x: 1.0628000000000242, y: 1.3167999999999864 },
              { x: 1.0628000000000242, y: -1.0882000000000147 },
              { x: -1.2405999999999864, y: -1.0882000000000147 },
              { x: -1.2405999999999864, y: 1.3167999999999864 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2971699.obj?uuid=660cf36f217f445398043cbd4315f47c",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2971699.step?uuid=660cf36f217f445398043cbd4315f47c",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.6 },
      }}
      {...props}
    />
  )
}

const p = (x: number, y: number, pcbRotation = 0) => ({
  pcbX: Number((x - 120.2).toFixed(3)),
  pcbY: Number((79 - y).toFixed(3)),
  pcbRotation,
})

const refRect = (x1: number, y1: number, x2: number, y2: number) => ({
  width: `${Number(Math.abs(x2 - x1).toFixed(3))}mm`,
  height: `${Number(Math.abs(y2 - y1).toFixed(3))}mm`,
  pcbX: `${Number(((x1 + x2) / 2 - 120.2).toFixed(3))}mm`,
  pcbY: `${Number((79 - (y1 + y2) / 2).toFixed(3))}mm`,
})

const edgeHole = (x: number, y: number) => ({
  radius: "0.9mm",
  pcbX: `${Number((x - 120.2).toFixed(3))}mm`,
  pcbY: `${Number((79 - y).toFixed(3))}mm`,
})

const modulePadPosition = (x: number, y: number) => ({
  pcbX: Number((x - 120.2).toFixed(3)),
  pcbY: Number((79 - y).toFixed(3)),
})

const referenceDiodePinLabels = {
  pin1: ["CATHODE"],
  pin2: ["ANODE"],
} as const

const jlcpcb = (partNumber: string) => ({
  supplierPartNumbers: {
    jlcpcb: [partNumber],
  },
})

const ReferenceDiode0201 = (
  props: ChipProps<typeof referenceDiodePinLabels>,
) => (
  <chip
    pinLabels={referenceDiodePinLabels}
    manufacturerPartNumber="TPMEG3005AESFYL"
    {...jlcpcb("C22435167")}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.32mm"
          pcbY="0mm"
          width="0.46mm"
          height="0.4mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0.32mm"
          pcbY="0mm"
          width="0.46mm"
          height="0.4mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: -0.15 },
            { x: -0.3, y: 0.15 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -0.2, y: -0.15 },
            { x: -0.2, y: 0.15 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: 0.15 },
            { x: 0.3, y: 0.15 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -0.3, y: -0.15 },
            { x: 0.3, y: -0.15 },
          ]}
        />
        <courtyardoutline
          outline={[
            { x: -0.7, y: 0.35 },
            { x: 0.7, y: 0.35 },
            { x: 0.7, y: -0.35 },
            { x: -0.7, y: -0.35 },
            { x: -0.7, y: 0.35 },
          ]}
        />
      </footprint>
    }
    {...props}
  />
)

const ModulePad = ({
  name,
  label,
  pcbX,
  pcbY,
  side,
}: {
  name: string
  label: string
  pcbX: number
  pcbY: number
  side: "left" | "right"
}) => {
  const padX = side === "left" ? -0.5 : 0.5

  return (
    <chip
      name={name}
      pcbX={pcbX}
      pcbY={pcbY}
      footprint={
        <footprint>
          <smtpad
            layer="top"
            shape="rect"
            pcbX={`${padX}mm`}
            pcbY="0mm"
            width="2mm"
            height="6mm"
            portHints={["pin1"]}
          />
          <smtpad
            layer="bottom"
            shape="rect"
            pcbX={`${padX}mm`}
            pcbY="0mm"
            width="2mm"
            height="6mm"
            portHints={["pin1"]}
          />
        </footprint>
      }
      pinLabels={{ pin1: label }}
    />
  )
}

export default () => (
  <board
    width="34.8mm"
    height="30mm"
    layers={4}
    autorouterVersion="v6"
    minViaPadDiameter={0.45}
    minViaHoleDiameter={0.3}
  >
    <copperpour connectsTo="net.GND" layer="top" clearance="0.15mm" />
    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.15mm" />

    <cutout shape="rect" {...refRect(102.8, 70.9, 105.2, 72.0)} />
    <cutout shape="rect" {...refRect(102.9, 78.4, 105.2, 79.4)} />
    <cutout shape="rect" {...refRect(102.9, 85.8, 105.1, 87.0)} />
    <cutout shape="rect" {...refRect(135.3, 70.9, 137.4, 72.0)} />
    <cutout shape="rect" {...refRect(135.3, 78.4, 137.6, 79.6)} />
    <cutout shape="rect" {...refRect(135.2, 86.0, 137.5, 87.0)} />
    <cutout shape="circle" {...edgeHole(102.8, 67.7)} />
    <cutout shape="circle" {...edgeHole(102.9, 75.2)} />
    <cutout shape="circle" {...edgeHole(102.9, 82.6)} />
    <cutout shape="circle" {...edgeHole(102.8, 90.2)} />
    <cutout shape="circle" {...edgeHole(137.4, 67.7)} />
    <cutout shape="circle" {...edgeHole(137.6, 75.2)} />
    <cutout shape="circle" {...edgeHole(137.6, 82.8)} />
    <cutout shape="circle" {...edgeHole(137.5, 90.2)} />

    <ModulePad
      name="J8"
      label="VIN"
      {...modulePadPosition(104.5, 67.7)}
      side="left"
    />
    <ModulePad
      name="J1"
      label="nCE"
      {...modulePadPosition(104.6, 75.2)}
      side="left"
    />
    <ModulePad
      name="J6"
      label="ON_OFF"
      {...modulePadPosition(104.6, 82.6)}
      side="left"
    />
    <ModulePad
      name="J7"
      label="ALM"
      {...modulePadPosition(104.5, 90.2)}
      side="left"
    />
    <ModulePad
      name="J2"
      label="VOUT"
      {...modulePadPosition(135.7, 67.7)}
      side="right"
    />
    <ModulePad
      name="J3"
      label="GND"
      {...modulePadPosition(135.9, 75.1)}
      side="right"
    />
    <ModulePad
      name="J5"
      label="SDA"
      {...modulePadPosition(135.9, 82.9)}
      side="right"
    />
    <ModulePad
      name="J4"
      label="SCL"
      {...modulePadPosition(135.8, 90.2)}
      side="right"
    />

    <B2B_PH_SM4_TBT_LF__SN_ name="SLPWR1" {...p(112.2, 71)} />
    <B2B_PH_SM4_TBT_LF__SN_ name="SLPWR2" {...p(128.2, 71)} />

    <BQ24650RVAR name="U3" {...p(112.2, 86)} />

    <MCP73113T_06SI_MF name="U2" {...p(129.2, 82, 270)} />

    <STC3117IJT name="IC1" {...p(130, 76.8, 270)} />

    <LT1129CS8_3_3_PBF name="U1" {...p(122.6, 89.8)} />

    <DMG3404L_7 name="Q1" {...p(117, 78.2, 90)} />
    <DMG3404L_7 name="Q2" {...p(120.6, 78.2, 90)} />
    <DMG3404L_7 name="Q3" {...p(109, 78.3, 270)} />

    <resistor
      name="R1"
      resistance="100k"
      footprint="0201"
      {...jlcpcb("C270364")}
      {...p(122, 84.38, 270)}
    />
    <resistor
      name="R2"
      resistance="499k"
      footprint="0201"
      {...jlcpcb("C138138")}
      {...p(121.55, 81.1, 270)}
    />
    <resistor
      name="R3"
      resistance="499k"
      footprint="0201"
      {...jlcpcb("C138138")}
      {...p(110.6, 82.5, 270)}
    />
    <resistor
      name="R4"
      resistance="36k"
      footprint="0201"
      {...jlcpcb("C295796")}
      {...p(109.2, 84, 270)}
    />
    <resistor
      name="R5"
      resistance="2ohm"
      footprint="0201"
      {...jlcpcb("C240147")}
      {...p(112.6, 76, 180)}
    />
    <resistor
      name="R6"
      resistance="10ohm"
      footprint="0201"
      {...jlcpcb("C270817")}
      {...p(114, 79.7, 180)}
    />
    <resistor
      name="R7"
      resistance="1k"
      footprint="0201"
      {...jlcpcb("C270365")}
      {...p(129.3, 86, 270)}
    />
    <resistor
      name="R8"
      resistance="1k"
      footprint="0201"
      {...jlcpcb("C270365")}
      {...p(131.8, 86.2, 90)}
    />
    <resistor
      name="R9"
      resistance="1k"
      footprint="0201"
      {...jlcpcb("C270365")}
      {...p(126.6, 75.2, 180)}
    />
    <resistor
      name="R10"
      resistance="1k"
      footprint="0201"
      {...jlcpcb("C270365")}
      {...p(108.9, 88.8, 270)}
    />
    <resistor
      name="R11"
      resistance="1k"
      footprint="0201"
      {...jlcpcb("C270365")}
      {...p(108, 85.2, 270)}
    />
    <resistor
      name="RS1"
      resistance="0.005ohm"
      footprint="0201"
      {...jlcpcb("C2981420")}
      {...p(131.5, 75.2)}
    />
    <resistor
      name="RSR1"
      resistance="0.02ohm"
      footprint="0201"
      {...jlcpcb("C76748")}
      {...p(119.95, 81.1, 90)}
    />

    <capacitor
      name="C1"
      capacitance="2.2uF"
      footprint="0201"
      {...jlcpcb("C319184")}
      {...p(111, 76, 180)}
    />
    <capacitor
      name="C2"
      capacitance="1uF"
      footprint="0201"
      {...jlcpcb("C53067")}
      {...p(113, 83, 90)}
    />
    <capacitor
      name="C3"
      capacitance="1uF"
      footprint="0201"
      {...jlcpcb("C53067")}
      {...p(127.4, 76.2, 180)}
    />
    <capacitor
      name="C4"
      capacitance="1uF"
      footprint="0201"
      {...jlcpcb("C53067")}
      {...p(115.75, 85.8, 270)}
    />
    <capacitor
      name="C5"
      capacitance="0.1uF"
      footprint="0201"
      {...jlcpcb("C76928")}
      {...p(114.5, 82.9)}
    />
    <CL10A106MA8NRNC name="C6" {...p(113, 81.2)} />
    <capacitor
      name="C7"
      capacitance="0.1uF"
      footprint="0201"
      {...jlcpcb("C76928")}
      {...p(117.62, 83.7, 180)}
    />
    <CL10A106MA8NRNC name="C8" {...p(120.3, 83.68, 270)} />
    <capacitor
      name="C9"
      capacitance="4.7uF"
      footprint="0201"
      {...jlcpcb("C335103")}
      {...p(118.5, 85.08, 270)}
    />
    <capacitor
      name="C10"
      capacitance="22pF"
      footprint="0201"
      {...jlcpcb("C57783")}
      {...p(122.6, 81.98, 270)}
    />
    <capacitor
      name="C11"
      capacitance="220nF"
      footprint="0201"
      {...jlcpcb("C76932")}
      {...p(125.12, 75.2, 180)}
    />
    <capacitor
      name="Cin1"
      capacitance="22pF"
      footprint="0201"
      {...jlcpcb("C57783")}
      {...p(131.8, 80.6, 90)}
    />
    <capacitor
      name="Cout1"
      capacitance="22pF"
      footprint="0201"
      {...jlcpcb("C57783")}
      {...p(131.6, 79.0, 180)}
    />
    <CL31A107MQHNNNE name="C_VOLT1" {...p(127.2, 88.725, 90)} />
    <CL31A107MQHNNNE name="C_VOLT2" {...p(114.7, 91.45, 90)} />

    <SPH202012H100MT name="L1" {...p(117.52, 81.7, 180)} />
    <SPH202012H100MT name="L2" {...p(111.8, 90.3, 270)} />

    <ReferenceDiode0201 name="D1" {...p(114.8, 78.6, 90)} />
    <ReferenceDiode0201 name="D2" {...p(114.95, 86.95, 90)} />
    <ReferenceDiode0201 name="D3" {...p(133.2, 76.1, 270)} />
    <B5819W_SL name="D5" {...p(117.6, 89.25, 270)} />

    <ReferenceDiode0201 name="D4" {...p(128.6, 84.5, 180)} />
    <ReferenceDiode0201 name="D6" {...p(109.7, 90.15, 90)} />
    <ReferenceDiode0201 name="D7" {...p(107, 84, 90)} />

    <pcbnotetext
      pcbX={2.8}
      pcbY={9}
      text="Battery Connector"
      fontSize={0.7}
      anchorAlignment="center"
      pcbRotation={270}
    />
    <pcbnotetext
      pcbX={-2.5}
      pcbY={10.2}
      text="Solar Panel"
      fontSize={0.7}
      anchorAlignment="center"
      pcbRotation={90}
    />
    <pcbnotetext
      pcbX={13.4}
      pcbY={11.2}
      text="Vout"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={90}
    />
    <pcbnotetext
      pcbX={13.4}
      pcbY={4}
      text="GND"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={90}
    />
    <pcbnotetext
      pcbX={13.2}
      pcbY={-3.7}
      text="SDA"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={90}
    />
    <pcbnotetext
      pcbX={13.2}
      pcbY={-10.7}
      text="SCL"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={90}
    />
    <pcbnotetext
      pcbX={-13.4}
      pcbY={-11.3}
      text="Alarm"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={270}
    />
    <pcbnotetext
      pcbX={-13.4}
      pcbY={-3.5}
      text="Power ON/OFF"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={270}
    />
    <pcbnotetext
      pcbX={-13.4}
      pcbY={4.6}
      text="nCE"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={270}
    />
    <pcbnotetext
      pcbX={-13.3}
      pcbY={10.3}
      text="Vin"
      fontSize={0.5}
      anchorAlignment="center"
      pcbRotation={270}
    />
    <chip
      name="LOGO1"
      pcbX={0.1}
      pcbY={-0.2}
      pcbRotation={180}
      layer="bottom"
      footprint={
        <footprint>
          <silkscreentext
            text="OSHW"
            fontSize="2.4mm"
            anchorAlignment="center"
          />
        </footprint>
      }
    />

    <trace from="SLPWR1.pin1" to="net.VCC" />
    <trace from="SLPWR1.pin2" to="net.GND" />
    <trace from="SLPWR2.pin1" to="net.BATD" />
    <trace from="SLPWR2.pin2" to="net.CS" />

    <trace from="U3.VCC" to="net.VCC" />
    <trace from="U3.MPPSET" to="net.MPPSET" />
    <trace from="U3.STAT1" to="net.STAT_1" />
    <trace from="U3.STAT2" to="net.STAT_2" />
    <trace from="U3.VREF" to="net.VREF" />
    <trace from="U3.TERM_EN" to="net.VREF" />
    <trace from="U3.VFB" to="net.VFB" />
    <trace from="U3.SRN" to="net.BATTERY" />
    <trace from="U3.SRP" to="net.SRP" />
    <trace from="U3.GND" to="net.GND" />
    <trace from="U3.REGN" to="net.REGN" />
    <trace from="U3.LODRV" to="net.LODRV" />
    <trace from="U3.PH" to="net.PH" />
    <trace from="U3.HIDRV" to="net.HIDRV" />
    <trace from="U3.BTST" to="net.BTST" />
    <trace from="U3.EP" to="net.GND" />

    <trace from="Q1.G" to="net.HIDRV" />
    <trace from="Q1.S" to="net.PH" />
    <trace from="Q1.D" to="net.VCC_BOOT" />
    <trace from="Q2.G" to="net.LODRV" />
    <trace from="Q2.S" to="net.GND" />
    <trace from="Q2.D" to="net.PH" />
    <trace from="Q3.G" to="net.nCE" />
    <trace from="Q3.S" to="net.GND" />
    <trace from="Q3.D" to="net.MPPSET" />

    <trace from="R3.pin1" to="net.VCC" />
    <trace from="R3.pin2" to="net.MPPSET" />
    <trace from="R4.pin1" to="net.MPPSET" />
    <trace from="R4.pin2" to="net.GND" />
    <trace from="R5.pin1" to="net.VCC" />
    <trace from="R5.pin2" to="net.C1_FILTER" />
    <trace from="C1.pin1" to="net.C1_FILTER" />
    <trace from="C1.pin2" to="net.GND" />
    <trace from="R6.pin1" to="net.VCC_BOOT" />
    <trace from="R6.pin2" to="net.VCC" />
    <trace from="C2.pin1" to="net.VCC" />
    <trace from="C2.pin2" to="net.GND" />
    <trace from="C6.pin1" to="net.VCC_BOOT" />
    <trace from="C6.pin2" to="net.GND" />
    <trace from="D1.pin1" to="net.VCC_BOOT" />
    <trace from="D1.pin2" to="net.VCC" />

    <trace from="U3.REGN" to="D2.pin2" />
    <trace from="D2.pin2" to="C4.pin1" />
    <trace from="C4.pin2" to="net.GND" />
    <trace from="C5.pin1" to="net.PH" />
    <trace from="U3.BTST" to="D2.pin1" />
    <trace from="D2.pin1" to="C5.pin2" />

    <trace from="L1.pin1" to="net.SRP" />
    <trace from="L1.pin2" to="net.PH" />
    <trace from="RSR1.pin1" to="net.SRP" />
    <trace from="RSR1.pin2" to="net.BATTERY" />
    <trace from="C7.pin1" to="net.BATTERY" />
    <trace from="C7.pin2" to="net.SRP" />
    <trace from="C8.pin1" to="net.BATTERY" />
    <trace from="C8.pin2" to="net.GND" />
    <trace from="C9.pin1" to="net.BATTERY" />
    <trace from="C9.pin2" to="net.GND" />
    <trace from="R2.pin1" to="net.BATTERY" />
    <trace from="R2.pin2" to="net.VFB" />
    <trace from="R1.pin1" to="net.VFB" />
    <trace from="R1.pin2" to="net.GND" />
    <trace from="C10.pin1" to="net.BATTERY" />
    <trace from="C10.pin2" to="net.VFB" />

    <trace from="D7.pin1" to="net.STAT1_LED" />
    <trace from="D7.pin2" to="net.VCC" />
    <trace from="R11.pin1" to="net.STAT_1" />
    <trace from="R11.pin2" to="net.STAT1_LED" />
    <trace from="D6.pin1" to="net.STAT2_LED" />
    <trace from="D6.pin2" to="net.VCC" />
    <trace from="R10.pin1" to="net.STAT_2" />
    <trace from="R10.pin2" to="net.STAT2_LED" />

    <trace from="U2.VDD1" to="net.BATTERY" />
    <trace from="U2.VDD2" to="net.BATTERY" />
    <trace from="U2.VBAT1" to="net.BATD" />
    <trace from="U2.VBAT2" to="net.BATD" />
    <trace from="U2.STAT" to="net.U2_STAT" />
    <trace from="U2.VSS1" to="net.GND" />
    <trace from="U2.VSS2" to="net.GND" />
    <trace from="U2.PROG" to="net.U2_PROG" />
    <trace from="D4.pin1" to="net.U2_STAT_LED" />
    <trace from="D4.pin2" to="net.BATTERY" />
    <trace from="R7.pin1" to="net.U2_STAT" />
    <trace from="R7.pin2" to="net.U2_STAT_LED" />
    <trace from="R8.pin1" to="net.U2_PROG" />
    <trace from="R8.pin2" to="net.GND" />

    <trace from="IC1.A2" to="net.SDA" />
    <trace from="IC1.A3" to="net.GND" />
    <trace from="IC1.B1" to="net.BATD" />
    <trace from="IC1.B2" to="net.SCL" />
    <trace from="IC1.B3" to="net.CS" />
    <trace from="IC1.C1" to="net.IC1_VIN" />
    <trace from="IC1.C2" to="net.BATD" />
    <trace from="IC1.C3" to="net.ALM" />
    <trace from="R9.pin1" to="net.BATD" />
    <trace from="R9.pin2" to="net.IC1_VIN" />
    <trace from="C11.pin1" to="net.IC1_VIN" />
    <trace from="C11.pin2" to="net.GND" />
    <trace from="RS1.pin1" to="net.CS" />
    <trace from="RS1.pin2" to="net.GND" />

    <trace from="C3.pin1" to="net.BATD" />
    <trace from="C3.pin2" to="net.GND" />
    <trace from="Cout1.pin1" to="net.GND" />
    <trace from="Cout1.pin2" to="net.BATD" />
    <trace from="Cin1.pin1" to="net.GND" />
    <trace from="Cin1.pin2" to="net.BATTERY" />
    <trace from="D3.pin1" to="net.BATTERY" />
    <trace from="D3.pin2" to="net.VIN_RAW" />

    <trace from="U1.OUTPUT" to="net.VOUT" />
    <trace from="U1.SENSE" to="net.D5_SW" />
    <trace from="U1.GND1" to="net.GND" />
    <trace from="U1.NC" to="net.D5_SW" />
    <trace from="U1.SHDN" to="net.ON_OFF" />
    <trace from="U1.GND2" to="net.GND" />
    <trace from="U1.GND3" to="net.GND" />
    <trace from="U1.VIN" to="net.BATD" />
    <trace from="L2.pin1" to="net.D5_SW" />
    <trace from="L2.pin2" to="net.VOUT" />
    <trace from="D5.pin1" to="net.D5_SW" />
    <trace from="D5.pin2" to="net.GND" />
    <trace from="C_VOLT1.pin1" to="net.GND" />
    <trace from="C_VOLT1.pin2" to="net.BATD" />
    <trace from="C_VOLT2.pin1" to="net.GND" />
    <trace from="C_VOLT2.pin2" to="net.VOUT" />

    <trace from="J8.VIN" to="net.VIN_RAW" />
    <trace from="J1.nCE" to="net.nCE" />
    <trace from="J6.ON_OFF" to="net.ON_OFF" />
    <trace from="J7.ALM" to="net.ALM" />
    <trace from="J2.VOUT" to="net.VOUT" />
    <trace from="J3.GND" to="net.GND" />
    <trace from="J5.SDA" to="net.SDA" />
    <trace from="J4.SCL" to="net.SCL" />
  </board>
)
