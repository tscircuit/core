import type { ChipProps } from "@tscircuit/props"

// U70 from the four-motor USB-C motherboard: STM32MP157DAB1, JLCPCB C1236721.
// All 354 pad coordinates and sizes are copied verbatim from its tsci import.
// Semantic pin labels and all 104 GND assignments are copied from the board.
// Other nets are omitted to isolate ground-plane handoff; no copper is saved.
// Footprint-local points are in right-handed mm (+X right, +Y up, +Z above).
// Chip placement is applied by core. The unused 3D assets are not included.
const pinLabels = {
  pin1: ["A1_VSS"],
  pin2: ["A2_PG15"],
  pin3: ["A3_PD0"],
  pin4: ["A4_PD1"],
  pin5: ["A5_PE3"],
  pin6: ["A6_PG6"],
  pin7: ["A7_PB3"],
  pin8: ["A8_PB15"],
  pin9: ["A9_PC7"],
  pin10: ["A10_PC9"],
  pin11: ["A11_PC11"],
  pin12: ["A12_VDD_DSI"],
  pin13: ["A13_DSIHOST_D0N"],
  pin14: ["A14_DSIHOST_CKN"],
  pin15: ["A15_DSIHOST_D1N"],
  pin16: ["A16_VDD1V2_DSI_PHY"],
  pin17: ["A17_DDR_DQ0"],
  pin18: ["A18_DDR_DQ1"],
  pin19: ["A19_VSS"],
  pin20: ["B1_PE1"],
  pin21: ["B2_VSS"],
  pin22: ["B3_PE6"],
  pin23: ["B4_PD7"],
  pin24: ["B5_PB7"],
  pin25: ["B6_VSS"],
  pin26: ["B7_PE5"],
  pin27: ["B8_PA8"],
  pin28: ["B9_PB4"],
  pin29: ["B10_PD2"],
  pin30: ["B11_PE4"],
  pin31: ["B12_VDDA1V8_DSI"],
  pin32: ["B13_DSIHOST_D0P"],
  pin33: ["B14_DSIHOST_CKP"],
  pin34: ["B15_DSIHOST_D1P"],
  pin35: ["B16_VDD1V2_DSI_REG"],
  pin36: ["B17_DDR_DQ3"],
  pin37: ["B18_DDR_DQ7"],
  pin38: ["B19_DDR_DQS0N"],
  pin39: ["C1_PE11"],
  pin40: ["C2_PE13"],
  pin41: ["C3_VSS"],
  pin42: ["C4_PE0"],
  pin43: ["C5_PD10"],
  pin44: ["C6_PD3"],
  pin45: ["C7_PA15"],
  pin46: ["C8_PA9"],
  pin47: ["C9_PB14"],
  pin48: ["C10_PC12"],
  pin49: ["C11_PC8"],
  pin50: ["C12_VSS_DSI"],
  pin51: ["C13_VSS_DSI"],
  pin52: ["C14_VSS_DSI"],
  pin53: ["C15_VSS_DSI"],
  pin54: ["C16_VSS_DSI"],
  pin55: ["C17_VSS"],
  pin56: ["C18_DDR_DQM0"],
  pin57: ["C19_DDR_DQS0P"],
  pin58: ["D1_VSS"],
  pin59: ["D2_PE12"],
  pin60: ["D3_PE14"],
  pin61: ["D4_VSS"],
  pin62: ["D5_VSS"],
  pin63: ["D6_PD4"],
  pin64: ["D7_PD5"],
  pin65: ["D8_VSS"],
  pin66: ["D9_PB9"],
  pin67: ["D10_PC6"],
  pin68: ["D11_PC10"],
  pin69: ["D12_NJTRST"],
  pin70: ["D13_JTDI"],
  pin71: ["D14_JTDO_TRACESWO"],
  pin72: ["D15_JTMS_SWDIO"],
  pin73: ["D16_JTCK_SWCLK"],
  pin74: ["D17_DDR_DQ5"],
  pin75: ["D18_DDR_DQ2"],
  pin76: ["D19_DDR_DQ6"],
  pin77: ["E1_PE15"],
  pin78: ["E2_VSS"],
  pin79: ["E3_PD6"],
  pin80: ["E4_VSS"],
  pin81: ["E5_VSS"],
  pin82: ["E6_VSS"],
  pin83: ["E7_VDDCORE"],
  pin84: ["E8_VSS"],
  pin85: ["E9_VDDCORE"],
  pin86: ["E10_VSS"],
  pin87: ["E11_VDDCORE"],
  pin88: ["E12_VSS"],
  pin89: ["E13_VDDCORE"],
  pin90: ["E14_VSS"],
  pin91: ["E15_VDDQ_DDR"],
  pin92: ["E16_VSS"],
  pin93: ["E17_DDR_A7"],
  pin94: ["E18_DDR_DQ4"],
  pin95: ["F1_PG12"],
  pin96: ["F2_PD8"],
  pin97: ["F3_PD14"],
  pin98: ["F4_VDDCORE"],
  pin99: ["F5_VSS"],
  pin100: ["F6_VDDCORE"],
  pin101: ["F7_VSS"],
  pin102: ["F8_VDDCORE"],
  pin103: ["F9_VSS"],
  pin104: ["F10_VDDCORE"],
  pin105: ["F11_VSS"],
  pin106: ["F12_VDDCORE"],
  pin107: ["F13_VSS_PLL2"],
  pin108: ["F14_VDDQ_DDR"],
  pin109: ["F15_VSS"],
  pin110: ["F17_DDR_A13"],
  pin111: ["F18_DDR_ZQ"],
  pin112: ["F19_DDR_A3"],
  pin113: ["G1_PD15"],
  pin114: ["G2_VSS"],
  pin115: ["G3_PD9"],
  pin116: ["G4_VSS"],
  pin117: ["G5_VDDCORE"],
  pin118: ["G6_VSS"],
  pin119: ["G7_VDDCORE"],
  pin120: ["G8_VSS"],
  pin121: ["G9_VDDCORE"],
  pin122: ["G10_VSS"],
  pin123: ["G11_VDDCORE"],
  pin124: ["G12_VSS"],
  pin125: ["G13_VDD_PLL2"],
  pin126: ["G14_VSS"],
  pin127: ["G15_VDDQ_DDR"],
  pin128: ["G16_DDR_RESETN"],
  pin129: ["G17_DDR_A9"],
  pin130: ["G18_DDR_A2"],
  pin131: ["G19_DDR_BA0"],
  pin132: ["H1_PC14_OSC32_IN"],
  pin133: ["H2_PC15_OSC32_OUT"],
  pin134: ["H3_VBAT"],
  pin135: ["H4_VDDCORE"],
  pin136: ["H5_VSS"],
  pin137: ["H6_VDDCORE"],
  pin138: ["H7_VSS"],
  pin139: ["H8_VDDCORE"],
  pin140: ["H9_VSS"],
  pin141: ["H10_VDDCORE"],
  pin142: ["H11_VSS"],
  pin143: ["H12_VDDCORE"],
  pin144: ["H13_VSS"],
  pin145: ["H14_VDDQ_DDR"],
  pin146: ["H15_VSS"],
  pin147: ["H17_DDR_A5"],
  pin148: ["H18_DDR_A0"],
  pin149: ["H19_DDR_ODT"],
  pin150: ["J1_NRST"],
  pin151: ["J2_NRST_CORE"],
  pin152: ["J3_VSS"],
  pin153: ["J4_VSS_PLL"],
  pin154: ["J5_VDD_PLL"],
  pin155: ["J6_VSS"],
  pin156: ["J7_VDDCORE"],
  pin157: ["J8_VSS"],
  pin158: ["J9_VDDCORE"],
  pin159: ["J10_VSS"],
  pin160: ["J11_VDDCORE"],
  pin161: ["J12_VSS"],
  pin162: ["J13_VDDCORE"],
  pin163: ["J14_VSS"],
  pin164: ["J15_VDDQ_DDR"],
  pin165: ["J16_DDR_BA2"],
  pin166: ["J17_DDR_WEN"],
  pin167: ["J18_DDR_CSN"],
  pin168: ["J19_DDR_DTO1"],
  pin169: ["K1_BOOT0"],
  pin170: ["K2_VSS"],
  pin171: ["K3_PC13"],
  pin172: ["K4_BOOT1"],
  pin173: ["K5_VSS"],
  pin174: ["K6_VDD"],
  pin175: ["K7_VSS"],
  pin176: ["K8_VDDCORE"],
  pin177: ["K9_VSS"],
  pin178: ["K10_VDDCORE"],
  pin179: ["K11_VSS"],
  pin180: ["K12_VDDCORE"],
  pin181: ["K13_VSS"],
  pin182: ["K14_VDDQ_DDR"],
  pin183: ["K15_VSS"],
  pin184: ["K17_DDR_CASN"],
  pin185: ["K18_DDR_DTO0"],
  pin186: ["K19_DDR_CLKN"],
  pin187: ["L1_PWR_ON"],
  pin188: ["L2_BOOT2"],
  pin189: ["L3_VDD_ANA"],
  pin190: ["L4_VSS_ANA"],
  pin191: ["L5_VDD"],
  pin192: ["L6_VSS"],
  pin193: ["L7_VDD"],
  pin194: ["L8_VSS"],
  pin195: ["L9_VDDCORE"],
  pin196: ["L10_VSS"],
  pin197: ["L11_VDDCORE"],
  pin198: ["L12_VSS"],
  pin199: ["L13_VDDCORE"],
  pin200: ["L14_VSS"],
  pin201: ["L15_VDDQ_DDR"],
  pin202: ["L16_DDR_A15"],
  pin203: ["L17_DDR_A12"],
  pin204: ["L18_DDR_RASN"],
  pin205: ["L19_DDR_CLKP"],
  pin206: ["M1_PH0_OSC_IN"],
  pin207: ["M2_PH1_OSC_OUT"],
  pin208: ["M3_VREF_"],
  pin209: ["M4_VDDA"],
  pin210: ["M5_VSS"],
  pin211: ["M6_VDD"],
  pin212: ["M7_VSS"],
  pin213: ["M8_VDD"],
  pin214: ["M9_VSS"],
  pin215: ["M10_VDDCORE"],
  pin216: ["M11_VSS"],
  pin217: ["M12_VDDCORE"],
  pin218: ["M13_VSS"],
  pin219: ["M14_VDDQ_DDR"],
  pin220: ["M15_VSS"],
  pin221: ["M17_DDR_A1"],
  pin222: ["M18_DDR_A11"],
  pin223: ["M19_DDR_A10"],
  pin224: ["N1_PDR_ON_CORE"],
  pin225: ["N2_PDR_ON"],
  pin226: ["N3_VREF_"],
  pin227: ["N4_VSSA"],
  pin228: ["N5_VDD"],
  pin229: ["N6_VSS"],
  pin230: ["N7_VDD"],
  pin231: ["N8_VSS"],
  pin232: ["N9_VDD"],
  pin233: ["N10_VSS"],
  pin234: ["N11_VDDCORE"],
  pin235: ["N12_VSS"],
  pin236: ["N13_VDDCORE"],
  pin237: ["N14_VSS"],
  pin238: ["N15_VDDQ_DDR"],
  pin239: ["N16_DDR_A6"],
  pin240: ["N17_DDR_BA1"],
  pin241: ["N18_DDR_A14"],
  pin242: ["N19_DDR_ATO"],
  pin243: ["P1_PWR_LP"],
  pin244: ["P2_PA13"],
  pin245: ["P3_PA3"],
  pin246: ["P4_PA5"],
  pin247: ["P5_VSSA"],
  pin248: ["P6_VDD"],
  pin249: ["P7_VSS"],
  pin250: ["P8_VDD"],
  pin251: ["P9_VSS"],
  pin252: ["P10_VDD"],
  pin253: ["P11_VSS"],
  pin254: ["P12_VDDCORE"],
  pin255: ["P13_VSS"],
  pin256: ["P14_VDDQ_DDR"],
  pin257: ["P15_VSS"],
  pin258: ["P17_DDR_A4"],
  pin259: ["P18_DDR_DQ8"],
  pin260: ["P19_DDR_CKE"],
  pin261: ["R1_PA14"],
  pin262: ["R2_VSS"],
  pin263: ["R3_PA0"],
  pin264: ["R4_PA4"],
  pin265: ["R5_VSSA"],
  pin266: ["R6_VSS"],
  pin267: ["R7_VDD"],
  pin268: ["R8_VSS"],
  pin269: ["R9_VDD"],
  pin270: ["R10_VSS"],
  pin271: ["R11_VDD"],
  pin272: ["R12_VSS"],
  pin273: ["R13_VDDCORE"],
  pin274: ["R14_VSS"],
  pin275: ["R15_VDDQ_DDR"],
  pin276: ["R16_VSS"],
  pin277: ["R17_DDR_A8"],
  pin278: ["R18_DDR_DQ10"],
  pin279: ["T1_PE2"],
  pin280: ["T2_PC2"],
  pin281: ["T3_PC3"],
  pin282: ["T4_VSS"],
  pin283: ["T5_PA6"],
  pin284: ["T6_PA7"],
  pin285: ["T7_PC0"],
  pin286: ["T8_PB5"],
  pin287: ["T9_PB13"],
  pin288: ["T10_PE7"],
  pin289: ["T11_PE8"],
  pin290: ["T12_PB6"],
  pin291: ["T13_PB2"],
  pin292: ["T14_PG9"],
  pin293: ["T15_BYPASS_REG1V8"],
  pin294: ["T16_PA10"],
  pin295: ["T17_DDR_DQ9"],
  pin296: ["T18_DDR_DQ13"],
  pin297: ["T19_DDR_DQS1N"],
  pin298: ["U1_PG14"],
  pin299: ["U2_PG13"],
  pin300: ["U3_VSS"],
  pin301: ["U4_PA1"],
  pin302: ["U5_PF11"],
  pin303: ["U6_VSS"],
  pin304: ["U7_PG8"],
  pin305: ["U8_VSS"],
  pin306: ["U9_PF10"],
  pin307: ["U10_PF8"],
  pin308: ["U11_PD12"],
  pin309: ["U12_PD13"],
  pin310: ["U13_VSS_USBHS"],
  pin311: ["U14_VSS_USBHS"],
  pin312: ["U15_OTG_VBUS"],
  pin313: ["U16_PA12"],
  pin314: ["U17_VSS"],
  pin315: ["U18_DDR_DQM1"],
  pin316: ["U19_DDR_DQS1P"],
  pin317: ["V1_PB11"],
  pin318: ["V2_PC1"],
  pin319: ["V3_PB1"],
  pin320: ["V4_PC5"],
  pin321: ["V5_PB12"],
  pin322: ["V6_PG11"],
  pin323: ["V7_PG10"],
  pin324: ["V8_PD11"],
  pin325: ["V9_PF6"],
  pin326: ["V10_PE10"],
  pin327: ["V11_VDDA1V8_REG"],
  pin328: ["V12_VSS_USBHS"],
  pin329: ["V13_USB_DM2"],
  pin330: ["V14_USB_DP1"],
  pin331: ["V15_VSS_USBHS"],
  pin332: ["V16_USB_RREF"],
  pin333: ["V17_PA11"],
  pin334: ["V18_DDR_DQ14"],
  pin335: ["V19_DDR_DQ11"],
  pin336: ["W1_VSS"],
  pin337: ["W2_PA2"],
  pin338: ["W3_PB0"],
  pin339: ["W4_PC4"],
  pin340: ["W5_PB10"],
  pin341: ["W6_PB8"],
  pin342: ["W7_PE9"],
  pin343: ["W8_PF7"],
  pin344: ["W9_PF9"],
  pin345: ["W10_PG7"],
  pin346: ["W11_VDDA1V1_REG"],
  pin347: ["W12_VDD3V3_USBHS"],
  pin348: ["W13_USB_DP2"],
  pin349: ["W14_USB_DM1"],
  pin350: ["W15_VDD3V3_USBFS"],
  pin351: ["W16_DDR_VREF"],
  pin352: ["W17_DDR_DQ15"],
  pin353: ["W18_DDR_DQ12"],
  pin354: ["W19_VSS"],
} as const

