export const DEBUG_SECTION = "debug"

const DEBUG_X = 8
const DEBUG_Y = 5

export const DebugCircuit = () => (
  <>
    <switch
      schSectionName={DEBUG_SECTION}
      name="SW2"
      schRotation="-90"
      schX={DEBUG_X}
      schY={DEBUG_Y}
    />
    <resistor
      schSectionName={DEBUG_SECTION}
      name="R29"
      resistance="1k"
      schOrientation="vertical"
      schX={DEBUG_X}
      schY={DEBUG_Y - 2.3}
    />

    <switch
      schSectionName={DEBUG_SECTION}
      name="SW1"
      schRotation="-90"
      schX={DEBUG_X + 1.7}
      schY={DEBUG_Y}
    />
    <resistor
      schSectionName={DEBUG_SECTION}
      schX={DEBUG_X + 1.7}
      schY={DEBUG_Y - 2.3}
      name="R9"
      resistance="1k"
      schOrientation="vertical"
    />

    <led
      schSectionName={DEBUG_SECTION}
      name="ACT_LED"
      schRotation="-90"
      schX={DEBUG_X + 3.5}
      schY={DEBUG_Y}
    />
    <resistor
      schSectionName={DEBUG_SECTION}
      schX={DEBUG_X + 3.5}
      schY={DEBUG_Y - 2.3}
      name="R10"
      resistance="1k"
      schOrientation="vertical"
    />

    <led
      schSectionName={DEBUG_SECTION}
      name="AUX_LED"
      schRotation="-90"
      schX={DEBUG_X + 5.3}
      schY={DEBUG_Y}
    />
    <resistor
      schSectionName={DEBUG_SECTION}
      name="R28"
      resistance="1k"
      schOrientation="vertical"
      schX={DEBUG_X + 5.3}
      schY={DEBUG_Y - 2.3}
    />

    <trace from="R29.pin2" to="net.GND" />
    <trace from="R9.pin2" to="net.GND" />
    <trace from="R10.pin2" to="net.GND" />
    <trace from="R28.pin2" to="net.GND" />

    <trace from="SW2.pin2" to="R29.pin1" />
    <trace from="SW1.pin2" to="R9.pin1" />
    <trace from="ACT_LED.pin2" to="R10.pin1" />
    <trace from="AUX_LED.pin2" to="R28.pin1" />

    <testpoint
      schSectionName={DEBUG_SECTION}
      name="TP5"
      schX={DEBUG_X - 4}
      schY={DEBUG_Y - 1}
      schRotation="-90"
    />
    <testpoint
      schSectionName={DEBUG_SECTION}
      name="TP6"
      schX={DEBUG_X - 3}
      schY={DEBUG_Y - 1}
      schRotation="-90"
    />

    <testpoint
      schSectionName={DEBUG_SECTION}
      name="TP7"
      schX={DEBUG_X - 4}
      schY={DEBUG_Y - 3}
      schRotation="-90"
    />
    <testpoint
      schSectionName={DEBUG_SECTION}
      name="TP8"
      schX={DEBUG_X - 3}
      schY={DEBUG_Y - 3}
      schRotation="-90"
    />
    <testpoint
      schSectionName={DEBUG_SECTION}
      name="TP9"
      schX={DEBUG_X - 2}
      schY={DEBUG_Y - 3}
      schRotation="-90"
    />

    <trace from="TP6.pin1" to="net.V3_3" />
  </>
)

export default () => (
  <board schAutoLayoutEnabled>
    <DebugCircuit />
  </board>
)
