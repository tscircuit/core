import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDDQ1", "A11"],
  pin2: ["VSSQ1", "B1"],
  pin3: ["VDDQ2", "C1"],
  pin4: ["VSSQ2", "D1"],
  pin5: ["VSS1", "E1"],
  pin6: ["VDDQ3", "F1"],
  pin7: ["VSSQ3", "G1"],
  pin8: ["VREFDQ", "H1"],
  pin9: ["NC1", "J1"],
  pin10: ["ODT", "K1"],
  pin11: ["NC2", "L1"],
  pin12: ["VSS2", "M1"],
  pin13: ["VDD1", "N1"],
  pin14: ["VSS3", "P1"],
  pin15: ["VDD2", "R1"],
  pin16: ["VSS4", "T1"],
  pin17: ["DQU5", "A21"],
  pin18: ["VDD3", "B2"],
  pin19: ["DQU3", "C2"],
  pin20: ["VDDQ4", "D2"],
  pin21: ["VSSQ4", "E2"],
  pin22: ["DQL2", "F2"],
  pin23: ["DQL6", "G2"],
  pin24: ["VDDQ5", "H2"],
  pin25: ["VSS5", "J2"],
  pin26: ["VDD4", "K2"],
  pin27: ["N_CS", "L2"],
  pin28: ["BA0", "M2"],
  pin29: ["A31", "N2"],
  pin30: ["A5", "P2"],
  pin31: ["A71", "R2"],
  pin32: ["N_RESET", "T2"],
  pin33: ["DQU7", "A32"],
  pin34: ["VSS6", "B3"],
  pin35: ["DQU1", "C3"],
  pin36: ["DMU", "D3"],
  pin37: ["DQL0", "E3"],
  pin38: ["DQSL", "F3"],
  pin39: ["N_DQSL", "G3"],
  pin40: ["DQL4", "H3"],
  pin41: ["N_RAS", "J3"],
  pin42: ["N_CAS", "K3"],
  pin43: ["N_WE", "L3"],
  pin44: ["BA2", "M3"],
  pin45: ["A0", "N3"],
  pin46: ["A22", "P3"],
  pin47: ["A91", "R3"],
  pin48: ["A13", "T3"],
  pin49: ["DQU4", "A72"],
  pin50: ["N_DQSU", "B7"],
  pin51: ["DQSU", "C7"],
  pin52: ["DQU0", "D7"],
  pin53: ["DML", "E7"],
  pin54: ["DQL1", "F7"],
  pin55: ["VDD5", "G7"],
  pin56: ["DQL7", "H7"],
  pin57: ["CK", "J7"],
  pin58: ["N_CK", "K7"],
  pin59: ["A10", "AP", "L7"],
  pin60: ["NC3", "M7"],
  pin61: ["A12", "N_BC", "N7"],
  pin62: ["A12", "P7"],
  pin63: ["A11", "R7"],
  pin64: ["A14", "T7"],
  pin65: ["VDDQ6", "A81"],
  pin66: ["DQU6", "B8"],
  pin67: ["DQU2", "C8"],
  pin68: ["VSSQ5", "D8"],
  pin69: ["VSSQ6", "E8"],
  pin70: ["DQL3", "F8"],
  pin71: ["VSS7", "G8"],
  pin72: ["DQL5", "H8"],
  pin73: ["VSS8", "J8"],
  pin74: ["VDD6", "K8"],
  pin75: ["ZQ", "L8"],
  pin76: ["VREFCA", "M8"],
  pin77: ["BA1", "N8"],
  pin78: ["A4", "P8"],
  pin79: ["A6", "R8"],
  pin80: ["A82", "T8"],
  pin81: ["VSS9", "A92"],
  pin82: ["VSSQ7", "B9"],
  pin83: ["VDDQ7", "C9"],
  pin84: ["VDD7", "D9"],
  pin85: ["VDDQ8", "E9"],
  pin86: ["VSSQ8", "F9"],
  pin87: ["VSSQ9", "G9"],
  pin88: ["VDDQ9", "H9"],
  pin89: ["NC4", "J9"],
  pin90: ["CKE", "K9"],
  pin91: ["NC5", "L9"],
  pin92: ["VSS10", "M9"],
  pin93: ["VDD8", "N9"],
  pin94: ["VSS11", "P9"],
  pin95: ["VDD9", "R9"],
  pin96: ["VSS12", "T9"],
} as const

