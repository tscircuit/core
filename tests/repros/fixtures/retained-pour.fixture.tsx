import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { LayerRef } from "circuit-json"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

/** All geometry is circuit-world points in mm: +X right, +Y up. */
export const RetainedPourCircuit = ({
  pourLayer = "top",
}: {
  pourLayer?: LayerRef
}) => (
  <board width={12} height={8} layers={2}>
    <net name="GND" />
    <testpoint
      name="GND"
      footprintVariant="pad"
      pcbX={0}
      pcbY={1.6}
      padDiameter={0.5}
      connections={{ pin1: "net.GND" }}
    />
    <testpoint
      name="SIGNAL_A"
      footprintVariant="pad"
      pcbX={-0.6}
      pcbY={0.3}
      padDiameter={0.5}
    />
    <testpoint
      name="SIGNAL_B"
      footprintVariant="pad"
      pcbX={4}
      pcbY={0.3}
      padDiameter={0.5}
    />
    <trace from="SIGNAL_A.pin1" to="SIGNAL_B.pin1" thickness={0.2} />
    <testpoint
      name="HOLE_A"
      footprintVariant="pad"
      pcbX={-0.7}
      pcbY={-0.5}
      padDiameter={0.4}
    />
    <testpoint
      name="HOLE_B"
      footprintVariant="pad"
      pcbX={0.7}
      pcbY={-0.5}
      padDiameter={0.4}
    />
    <trace from="HOLE_A.pin1" to="HOLE_B.pin1" thickness={0.2} />
    {/* A warning-only keepout cuts the poured copper without blocking routing. */}
    <keepout
      shape="rect"
      width={2.8}
      height={2}
      layers={[pourLayer]}
      warningOnly
      pcbX={0}
      pcbY={0}
    />
    <copperpour
      name="RETAINED_GND"
      connectsTo="net.GND"
      layer={pourLayer}
      outline={[
        { x: -2.5, y: -2 },
        { x: 2.5, y: -2 },
        { x: 2.5, y: 2 },
        { x: -2.5, y: 2 },
      ]}
      clearance={0.2}
    />
    <pcbnotetext text="GND" pcbY={1.92} fontSize={0.22} color="#ffffff" />
    <pcbnotetext
      text="SIGNAL A"
      pcbX={-0.6}
      pcbY={0.7}
      fontSize={0.22}
      color="#ffffff"
    />
    <pcbnotetext
      text="SIGNAL B"
      pcbX={4}
      pcbY={0.9}
      fontSize={0.22}
      color="#ffffff"
    />
    <pcbnotetext
      text="HOLE CONTROL"
      pcbY={-0.82}
      fontSize={0.22}
      color="#ffffff"
    />
    <pcbnotetext
      text="Next routing phase: retain generated TOP GND copper and its hole"
      pcbY={3.4}
      fontSize={0.35}
      color="#ffffff"
    />
    <pcbnotetext
      text="SIGNAL must escape the hole without touching retained GND"
      pcbY={2.7}
      fontSize={0.3}
      color="#ffffff"
    />
    <pcbnotetext
      text="HOLE control must stay routable on TOP, without vias"
      pcbY={-2.6}
      fontSize={0.3}
      color="#ffffff"
    />
    <pcbnotetext
      text="Copper and void are compiled from TSX; no geometry edits"
      pcbY={-3.4}
      fontSize={0.28}
      color="#ffffff"
    />
  </board>
)

export const getRetainedPourFixture = async (pourLayer: LayerRef = "top") => {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true
  circuit.add(<RetainedPourCircuit pourLayer={pourLayer} />)
  await circuit.renderUntilSettled()
  return { circuit, circuitJson: circuit.getCircuitJson() }
}

