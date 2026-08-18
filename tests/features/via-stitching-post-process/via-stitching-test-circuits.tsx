interface CopperPourViaStitchingCircuitProps {
  chipFootprint: string
  circuitLabel: string
  passiveFootprints: [string, string, string, string?]
  r1PcbX?: number
}

const CopperPourViaStitchingCircuit = ({
  chipFootprint,
  circuitLabel,
  passiveFootprints,
  r1PcbX = -3,
}: CopperPourViaStitchingCircuitProps) => {
  const [powerCapFootprint, pullupFootprint, bypassFootprint, filterFootprint] =
    passiveFootprints

  return (
    <board width="28mm" height="22mm">
      <pcbnotetext
        pcbX={0}
        pcbY={9}
        fontSize={0.55}
        text={`${circuitLabel}: top and bottom GND pours are connected by a regular stitching-via grid`}
      />
      <net name="GND" isGroundNet />
      <net name="VCC" isPowerNet />
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
        pcbX={r1PcbX}
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
            pin2: "net.GND",
          }}
        />
      )}
      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
      <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" />
    </board>
  )
}

export const ViaStitchingSoic8Circuit = () => (
  <CopperPourViaStitchingCircuit
    chipFootprint="soic8"
    circuitLabel="SOIC-8 with 3 passives"
    passiveFootprints={["0603", "0402", "0805"]}
  />
)

export const ViaStitchingSoic16Circuit = () => (
  <CopperPourViaStitchingCircuit
    chipFootprint="soic16"
    circuitLabel="SOIC-16 with 4 passives"
    passiveFootprints={["0805", "0603", "0402", "1206"]}
    r1PcbX={-2}
  />
)

export const ViaStitchingQfp16Circuit = () => (
  <CopperPourViaStitchingCircuit
    chipFootprint="qfp16"
    circuitLabel="QFP-16 with 3 passives"
    passiveFootprints={["0402", "0805", "0603"]}
  />
)

export const ViaStitchingQfn32Circuit = () => (
  <CopperPourViaStitchingCircuit
    chipFootprint="qfn32"
    circuitLabel="QFN-32 with 4 passives"
    passiveFootprints={["1206", "0402", "0603", "0805"]}
  />
)

export const ViaStitchingTssop20Circuit = () => (
  <CopperPourViaStitchingCircuit
    chipFootprint="tssop20"
    circuitLabel="TSSOP-20 with 3 passives"
    passiveFootprints={["0603", "1206", "0402"]}
  />
)

export const convexPolygonCopperPourOutline = [
  { x: -15, y: -8 },
  { x: -4, y: -8 },
  { x: -1, y: -3 },
  { x: -3, y: 6 },
  { x: -10, y: 8 },
  { x: -15, y: 4 },
  { x: -15, y: -8 },
]

export const concavePolygonCopperPourOutline = [
  { x: 1, y: -8 },
  { x: 15, y: -8 },
  { x: 15, y: 7 },
  { x: 10, y: 7 },
  { x: 10, y: 2 },
  { x: 5, y: 2 },
  { x: 5, y: 7 },
  { x: 1, y: 7 },
  { x: 1, y: -8 },
]

export const ViaStitchingConvexPolygonCircuit = () => (
  <board width="34mm" height="24mm">
    <pcbnotetext
      pcbX={0}
      pcbY={10.7}
      fontSize={0.55}
      text="Full circuit with stitching confined to a partial-board convex GND pour"
    />
    <net name="GND" isGroundNet />
    <net name="VCC" isPowerNet />
    <chip
      name="U1"
      footprint="soic8"
      pcbX={-9}
      pcbY={0}
      connections={{ pin1: "net.GND", pin2: "net.VCC" }}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0603"
      pcbX={-6}
      pcbY={-5}
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
    <resistor
      name="R1"
      resistance="10k"
      footprint="0402"
      pcbX={9}
      pcbY={6}
      connections={{ pin1: "U1.pin3", pin2: "net.VCC" }}
    />
    <capacitor
      name="C2"
      capacitance="1uF"
      footprint="0805"
      pcbX={10}
      pcbY={-6}
      connections={{ pin1: "U1.pin4", pin2: "net.GND" }}
    />
    <copperpour
      connectsTo="net.GND"
      layer="top"
      clearance="0.3mm"
      outline={convexPolygonCopperPourOutline}
    />
    <copperpour
      connectsTo="net.GND"
      layer="bottom"
      clearance="0.3mm"
      outline={convexPolygonCopperPourOutline}
    />
  </board>
)

export const ViaStitchingConcavePolygonCircuit = () => (
  <board width="34mm" height="24mm">
    <pcbnotetext
      pcbX={0}
      pcbY={10.7}
      fontSize={0.55}
      text="Full circuit with stitching confined to a partial-board concave GND pour"
    />
    <net name="GND" isGroundNet />
    <net name="VCC" isPowerNet />
    <chip
      name="U1"
      footprint="qfp16"
      pcbX={9}
      pcbY={-3}
      connections={{ pin1: "net.GND", pin2: "net.VCC" }}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0402"
      pcbX={5}
      pcbY={-6}
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
    <resistor
      name="R1"
      resistance="4.7k"
      footprint="0603"
      pcbX={-10}
      pcbY={6}
      connections={{ pin1: "U1.pin3", pin2: "net.VCC" }}
    />
    <capacitor
      name="C2"
      capacitance="1uF"
      footprint="0805"
      pcbX={-9}
      pcbY={-6}
      connections={{ pin1: "U1.pin4", pin2: "net.GND" }}
    />
    <copperpour
      connectsTo="net.GND"
      layer="top"
      clearance="0.3mm"
      outline={concavePolygonCopperPourOutline}
    />
    <copperpour
      connectsTo="net.GND"
      layer="bottom"
      clearance="0.3mm"
      outline={concavePolygonCopperPourOutline}
    />
  </board>
)
