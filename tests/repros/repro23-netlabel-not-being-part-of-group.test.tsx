const Component = ({ x = 0, y = 0 }) => (
  <group name="addresses" schY={y} schX={x}>
    <resistor
      footprint={"0402"}
      name="R5"
      resistance={"10k"}
      schRotation={90}
      connections={{
        pin2: "net.V3_3",
      }}
      schY={1}
    />
    <trace from=".R5 > .pin1" to=".OX45 > .pin1" />
    <solderjumper
      name="OX45"
      pinCount={2}
      footprint="solderjumper3_p0.8_pw0.635_ph1.270"
      schRotation={180}
      schX={-0.6}
      schY={0.11}
    />
    <solderjumper
      name="OX46"
      pinCount={2}
      footprint="solderjumper3_p0.8_pw0.635_ph1.270"
      schRotation={180}
      schX={-0.6}
      schY={-0.6}
    />
    <trace from=".OX46 > .pin1" to="net.SDA" />
    <solderjumper
      name="OX44"
      pinCount={2}
      footprint="solderjumper3_p0.8_pw0.635_ph1.270"
      schRotation={180}
      schX={-0.6}
      schY={-1.3}
    />
    <netlabel
      net="GND"
      schX={-0.6}
      schY={-1.3}
      connection="OX44.pin1"
      anchorSide="top"
    />
    <trace from=".OX44 > .pin2" to="net.ADDR" />
    <trace from=".OX45 > .pin2" to="net.ADDR" />
    <trace from=".OX46 > .pin2" to="net.ADDR" />
  </group>
)

import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro23 netlabel-not-being-part-of-group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <Component />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
