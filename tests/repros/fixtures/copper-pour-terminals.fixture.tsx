import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Circuit-world positions in mm: +X right, +Y up, +Z toward the top layer.
export async function getCopperPourTerminalsFixture({ bridge = false } = {}) {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled>
      <net name="GND" />
      <testpoint name="A" footprintVariant="pad" pcbX={-4} padDiameter={1} />
      <testpoint name="B" footprintVariant="pad" pcbX={0} padDiameter={1} />
      <testpoint name="C" footprintVariant="pad" pcbX={4} padDiameter={1} />
      <trace from="A.pin1" to="net.GND" />
      <trace from="B.pin1" to="net.GND" />
      <trace from="C.pin1" to="net.GND" />
      {bridge && <trace from="B.pin1" to="C.pin1" pcbStraightLine />}
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -6, y: -2 },
          { x: 1.5, y: -2 },
          { x: 1.5, y: 2 },
          { x: -6, y: 2 },
        ]}
      />
      <pcbnotetext
        pcbY={3.7}
        fontSize={0.5}
        text="GND: A + B already joined by TOP copper"
      />
      <pcbnotetext
        pcbY={-3.7}
        fontSize={0.5}
        text="Only C still needs a route to the pour"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}
