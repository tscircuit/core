export default function FanoutComponentViaInPadCircuit() {
  return (
    <board
      width="8mm"
      height="8mm"
      layers={4}
      autorouter="default"
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.4mm"
      isViaInPadAllowed
    >
      <fanout
        name="U1_FANOUT"
        width="3mm"
        height="3mm"
        autorouter={{ preset: "fanout", allowViaInPad: true }}
        fanoutPourNetMap={{ inner1: "GND" }}
      >
        <chip
          name="U1"
          pinLabels={{ pin1: "VSS" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={0}
                pcbY={0}
                shape="circle"
                radius="0.5mm"
              />
            </footprint>
          }
        />
        <trace name="GND_DROP" from=".U1 > .VSS" to="net.GND" />
      </fanout>
      <pcbnotetext text="DEFAULT BOARD AUTOROUTER" pcbY={2.8} fontSize={0.3} />
      <pcbnotetext text="fanout allowViaInPad=true" pcbY={2.2} fontSize={0.3} />
      <pcbnotetext
        text="Expected: via centered in VSS pad"
        pcbY={-2}
        fontSize={0.3}
      />
      <pcbnotetext text="VSS to inner1 GND" pcbY={-2.6} fontSize={0.3} />
    </board>
  )
}
