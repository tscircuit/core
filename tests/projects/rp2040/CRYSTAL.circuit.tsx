import { sel } from "tscircuit"

export const CRYSTAL_SECTION = "crystal"

const CRYSTAL_X = 8
const CRYSTAL_Y = -2.1

export const CrystalCircuit = () => (
  <>
    <net name="XIN" />
    <net name="XOUT" />
    <net name="XOUT_XTAL" />
    <net name="GND" isGroundNet />

    <crystal
      schSectionName={CRYSTAL_SECTION}
      name="Y1"
      frequency="12MHz"
      loadCapacitance="15pF"
      schX={CRYSTAL_X}
      schY={CRYSTAL_Y}
      schOrientation="horizontal"
    />
    <resistor
      schSectionName={CRYSTAL_SECTION}
      name="R11"
      resistance="1k"
      schX={CRYSTAL_X + 1.4}
      schY={CRYSTAL_Y + 0.9}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={CRYSTAL_SECTION}
      name="C23"
      capacitance="15pF"
      schX={CRYSTAL_X - 1.2}
      schY={CRYSTAL_Y - 0.8}
      schOrientation="vertical"
    />
    <capacitor
      schSectionName={CRYSTAL_SECTION}
      name="C24"
      capacitance="15pF"
      schX={CRYSTAL_X + 1.4}
      schY={CRYSTAL_Y - 0.8}
      schOrientation="vertical"
    />

    <netlabel
      schX={CRYSTAL_X - 1.2}
      schY={CRYSTAL_Y + 1.8}
      net="XIN"
      connectsTo="C23.pin1"
      anchorSide="bottom"
    />
    <netlabel
      schX={CRYSTAL_X + 1.4}
      schY={CRYSTAL_Y + 1.8}
      net="XOUT"
      connectsTo="R11.pin1"
      anchorSide="bottom"
    />

    <trace from={sel.Y1.pin1} to="net.XIN" />
    <trace from={sel.C23.pin1} to="net.XIN" />

    <trace from={sel.R11.pin1} to="net.XOUT" />
    <trace from={sel.R11.pin2} to="net.XOUT_XTAL" />
    <trace from={sel.Y1.pin2} to="net.XOUT_XTAL" />
    <trace from={sel.C24.pin1} to="net.XOUT_XTAL" />

    <trace from={sel.C23.pin2} to={sel.net.GND} />
    <trace from={sel.C24.pin2} to={sel.net.GND} />
  </>
)

export default () => (
  <board routingDisabled>
    <CrystalCircuit />
  </board>
)
