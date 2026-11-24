import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["USBDN1_DM", "PRT_DIS_M1"],
  pin2: ["USBDN1_DP", "PRT_DIS_P1"],
  pin3: ["USBDN2_DM", "PRT_DIS_M2"],
  pin4: ["USBDN2_DP", "PRT_DIS_P2"],
  pin5: ["VDDA332"],
  pin6: ["USBDN3_DM", "PRT_DIS_M3"],
  pin7: ["USBDN3_DP", "PRT_DIS_P3"],
  pin8: ["USBDN4_DM", "PRT_DIS_M4"],
  pin9: ["USBDN4_DP", "PRT_DIS_P4"],
  pin10: ["VDDA331"],
  pin11: ["USBDN5_DM", "PRT_DIS_M5"],
  pin12: ["USBDN5_DP", "PRT_DIS_P5"],
  pin13: ["CFG_SEL2"],
  pin14: ["LED_B7_N"],
  pin15: ["LED_A7_N", "PRT_SWP7"],
  pin16: ["LED_B6_N"],
  pin17: ["LED_A6_N", "PRT_SWP6"],
  pin18: ["LED_B5_N"],
  pin19: ["TEST"],
  pin20: ["PRTPWR4"],
  pin21: ["OCS4_N"],
  pin22: ["OCS3_N"],
  pin23: ["PRTPWR3"],
  pin24: ["VDD33CR"],
  pin25: ["VDD18"],
  pin26: ["PRTPWR2"],
  pin27: ["OCS2_N"],
  pin28: ["OCS1_N"],
  pin29: ["PRTPWR1"],
  pin30: ["PRTPWR5"],
  pin31: ["LED_A5_N", "PRT_SWP5"],
  pin32: ["LED_B4_N"],
  pin33: ["LED_A4_N", "PRT_SWP4"],
  pin34: ["LED_B3_N", "GANG_EN"],
  pin35: ["OCS5_N"],
  pin36: ["PRTPWR7"],
  pin37: ["OCS7_N"],
  pin38: ["OCS6_N"],
  pin39: ["PRTPWR6"],
  pin40: ["SDA", "SMBDATA", "NON_REM1"],
  pin41: ["SCL", "SMBCLK", "CFG_SEL0"],
  pin42: ["HS_IND", "CFG_SEL1"],
  pin43: ["RESET_N"],
  pin44: ["VBUS_DET"],
  pin45: ["SUSP_IND", "LOCAL_PWR", "NON_REM0"],
  pin46: ["VDD33"],
  pin47: ["LED_A3_N", "PRT_SWP3"],
  pin48: ["LED_B2_N", "BOOST1"],
  pin49: ["LED_A2_N", "PRT_SWP2"],
  pin50: ["LED_B1_N", "BOOST0"],
  pin51: ["LED_A1_N", "PRT_SWP1"],
  pin52: ["VDDA333"],
  pin53: ["USBDN6_DM", "PRT_DIS_M6"],
  pin54: ["USBDN6_DP", "PRT_DIS_P6"],
  pin55: ["USBDN7_DM", "PRT_DIS_M7"],
  pin56: ["USBDN7_DP", "PRT_DIS_P7"],
  pin57: ["VDDA334"],
  pin58: ["USBUP_DM"],
  pin59: ["USBUP_DP"],
  pin60: ["XTAL2"],
  pin61: ["XTAL1", "CLKIN"],
  pin62: ["VDD18PLL"],
  pin63: ["RBIAS"],
  pin64: ["VDD33PLL"],
  pin65: ["VSS"],
} as const

const pinAttributes = {
  pin5: { requiresPower: true },
  pin10: { requiresPower: true },
  pin52: { requiresPower: true },
  pin57: { requiresPower: true },
  pin65: { requiresGround: true },
} as const

