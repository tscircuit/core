import type { PcbNoiseWaveform } from "@tscircuit/props"
import { simulation } from "lib"
import type { ReactNode } from "react"

export const noisePrbs = {
  kind: "prbs",
  order: 7,
  baudRate: "500MHz",
  lowVoltage: "0V",
  highVoltage: "1V",
  riseTime: "200ps",
  fallTime: "200ps",
  seed: 1,
} satisfies PcbNoiseWaveform

/** Independent signal pads can share the same real plated-hole reference. */
export function NoiseBoard({
  children,
  layer = "top",
  rotation = 0,
  straightSignal = true,
  connections = true,
}: {
  children?: ReactNode
  layer?: "top" | "bottom"
  rotation?: number
  straightSignal?: boolean
  /** Transform fixtures inspect contacts without routing an unsupported crossed layout. */
  connections?: boolean
}) {
  return (
    <board width={12} height={10} layers={2} schematicDisabled>
      <net name="GND" />
      {[-3, 3].map((pcbX, index) => (
        <chip
          key={index}
          name={`U${index + 1}`}
          pcbX={pcbX}
          layer={layer}
          pcbRotation={rotation}
          pinLabels={{ pin1: "A", pin2: "V", pin3: "REF" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={-0.7}
                width={0.7}
                height={0.5}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={0.7}
                width={0.7}
                height={0.5}
                shape="rect"
              />
              <platedhole
                portHints={["pin3"]}
                pcbY={2}
                holeDiameter={0.3}
                outerDiameter={0.7}
                shape="circle"
              />
            </footprint>
          }
        />
      ))}
      {connections && (
        <>
          <trace
            name="A"
            from=".U1 > .A"
            to=".U2 > .A"
            pcbStraightLine={straightSignal}
            thickness={0.18}
          />
          <trace
            name="V"
            from=".U1 > .V"
            to=".U2 > .V"
            pcbStraightLine={straightSignal}
            thickness={0.18}
          />
          <trace from=".U1 > .REF" to="net.GND" />
          <trace from=".U2 > .REF" to="net.GND" />
        </>
      )}
      <pcbnotetext
        text={
          connections
            ? "A: aggressor / V: active victim"
            : `Physical contacts: ${layer}, ${rotation}°`
        }
        pcbY={-2.5}
        fontSize={0.36}
      />
      <pcbnotetext
        text="Shared physical REF contacts; pending noise inputs"
        pcbY={-3.1}
        fontSize={0.3}
      />
      {children ?? <NoiseSimulation layer={layer} />}
    </board>
  )
}

export function NoiseSimulation({
  layer = "top",
  name = "Active victim with shared references",
}: {
  layer?: "top" | "bottom"
  name?: string
}) {
  return (
    <simulation.pcbnoisesimulation
      name={name}
      duration="512ns"
      sampleInterval="20ps"
      baseline={{ quietChannels: ["a"], voltage: "0V" }}
    >
      {["a", "v"].map((signal, index) => (
        <simulation.pcbnoisechannel
          key={signal}
          name={signal}
          role={signal === "a" ? "aggressor" : "victim"}
          source={`.U1 > .${signal.toUpperCase()}`}
          sourceReference=".U1 > .REF"
          sourceReferenceLayer={layer}
          load={`.U2 > .${signal.toUpperCase()}`}
          loadReference=".U2 > .REF"
          loadReferenceLayer={layer}
          sourceImpedance="50ohm"
          loadImpedance="50ohm"
          loadBiasVoltage="0V"
          loadCapacitance={signal === "v" ? "1pF" : undefined}
          waveform={{ ...noisePrbs, seed: index + 1 }}
        />
      ))}
      <simulation.pcbnoiseeye
        channel="v"
        timing={{ kind: "source", channel: "v", sampleOffset: "1ns" }}
      />
    </simulation.pcbnoisesimulation>
  )
}
