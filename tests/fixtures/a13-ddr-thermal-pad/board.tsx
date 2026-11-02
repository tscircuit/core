import type { ReactElement } from "react"
import { NativeA13Part } from "./native-a13-part"
import source from "./source-data.json"

const selectedDataNets = new Map([
  ["/DDR3 Memory/d00", "CPU_D0"],
  ["/DDR3 Memory/ddr-d0", "DRAM_D0"],
  ["/DDR3 Memory/d01", "CPU_D1"],
  ["/DDR3 Memory/ddr-d1", "DRAM_D1"],
  ["/DDR3 Memory/d02", "CPU_D2"],
  ["/DDR3 Memory/ddr-d2", "DRAM_D2"],
  ["/DDR3 Memory/d03", "CPU_D3"],
  ["/DDR3 Memory/ddr-d3", "DRAM_D3"],
])

/** Native A13 DDR subsystem in board-world mm: +X right, +Y top, +Z above.
 * All parts retain their pinned native placement in this right-handed frame.
 * D0-D3's eight paths through RN4/RN1 are requested; other DDR nets remain.
 */
export function NativeA13DdrThermalPadBoard(): ReactElement {
  return (
    <board
      title="Native A13 DDR: exposed pad and thermal vias"
      width={source.width}
      height={source.height}
      layers={4}
      minTraceWidth={Math.min(...source.rules.widths)}
      minTraceToPadEdgeClearance={source.rules.appliedGlobalClearance}
      minViaEdgeToPadEdgeClearance={source.rules.appliedGlobalClearance}
      minViaPadDiameter={source.rules.viaPad}
      minViaHoleDiameter={source.rules.viaDrill}
      routeRemaining={false}
      schematicDisabled
    >
      {source.parts.map((part) => (
        <NativeA13Part key={part.name} part={part} />
      ))}
      <autoroutingphase
        name="DDR_DATA"
        phaseIndex={0}
        autorouter="auto"
        connections={[...selectedDataNets.values()]}
      />
      {source.traces.map((trace) => {
        const selectedName = selectedDataNets.get(trace.nativeNet)
        const name = selectedName ?? trace.name
        const routingPhaseIndex = selectedName ? 0 : undefined
        return (
          <trace
            key={trace.name}
            name={name}
            from={trace.from}
            to={trace.to}
            thickness={trace.width}
            routingPhaseIndex={routingPhaseIndex}
          />
        )
      })}
      <pcbnotetext
        pcbX={10}
        pcbY={19}
        fontSize={0.8}
        text="A13 DDR D0-D3: CPU through RN4/RN1 to RAM"
      />
      <pcbnotetext
        pcbX={10}
        pcbY={17.5}
        fontSize={0.65}
        text="U100.GND_EP: 6mm exposed pad + nine thermal vias (pin 177)"
      />
      <pcbnotetext pcbX={-4} pcbY={10.5} fontSize={0.7} text="U200: DDR3L" />
      <pcbnotetext pcbX={21} pcbY={-1.9} fontSize={0.7} text="U100: A13" />
      <pcbnotetext pcbX={12} pcbY={10.8} fontSize={0.55} text="RN4" />
      <pcbnotetext
        pcbX={10}
        pcbY={-19}
        fontSize={0.65}
        text="Native placements; 96 DDR nets retained; D0-D3 routing only"
      />
    </board>
  )
}