export const USB2517I_JZX = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C478081"],
      }}
      manufacturerPartNumber="USB2517I-JZX"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin16"]}
            pcbX="-4.449953mm"
            pcbY="-3.749929mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-4.449953mm"
            pcbY="-3.250057mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-4.449953mm"
            pcbY="-2.749931mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-4.449953mm"
            pcbY="-2.250059mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-4.449953mm"
            pcbY="-1.749933mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-4.449953mm"
            pcbY="-1.250061mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-4.449953mm"
            pcbY="-0.749935mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-4.449953mm"
            pcbY="-0.250063mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-4.449953mm"
            pcbY="0.250063mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-4.449953mm"
            pcbY="0.749935mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-4.449953mm"
            pcbY="1.250061mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-4.449953mm"
            pcbY="1.749933mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-4.449953mm"
            pcbY="2.250059mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-4.449953mm"
            pcbY="2.749931mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-4.449953mm"
            pcbY="3.250057mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-4.449953mm"
            pcbY="3.749929mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-3.749929mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-3.250057mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-2.749931mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-2.250059mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-1.749933mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-1.250061mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-0.749935mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-0.250063mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="0.250063mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="0.749935mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="1.250061mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="1.749933mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="2.250059mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="2.749931mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="3.250057mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="3.749929mm"
            pcbY="-4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="4.449953mm"
            pcbY="-3.750183mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="4.449953mm"
            pcbY="-3.250057mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="4.449953mm"
            pcbY="-2.750185mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="4.449953mm"
            pcbY="-2.250059mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="4.449953mm"
            pcbY="-1.750187mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="4.449953mm"
            pcbY="-1.250061mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="4.449953mm"
            pcbY="-0.750189mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="4.449953mm"
            pcbY="-0.250063mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="4.449953mm"
            pcbY="0.249809mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="4.449953mm"
            pcbY="0.749935mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="4.449953mm"
            pcbY="1.249807mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="4.449953mm"
            pcbY="1.749933mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="4.449953mm"
            pcbY="2.249805mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="4.449953mm"
            pcbY="2.749931mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="4.449953mm"
            pcbY="3.249803mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="4.449953mm"
            pcbY="3.749929mm"
            width="0.850011mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin49"]}
            pcbX="3.749929mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin50"]}
            pcbX="3.250057mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin51"]}
            pcbX="2.749931mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin52"]}
            pcbX="2.250059mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin53"]}
            pcbX="1.749933mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin54"]}
            pcbX="1.250061mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin55"]}
            pcbX="0.749935mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin56"]}
            pcbX="0.250063mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin57"]}
            pcbX="-0.250063mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin58"]}
            pcbX="-0.749935mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin59"]}
            pcbX="-1.250061mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin60"]}
            pcbX="-1.749933mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin61"]}
            pcbX="-2.250059mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin62"]}
            pcbX="-2.749931mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin63"]}
            pcbX="-3.250057mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin64"]}
            pcbX="-3.749929mm"
            pcbY="4.449953mm"
            width="0.2999994mm"
            height="0.850011mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin65"]}
            pcbX="0.000127mm"
            pcbY="-0.000127mm"
            width="4.7999904mm"
            height="4.7999904mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 4.251070999999911, y: 4.704841999999985 },
              { x: 4.748910999999907, y: 4.704841999999985 },
              { x: 4.748910999999907, y: 4.207001999999875 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.170476799999847, y: -4.760188599999992 },
              { x: 4.668316799999843, y: -4.760188599999992 },
              { x: 4.668316799999843, y: -4.262348599999996 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.729683200000068, y: -4.1952925999999024 },
              { x: -4.729683200000068, y: -4.693132600000013 },
              { x: -4.231843200000185, y: -4.693132600000013 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.729683200000068, y: 4.207027400000015 },
              { x: -4.729683200000068, y: 4.704867399999898 },
              { x: -4.231843200000185, y: 4.704867399999898 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.699000000000069, y: 4.825949199999968 },
              { x: -4.8496293292496375, y: 4.974677555883773 },
              { x: -4.9989940235595896, y: 4.824679200000105 },
              { x: -4.849629329249865, y: 4.67468084411621 },
              { x: -4.699000000000069, y: 4.823409199999901 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.132207mm"
            pcbY="5.984369mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -5.124958500000048, y: 5.124958499999934 },
              { x: 5.124958499999934, y: 5.124958499999934 },
              { x: 5.124958499999934, y: -5.124958500000048 },
              { x: -5.124958500000048, y: -5.124958500000048 },
              { x: -5.124958500000048, y: 5.124958499999934 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C478081.obj?uuid=bd78003bcb1d41e4bbba69dca96032a0",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C478081.step?uuid=bd78003bcb1d41e4bbba69dca96032a0",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.00005080000005364127, z: -0.05 },
      }}
      {...props}
    />
  )
}
