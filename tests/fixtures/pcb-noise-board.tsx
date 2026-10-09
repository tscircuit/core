import { simulation } from "lib"
import type { ReactNode } from "react"
import type { PcbNoiseWaveform } from "@tscircuit/props"

export const noisePrbs = {
  kind: "prbs",
  order: 7,
  baudRate: "500MHz",
  lowVoltage: "0V",
  highVoltage: "1V",
  riseTime: "200ps",
  fallTime: "200ps",
  edgeTimeConvention: "10_90",
  seed: 1,
  algorithm: "lfsr_fibonacci",
  algorithmVersion: "1",
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
      baseline={{
        kind: "quiet_sources",
        sourceNames: ["a_tx_source"],
        voltage: "0V",
      }}
    >
      {["a", "v"].flatMap((signal) =>
        [1, 2].map((component) => (
          <simulation.pcbnoiseport
            key={`${signal}${component}`}
            name={`${signal}_${component === 1 ? "tx" : "rx"}`}
            signal={`.U${component} > .${signal.toUpperCase()}`}
            reference={`.U${component} > .REF`}
            referenceLayer={layer}
          />
        )),
      )}
      <simulation.pcbnoiseexcitation
        port="a_tx"
        role="aggressor"
        sourceModel={{ kind: "thevenin", resistance: "50ohm" }}
        waveform={noisePrbs}
      />
      <simulation.pcbnoiseexcitation
        port="v_tx"
        role="victim"
        sourceModel={{ kind: "thevenin", resistance: "50ohm" }}
        waveform={{ ...noisePrbs, seed: 2 }}
      />
      <simulation.pcbnoisetermination
        port="a_rx"
        model={{ kind: "resistor", resistance: "50ohm", biasVoltage: "0V" }}
      />
      <simulation.pcbnoisetermination
        port="v_rx"
        model={{
          kind: "parallel_rc",
          resistance: "50ohm",
          capacitance: "1pF",
          biasVoltage: "0V",
        }}
      />
      <simulation.pcbnoiseobservation
        name="victim_voltage"
        port="v_rx"
        quantity="voltage"
      />
      <simulation.pcbnoiseeye
        observation="victim_voltage"
        modulation="nrz"
        timing={{
          kind: "known_ui",
          unitInterval: "2ns",
          epoch: "0ns",
          sampleOffset: "1ns",
        }}
      />
    </simulation.pcbnoisesimulation>
  )
}
