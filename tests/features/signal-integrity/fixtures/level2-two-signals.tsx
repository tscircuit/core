import { simulation } from "lib/namespaced-elements"
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

    <simulation.pcbtransientchannelsimulation bitRate="20Mbps">
      <simulation.pcbchannel
        name="D0"
        driverRef=".TX0 > .Y"
        receiverRef=".RX0 > .A"
      />
      <simulation.pcbchannel
        name="D1"
        driverRef=".TX1 > .Y"
        receiverRef=".RX1 > .A"
      />
    </simulation.pcbtransientchannelsimulation>
  </board>
)