export const stm32GroundConnections = {
  pin1: "net.GND",
  pin19: "net.GND",
  pin21: "net.GND",
  pin25: "net.GND",
  pin41: "net.GND",
  pin50: "net.GND",
  pin51: "net.GND",
  pin52: "net.GND",
  pin53: "net.GND",
  pin54: "net.GND",
  pin55: "net.GND",
  pin58: "net.GND",
  pin61: "net.GND",
  pin62: "net.GND",
  pin65: "net.GND",
  pin78: "net.GND",
  pin80: "net.GND",
  pin81: "net.GND",
  pin82: "net.GND",
  pin84: "net.GND",
  pin86: "net.GND",
  pin88: "net.GND",
  pin90: "net.GND",
  pin92: "net.GND",
  pin99: "net.GND",
  pin101: "net.GND",
  pin103: "net.GND",
  pin105: "net.GND",
  pin107: "net.GND",
  pin109: "net.GND",
  pin114: "net.GND",
  pin116: "net.GND",
  pin118: "net.GND",
  pin120: "net.GND",
  pin122: "net.GND",
  pin124: "net.GND",
  pin126: "net.GND",
  pin132: "net.GND",
  pin136: "net.GND",
  pin138: "net.GND",
  pin140: "net.GND",
  pin142: "net.GND",
  pin144: "net.GND",
  pin146: "net.GND",
  pin152: "net.GND",
  pin153: "net.GND",
  pin155: "net.GND",
  pin157: "net.GND",
  pin159: "net.GND",
  pin161: "net.GND",
  pin163: "net.GND",
  pin170: "net.GND",
  pin172: "net.GND",
  pin173: "net.GND",
  pin175: "net.GND",
  pin177: "net.GND",
  pin179: "net.GND",
  pin181: "net.GND",
  pin183: "net.GND",
  pin190: "net.GND",
  pin192: "net.GND",
  pin194: "net.GND",
  pin196: "net.GND",
  pin198: "net.GND",
  pin200: "net.GND",
  pin208: "net.GND",
  pin210: "net.GND",
  pin212: "net.GND",
  pin214: "net.GND",
  pin216: "net.GND",
  pin218: "net.GND",
  pin220: "net.GND",
  pin227: "net.GND",
  pin229: "net.GND",
  pin231: "net.GND",
  pin233: "net.GND",
  pin235: "net.GND",
  pin237: "net.GND",
  pin247: "net.GND",
  pin249: "net.GND",
  pin251: "net.GND",
  pin253: "net.GND",
  pin255: "net.GND",
  pin257: "net.GND",
  pin262: "net.GND",
  pin265: "net.GND",
  pin266: "net.GND",
  pin268: "net.GND",
  pin270: "net.GND",
  pin272: "net.GND",
  pin274: "net.GND",
  pin276: "net.GND",
  pin282: "net.GND",
  pin293: "net.GND",
  pin300: "net.GND",
  pin303: "net.GND",
  pin305: "net.GND",
  pin310: "net.GND",
  pin311: "net.GND",
  pin314: "net.GND",
  pin328: "net.GND",
  pin331: "net.GND",
  pin336: "net.GND",
  pin354: "net.GND",
} as const

