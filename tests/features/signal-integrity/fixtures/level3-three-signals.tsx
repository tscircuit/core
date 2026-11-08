import { Inverter, Supply } from "./parts"

export default () => (
  <board
    width="40mm"
    height="24mm"
    layers={2}
    fabricatorPreset="jlcpcb_standard"
  >
    <Inverter name="TX0" pcbX={-15} pcbY={4} />
    <Inverter name="TX1" pcbX={-15} pcbY={0} />
    <Inverter name="TX2" pcbX={-15} pcbY={-4} />
    <Inverter name="RX0" pcbX={15} pcbY={4} />
    <Inverter name="RX1" pcbX={15} pcbY={0} />
    <Inverter name="RX2" pcbX={15} pcbY={-4} />
    <Supply />

    <trace from=".TX0 > .Y" to=".RX0 > .A" />
    <trace from=".TX1 > .Y" to=".RX1 > .A" />
    <trace from=".TX2 > .Y" to=".RX2 > .A" />
    <copperpour connectsTo="net.GND" layer="bottom" />

    <signalintegrity name="TRAFFIC" bitRate="20Mbps">
      <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
      <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" />
      <signal name="D2" driver=".TX2 > .Y" receiver=".RX2 > .A" />
    </signalintegrity>

    <signalintegrity name="XTALK_LOW" bitRate="20Mbps">
      <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
      <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" quiet="low" />
      <signal name="D2" driver=".TX2 > .Y" receiver=".RX2 > .A" />
    </signalintegrity>

    <signalintegrity name="XTALK_HIGH" bitRate="20Mbps">
      <signal name="D0" driver=".TX0 > .Y" receiver=".RX0 > .A" />
      <signal name="D1" driver=".TX1 > .Y" receiver=".RX1 > .A" quiet="high" />
      <signal name="D2" driver=".TX2 > .Y" receiver=".RX2 > .A" />
    </signalintegrity>
  </board>
)
