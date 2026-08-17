interface ViaStitchingPowerCircuitProps {
  chipFootprint: string
  circuitLabel: string
  passiveFootprints: [string, string, string, string?]
}

const ViaStitchingPowerCircuit = ({
  chipFootprint,
  circuitLabel,
  passiveFootprints,
}: ViaStitchingPowerCircuitProps) => {
  const [powerCapFootprint, pullupFootprint, bypassFootprint, filterFootprint] =
    passiveFootprints

  return (
    <board width="28mm" height="22mm">
      <pcbnotetext
        pcbX={0}
        pcbY={10}
        fontSize={0.55}
        text={`${circuitLabel}: top-bottom VCC transition should have paired pours and four stitching vias`}
      />
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />
      <chip
        name="U1"
        footprint={chipFootprint}
        pcbX={-6}
        pcbY={0}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
        }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint={powerCapFootprint}
        layer="bottom"
        pcbX={8}
        pcbY={0}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
        }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint={pullupFootprint}
        pcbX={-3}
        pcbY={7}
        connections={{
          pin1: "U1.pin3",
          pin2: "net.VCC",
        }}
      />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint={bypassFootprint}
        pcbX={-3}
        pcbY={-7}
        connections={{
          pin1: "U1.pin4",
          pin2: "net.GND",
        }}
      />
      {filterFootprint && (
        <resistor
          name="R2"
          resistance="47"
          footprint={filterFootprint}
          pcbX={4}
          pcbY={7}
          connections={{
            pin1: "U1.pin5",
            pin2: "net.VCC",
          }}
        />
      )}
    </board>
  )
}

export const ViaStitchingSoic8Circuit = () => (
  <ViaStitchingPowerCircuit
    chipFootprint="soic8"
    circuitLabel="SOIC-8 with 3 passives"
    passiveFootprints={["0603", "0402", "0805"]}
  />
)

export const ViaStitchingSoic16Circuit = () => (
  <ViaStitchingPowerCircuit
    chipFootprint="soic16"
    circuitLabel="SOIC-16 with 4 passives"
    passiveFootprints={["0805", "0603", "0402", "1206"]}
  />
)

export const ViaStitchingQfp16Circuit = () => (
  <ViaStitchingPowerCircuit
    chipFootprint="qfp16"
    circuitLabel="QFP-16 with 3 passives"
    passiveFootprints={["0402", "0805", "0603"]}
  />
)

export const ViaStitchingQfn32Circuit = () => (
  <ViaStitchingPowerCircuit
    chipFootprint="qfn32"
    circuitLabel="QFN-32 with 4 passives"
    passiveFootprints={["1206", "0402", "0603", "0805"]}
  />
)

export const ViaStitchingTssop20Circuit = () => (
  <ViaStitchingPowerCircuit
    chipFootprint="tssop20"
    circuitLabel="TSSOP-20 with 3 passives"
    passiveFootprints={["0603", "1206", "0402"]}
  />
)
