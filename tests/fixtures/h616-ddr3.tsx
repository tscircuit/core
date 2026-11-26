/** H616 DDR3 interface from the original native board.
 * Footprint-local points use millimetres, +X right, +Y up. Native KiCad
 * placements are converted once; all 384 pads and 53 electrical nets remain.
 */
export default function H616Ddr3() {
  return (
    <board
      title="H616 DDR3"
      width={26.5}
      height={72.49999999999999}
      layers={4}
      schematicDisabled
      routeRemaining={false}
      isViaInPadAllowed={false}
      minTraceWidth={0.093}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      minViaPadDiameter={0.35}
      minViaHoleDiameter={0.15}
    >
      <chip
        name="U1"
        pcbX={4.939999999999998}
        pcbY={10.174999999999997}
        layer="top"
        pinLabels={{
          pin1: ["BALL_A1"],
          pin2: ["BALL_A2"],
          pin3: ["BALL_A4"],
          pin4: ["BALL_A6"],
          pin5: ["BALL_A8"],
          pin6: ["BALL_A10"],
          pin7: ["BALL_A12"],
          pin8: ["BALL_A14"],
          pin9: ["BALL_A16"],
          pin10: ["BALL_A18"],
          pin11: ["BALL_A19"],
          pin12: ["BALL_A20"],
          pin13: ["BALL_A21"],
          pin14: ["BALL_B1"],
          pin15: ["BALL_B2"],
          pin16: ["BALL_B3"],
          pin17: ["BALL_B4"],
          pin18: ["BALL_B5"],
          pin19: ["BALL_B6"],
          pin20: ["BALL_B7"],
          pin21: ["BALL_B8"],
          pin22: ["BALL_B9"],
          pin23: ["BALL_B10"],
          pin24: ["BALL_B11"],
          pin25: ["BALL_B12"],
          pin26: ["BALL_B13"],
          pin27: ["BALL_B14"],
          pin28: ["BALL_B15"],
          pin29: ["BALL_B16"],
          pin30: ["BALL_B17"],
          pin31: ["BALL_B18"],
          pin32: ["BALL_B19"],
          pin33: ["BALL_B20"],
          pin34: ["BALL_B21"],
          pin35: ["BALL_C1"],
          pin36: ["BALL_C2"],
          pin37: ["BALL_C3"],
          pin38: ["BALL_C4"],
          pin39: ["BALL_C5"],
          pin40: ["BALL_C6"],
          pin41: ["BALL_C7"],
          pin42: ["BALL_C8"],
          pin43: ["BALL_C9"],
          pin44: ["BALL_C10"],
          pin45: ["BALL_C11"],
          pin46: ["BALL_C12"],
          pin47: ["BALL_C13"],
          pin48: ["BALL_C14"],
          pin49: ["BALL_C15"],
          pin50: ["BALL_C16"],
          pin51: ["BALL_C17"],
          pin52: ["BALL_C18"],
          pin53: ["BALL_C19"],
          pin54: ["BALL_C20"],
          pin55: ["BALL_D1"],
          pin56: ["BALL_D2"],
          pin57: ["BALL_D3"],
          pin58: ["BALL_D4"],
          pin59: ["BALL_D5"],
          pin60: ["BALL_D7"],
          pin61: ["BALL_D10"],
          pin62: ["BALL_D11"],
          pin63: ["BALL_D12"],
          pin64: ["BALL_D13"],
          pin65: ["BALL_D14"],
          pin66: ["BALL_D15"],
          pin67: ["BALL_D16"],
          pin68: ["BALL_D18"],
          pin69: ["BALL_D19"],
          pin70: ["BALL_D20"],
          pin71: ["BALL_D21"],
          pin72: ["BALL_E2"],
          pin73: ["BALL_E3"],
          pin74: ["BALL_E4"],
          pin75: ["BALL_E5"],
          pin76: ["BALL_E6"],
          pin77: ["BALL_E18"],
          pin78: ["BALL_E19"],
          pin79: ["BALL_E20"],
          pin80: ["BALL_F1"],
          pin81: ["BALL_F2"],
          pin82: ["BALL_F3"],
          pin83: ["BALL_F4"],
          pin84: ["BALL_F5"],
          pin85: ["BALL_F8"],
          pin86: ["BALL_F9"],
          pin87: ["BALL_F10"],
          pin88: ["BALL_F11"],
          pin89: ["BALL_F12"],
          pin90: ["BALL_F13"],
          pin91: ["BALL_F14"],
          pin92: ["BALL_F15"],
          pin93: ["BALL_F18"],
          pin94: ["BALL_F19"],
          pin95: ["BALL_F20"],
          pin96: ["BALL_F21"],
          pin97: ["BALL_G2"],
          pin98: ["BALL_G3"],
          pin99: ["BALL_G4"],
          pin100: ["BALL_G5"],
          pin101: ["BALL_G6"],
          pin102: ["BALL_G8"],
          pin103: ["BALL_G9"],
          pin104: ["BALL_G10"],
          pin105: ["BALL_G11"],
          pin106: ["BALL_G12"],
          pin107: ["BALL_G13"],
          pin108: ["BALL_G14"],
          pin109: ["BALL_G15"],
          pin110: ["BALL_G17"],
          pin111: ["BALL_G18"],
          pin112: ["BALL_G19"],
          pin113: ["BALL_G20"],
          pin114: ["BALL_G21"],
          pin115: ["BALL_H1"],
          pin116: ["BALL_H2"],
          pin117: ["BALL_H3"],
          pin118: ["BALL_H4"],
          pin119: ["BALL_H5"],
          pin120: ["BALL_H6"],
          pin121: ["BALL_H8"],
          pin122: ["BALL_H9"],
          pin123: ["BALL_H10"],
          pin124: ["BALL_H11"],
          pin125: ["BALL_H12"],
          pin126: ["BALL_H13"],
          pin127: ["BALL_H14"],
          pin128: ["BALL_H15"],
          pin129: ["BALL_H17"],
          pin130: ["BALL_H18"],
          pin131: ["BALL_H19"],
          pin132: ["BALL_H20"],
          pin133: ["BALL_J2"],
          pin134: ["BALL_J3"],
          pin135: ["BALL_J6"],
          pin136: ["BALL_J8"],
          pin137: ["BALL_J9"],
          pin138: ["BALL_J10"],
          pin139: ["BALL_J11"],
          pin140: ["BALL_J12"],
          pin141: ["BALL_J13"],
          pin142: ["BALL_J14"],
          pin143: ["BALL_J15"],
          pin144: ["BALL_J17"],
          pin145: ["BALL_J18"],
          pin146: ["BALL_J19"],
          pin147: ["BALL_J20"],
          pin148: ["BALL_J21"],
          pin149: ["BALL_K1"],
          pin150: ["BALL_K2"],
          pin151: ["BALL_K3"],
          pin152: ["BALL_K4"],
          pin153: ["BALL_K5"],
          pin154: ["BALL_K6"],
          pin155: ["BALL_K8"],
          pin156: ["BALL_K9"],
          pin157: ["BALL_K10"],
          pin158: ["BALL_K11"],
          pin159: ["BALL_K12"],
          pin160: ["BALL_K13"],
          pin161: ["BALL_K14"],
          pin162: ["BALL_K15"],
          pin163: ["BALL_K18"],
          pin164: ["BALL_K19"],
          pin165: ["BALL_K20"],
          pin166: ["BALL_L2"],
          pin167: ["BALL_L3"],
          pin168: ["BALL_L4"],
          pin169: ["BALL_L5"],
          pin170: ["BALL_L6"],
          pin171: ["BALL_L8"],
          pin172: ["BALL_L9"],
          pin173: ["BALL_L10"],
          pin174: ["BALL_L11"],
          pin175: ["BALL_L12"],
          pin176: ["BALL_L13"],
          pin177: ["BALL_L14"],
          pin178: ["BALL_L15"],
          pin179: ["BALL_L18"],
          pin180: ["BALL_L19"],
          pin181: ["BALL_L20"],
          pin182: ["BALL_L21"],
          pin183: ["BALL_M1"],
          pin184: ["BALL_M2"],
          pin185: ["BALL_M3"],
          pin186: ["BALL_M18"],
          pin187: ["BALL_M19"],
          pin188: ["BALL_M20"],
          pin189: ["BALL_N2"],
          pin190: ["BALL_N3"],
          pin191: ["BALL_N4"],
          pin192: ["BALL_N5"],
          pin193: ["BALL_N6"],
          pin194: ["BALL_N7"],
          pin195: ["BALL_N9"],
          pin196: ["BALL_N10"],
          pin197: ["BALL_N12"],
          pin198: ["BALL_N13"],
          pin199: ["BALL_N15"],
          pin200: ["BALL_N16"],
          pin201: ["BALL_N18"],
          pin202: ["BALL_N19"],
          pin203: ["BALL_N20"],
          pin204: ["BALL_N21"],
          pin205: ["BALL_P1"],
          pin206: ["BALL_P2"],
          pin207: ["BALL_P3"],
          pin208: ["BALL_P4"],
          pin209: ["BALL_P5"],
          pin210: ["BALL_P6"],
          pin211: ["BALL_P7"],
          pin212: ["BALL_P9"],
          pin213: ["BALL_P10"],
          pin214: ["BALL_P12"],
          pin215: ["BALL_P13"],
          pin216: ["BALL_P15"],
          pin217: ["BALL_P16"],
          pin218: ["BALL_P18"],
          pin219: ["BALL_P20"],
          pin220: ["BALL_P21"],
          pin221: ["BALL_R1"],
          pin222: ["BALL_R2"],
          pin223: ["BALL_R3"],
          pin224: ["BALL_R4"],
          pin225: ["BALL_R5"],
          pin226: ["BALL_R6"],
          pin227: ["BALL_R9"],
          pin228: ["BALL_R12"],
          pin229: ["BALL_R15"],
          pin230: ["BALL_R18"],
          pin231: ["BALL_R19"],
          pin232: ["BALL_R20"],
          pin233: ["BALL_R21"],
          pin234: ["BALL_T1"],
          pin235: ["BALL_T2"],
          pin236: ["BALL_T3"],
          pin237: ["BALL_T4"],
          pin238: ["BALL_T5"],
          pin239: ["BALL_T6"],
          pin240: ["BALL_T7"],
          pin241: ["BALL_T8"],
          pin242: ["BALL_T9"],
          pin243: ["BALL_T10"],
          pin244: ["BALL_T11"],
          pin245: ["BALL_T12"],
          pin246: ["BALL_T14"],
          pin247: ["BALL_T15"],
          pin248: ["BALL_T16"],
          pin249: ["BALL_T17"],
          pin250: ["BALL_T18"],
          pin251: ["BALL_T20"],
          pin252: ["BALL_T21"],
          pin253: ["BALL_U1"],
          pin254: ["BALL_U2"],
          pin255: ["BALL_U3"],
          pin256: ["BALL_U4"],
          pin257: ["BALL_U5"],
          pin258: ["BALL_U6"],
          pin259: ["BALL_U8"],
          pin260: ["BALL_U9"],
          pin261: ["BALL_U10"],
          pin262: ["BALL_U11"],
          pin263: ["BALL_U12"],
          pin264: ["BALL_U13"],
          pin265: ["BALL_U14"],
          pin266: ["BALL_U15"],
          pin267: ["BALL_U16"],
          pin268: ["BALL_U17"],
          pin269: ["BALL_U18"],
          pin270: ["BALL_U19"],
          pin271: ["BALL_U20"],
          pin272: ["BALL_U21"],
          pin273: ["BALL_V1"],
          pin274: ["BALL_V2"],
          pin275: ["BALL_V3"],
          pin276: ["BALL_V5"],
          pin277: ["BALL_V8"],
          pin278: ["BALL_V10"],
          pin279: ["BALL_V12"],
          pin280: ["BALL_V15"],
          pin281: ["BALL_V17"],
          pin282: ["BALL_V19"],
          pin283: ["BALL_V20"],
          pin284: ["BALL_V21"],
        }}
        manufacturerPartNumber="H616"
        noSchematicRepresentation
        footprint={
          <footprint originalLayer="top">
            <smtpad
              portHints={["pin1"]}
              pcbX={5.5}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={5.5}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={5.5}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={5.5}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin5"]}
              pcbX={5.5}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin6"]}
              pcbX={5.5}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin7"]}
              pcbX={5.5}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin8"]}
              pcbX={5.5}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin9"]}
              pcbX={5.5}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin10"]}
              pcbX={5.5}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin11"]}
              pcbX={5.5}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin12"]}
              pcbX={5.5}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin13"]}
              pcbX={5.5}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin14"]}
              pcbX={4.85}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin15"]}
              pcbX={4.85}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin16"]}
              pcbX={4.85}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin17"]}
              pcbX={4.85}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin18"]}
              pcbX={4.85}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin19"]}
              pcbX={4.85}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin20"]}
              pcbX={4.85}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin21"]}
              pcbX={4.85}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin22"]}
              pcbX={4.85}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin23"]}
              pcbX={4.85}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin24"]}
              pcbX={4.85}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin25"]}
              pcbX={4.85}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin26"]}
              pcbX={4.85}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin27"]}
              pcbX={4.85}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin28"]}
              pcbX={4.85}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin29"]}
              pcbX={4.85}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin30"]}
              pcbX={4.85}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin31"]}
              pcbX={4.85}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin32"]}
              pcbX={4.85}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin33"]}
              pcbX={4.85}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin34"]}
              pcbX={4.85}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin35"]}
              pcbX={4.2}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin36"]}
              pcbX={4.2}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin37"]}
              pcbX={4.2}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin38"]}
              pcbX={4.2}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin39"]}
              pcbX={4.2}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin40"]}
              pcbX={4.2}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin41"]}
              pcbX={4.2}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin42"]}
              pcbX={4.2}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin43"]}
              pcbX={4.2}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin44"]}
              pcbX={4.2}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin45"]}
              pcbX={4.2}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin46"]}
              pcbX={4.2}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin47"]}
              pcbX={4.2}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin48"]}
              pcbX={4.2}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin49"]}
              pcbX={4.2}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin50"]}
              pcbX={4.2}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin51"]}
              pcbX={4.2}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin52"]}
              pcbX={4.2}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin53"]}
              pcbX={4.2}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin54"]}
              pcbX={4.2}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin55"]}
              pcbX={3.55}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin56"]}
              pcbX={3.55}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin57"]}
              pcbX={3.55}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin58"]}
              pcbX={3.55}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin59"]}
              pcbX={3.55}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin60"]}
              pcbX={3.55}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin61"]}
              pcbX={3.55}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin62"]}
              pcbX={3.55}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin63"]}
              pcbX={3.55}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin64"]}
              pcbX={3.55}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin65"]}
              pcbX={3.55}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin66"]}
              pcbX={3.55}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin67"]}
              pcbX={3.55}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin68"]}
              pcbX={3.55}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin69"]}
              pcbX={3.55}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin70"]}
              pcbX={3.55}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin71"]}
              pcbX={3.55}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin72"]}
              pcbX={2.9}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin73"]}
              pcbX={2.9}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin74"]}
              pcbX={2.9}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin75"]}
              pcbX={2.9}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin76"]}
              pcbX={2.9}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin77"]}
              pcbX={2.9}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin78"]}
              pcbX={2.9}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin79"]}
              pcbX={2.9}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin80"]}
              pcbX={2.25}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin81"]}
              pcbX={2.25}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin82"]}
              pcbX={2.25}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin83"]}
              pcbX={2.25}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin84"]}
              pcbX={2.25}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin85"]}
              pcbX={2.25}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin86"]}
              pcbX={2.25}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin87"]}
              pcbX={2.25}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin88"]}
              pcbX={2.25}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin89"]}
              pcbX={2.25}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin90"]}
              pcbX={2.25}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin91"]}
              pcbX={2.25}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin92"]}
              pcbX={2.25}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin93"]}
              pcbX={2.25}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin94"]}
              pcbX={2.25}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin95"]}
              pcbX={2.25}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin96"]}
              pcbX={2.25}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin97"]}
              pcbX={1.6}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin98"]}
              pcbX={1.6}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin99"]}
              pcbX={1.6}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin100"]}
              pcbX={1.6}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin101"]}
              pcbX={1.6}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin102"]}
              pcbX={1.6}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin103"]}
              pcbX={1.6}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin104"]}
              pcbX={1.6}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin105"]}
              pcbX={1.6}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin106"]}
              pcbX={1.6}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin107"]}
              pcbX={1.6}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin108"]}
              pcbX={1.6}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin109"]}
              pcbX={1.6}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin110"]}
              pcbX={1.6}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin111"]}
              pcbX={1.6}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin112"]}
              pcbX={1.6}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin113"]}
              pcbX={1.6}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin114"]}
              pcbX={1.6}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin115"]}
              pcbX={0.95}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin116"]}
              pcbX={0.95}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin117"]}
              pcbX={0.95}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin118"]}
              pcbX={0.95}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin119"]}
              pcbX={0.95}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin120"]}
              pcbX={0.95}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin121"]}
              pcbX={0.95}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin122"]}
              pcbX={0.95}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin123"]}
              pcbX={0.95}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin124"]}
              pcbX={0.95}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin125"]}
              pcbX={0.95}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin126"]}
              pcbX={0.95}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin127"]}
              pcbX={0.95}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin128"]}
              pcbX={0.95}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin129"]}
              pcbX={0.95}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin130"]}
              pcbX={0.95}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin131"]}
              pcbX={0.95}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin132"]}
              pcbX={0.95}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin133"]}
              pcbX={0.3}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin134"]}
              pcbX={0.3}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin135"]}
              pcbX={0.3}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin136"]}
              pcbX={0.3}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin137"]}
              pcbX={0.3}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin138"]}
              pcbX={0.3}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin139"]}
              pcbX={0.3}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin140"]}
              pcbX={0.3}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin141"]}
              pcbX={0.3}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin142"]}
              pcbX={0.3}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin143"]}
              pcbX={0.3}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin144"]}
              pcbX={0.3}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin145"]}
              pcbX={0.3}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin146"]}
              pcbX={0.3}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin147"]}
              pcbX={0.3}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin148"]}
              pcbX={0.3}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin149"]}
              pcbX={-0.35}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin150"]}
              pcbX={-0.35}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin151"]}
              pcbX={-0.35}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin152"]}
              pcbX={-0.35}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin153"]}
              pcbX={-0.35}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin154"]}
              pcbX={-0.35}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin155"]}
              pcbX={-0.35}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin156"]}
              pcbX={-0.35}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin157"]}
              pcbX={-0.35}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin158"]}
              pcbX={-0.35}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin159"]}
              pcbX={-0.35}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin160"]}
              pcbX={-0.35}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin161"]}
              pcbX={-0.35}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin162"]}
              pcbX={-0.35}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin163"]}
              pcbX={-0.35}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin164"]}
              pcbX={-0.35}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin165"]}
              pcbX={-0.35}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin166"]}
              pcbX={-1}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin167"]}
              pcbX={-1}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin168"]}
              pcbX={-1}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin169"]}
              pcbX={-1}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin170"]}
              pcbX={-1}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin171"]}
              pcbX={-1}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin172"]}
              pcbX={-1}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin173"]}
              pcbX={-1}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin174"]}
              pcbX={-1}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin175"]}
              pcbX={-1}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin176"]}
              pcbX={-1}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin177"]}
              pcbX={-1}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin178"]}
              pcbX={-1}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin179"]}
              pcbX={-1}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin180"]}
              pcbX={-1}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin181"]}
              pcbX={-1}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin182"]}
              pcbX={-1}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin183"]}
              pcbX={-1.65}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin184"]}
              pcbX={-1.65}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin185"]}
              pcbX={-1.65}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin186"]}
              pcbX={-1.65}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin187"]}
              pcbX={-1.65}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin188"]}
              pcbX={-1.65}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin189"]}
              pcbX={-2.3}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin190"]}
              pcbX={-2.3}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin191"]}
              pcbX={-2.3}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin192"]}
              pcbX={-2.3}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin193"]}
              pcbX={-2.3}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin194"]}
              pcbX={-2.3}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin195"]}
              pcbX={-2.3}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin196"]}
              pcbX={-2.3}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin197"]}
              pcbX={-2.3}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin198"]}
              pcbX={-2.3}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin199"]}
              pcbX={-2.3}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin200"]}
              pcbX={-2.3}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin201"]}
              pcbX={-2.3}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin202"]}
              pcbX={-2.3}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin203"]}
              pcbX={-2.3}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin204"]}
              pcbX={-2.3}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin205"]}
              pcbX={-2.95}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin206"]}
              pcbX={-2.95}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin207"]}
              pcbX={-2.95}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin208"]}
              pcbX={-2.95}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin209"]}
              pcbX={-2.95}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin210"]}
              pcbX={-2.95}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin211"]}
              pcbX={-2.95}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin212"]}
              pcbX={-2.95}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin213"]}
              pcbX={-2.95}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin214"]}
              pcbX={-2.95}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin215"]}
              pcbX={-2.95}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin216"]}
              pcbX={-2.95}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin217"]}
              pcbX={-2.95}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin218"]}
              pcbX={-2.95}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin219"]}
              pcbX={-2.95}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin220"]}
              pcbX={-2.95}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin221"]}
              pcbX={-3.6}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin222"]}
              pcbX={-3.6}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin223"]}
              pcbX={-3.6}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin224"]}
              pcbX={-3.6}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin225"]}
              pcbX={-3.6}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin226"]}
              pcbX={-3.6}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin227"]}
              pcbX={-3.6}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin228"]}
              pcbX={-3.6}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin229"]}
              pcbX={-3.6}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin230"]}
              pcbX={-3.6}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin231"]}
              pcbX={-3.6}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin232"]}
              pcbX={-3.6}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin233"]}
              pcbX={-3.6}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin234"]}
              pcbX={-4.25}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin235"]}
              pcbX={-4.25}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin236"]}
              pcbX={-4.25}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin237"]}
              pcbX={-4.25}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin238"]}
              pcbX={-4.25}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin239"]}
              pcbX={-4.25}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin240"]}
              pcbX={-4.25}
              pcbY={2.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin241"]}
              pcbX={-4.25}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin242"]}
              pcbX={-4.25}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin243"]}
              pcbX={-4.25}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin244"]}
              pcbX={-4.25}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin245"]}
              pcbX={-4.25}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin246"]}
              pcbX={-4.25}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin247"]}
              pcbX={-4.25}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin248"]}
              pcbX={-4.25}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin249"]}
              pcbX={-4.25}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin250"]}
              pcbX={-4.25}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin251"]}
              pcbX={-4.25}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin252"]}
              pcbX={-4.25}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin253"]}
              pcbX={-4.9}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin254"]}
              pcbX={-4.9}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin255"]}
              pcbX={-4.9}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin256"]}
              pcbX={-4.9}
              pcbY={4.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin257"]}
              pcbX={-4.9}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin258"]}
              pcbX={-4.9}
              pcbY={3.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin259"]}
              pcbX={-4.9}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin260"]}
              pcbX={-4.9}
              pcbY={1.325}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin261"]}
              pcbX={-4.9}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin262"]}
              pcbX={-4.9}
              pcbY={0.025}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin263"]}
              pcbX={-4.9}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin264"]}
              pcbX={-4.9}
              pcbY={-1.275}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin265"]}
              pcbX={-4.9}
              pcbY={-1.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin266"]}
              pcbX={-4.9}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin267"]}
              pcbX={-4.9}
              pcbY={-3.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin268"]}
              pcbX={-4.9}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin269"]}
              pcbX={-4.9}
              pcbY={-4.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin270"]}
              pcbX={-4.9}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin271"]}
              pcbX={-4.9}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin272"]}
              pcbX={-4.9}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin273"]}
              pcbX={-5.55}
              pcbY={6.525}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin274"]}
              pcbX={-5.55}
              pcbY={5.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin275"]}
              pcbX={-5.55}
              pcbY={5.225}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin276"]}
              pcbX={-5.55}
              pcbY={3.925}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin277"]}
              pcbX={-5.55}
              pcbY={1.975}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin278"]}
              pcbX={-5.55}
              pcbY={0.675}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin279"]}
              pcbX={-5.55}
              pcbY={-0.625}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin280"]}
              pcbX={-5.55}
              pcbY={-2.575}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin281"]}
              pcbX={-5.55}
              pcbY={-3.875}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin282"]}
              pcbX={-5.55}
              pcbY={-5.175}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin283"]}
              pcbX={-5.55}
              pcbY={-5.825}
              shape="circle"
              radius={0.175}
            />
            <smtpad
              portHints={["pin284"]}
              pcbX={-5.55}
              pcbY={-6.475}
              shape="circle"
              radius={0.175}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={-6.819999999999993}
        pcbY={10.539999999999992}
        layer="top"
        pinLabels={{
          pin1: ["BALL_A1"],
          pin2: ["BALL_A2"],
          pin3: ["BALL_A3"],
          pin4: ["BALL_A7"],
          pin5: ["BALL_A8"],
          pin6: ["BALL_A9"],
          pin7: ["BALL_B1"],
          pin8: ["BALL_B2"],
          pin9: ["BALL_B3"],
          pin10: ["BALL_B7"],
          pin11: ["BALL_B8"],
          pin12: ["BALL_B9"],
          pin13: ["BALL_C1"],
          pin14: ["BALL_C2"],
          pin15: ["BALL_C3"],
          pin16: ["BALL_C7"],
          pin17: ["BALL_C8"],
          pin18: ["BALL_C9"],
          pin19: ["BALL_D1"],
          pin20: ["BALL_D2"],
          pin21: ["BALL_D3"],
          pin22: ["BALL_D7"],
          pin23: ["BALL_D8"],
          pin24: ["BALL_D9"],
          pin25: ["BALL_E1"],
          pin26: ["BALL_E2"],
          pin27: ["BALL_E3"],
          pin28: ["BALL_E7"],
          pin29: ["BALL_E8"],
          pin30: ["BALL_E9"],
          pin31: ["BALL_F1"],
          pin32: ["BALL_F2"],
          pin33: ["BALL_F3"],
          pin34: ["BALL_F7"],
          pin35: ["BALL_F8"],
          pin36: ["BALL_F9"],
          pin37: ["BALL_G1"],
          pin38: ["BALL_G2"],
          pin39: ["BALL_G3"],
          pin40: ["BALL_G7"],
          pin41: ["BALL_G8"],
          pin42: ["BALL_G9"],
          pin43: ["BALL_H1"],
          pin44: ["BALL_H2"],
          pin45: ["BALL_H3"],
          pin46: ["BALL_H7"],
          pin47: ["BALL_H8"],
          pin48: ["BALL_H9"],
          pin49: ["BALL_J1"],
          pin50: ["BALL_J2"],
          pin51: ["BALL_J3"],
          pin52: ["BALL_J7"],
          pin53: ["BALL_J8"],
          pin54: ["BALL_J9"],
          pin55: ["BALL_K1"],
          pin56: ["BALL_K2"],
          pin57: ["BALL_K3"],
          pin58: ["BALL_K7"],
          pin59: ["BALL_K8"],
          pin60: ["BALL_K9"],
          pin61: ["BALL_L1"],
          pin62: ["BALL_L2"],
          pin63: ["BALL_L3"],
          pin64: ["BALL_L7"],
          pin65: ["BALL_L8"],
          pin66: ["BALL_L9"],
          pin67: ["BALL_M1"],
          pin68: ["BALL_M2"],
          pin69: ["BALL_M3"],
          pin70: ["BALL_M7"],
          pin71: ["BALL_M8"],
          pin72: ["BALL_M9"],
          pin73: ["BALL_N1"],
          pin74: ["BALL_N2"],
          pin75: ["BALL_N3"],
          pin76: ["BALL_N7"],
          pin77: ["BALL_N8"],
          pin78: ["BALL_N9"],
          pin79: ["BALL_P1"],
          pin80: ["BALL_P2"],
          pin81: ["BALL_P3"],
          pin82: ["BALL_P7"],
          pin83: ["BALL_P8"],
          pin84: ["BALL_P9"],
          pin85: ["BALL_R1"],
          pin86: ["BALL_R2"],
          pin87: ["BALL_R3"],
          pin88: ["BALL_R7"],
          pin89: ["BALL_R8"],
          pin90: ["BALL_R9"],
          pin91: ["BALL_T1"],
          pin92: ["BALL_T2"],
          pin93: ["BALL_T3"],
          pin94: ["BALL_T7"],
          pin95: ["BALL_T8"],
          pin96: ["BALL_T9"],
        }}
        manufacturerPartNumber="K4B8G1646D"
        noSchematicRepresentation
        footprint={
          <footprint originalLayer="top">
            <smtpad
              portHints={["pin1"]}
              pcbX={-3.2}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={-2.4}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={-1.6}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={1.6}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin5"]}
              pcbX={2.4}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin6"]}
              pcbX={3.2}
              pcbY={6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin7"]}
              pcbX={-3.2}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin8"]}
              pcbX={-2.4}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin9"]}
              pcbX={-1.6}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin10"]}
              pcbX={1.6}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin11"]}
              pcbX={2.4}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin12"]}
              pcbX={3.2}
              pcbY={5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin13"]}
              pcbX={-3.2}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin14"]}
              pcbX={-2.4}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin15"]}
              pcbX={-1.6}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin16"]}
              pcbX={1.6}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin17"]}
              pcbX={2.4}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin18"]}
              pcbX={3.2}
              pcbY={4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin19"]}
              pcbX={-3.2}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin20"]}
              pcbX={-2.4}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin21"]}
              pcbX={-1.6}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin22"]}
              pcbX={1.6}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin23"]}
              pcbX={2.4}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin24"]}
              pcbX={3.2}
              pcbY={3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin25"]}
              pcbX={-3.2}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin26"]}
              pcbX={-2.4}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin27"]}
              pcbX={-1.6}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin28"]}
              pcbX={1.6}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin29"]}
              pcbX={2.4}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin30"]}
              pcbX={3.2}
              pcbY={2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin31"]}
              pcbX={-3.2}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin32"]}
              pcbX={-2.4}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin33"]}
              pcbX={-1.6}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin34"]}
              pcbX={1.6}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin35"]}
              pcbX={2.4}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin36"]}
              pcbX={3.2}
              pcbY={2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin37"]}
              pcbX={-3.2}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin38"]}
              pcbX={-2.4}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin39"]}
              pcbX={-1.6}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin40"]}
              pcbX={1.6}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin41"]}
              pcbX={2.4}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin42"]}
              pcbX={3.2}
              pcbY={1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin43"]}
              pcbX={-3.2}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin44"]}
              pcbX={-2.4}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin45"]}
              pcbX={-1.6}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin46"]}
              pcbX={1.6}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin47"]}
              pcbX={2.4}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin48"]}
              pcbX={3.2}
              pcbY={0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin49"]}
              pcbX={-3.2}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin50"]}
              pcbX={-2.4}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin51"]}
              pcbX={-1.6}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin52"]}
              pcbX={1.6}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin53"]}
              pcbX={2.4}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin54"]}
              pcbX={3.2}
              pcbY={-0.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin55"]}
              pcbX={-3.2}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin56"]}
              pcbX={-2.4}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin57"]}
              pcbX={-1.6}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin58"]}
              pcbX={1.6}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin59"]}
              pcbX={2.4}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin60"]}
              pcbX={3.2}
              pcbY={-1.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin61"]}
              pcbX={-3.2}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin62"]}
              pcbX={-2.4}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin63"]}
              pcbX={-1.6}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin64"]}
              pcbX={1.6}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin65"]}
              pcbX={2.4}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin66"]}
              pcbX={3.2}
              pcbY={-2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin67"]}
              pcbX={-3.2}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin68"]}
              pcbX={-2.4}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin69"]}
              pcbX={-1.6}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin70"]}
              pcbX={1.6}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin71"]}
              pcbX={2.4}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin72"]}
              pcbX={3.2}
              pcbY={-2.8}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin73"]}
              pcbX={-3.2}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin74"]}
              pcbX={-2.4}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin75"]}
              pcbX={-1.6}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin76"]}
              pcbX={1.6}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin77"]}
              pcbX={2.4}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin78"]}
              pcbX={3.2}
              pcbY={-3.6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin79"]}
              pcbX={-3.2}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin80"]}
              pcbX={-2.4}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin81"]}
              pcbX={-1.6}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin82"]}
              pcbX={1.6}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin83"]}
              pcbX={2.4}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin84"]}
              pcbX={3.2}
              pcbY={-4.4}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin85"]}
              pcbX={-3.2}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin86"]}
              pcbX={-2.4}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin87"]}
              pcbX={-1.6}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin88"]}
              pcbX={1.6}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin89"]}
              pcbX={2.4}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin90"]}
              pcbX={3.2}
              pcbY={-5.2}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin91"]}
              pcbX={-3.2}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin92"]}
              pcbX={-2.4}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin93"]}
              pcbX={-1.6}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin94"]}
              pcbX={1.6}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin95"]}
              pcbX={2.4}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
            <smtpad
              portHints={["pin96"]}
              pcbX={3.2}
              pcbY={-6}
              shape="circle"
              radius={0.2}
            />
          </footprint>
        }
      />
      <resistor
        name="R4"
        resistance="100R"
        pcbX={-6.112500000000011}
        pcbY={11.439999999999998}
        layer="bottom"
        footprint={
          <footprint originalLayer="bottom">
            <smtpad
              portHints={["pin1"]}
              pcbX={0.5975}
              pcbY={0}
              shape="rotated_rect"
              width={0.715}
              height={0.64}
              ccwRotation={180}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={-0.5975}
              pcbY={0}
              shape="rotated_rect"
              width={0.715}
              height={0.64}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <capacitor
        name="C7"
        capacitance="2.2p"
        pcbX={-0.6299999999999955}
        pcbY={9.387499999999989}
        layer="bottom"
        footprint={
          <footprint originalLayer="bottom">
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0.5675}
              shape="rotated_rect"
              width={0.735}
              height={0.62}
              ccwRotation={270}
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={-0.5675}
              shape="rotated_rect"
              width={0.735}
              height={0.62}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <net
        name="DDR_000"
        connectsTo={[".U1 > .pin275", ".U2 > .pin27"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_001"
        connectsTo={[".U1 > .pin210", ".U2 > .pin34"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_002"
        connectsTo={[".U1 > .pin256", ".U2 > .pin17"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_003"
        connectsTo={[".U1 > .pin206", ".U2 > .pin14"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_004"
        connectsTo={[".U1 > .pin235", ".U2 > .pin4"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_005"
        connectsTo={[".U1 > .pin190", ".U2 > .pin2"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_006"
        connectsTo={[".U1 > .pin255", ".U2 > .pin11"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_007"
        connectsTo={[".U1 > .pin189", ".U2 > .pin3"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_008"
        connectsTo={[".U1 > .pin224", ".U2 > .pin32"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_009"
        connectsTo={[".U1 > .pin226", ".U2 > .pin35"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_010"
        connectsTo={[".U1 > .pin191", ".U2 > .pin45"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_011"
        connectsTo={[".U1 > .pin209", ".U2 > .pin47"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_012"
        connectsTo={[".U1 > .pin208", ".U2 > .pin38"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_013"
        connectsTo={[".U1 > .pin192", ".U2 > .pin46"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_014"
        connectsTo={[".U1 > .pin237", ".U2 > .pin22"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_015"
        connectsTo={[".U1 > .pin205", ".U2 > .pin15"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_016"
        connectsTo={[".U1 > .pin218", ".U2 > .pin75"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_017"
        connectsTo={[".U1 > .pin229", ".U2 > .pin82"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_018"
        connectsTo={[".U1 > .pin270", ".U2 > .pin64"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_019"
        connectsTo={[".U1 > .pin268", ".U2 > .pin88"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_020"
        connectsTo={[".U1 > .pin217", ".U2 > .pin76"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_021"
        connectsTo={[".U1 > .pin230", ".U2 > .pin93"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_022"
        connectsTo={[".U1 > .pin216", ".U2 > .pin94"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_023"
        connectsTo={[".U1 > .pin269", ".U2 > .pin70"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_024"
        connectsTo={[".U1 > .pin250", ".U2 > .pin81"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_025"
        connectsTo={[".U1 > .pin231", ".U2 > .pin74"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_026"
        connectsTo={[".U1 > .pin267", ".U2 > .pin83"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_027"
        connectsTo={[".U1 > .pin232", ".U2 > .pin80"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_028"
        connectsTo={[".U1 > .pin198", ".U2 > .pin89"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_029"
        connectsTo={[".U1 > .pin252", ".U2 > .pin86"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_030"
        connectsTo={[".U1 > .pin281", ".U2 > .pin95"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_031"
        connectsTo={[".U1 > .pin251", ".U2 > .pin87"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_032"
        connectsTo={[".U1 > .pin219", ".U2 > .pin68"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_033"
        connectsTo={[".U1 > .pin266", ".U2 > .pin77"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_034"
        connectsTo={[".U1 > .pin271", ".U2 > .pin69"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_035"
        connectsTo={[".U1 > .pin200", ".U2 > .pin57"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_036"
        connectsTo={[".U1 > .pin280", ".U2 > .pin60"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_037"
        connectsTo={[".U1 > .pin215", ".U2 > .pin54"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_038"
        connectsTo={[
          ".C7 > .pin2",
          ".R4 > .pin2",
          ".U1 > .pin265",
          ".U2 > .pin58",
        ]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <trace
        name="SCKN"
        path={[".U1 > .pin265", ".U2 > .pin58", "net.DDR_038"]}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_039"
        connectsTo={[
          ".C7 > .pin1",
          ".R4 > .pin1",
          ".U1 > .pin246",
          ".U2 > .pin52",
        ]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <trace
        name="SCKP"
        path={[".U1 > .pin246", ".U2 > .pin52", "net.DDR_039"]}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_040"
        connectsTo={[".U1 > .pin220", ".U2 > .pin62"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_041"
        connectsTo={[".U1 > .pin202", ".U2 > .pin61"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_042"
        connectsTo={[".U1 > .pin253", ".U2 > .pin21"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_043"
        connectsTo={[".U1 > .pin223", ".U2 > .pin28"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_044"
        connectsTo={[".U1 > .pin221", ".U2 > .pin10"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_045"
        connectsTo={[".U1 > .pin222", ".U2 > .pin16"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_046"
        connectsTo={[".U1 > .pin274", ".U2 > .pin39"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_047"
        connectsTo={[".U1 > .pin254", ".U2 > .pin33"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_048"
        connectsTo={[".U1 > .pin203", ".U2 > .pin55"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_049"
        connectsTo={[".U1 > .pin204", ".U2 > .pin49"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_050"
        connectsTo={[".U1 > .pin248", ".U2 > .pin51"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_051"
        connectsTo={[".U1 > .pin272", ".U2 > .pin92"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <net
        name="DDR_052"
        connectsTo={[".U1 > .pin283", ".U2 > .pin63"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={0}
      />
      <bus
        name="CLOCK"
        connections={["SCKP", "SCKN"]}
        maxLengthSkew={0.096626}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      {/* For n signals, range <= mean tolerance * n/(n-1) guarantees the reference mean-deviation rule. */}
      <bus
        name="LOW_DATA"
        connections={[
          ".U1 > .pin275",
          ".U1 > .pin224",
          ".U1 > .pin226",
          ".U1 > .pin191",
          ".U1 > .pin209",
          ".U1 > .pin208",
          ".U1 > .pin192",
        ]}
        maxLengthSkew={(2.54 * 7) / 6}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="HIGH_DATA"
        connections={[
          ".U1 > .pin210",
          ".U1 > .pin256",
          ".U1 > .pin206",
          ".U1 > .pin235",
          ".U1 > .pin190",
          ".U1 > .pin255",
          ".U1 > .pin189",
          ".U1 > .pin237",
          ".U1 > .pin205",
        ]}
        maxLengthSkew={(2.54 * 9) / 8}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="LOW_STROBE"
        connections={[".U1 > .pin254", ".U1 > .pin274"]}
        maxLengthSkew={0.359683}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="HIGH_STROBE"
        connections={[".U1 > .pin222", ".U1 > .pin221"]}
        maxLengthSkew={2.615682}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="BYTE0"
        connections={[
          ".U1 > .pin275",
          ".U1 > .pin210",
          ".U1 > .pin224",
          ".U1 > .pin226",
          ".U1 > .pin191",
          ".U1 > .pin209",
          ".U1 > .pin208",
          ".U1 > .pin192",
          ".U1 > .pin223",
          ".U1 > .pin254",
          ".U1 > .pin274",
        ]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="BYTE1"
        connections={[
          ".U1 > .pin237",
          ".U1 > .pin205",
          ".U1 > .pin256",
          ".U1 > .pin206",
          ".U1 > .pin235",
          ".U1 > .pin190",
          ".U1 > .pin255",
          ".U1 > .pin189",
          ".U1 > .pin253",
          ".U1 > .pin222",
          ".U1 > .pin221",
        ]}
        maxLengthSkew={6.418864}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="DQ0_TO_DQS"
        connections={[".U1 > .pin275"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ1_TO_DQS"
        connections={[".U1 > .pin210"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ2_TO_DQS"
        connections={[".U1 > .pin224"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ3_TO_DQS"
        connections={[".U1 > .pin226"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ4_TO_DQS"
        connections={[".U1 > .pin191"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ5_TO_DQS"
        connections={[".U1 > .pin209"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ6_TO_DQS"
        connections={[".U1 > .pin208"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ7_TO_DQS"
        connections={[".U1 > .pin192"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="SDQM1_TO_DQS"
        connections={[".U1 > .pin223"]}
        maxLengthSkew={7.546898}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ8_TO_DQS"
        connections={[".U1 > .pin237"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ9_TO_DQS"
        connections={[".U1 > .pin205"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ10_TO_DQS"
        connections={[".U1 > .pin256"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ11_TO_DQS"
        connections={[".U1 > .pin206"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ12_TO_DQS"
        connections={[".U1 > .pin235"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ13_TO_DQS"
        connections={[".U1 > .pin190"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ14_TO_DQS"
        connections={[".U1 > .pin255"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ15_TO_DQS"
        connections={[".U1 > .pin189"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="SDQM0_TO_DQS"
        connections={[".U1 > .pin253"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="ADDRESS"
        connections={[
          ".U1 > .pin218",
          ".U1 > .pin229",
          ".U1 > .pin250",
          ".U1 > .pin231",
          ".U1 > .pin267",
          ".U1 > .pin232",
          ".U1 > .pin198",
          ".U1 > .pin252",
          ".U1 > .pin281",
          ".U1 > .pin251",
          ".U1 > .pin270",
          ".U1 > .pin268",
          ".U1 > .pin217",
          ".U1 > .pin230",
          ".U1 > .pin216",
          ".U1 > .pin269",
        ]}
        maxLengthSkew={(6.35 * 16) / 15}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="ADDRESS_COMMAND"
        connections={[
          ".U1 > .pin218",
          ".U1 > .pin229",
          ".U1 > .pin250",
          ".U1 > .pin231",
          ".U1 > .pin267",
          ".U1 > .pin232",
          ".U1 > .pin198",
          ".U1 > .pin252",
          ".U1 > .pin281",
          ".U1 > .pin251",
          ".U1 > .pin270",
          ".U1 > .pin268",
          ".U1 > .pin217",
          ".U1 > .pin230",
          ".U1 > .pin216",
          ".U1 > .pin269",
          ".U1 > .pin219",
          ".U1 > .pin266",
          ".U1 > .pin271",
          ".U1 > .pin200",
          ".U1 > .pin280",
          ".U1 > .pin215",
          ".U1 > .pin220",
          ".U1 > .pin202",
          ".U1 > .pin203",
          ".U1 > .pin204",
          ".U1 > .pin248",
          ".U1 > .pin283",
        ]}
        maxLengthSkew={19.717944}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="SA0_TO_CLK"
        connections={[".U1 > .pin218"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA1_TO_CLK"
        connections={[".U1 > .pin229"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA2_TO_CLK"
        connections={[".U1 > .pin250"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA3_TO_CLK"
        connections={[".U1 > .pin231"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA4_TO_CLK"
        connections={[".U1 > .pin267"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA5_TO_CLK"
        connections={[".U1 > .pin232"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA6_TO_CLK"
        connections={[".U1 > .pin198"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA7_TO_CLK"
        connections={[".U1 > .pin252"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA8_TO_CLK"
        connections={[".U1 > .pin281"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA9_TO_CLK"
        connections={[".U1 > .pin251"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA10_TO_CLK"
        connections={[".U1 > .pin270"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA11_TO_CLK"
        connections={[".U1 > .pin268"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA12_TO_CLK"
        connections={[".U1 > .pin217"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA13_TO_CLK"
        connections={[".U1 > .pin230"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA14_TO_CLK"
        connections={[".U1 > .pin216"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA15_TO_CLK"
        connections={[".U1 > .pin269"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA0_TO_CLK"
        connections={[".U1 > .pin219"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA1_TO_CLK"
        connections={[".U1 > .pin266"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA2_TO_CLK"
        connections={[".U1 > .pin271"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCAS_TO_CLK"
        connections={[".U1 > .pin200"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCKE0_TO_CLK"
        connections={[".U1 > .pin280"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCKE1_TO_CLK"
        connections={[".U1 > .pin215"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCS0_TO_CLK"
        connections={[".U1 > .pin220"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCS1_TO_CLK"
        connections={[".U1 > .pin202"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SODT0_TO_CLK"
        connections={[".U1 > .pin203"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SODT1_TO_CLK"
        connections={[".U1 > .pin204"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SRAS_TO_CLK"
        connections={[".U1 > .pin248"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SWE_TO_CLK"
        connections={[".U1 > .pin283"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <autoroutingphase
        name="DDR_ROUTING"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <pcbnotetext
        pcbY={19.4}
        fontSize={0.5}
        text="H616 DDR3: 53 native nets; built-in bus lanes routing"
      />
    </board>
  )
}
