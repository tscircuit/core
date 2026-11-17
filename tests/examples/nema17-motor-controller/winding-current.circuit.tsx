const sheetName = "winding-current"

const WindingCurrentChannel = ({
  phase,
  schX,
}: {
  phase: "A" | "B"
  schX: number
}) => {
  const amplifier = `U_CURRENT_${phase}`
  const shunt = `R_PHASE_${phase}`
  const filterResistor = `R_ADC_${phase}`
  const section = {
    schSheetName: sheetName,
    schSectionName: `winding-${phase}`,
  }

  return (
    <group name={`phase-${phase}`} schX={schX} schSheetName={sheetName}>
      <resistor
        {...section}
        name={shunt}
        resistance="50mΩ"
        schX={-2.94}
        schRotation={270}
        connections={{ pin1: `net.${phase}_DRIVE`, pin2: `net.${phase}_POS` }}
      />
      <chip
        {...section}
        name={amplifier}
        manufacturerPartNumber="INA240A1D"
        schWidth={1.98}
        schHeight={2.35}
        pinLabels={{
          pin1: "IN_NEG",
          pin2: "GND",
          pin3: "REF2",
          pin4: "NC",
          pin5: "OUT",
          pin6: "VS",
          pin7: "REF1",
          pin8: "IN_POS",
        }}
        schPinArrangement={{
          leftSide: { pins: [8, 1], direction: "top-to-bottom" },
          rightSide: { pins: [5], direction: "top-to-bottom" },
          topSide: { pins: [6, 7], direction: "left-to-right" },
          bottomSide: { pins: [3, 2, 4], direction: "left-to-right" },
        }}
        schPinStyle={{
          pin1: { marginTop: 0.8 },
          pin7: { marginLeft: 0.85 },
          pin2: { marginLeft: 0.3 },
          pin4: { marginLeft: 0.3 },
        }}
        connections={{
          IN_POS: `${shunt}.pin1`,
          IN_NEG: `${shunt}.pin2`,
          VS: "net.V3V3",
          REF1: "net.V3V3",
          REF2: "net.GND",
          GND: "net.GND",
          NC: "net.GND",
        }}
      />
      <resistor
        {...section}
        name={filterResistor}
        resistance="1kΩ"
        schX={3.04}
        connections={{ pin2: `net.CURRENT_${phase}` }}
      />
      <trace
        from={`${amplifier}.OUT`}
        to={`${filterResistor}.pin1`}
        schDisplayLabel={`CURRENT_${phase}_OUT`}
      />
      <capacitor
        {...section}
        name={`C_ADC_${phase}`}
        capacitance="10nF"
        schX={4.69}
        schY={-1.3}
        schRotation={270}
        connections={{
          pin1: `${filterResistor}.pin2`,
          pin2: "net.GND",
        }}
      />
    </group>
  )
}

/** The two INA240 current-sense channels from the RP2040 motor controller. */
export default function Rp2040MotorControllerCurrentSense() {
  return (
    <board schMaxTraceDistance={5}>
      <schematicsheet
        name={sheetName}
        displayName="Winding Current Measurement"
        sheetIndex={1}
        sheetWidth="235mm"
        sheetHeight="90mm"
      >
        <schematicsection name="winding-A" displayName="Winding A" />
        <schematicsection name="winding-B" displayName="Winding B" />
      </schematicsheet>
      <WindingCurrentChannel phase="A" schX={-6.6} />
      <WindingCurrentChannel phase="B" schX={5.6} />
    </board>
  )
}
