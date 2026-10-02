import type { ChipProps } from "@tscircuit/props"

export const pinLabels = {
  pin1: ["A1", "VDDQ1"],
  pin2: ["B1", "VSSQ1"],
  pin3: ["C1", "VDDQ2"],
  pin4: ["D1", "VSSQ2"],
  pin5: ["E1", "VSS1"],
  pin6: ["F1", "VDDQ3"],
  pin7: ["G1", "VSSQ3"],
  pin8: ["H1", "VREFDQ"],
  pin9: ["J1", "NC1"],
  pin10: ["K1", "ODT"],
  pin11: ["L1", "NC2"],
  pin12: ["M1", "VSS2"],
  pin13: ["N1", "VDD1"],
  pin14: ["P1", "VSS3"],
  pin15: ["R1", "VDD2"],
  pin16: ["T1", "VSS4"],
  pin17: ["A2", "DQU5"],
  pin18: ["B2", "VDD3"],
  pin19: ["C2", "DQU3"],
  pin20: ["D2", "VDDQ4"],
  pin21: ["E2", "VSSQ4"],
  pin22: ["F2", "DQL2"],
  pin23: ["G2", "DQL6"],
  pin24: ["H2", "VDDQ5"],
  pin25: ["J2", "VSS5"],
  pin26: ["K2", "VDD4"],
  pin27: ["L2", "N_CS"],
  pin28: ["M2", "BA0"],
  pin29: ["N2", "A3"],
  pin30: ["P2", "A5"],
  pin31: ["R2", "A7"],
  pin32: ["T2", "N_RESET"],
  pin33: ["A3", "DQU7"],
  pin34: ["B3", "VSS6"],
  pin35: ["C3", "DQU1"],
  pin36: ["D3", "DMU"],
  pin37: ["E3", "DQL0"],
  pin38: ["F3", "DQSL"],
  pin39: ["G3", "N_DQSl"],
  pin40: ["H3", "DQL4"],
  pin41: ["J3", "N_RAS"],
  pin42: ["K3", "N_CAS"],
  pin43: ["L3", "N_WE"],
  pin44: ["M3", "BA2"],
  pin45: ["N3", "A0"],
  pin46: ["P3", "A2"],
  pin47: ["R3", "A9"],
  pin48: ["T3", "NC3"],
  pin49: ["A7", "DQU4"],
  pin50: ["B7", "N_DQSU"],
  pin51: ["C7", "DQSU"],
  pin52: ["D7", "DQU0"],
  pin53: ["E7", "DML"],
  pin54: ["F7", "DQL1"],
  pin55: ["G7", "VDD5"],
  pin56: ["H7", "DQL7"],
  pin57: ["J7", "CK"],
  pin58: ["K7", "N_CK"],
  pin59: ["L7", "A10"],
  pin60: ["M7", "NC4"],
  pin61: ["N7", "A12"],
  pin62: ["P7", "A1"],
  pin63: ["R7", "A11"],
  pin64: ["T7", "NC5"],
  pin65: ["A8", "VDDQ6"],
  pin66: ["B8", "DQU6"],
  pin67: ["C8", "DQU2"],
  pin68: ["D8", "VSSQ5"],
  pin69: ["E8", "VSSQ6"],
  pin70: ["F8", "DQL3"],
  pin71: ["G8", "VSS7"],
  pin72: ["H8", "DQL5"],
  pin73: ["J8", "VSS8"],
  pin74: ["K8", "VDD6"],
  pin75: ["L8", "ZQ"],
  pin76: ["M8", "VREFCA"],
  pin77: ["N8", "BA1"],
  pin78: ["P8", "A4"],
  pin79: ["R8", "A6"],
  pin80: ["T8", "A8"],
  pin81: ["A9", "VSS9"],
  pin82: ["B9", "VSSQ7"],
  pin83: ["C9", "VDDQ7"],
  pin84: ["D9", "VDD7"],
  pin85: ["E9", "VDDQ8"],
  pin86: ["F9", "VSSQ8"],
  pin87: ["G9", "VSSQ9"],
  pin88: ["H9", "VDDQ9"],
  pin89: ["J9", "NC6"],
  pin90: ["K9", "CKE"],
  pin91: ["L9", "NC7"],
  pin92: ["M9", "VSS10"],
  pin93: ["N9", "VDD8"],
  pin94: ["P9", "VSS11"],
  pin95: ["R9", "VDD9"],
  pin96: ["T9", "VSS12"],
} as const

