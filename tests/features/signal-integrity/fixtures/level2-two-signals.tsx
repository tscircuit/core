import { Inverter, Supply } from "./parts"

export default () => (
  <board
    width="40mm"
    height="20mm"
    layers={2}
    fabricatorPreset="jlcpcb_standard"
  >
    <Inverter name="TX0" pcbX={-15} pcbY={2} />
    <Inverter name="TX1" pcbX={-15} pcbY={-2} />
    <Inverter name="RX0" pcbX={15} pcbY={2} />
    <Inverter name="RX1" pcbX={15} pcbY={-2} />
    <Supply />

    <trace from=".TX0 > .Y" to=".RX0 > .A" />
    <trace from=".TX1 > .Y" to=".RX1 > .A" />
    <copperpour connectsTo="net.GND" layer="bottom" />

    <signalintegrity bitRate="20Mbps">
      <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
      <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" />
    </signalintegrity>
  </board>
)
