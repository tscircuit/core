const ibisFile = {
  project_relative_path: "models/sn74lvc1g04.ibs",
  url: "./models/sn74lvc1g04.ibs",
  mimetype: "text/plain",
}
const lvc1g04 = {
  ibisModelAsset: ibisFile,
  ibisComponentName: "LVC1G04_DCK",
  ibisPinNameToPortLabel: { "2": "A", "3": "GND", "4": "Y", "5": "VCC" },
  ibisPinNameToModelName: { "2": "LVC1G04_IN_33", "4": "LVC1G04_OUT_33" },
  ibisPinNameToReferencePortLabels: {
    "2": {
      pullup: "VCC",
      pulldown: "GND",
      powerClamp: "VCC",
      groundClamp: "GND",
    },
    "4": {
      pullup: "VCC",
      pulldown: "GND",
      powerClamp: "VCC",
      groundClamp: "GND",
    },
  },
}
const pins = { pin1: "NC", pin2: "A", pin3: "GND", pin4: "Y", pin5: "VCC" }

export default () => (
  <board
    width="40mm"
    height="20mm"
    layers={2}
    fabricatorPreset="jlcpcb_standard"
  >
    <chip
      name="TX"
      manufacturerPartNumber="SN74LVC1G04DCK"
      footprint="sot23_5"
      pcbX={-15}
      pinLabels={pins}
    />
    <chip
      name="RX"
      manufacturerPartNumber="SN74LVC1G04DCK"
      footprint="sot23_5"
      pcbX={15}
      pinLabels={pins}
    />

    <ibismodel componentRef=".TX" {...lvc1g04} />
    <ibismodel componentRef=".RX" {...lvc1g04} />

    <voltagesource
      name="V3V3"
      voltage="3.3V"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
    <trace from=".TX > .VCC" to="net.VCC" />
    <trace from=".RX > .VCC" to="net.VCC" />
    <trace from=".TX > .GND" to="net.GND" />
    <trace from=".RX > .GND" to="net.GND" />

    <trace from=".TX > .Y" to=".RX > .A" />

    <copperpour connectsTo="net.GND" layer="bottom" />

    <signalintegrity bitRate="20Mbps">
      <signal name="DATA" driver=".TX > .Y" receiver=".RX > .A" />
    </signalintegrity>
  </board>
)
