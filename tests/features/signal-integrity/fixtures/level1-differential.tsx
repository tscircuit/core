const sn65hvd72 = {
  ibisModelAsset: {
    project_relative_path: "models/sn65hvd72.ibs",
    url: "./models/sn65hvd72.ibs",
    mimetype: "text/plain",
  },
  ibisComponentName: "SN65HVD72D",
  ibisPinNameToPortLabel: { "5": "GND", "6": "A", "7": "B", "8": "VCC" },
  ibisPinNameToModelName: { "6": "a_b_p", "7": "a_b_n" },
  ibisPinNameToReferencePortLabels: {
    "6": {
      pullup: "VCC",
      pulldown: "GND",
      powerClamp: "VCC",
      groundClamp: "GND",
    },
    "7": {
      pullup: "VCC",
      pulldown: "GND",
      powerClamp: "VCC",
      groundClamp: "GND",
    },
  },
}
const pins = {
  pin1: "R",
  pin2: "RE",
  pin3: "DE",
  pin4: "D",
  pin5: "GND",
  pin6: "A",
  pin7: "B",
  pin8: "VCC",
}

export default () => (
  <board
    width="60mm"
    height="20mm"
    layers={2}
    fabricatorPreset="jlcpcb_standard"
  >
    <autoroutingphase
      name="BUS_TRUNKS"
      phaseIndex={0}
      autorouter="auto_local"
    />
    <autoroutingphase
      name="TERMINATION_AND_SUPPLY"
      phaseIndex={1}
      autorouter="auto_local"
    />
    <chip
      name="TX"
      manufacturerPartNumber="SN65HVD72D"
      footprint="soic8"
      pcbX={-25}
      pinLabels={pins}
    />
    <chip
      name="RX"
      manufacturerPartNumber="SN65HVD72D"
      footprint="soic8"
      pcbX={20}
      pinLabels={pins}
    />
    <ibismodel componentRef=".TX" {...sn65hvd72} />
    <ibismodel componentRef=".RX" {...sn65hvd72} />

    <resistor name="RTERM" resistance="120" footprint="0603" pcbX={26} />

    <voltagesource
      name="V3V3"
      voltage="3.3V"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
    <trace routingPhaseIndex={1} from=".TX > .VCC" to="net.VCC" />
    <trace routingPhaseIndex={1} from=".RX > .VCC" to="net.VCC" />
    <trace routingPhaseIndex={1} from=".TX > .GND" to="net.GND" />
    <trace routingPhaseIndex={1} from=".RX > .GND" to="net.GND" />

    <trace name="BUS_P" routingPhaseIndex={0} from=".TX > .A" to=".RX > .A" />
    <trace name="BUS_N" routingPhaseIndex={0} from=".TX > .B" to=".RX > .B" />
    <trace routingPhaseIndex={1} from=".RX > .A" to=".RTERM > .pin1" />
    <trace routingPhaseIndex={1} from=".RX > .B" to=".RTERM > .pin2" />
    <differentialpair positiveConnection="BUS_P" negativeConnection="BUS_N" />
    <copperpour connectsTo="net.GND" layer="bottom" />

    <signalintegrity bitRate="250kbps">
      <signal
        name="BUS"
        driver={{ p: ".TX > .A", n: ".TX > .B" }}
        receiver={{ p: ".RX > .A", n: ".RX > .B" }}
      />
    </signalintegrity>
  </board>
)
