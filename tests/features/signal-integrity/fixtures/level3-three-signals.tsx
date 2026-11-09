import { signalintegrity } from "lib/namespaced-elements"
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

    <signalintegrity.simulation name="TRAFFIC" bitRate="20Mbps">
      <signalintegrity.signal
        name="D0"
        driverRef=".TX0 > .Y"
        receiverRef=".RX0 > .A"
      />
      <signalintegrity.signal
        name="D1"
        driverRef=".TX1 > .Y"
        receiverRef=".RX1 > .A"
      />
      <signalintegrity.signal
        name="D2"
        driverRef=".TX2 > .Y"
        receiverRef=".RX2 > .A"
      />
    </signalintegrity.simulation>

    <signalintegrity.simulation name="XTALK_LOW" bitRate="20Mbps">
      <signalintegrity.signal
        name="D0"
        driverRef=".TX0 > .Y"
        receiverRef=".RX0 > .A"
      />
      <signalintegrity.signal
        name="D1"
        driverRef=".TX1 > .Y"
        receiverRef=".RX1 > .A"
        quiet="low"
      />
      <signalintegrity.signal
        name="D2"
        driverRef=".TX2 > .Y"
        receiverRef=".RX2 > .A"
      />
    </signalintegrity.simulation>

    <signalintegrity.simulation name="XTALK_HIGH" bitRate="20Mbps">
      <signalintegrity.signal
        name="D0"
        driverRef=".TX0 > .Y"
        receiverRef=".RX0 > .A"
      />
      <signalintegrity.signal
        name="D1"
        driverRef=".TX1 > .Y"
        receiverRef=".RX1 > .A"
        quiet="high"
      />
      <signalintegrity.signal
        name="D2"
        driverRef=".TX2 > .Y"
        receiverRef=".RX2 > .A"
      />
    </signalintegrity.simulation>
  </board>
)