export const getRetainedPourHoleControls = async () => {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true
  // Authored local points become world points through the standard transform.
  const rotatedPourOutline = [
    { x: -1, y: -0.7 },
    { x: 1, y: -0.7 },
    { x: 1, y: 0.7 },
    { x: -1, y: 0.7 },
  ].map((point) => applyToPoint(compose(translate(2, 0), rotateDEG(30)), point))
  circuit.add(
    <board width={14} height={10} layers={2}>
      <net name="GND" />
      <net name="VCC" />
      <testpoint
        name="ROUND_A"
        footprintVariant="pad"
        pcbX={-2.3}
        pcbY={0}
        padDiameter={0.25}
      />
      <testpoint
        name="ROUND_B"
        footprintVariant="pad"
        pcbX={-1.7}
        pcbY={0}
        padDiameter={0.25}
      />
      <trace from="ROUND_A.pin1" to="ROUND_B.pin1" thickness={0.1} />
      <testpoint
        name="ROTATED_A"
        footprintVariant="pad"
        pcbX={1.65}
        pcbY={-0.2}
        padDiameter={0.25}
        connections={{ pin1: "net.VCC" }}
      />
      <testpoint
        name="ROTATED_B"
        footprintVariant="pad"
        pcbX={2.35}
        pcbY={0.2}
        padDiameter={0.25}
        connections={{ pin1: "net.VCC" }}
      />
      <trace from="ROTATED_A.pin1" to="ROTATED_B.pin1" thickness={0.1} />
      <testpoint
        name="GND_L"
        footprintVariant="pad"
        pcbX={-4}
        pcbY={1.8}
        padDiameter={0.4}
        connections={{ pin1: "net.GND" }}
      />
      <testpoint
        name="GND_R"
        footprintVariant="pad"
        pcbX={4}
        pcbY={1.8}
        padDiameter={0.4}
        connections={{ pin1: "net.GND" }}
      />
      <trace from="GND_L.pin1" to="GND_R.pin1" thickness={0.1} />
      <keepout
        shape="circle"
        radius={0.9}
        pcbX={-2}
        layers={["top"]}
        warningOnly
      />
      <copperpour
        name="RETAINED_GND"
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -5, y: -2.5 },
          { x: 5, y: -2.5 },
          { x: 5, y: 2.5 },
          { x: -5, y: 2.5 },
        ]}
        clearance={0.2}
      />
      <copperpour
        name="ROTATED_VCC"
        connectsTo="net.VCC"
        layer="top"
        outline={rotatedPourOutline}
        clearance={0.05}
      />
      <pcbnotetext
        text="Hole controls: circular void, rotated void, same-net GND contact"
        pcbY={4.2}
        fontSize={0.35}
        color="#ffffff"
      />
      <pcbnotetext
        text="KRT: cyan centerlines are real TOP routes, with no pour shorts"
        pcbY={3.5}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="ROUND: 0.9 mm radius"
        pcbX={-2}
        pcbY={-1.5}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="ROTATED VCC: 30 degrees"
        pcbX={2}
        pcbY={-1.5}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="GND same-net route"
        pcbY={2.65}
        fontSize={0.25}
        color="#ffffff"
      />
      <pcbnotetext
        text="GND connects to retained copper; holes remain empty"
        pcbY={-3.5}
        fontSize={0.3}
        color="#ffffff"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return { circuit, circuitJson: circuit.getCircuitJson() }
}

/** Root pours are regenerated on fresh routing; rendered child copper remains. */
export const getFreshChildPourFixture = async () => {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true
  const outline = [
    { x: -2.5, y: -2 },
    { x: 2.5, y: -2 },
    { x: 2.5, y: 2 },
    { x: -2.5, y: 2 },
  ]
  circuit.add(
    <board width={12} height={8} layers={2}>
      <net name="ROOT_GND" />
      <testpoint
        name="ROOT_GND"
        footprintVariant="pad"
        layer="bottom"
        pcbX={0}
        pcbY={-1.6}
        padDiameter={0.5}
        connections={{ pin1: "net.ROOT_GND" }}
      />
      <copperpour
        name="REGENERATED_ROOT"
        connectsTo="net.ROOT_GND"
        layer="bottom"
        outline={outline}
        clearance={0.2}
      />
      <testpoint
        name="SIGNAL_A"
        footprintVariant="pad"
        pcbX={-0.6}
        pcbY={0.3}
        padDiameter={0.5}
      />
      <testpoint
        name="SIGNAL_B"
        footprintVariant="pad"
        pcbX={4}
        pcbY={0.3}
        padDiameter={0.5}
      />
      <trace from="SIGNAL_A.pin1" to="SIGNAL_B.pin1" thickness={0.2} />
      <subcircuit name="RETAINED_CHILD" pcbX={0} pcbY={0}>
        <net name="CHILD_GND" />
        <testpoint
          name="CHILD_GND"
          footprintVariant="pad"
          pcbX={0}
          pcbY={1.6}
          padDiameter={0.5}
          connections={{ pin1: "net.CHILD_GND" }}
        />
        <keepout
          shape="rect"
          width={2.8}
          height={2}
          layers={["top"]}
          warningOnly
        />
        <copperpour
          name="RETAINED_CHILD_GND"
          connectsTo="net.CHILD_GND"
          layer="top"
          outline={outline}
          clearance={0.2}
        />
      </subcircuit>
      <pcbnotetext
        text="Fresh parent routing: retain CHILD GND, regenerate root pour"
        pcbY={3.4}
        fontSize={0.32}
        color="#ffffff"
      />
      <pcbnotetext
        text="Signal must bridge BELOW retained child copper"
        pcbY={2.7}
        fontSize={0.3}
        color="#ffffff"
      />
      <pcbnotetext
        text="TOP child GND"
        pcbY={1.92}
        fontSize={0.22}
        color="#ffffff"
      />
      <pcbnotetext
        text="SIGNAL A"
        pcbX={-0.6}
        pcbY={0.7}
        fontSize={0.22}
        color="#ffffff"
      />
      <pcbnotetext
        text="SIGNAL B"
        pcbX={4}
        pcbY={0.9}
        fontSize={0.22}
        color="#ffffff"
      />
      <pcbnotetext
        text="BOTTOM root pour is intentionally regenerated in this mode"
        pcbY={-3.3}
        fontSize={0.28}
        color="#ffffff"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return { circuit, circuitJson: circuit.getCircuitJson() }
}
