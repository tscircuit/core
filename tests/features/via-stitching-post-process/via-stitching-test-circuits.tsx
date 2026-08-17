interface ViaStitchingPowerCircuitProps {
  chipFootprint: string
  circuitLabel: string
  passiveFootprints: [string, string, string, string?]
  r1PcbX?: number
}

export const VIA_STITCHING_POWER_TRACE_WIDTH_MM = 0.8

const ViaStitchingPowerCircuit = ({
  chipFootprint,
  circuitLabel,
  passiveFootprints,
  r1PcbX = -3,
}: ViaStitchingPowerCircuitProps) => {
  const [powerCapFootprint, pullupFootprint, bypassFootprint, filterFootprint] =
    passiveFootprints

  return (
    <board width="28mm" height="22mm">
      <pcbnotetext
        pcbX={0}
        pcbY={10}
        fontSize={0.55}
        text={`${circuitLabel}: full VCC route should have top/bottom corridor pours and distributed stitching vias`}
      />
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />
      <chip
        name="U1"
        footprint={chipFootprint}
        pcbX={-6}
        pcbY={0}
        connections={{
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
          pin2: "net.GND",
        }}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint={pullupFootprint}
        pcbX={r1PcbX}
        pcbY={7}
        connections={{
          pin1: "U1.pin3",
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
          }}
        />
      )}
      <trace
        name="VCC_U1"
        from="U1.pin1"
        to="net.VCC"
        thickness={VIA_STITCHING_POWER_TRACE_WIDTH_MM}
      />
      <trace
        name="VCC_C1"
        from="C1.pin1"
        to="net.VCC"
        thickness={VIA_STITCHING_POWER_TRACE_WIDTH_MM}
      />
      <trace
        name="VCC_R1"
        from="R1.pin2"
        to="net.VCC"
        thickness={VIA_STITCHING_POWER_TRACE_WIDTH_MM}
      />
      {filterFootprint && (
        <trace
          name="VCC_R2"
          from="R2.pin2"
          to="net.VCC"
          thickness={VIA_STITCHING_POWER_TRACE_WIDTH_MM}
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
    r1PcbX={-2}
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
