// Source: https://tscircuit.com/seveibar/am3352-ram-dogbone-and-single-layer-route-test (v0.0.9)
// Preserves components, placement and constraints; replaces custom routing with the public preset.
import { TimingConstraints } from "./design/timing-constraints"
import { AM3352, ballMap } from "./components/AM3352"
import { W631GG6MB_12, pinLabels as ramPins } from "./imports/W631GG6MB_12"

const ramNet = (s: string): string | undefined => {
  if (/^VSS/.test(s)) return "GND"
  if (/^VDD/.test(s)) return "DDR_1V5"
  if (/^VREF/.test(s)) return "DDR_VREF"
  if (/^DQL\d/.test(s)) return `DDR_D${s.slice(3)}`
  if (/^DQU\d/.test(s)) return `DDR_D${8 + Number(s.slice(3))}`
  if (/^A\d+$/.test(s) || /^BA\d/.test(s)) return `DDR_${s}`
  return (
    {
      ODT: "DDR_ODT",
      CKE: "DDR_CKE",
      CK: "DDR_CK",
      N_CK: "DDR_CKn",
      N_CS: "DDR_CSn0",
      N_RESET: "DDR_RESETn",
      N_RAS: "DDR_RASn",
      N_CAS: "DDR_CASn",
      N_WE: "DDR_WEn",
      DML: "DDR_DQM0",
      DMU: "DDR_DQM1",
      DQSL: "DDR_DQS0",
      N_DQSl: "DDR_DQSn0",
      DQSU: "DDR_DQS1",
      N_DQSU: "DDR_DQSn1",
      ZQ: "DDR_ZQ",
    } as Record<string, string>
  )[s]
}

// Keep only original nets shared by the two retained chips.
const cpuNet = (signal: string) => {
  if (/^VSS/.test(signal) || ["VREFN", "RTC_KALDO_ENn", "VPP"].includes(signal))
    return "GND"
  if (signal === "VDDS_DDR") return "DDR_1V5"
  return signal
}
const cpuConnections = Object.entries(ballMap).map(([pin, signal]) => ({
  pin,
  net: cpuNet(signal),
}))
const ramConnections = Object.entries(ramPins).map(([pin, labels]) => ({
  pin,
  net: ramNet(labels[1] ?? ""),
}))
const sharedNets = [
  ...new Set(
    ramConnections.flatMap(({ net }) =>
      net &&
      !["GND", "DDR_1V5", "DDR_VREF"].includes(net) &&
      cpuConnections.some((c) => c.net === net)
        ? [net]
        : [],
    ),
  ),
]

export default function Board() {
  return (
    <board
      width={70}
      height={70}
      layers={4}
      thickness={1.2}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
      routeRemaining={false}
      schAutoLayoutEnabled={false}
      title="AM3352 / RAM — dogbone and single-layer route test"
    >
      <autoroutingphase
        name="DDR_BUS_LANES"
        phaseIndex={1}
        autorouter="bus_lanes"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={15}
        text="AM3352 / DDR3: automatic dogbones and via-free bus lanes"
        fontSize={0.6}
      />
      <TimingConstraints />
      <AM3352 name="U1" noSchematicRepresentation pcbX={0} pcbY={0} />
      <W631GG6MB_12 name="U3" noSchematicRepresentation pcbX={0} pcbY={-27} />
      {sharedNets.map((net) => {
        const cpu = cpuConnections.find((c) => c.net === net)!
        const ram = ramConnections.find((c) => c.net === net)!
        return (
          <trace
            key={net}
            name={net}
            routingPhaseIndex={1}
            from={`.U1 > .${cpu.pin}`}
            to={`.U3 > .${ram.pin}`}
          />
        )
      })}
    </board>
  )
}