export const Stm32mp157dab1 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    manufacturerPartNumber="STM32MP157DAB1"
    supplierPartNumbers={{ jlcpcb: ["C1236721"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-7.199884mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="-7.199884mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="-7.199884mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="-7.199884mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="-7.199884mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="-7.199884mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin7"]}
          pcbX="-7.199884mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin8"]}
          pcbX="-7.199884mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin9"]}
          pcbX="-7.199884mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin10"]}
          pcbX="-7.199884mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin11"]}
          pcbX="-7.199884mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin12"]}
          pcbX="-7.199884mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin13"]}
          pcbX="-7.199884mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin14"]}
          pcbX="-7.199884mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin15"]}
          pcbX="-7.199884mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin16"]}
          pcbX="-7.199884mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin17"]}
          pcbX="-7.199884mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin18"]}
          pcbX="-7.199884mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin19"]}
          pcbX="-7.199884mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin20"]}
          pcbX="-6.400038mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin21"]}
          pcbX="-6.400038mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin22"]}
          pcbX="-6.400038mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin23"]}
          pcbX="-6.400038mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin24"]}
          pcbX="-6.400038mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin25"]}
          pcbX="-6.400038mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin26"]}
          pcbX="-6.400038mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin27"]}
          pcbX="-6.400038mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin28"]}
          pcbX="-6.400038mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin29"]}
          pcbX="-6.400038mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin30"]}
          pcbX="-6.400038mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin31"]}
          pcbX="-6.400038mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin32"]}
          pcbX="-6.400038mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin33"]}
          pcbX="-6.400038mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin34"]}
          pcbX="-6.400038mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin35"]}
          pcbX="-6.400038mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin36"]}
          pcbX="-6.400038mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin37"]}
          pcbX="-6.400038mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin38"]}
          pcbX="-6.400038mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin39"]}
          pcbX="-5.599938mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin40"]}
          pcbX="-5.599938mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin41"]}
          pcbX="-5.599938mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin42"]}
          pcbX="-5.599938mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin43"]}
          pcbX="-5.599938mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin44"]}
          pcbX="-5.599938mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin45"]}
          pcbX="-5.599938mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin46"]}
          pcbX="-5.599938mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin47"]}
          pcbX="-5.599938mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin48"]}
          pcbX="-5.599938mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin49"]}
          pcbX="-5.599938mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin50"]}
          pcbX="-5.599938mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin51"]}
          pcbX="-5.599938mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin52"]}
          pcbX="-5.599938mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin53"]}
          pcbX="-5.599938mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin54"]}
          pcbX="-5.599938mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin55"]}
          pcbX="-5.599938mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin56"]}
          pcbX="-5.599938mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin57"]}
          pcbX="-5.599938mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin58"]}
          pcbX="-4.800092mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin59"]}
          pcbX="-4.800092mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin60"]}
          pcbX="-4.800092mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin61"]}
          pcbX="-4.800092mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin62"]}
          pcbX="-4.800092mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin63"]}
          pcbX="-4.800092mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin64"]}
          pcbX="-4.800092mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin65"]}
          pcbX="-4.800092mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin66"]}
          pcbX="-4.800092mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin67"]}
          pcbX="-4.800092mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin68"]}
          pcbX="-4.800092mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin69"]}
          pcbX="-4.800092mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin70"]}
          pcbX="-4.800092mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin71"]}
          pcbX="-4.800092mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin72"]}
          pcbX="-4.800092mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin73"]}
          pcbX="-4.800092mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin74"]}
          pcbX="-4.800092mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin75"]}
          pcbX="-4.800092mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin76"]}
          pcbX="-4.800092mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin77"]}
          pcbX="-3.999992mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin78"]}
          pcbX="-3.999992mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin79"]}
          pcbX="-3.999992mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin80"]}
          pcbX="-3.999992mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin81"]}
          pcbX="-3.999992mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin82"]}
          pcbX="-3.999992mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin83"]}
          pcbX="-3.999992mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin84"]}
          pcbX="-3.999992mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin85"]}
          pcbX="-3.999992mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin86"]}
          pcbX="-3.999992mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin87"]}
          pcbX="-3.999992mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin88"]}
          pcbX="-3.999992mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin89"]}
          pcbX="-3.999992mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin90"]}
          pcbX="-3.999992mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin91"]}
          pcbX="-3.999992mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin92"]}
          pcbX="-3.999992mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin93"]}
          pcbX="-3.999992mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin94"]}
          pcbX="-3.999992mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin95"]}
          pcbX="-3.199892mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin96"]}
          pcbX="-3.199892mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin97"]}
          pcbX="-3.199892mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin98"]}
          pcbX="-3.199892mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin99"]}
          pcbX="-3.199892mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin100"]}
          pcbX="-3.199892mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin101"]}
          pcbX="-3.199892mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin102"]}
          pcbX="-3.199892mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin103"]}
          pcbX="-3.199892mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin104"]}
          pcbX="-3.199892mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin105"]}
          pcbX="-3.199892mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin106"]}
          pcbX="-3.199892mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin107"]}
          pcbX="-3.199892mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin108"]}
          pcbX="-3.199892mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin109"]}
          pcbX="-3.199892mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin110"]}
          pcbX="-3.199892mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin111"]}
          pcbX="-3.199892mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin112"]}
          pcbX="-3.199892mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin113"]}
          pcbX="-2.400046mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin114"]}
          pcbX="-2.400046mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin115"]}
          pcbX="-2.400046mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin116"]}
          pcbX="-2.400046mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin117"]}
          pcbX="-2.400046mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin118"]}
          pcbX="-2.400046mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin119"]}
          pcbX="-2.400046mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin120"]}
          pcbX="-2.400046mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin121"]}
          pcbX="-2.400046mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin122"]}
          pcbX="-2.400046mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin123"]}
          pcbX="-2.400046mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin124"]}
          pcbX="-2.400046mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin125"]}
          pcbX="-2.400046mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin126"]}
          pcbX="-2.400046mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin127"]}
          pcbX="-2.400046mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin128"]}
          pcbX="-2.400046mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin129"]}
          pcbX="-2.400046mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin130"]}
          pcbX="-2.400046mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin131"]}
          pcbX="-2.400046mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin132"]}
          pcbX="-1.599946mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin133"]}
          pcbX="-1.599946mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin134"]}
          pcbX="-1.599946mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin135"]}
          pcbX="-1.599946mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin136"]}
          pcbX="-1.599946mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin137"]}
          pcbX="-1.599946mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin138"]}
          pcbX="-1.599946mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin139"]}
          pcbX="-1.599946mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin140"]}
          pcbX="-1.599946mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin141"]}
          pcbX="-1.599946mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin142"]}
          pcbX="-1.599946mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin143"]}
          pcbX="-1.599946mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin144"]}
          pcbX="-1.599946mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin145"]}
          pcbX="-1.599946mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin146"]}
          pcbX="-1.599946mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin147"]}
          pcbX="-1.599946mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin148"]}
          pcbX="-1.599946mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin149"]}
          pcbX="-1.599946mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin150"]}
          pcbX="-0.8001mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin151"]}
          pcbX="-0.8001mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin152"]}
          pcbX="-0.8001mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin153"]}
          pcbX="-0.8001mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin154"]}
          pcbX="-0.8001mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin155"]}
          pcbX="-0.8001mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin156"]}
          pcbX="-0.8001mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin157"]}
          pcbX="-0.8001mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin158"]}
          pcbX="-0.8001mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin159"]}
          pcbX="-0.8001mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin160"]}
          pcbX="-0.8001mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin161"]}
          pcbX="-0.8001mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin162"]}
          pcbX="-0.8001mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin163"]}
          pcbX="-0.8001mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin164"]}
          pcbX="-0.8001mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin165"]}
          pcbX="-0.8001mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin166"]}
          pcbX="-0.8001mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin167"]}
          pcbX="-0.8001mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin168"]}
          pcbX="-0.8001mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin169"]}
          pcbX="0mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin170"]}
          pcbX="0mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin171"]}
          pcbX="0mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin172"]}
          pcbX="0mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin173"]}
          pcbX="0mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin174"]}
          pcbX="0mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin175"]}
          pcbX="0mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin176"]}
          pcbX="0mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin177"]}
          pcbX="0mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin178"]}
          pcbX="0mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin179"]}
          pcbX="0mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin180"]}
          pcbX="0mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin181"]}
          pcbX="0mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin182"]}
          pcbX="0mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin183"]}
          pcbX="0mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin184"]}
          pcbX="0mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin185"]}
          pcbX="0mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin186"]}
          pcbX="0mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin187"]}
          pcbX="0.8001mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin188"]}
          pcbX="0.8001mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin189"]}
          pcbX="0.8001mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin190"]}
          pcbX="0.8001mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin191"]}
          pcbX="0.8001mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin192"]}
          pcbX="0.8001mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin193"]}
          pcbX="0.8001mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin194"]}
          pcbX="0.8001mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin195"]}
          pcbX="0.8001mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin196"]}
          pcbX="0.8001mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin197"]}
          pcbX="0.8001mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin198"]}
          pcbX="0.8001mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin199"]}
          pcbX="0.8001mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin200"]}
          pcbX="0.8001mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin201"]}
          pcbX="0.8001mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin202"]}
          pcbX="0.8001mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin203"]}
          pcbX="0.8001mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin204"]}
          pcbX="0.8001mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin205"]}
          pcbX="0.8001mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin206"]}
          pcbX="1.599946mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin207"]}
          pcbX="1.599946mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin208"]}
          pcbX="1.599946mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin209"]}
          pcbX="1.599946mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin210"]}
          pcbX="1.599946mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin211"]}
          pcbX="1.599946mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin212"]}
          pcbX="1.599946mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin213"]}
          pcbX="1.599946mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin214"]}
          pcbX="1.599946mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin215"]}
          pcbX="1.599946mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin216"]}
          pcbX="1.599946mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin217"]}
          pcbX="1.599946mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin218"]}
          pcbX="1.599946mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin219"]}
          pcbX="1.599946mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin220"]}
          pcbX="1.599946mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin221"]}
          pcbX="1.599946mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin222"]}
          pcbX="1.599946mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin223"]}
          pcbX="1.599946mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin224"]}
          pcbX="2.400046mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin225"]}
          pcbX="2.400046mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin226"]}
          pcbX="2.400046mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin227"]}
          pcbX="2.400046mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin228"]}
          pcbX="2.400046mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin229"]}
          pcbX="2.400046mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin230"]}
          pcbX="2.400046mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin231"]}
          pcbX="2.400046mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin232"]}
          pcbX="2.400046mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin233"]}
          pcbX="2.400046mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin234"]}
          pcbX="2.400046mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin235"]}
          pcbX="2.400046mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin236"]}
          pcbX="2.400046mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin237"]}
          pcbX="2.400046mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin238"]}
          pcbX="2.400046mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin239"]}
          pcbX="2.400046mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin240"]}
          pcbX="2.400046mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin241"]}
          pcbX="2.400046mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin242"]}
          pcbX="2.400046mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin243"]}
          pcbX="3.199892mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin244"]}
          pcbX="3.199892mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin245"]}
          pcbX="3.199892mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin246"]}
          pcbX="3.199892mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin247"]}
          pcbX="3.199892mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin248"]}
          pcbX="3.199892mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin249"]}
          pcbX="3.199892mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin250"]}
          pcbX="3.199892mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin251"]}
          pcbX="3.199892mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin252"]}
          pcbX="3.199892mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin253"]}
          pcbX="3.199892mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin254"]}
          pcbX="3.199892mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin255"]}
          pcbX="3.199892mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin256"]}
          pcbX="3.199892mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin257"]}
          pcbX="3.199892mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin258"]}
          pcbX="3.199892mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin259"]}
          pcbX="3.199892mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin260"]}
          pcbX="3.199892mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin261"]}
          pcbX="3.999992mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin262"]}
          pcbX="3.999992mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin263"]}
          pcbX="3.999992mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin264"]}
          pcbX="3.999992mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin265"]}
          pcbX="3.999992mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin266"]}
          pcbX="3.999992mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin267"]}
          pcbX="3.999992mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin268"]}
          pcbX="3.999992mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin269"]}
          pcbX="3.999992mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin270"]}
          pcbX="3.999992mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin271"]}
          pcbX="3.999992mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin272"]}
          pcbX="3.999992mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin273"]}
          pcbX="3.999992mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin274"]}
          pcbX="3.999992mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin275"]}
          pcbX="3.999992mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin276"]}
          pcbX="3.999992mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin277"]}
          pcbX="3.999992mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin278"]}
          pcbX="3.999992mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin279"]}
          pcbX="4.800092mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin280"]}
          pcbX="4.800092mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin281"]}
          pcbX="4.800092mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin282"]}
          pcbX="4.800092mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin283"]}
          pcbX="4.800092mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin284"]}
          pcbX="4.800092mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin285"]}
          pcbX="4.800092mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin286"]}
          pcbX="4.800092mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin287"]}
          pcbX="4.800092mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin288"]}
          pcbX="4.800092mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin289"]}
          pcbX="4.800092mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin290"]}
          pcbX="4.800092mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin291"]}
          pcbX="4.800092mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin292"]}
          pcbX="4.800092mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin293"]}
          pcbX="4.800092mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin294"]}
          pcbX="4.800092mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin295"]}
          pcbX="4.800092mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin296"]}
          pcbX="4.800092mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin297"]}
          pcbX="4.800092mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin298"]}
          pcbX="5.599938mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin299"]}
          pcbX="5.599938mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin300"]}
          pcbX="5.599938mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin301"]}
          pcbX="5.599938mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin302"]}
          pcbX="5.599938mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin303"]}
          pcbX="5.599938mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin304"]}
          pcbX="5.599938mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin305"]}
          pcbX="5.599938mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin306"]}
          pcbX="5.599938mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin307"]}
          pcbX="5.599938mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin308"]}
          pcbX="5.599938mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin309"]}
          pcbX="5.599938mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin310"]}
          pcbX="5.599938mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin311"]}
          pcbX="5.599938mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin312"]}
          pcbX="5.599938mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin313"]}
          pcbX="5.599938mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin314"]}
          pcbX="5.599938mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin315"]}
          pcbX="5.599938mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin316"]}
          pcbX="5.599938mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin317"]}
          pcbX="6.400038mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin318"]}
          pcbX="6.400038mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin319"]}
          pcbX="6.400038mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin320"]}
          pcbX="6.400038mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin321"]}
          pcbX="6.400038mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin322"]}
          pcbX="6.400038mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin323"]}
          pcbX="6.400038mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin324"]}
          pcbX="6.400038mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin325"]}
          pcbX="6.400038mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin326"]}
          pcbX="6.400038mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin327"]}
          pcbX="6.400038mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin328"]}
          pcbX="6.400038mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin329"]}
          pcbX="6.400038mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin330"]}
          pcbX="6.400038mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin331"]}
          pcbX="6.400038mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin332"]}
          pcbX="6.400038mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin333"]}
          pcbX="6.400038mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin334"]}
          pcbX="6.400038mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin335"]}
          pcbX="6.400038mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin336"]}
          pcbX="7.199884mm"
          pcbY="-7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin337"]}
          pcbX="7.199884mm"
          pcbY="-6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin338"]}
          pcbX="7.199884mm"
          pcbY="-5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin339"]}
          pcbX="7.199884mm"
          pcbY="-4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin340"]}
          pcbX="7.199884mm"
          pcbY="-3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin341"]}
          pcbX="7.199884mm"
          pcbY="-3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin342"]}
          pcbX="7.199884mm"
          pcbY="-2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin343"]}
          pcbX="7.199884mm"
          pcbY="-1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin344"]}
          pcbX="7.199884mm"
          pcbY="-0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin345"]}
          pcbX="7.199884mm"
          pcbY="-0mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin346"]}
          pcbX="7.199884mm"
          pcbY="0.8001mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin347"]}
          pcbX="7.199884mm"
          pcbY="1.599946mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin348"]}
          pcbX="7.199884mm"
          pcbY="2.400046mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin349"]}
          pcbX="7.199884mm"
          pcbY="3.199892mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin350"]}
          pcbX="7.199884mm"
          pcbY="3.999992mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin351"]}
          pcbX="7.199884mm"
          pcbY="4.800092mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin352"]}
          pcbX="7.199884mm"
          pcbY="5.599938mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin353"]}
          pcbX="7.199884mm"
          pcbY="6.400038mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <smtpad
          portHints={["pin354"]}
          pcbX="7.199884mm"
          pcbY="7.199884mm"
          radius="0.1599946mm"
          shape="circle"
        />
        <silkscreenpath
          route={[
            { x: -8.076183999999998, y: 8.076183999999984 },
            { x: 8.076183999999998, y: 8.076183999999984 },
            { x: 8.076183999999998, y: -8.076184000000012 },
            { x: -8.076183999999998, y: -8.076184000000012 },
            { x: -8.076183999999998, y: 8.076183999999984 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -8.304783999999998, y: -7.4361801999999955 },
            { x: -8.304783999999998, y: -8.304784000000012 },
            { x: -7.4361801999999955, y: -8.304784000000012 },
          ]}
        />
        <silkscreencircle
          pcbX="-7.199884mm"
          pcbY="-8.57631mm"
          radius="0.050038mm"
        />
        <silkscreentext
          text="{NAME}"
          pcbX="0mm"
          pcbY="8.366mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <fabricationnotepath
          route={[
            { x: -8.076183847600007, y: -8.07618384760002 },
            { x: -7.436185127599984, y: -8.07618384760002 },
            { x: -7.436185127599984, y: -8.07618384760002 },
            { x: -8.076183847600007, y: -7.436185127599998 },
            { x: -8.076183847600007, y: -7.436185127599998 },
            { x: -8.076183847600007, y: -8.07618384760002 },
          ]}
          strokeWidth="0mm"
          isFilled
          hasStroke={false}
        />
        <courtyardoutline
          outline={[
            { x: -8.249983999999984, y: 8.249983999999984 },
            { x: 8.249984000000012, y: 8.249983999999984 },
            { x: 8.249984000000012, y: -8.249983999999998 },
            { x: -8.249983999999984, y: -8.249983999999998 },
            { x: -8.249983999999984, y: 8.249983999999984 },
          ]}
        />
      </footprint>
    }
    {...props}
  />
)