export const NT5CC256M16ER_EK = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C428584"],
      }}
      manufacturerPartNumber="NT5CC256M16ER-EK"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-3.199892mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-3.199892mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-3.199892mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-3.199892mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-3.199892mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-3.199892mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.199892mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="-3.199892mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="-3.199892mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="-3.199892mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="-3.199892mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="-3.199892mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="-3.199892mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-3.199892mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-3.199892mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-3.199892mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-2.400046mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-2.400046mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-2.400046mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-2.400046mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-2.400046mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-2.400046mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-2.400046mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-2.400046mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="-2.400046mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="-2.400046mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="-2.400046mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="-2.400046mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="-2.400046mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="-2.400046mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="-2.400046mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="-2.400046mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="-1.599946mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="-1.599946mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="-1.599946mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="-1.599946mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="-1.599946mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="-1.599946mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="-1.599946mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-1.599946mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-1.599946mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-1.599946mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-1.599946mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-1.599946mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="-1.599946mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="-1.599946mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="-1.599946mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="-1.599946mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin49"]}
            pcbX="1.599946mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin50"]}
            pcbX="1.599946mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin51"]}
            pcbX="1.599946mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin52"]}
            pcbX="1.599946mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin53"]}
            pcbX="1.599946mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin54"]}
            pcbX="1.599946mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin55"]}
            pcbX="1.599946mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin56"]}
            pcbX="1.599946mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin57"]}
            pcbX="1.599946mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin58"]}
            pcbX="1.599946mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin59"]}
            pcbX="1.599946mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin60"]}
            pcbX="1.599946mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin61"]}
            pcbX="1.599946mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin62"]}
            pcbX="1.599946mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin63"]}
            pcbX="1.599946mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin64"]}
            pcbX="1.599946mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin65"]}
            pcbX="2.400046mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin66"]}
            pcbX="2.400046mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin67"]}
            pcbX="2.400046mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin68"]}
            pcbX="2.400046mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin69"]}
            pcbX="2.400046mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin70"]}
            pcbX="2.400046mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin71"]}
            pcbX="2.400046mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin72"]}
            pcbX="2.400046mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin73"]}
            pcbX="2.400046mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin74"]}
            pcbX="2.400046mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin75"]}
            pcbX="2.400046mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin76"]}
            pcbX="2.400046mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin77"]}
            pcbX="2.400046mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin78"]}
            pcbX="2.400046mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin79"]}
            pcbX="2.400046mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin80"]}
            pcbX="2.400046mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin81"]}
            pcbX="3.199892mm"
            pcbY="5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin82"]}
            pcbX="3.199892mm"
            pcbY="5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin83"]}
            pcbX="3.199892mm"
            pcbY="4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin84"]}
            pcbX="3.199892mm"
            pcbY="3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin85"]}
            pcbX="3.199892mm"
            pcbY="2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin86"]}
            pcbX="3.199892mm"
            pcbY="1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin87"]}
            pcbX="3.199892mm"
            pcbY="1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin88"]}
            pcbX="3.199892mm"
            pcbY="0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin89"]}
            pcbX="3.199892mm"
            pcbY="-0.40005mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin90"]}
            pcbX="3.199892mm"
            pcbY="-1.199896mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin91"]}
            pcbX="3.199892mm"
            pcbY="-1.999996mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin92"]}
            pcbX="3.199892mm"
            pcbY="-2.800096mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin93"]}
            pcbX="3.199892mm"
            pcbY="-3.599942mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin94"]}
            pcbX="3.199892mm"
            pcbY="-4.400042mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin95"]}
            pcbX="3.199892mm"
            pcbY="-5.199888mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <smtpad
            portHints={["pin96"]}
            pcbX="3.199892mm"
            pcbY="-5.999988mm"
            radius="0.1799971mm"
            shape="circle"
          />
          <silkscreenpath
            route={[
              { x: -4.076090399999998, y: 6.576288599999884 },
              { x: 4.076344400000039, y: 6.576288599999884 },
              { x: 4.076344400000039, y: -6.576085400000011 },
              { x: -4.076090399999998, y: -6.576085400000011 },
              { x: -4.076090399999998, y: 6.576288599999884 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.67604039999992, y: 6.804863199999886 },
              { x: -4.304665, y: 6.804863199999886 },
              { x: -4.304665, y: 6.176314799999886 },
            ]}
          />
          <silkscreencircle
            pcbX="-4.476242mm"
            pcbY="5.999988mm"
            radius="0.100076mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.249936mm"
            pcbY="7.81609mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <fabricationnotepath
            route={[
              { x: -3.6760911999999735, y: 6.576314000000025 },
              { x: -4.076090399999998, y: 6.176289399999973 },
              { x: -4.076090399999998, y: 6.576314000000025 },
              { x: -3.6760911999999735, y: 6.576314000000025 },
            ]}
            strokeWidth="0mm"
            isFilled
            hasStroke={false}
          />
          <courtyardoutline
            outline={[
              { x: -4.249890400000027, y: 6.750088600000026 },
              { x: 4.2500935999999, y: 6.750088600000026 },
              { x: 4.2500935999999, y: -6.7498853999999255 },
              { x: -4.249890400000027, y: -6.7498853999999255 },
              { x: -4.249890400000027, y: 6.750088600000026 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C428584.obj?uuid=0616c6f3ea55437da47777c947613319",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C428584.step?uuid=0616c6f3ea55437da47777c947613319",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.0001015999999935957,
          y: -0.00010160000010728254,
          z: -0.325,
        },
      }}
      {...props}
    />
  )
}
