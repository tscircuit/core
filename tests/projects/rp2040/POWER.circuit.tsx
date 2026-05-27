import { sel } from "tscircuit"

export const POWER_SECTION = "power"

const POWER_X = -5
const POWER_Y = -8.5

export const PowerCircuit = () => (
  <>
    <capacitor
      schSectionName={POWER_SECTION}
      name="C10"
      capacitance="10uF"
      schX={POWER_X - 6}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C11"
      capacitance="100nF"
      schX={POWER_X - 4.8}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C12"
      capacitance="100nF"
      schX={POWER_X - 3.6}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C13"
      capacitance="100nF"
      schX={POWER_X - 2.4}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C14"
      capacitance="100nF"
      schX={POWER_X - 1.2}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C15"
      capacitance="100nF"
      schX={POWER_X}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C16"
      capacitance="100nF"
      schX={POWER_X + 1.2}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C17"
      capacitance="100nF"
      schX={POWER_X + 2.4}
      schY={POWER_Y}
      schOrientation="vertical"
    />

    <capacitor
      schSectionName={POWER_SECTION}
      name="C18"
      capacitance="1uF"
      schX={POWER_X + 4.2}
      schY={POWER_Y}
      schOrientation="vertical"
    />

    <capacitor
      schSectionName={POWER_SECTION}
      name="C19"
      capacitance="1uF"
      schX={POWER_X + 5.8}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C20"
      capacitance="100nF"
      schX={POWER_X + 7}
      schY={POWER_Y}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={POWER_SECTION}
      name="C21"
      capacitance="100nF"
      schX={POWER_X + 8.2}
      schY={POWER_Y}
      schOrientation="vertical"
    />

    <trace from={sel.C10.pin1} to={sel.net.V3_3} />
    <trace from={sel.C11.pin1} to={sel.net.V3_3} />
    <trace from={sel.C12.pin1} to={sel.net.V3_3} />
    <trace from={sel.C13.pin1} to={sel.net.V3_3} />
    <trace from={sel.C14.pin1} to={sel.net.V3_3} />
    <trace from={sel.C15.pin1} to={sel.net.V3_3} />
    <trace from={sel.C16.pin1} to={sel.net.V3_3} />
    <trace from={sel.C17.pin1} to={sel.net.V3_3} />
    <trace from={sel.C18.pin1} to={sel.net.V3_3} />

    <trace from={sel.C19.pin1} to="net.V1" />
    <trace from={sel.C20.pin1} to="net.V1" />
    <trace from={sel.C21.pin1} to="net.V1" />

    <trace from={sel.C10.pin2} to={sel.net.GND} />
    <trace from={sel.C11.pin2} to={sel.net.GND} />
    <trace from={sel.C12.pin2} to={sel.net.GND} />
    <trace from={sel.C13.pin2} to={sel.net.GND} />
    <trace from={sel.C14.pin2} to={sel.net.GND} />
    <trace from={sel.C15.pin2} to={sel.net.GND} />
    <trace from={sel.C16.pin2} to={sel.net.GND} />
    <trace from={sel.C17.pin2} to={sel.net.GND} />
    <trace from={sel.C18.pin2} to={sel.net.GND} />
    <trace from={sel.C19.pin2} to={sel.net.GND} />
    <trace from={sel.C20.pin2} to={sel.net.GND} />
    <trace from={sel.C21.pin2} to={sel.net.GND} />
  </>
)

export default () => (
  <board routingDisabled>
    <PowerCircuit />
  </board>
)