export const W631GG6MB_12 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      // Keep ball designators distinct from signal aliases (A1 is both a ball and an address signal).
      pinLabels={Object.fromEntries(
        Object.entries(pinLabels).map(([pin, [ball, signal]]) => [
          pin,
          [ball, `signal_${signal}`],
        ]),
      )}
      supplierPartNumbers={{
        jlcpcb: ["C408825"],
      }}
      manufacturerPartNumber="W631GG6MB-12"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-3.199892mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-3.199892mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-3.199892mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-3.199892mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-3.199892mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-3.199892mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.199892mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-3.199892mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-3.199892mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-3.199892mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-3.199892mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-3.199892mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-3.199892mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-3.199892mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-3.199892mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-3.199892mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-2.400046mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-2.400046mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-2.400046mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-2.400046mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-2.400046mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-2.400046mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-2.400046mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-2.400046mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="-2.400046mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="-2.400046mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="-2.400046mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="-2.400046mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="-2.400046mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="-2.400046mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="-2.400046mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="-2.400046mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="-1.599946mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="-1.599946mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="-1.599946mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="-1.599946mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="-1.599946mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="-1.599946mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="-1.599946mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-1.599946mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-1.599946mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-1.599946mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-1.599946mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-1.599946mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="-1.599946mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="-1.599946mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="-1.599946mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="-1.599946mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin49"]}
            pcbX="1.599946mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin50"]}
            pcbX="1.599946mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin51"]}
            pcbX="1.599946mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin52"]}
            pcbX="1.599946mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin53"]}
            pcbX="1.599946mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin54"]}
            pcbX="1.599946mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin55"]}
            pcbX="1.599946mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin56"]}
            pcbX="1.599946mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin57"]}
            pcbX="1.599946mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin58"]}
            pcbX="1.599946mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin59"]}
            pcbX="1.599946mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin60"]}
            pcbX="1.599946mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin61"]}
            pcbX="1.599946mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin62"]}
            pcbX="1.599946mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin63"]}
            pcbX="1.599946mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin64"]}
            pcbX="1.599946mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin65"]}
            pcbX="2.400046mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin66"]}
            pcbX="2.400046mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin67"]}
            pcbX="2.400046mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin68"]}
            pcbX="2.400046mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin69"]}
            pcbX="2.400046mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin70"]}
            pcbX="2.400046mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin71"]}
            pcbX="2.400046mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin72"]}
            pcbX="2.400046mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin73"]}
            pcbX="2.400046mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin74"]}
            pcbX="2.400046mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin75"]}
            pcbX="2.400046mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin76"]}
            pcbX="2.400046mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin77"]}
            pcbX="2.400046mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin78"]}
            pcbX="2.400046mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin79"]}
            pcbX="2.400046mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin80"]}
            pcbX="2.400046mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin81"]}
            pcbX="3.199892mm"
            pcbY="5.999861mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin82"]}
            pcbX="3.199892mm"
            pcbY="5.199761mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin83"]}
            pcbX="3.199892mm"
            pcbY="4.399915mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin84"]}
            pcbX="3.199892mm"
            pcbY="3.599815mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin85"]}
            pcbX="3.199892mm"
            pcbY="2.799969mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin86"]}
            pcbX="3.199892mm"
            pcbY="1.999869mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin87"]}
            pcbX="3.199892mm"
            pcbY="1.199769mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin88"]}
            pcbX="3.199892mm"
            pcbY="0.399923mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin89"]}
            pcbX="3.199892mm"
            pcbY="-0.400177mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin90"]}
            pcbX="3.199892mm"
            pcbY="-1.200023mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin91"]}
            pcbX="3.199892mm"
            pcbY="-2.000123mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin92"]}
            pcbX="3.199892mm"
            pcbY="-2.800223mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin93"]}
            pcbX="3.199892mm"
            pcbY="-3.600069mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin94"]}
            pcbX="3.199892mm"
            pcbY="-4.400169mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin95"]}
            pcbX="3.199892mm"
            pcbY="-5.200015mm"
            radius="0.175006mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin96"]}
            pcbX="3.199892mm"
            pcbY="-6.000115mm"
            radius="0.175006mm"
            shape="circle"
          />
          <silkscreencircle
            pcbX="-4.191mm"
            pcbY="5.968873mm"
            radius="0.100076mm"
          />
          <silkscreenrect
            pcbX="0mm"
            pcbY="0mm"
            width="7.500112mm"
            height="12.999974mm"
            strokeWidth="0.1999996mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.2667mm"
            pcbY="7.527673mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.542599999999993, y: 6.77767300000005 },
              { x: 4.009199999999851, y: 6.77767300000005 },
              { x: 4.009199999999851, y: -6.752526999999986 },
              { x: -4.542599999999993, y: -6.752526999999986 },
              { x: -4.542599999999993, y: 6.77767300000005 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C408825.obj?uuid=ad4fb88e379c496cbe0bdd4afce603af",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C408825.step?uuid=ad4fb88e379c496cbe0bdd4afce603af",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.000012700000070253736,
          y: 0.00012700000002041634,
          z: -0.325,
        },
      }}
      {...props}
    />
  )
}
