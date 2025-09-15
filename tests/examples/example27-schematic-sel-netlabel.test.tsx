import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Test for schematic with sel-based netlabel and connections

test("example27 schematic sel netlabel", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        schPinArrangement={{
          rightSide: {
            direction: "bottom-to-top",
            pins: [6, 8, 1],
          },
        }}
      />
      <capacitor
        name="C2"
        capacitance="10nf"
        schRotation={90}
        schX={1.4}
        schY={0.55}
        connections={{
          pin1: sel.U1.pin8,
          pin2: sel.R1.pin1,
        }}
      />
      <resistor
        name="R1"
        resistance="10k"
        schX={2.7}
        schY={1.3}
        connections={{
          pin1: sel.U1.pin1,
        }}
      />
      <netlabel
        net="PAD"
        anchorSide="left"
        connection="R1.pin2"
        schX={4.4}
        schY={1.3}
      />
      <pinheader
        name="JP5"
        gender="female"
        pinCount={1}
        schX={4.4}
        schY={0}
        schFacingDirection="left"
        connections={{ pin1: sel.R1.pin2 }}
      />
      <pinheader
        name="JP9"
        gender="female"
        pinCount={1}
        schX={4.4}
        schY={-0.9}
        schFacingDirection="left"
        connections={{ pin1: sel.R1.pin2 }}
      />

      <solderjumper
        name="JP8"
        pinCount={3}
        schRotation={180}
        schX={2}
        schY={-1.1}
        connections={{
          pin2: sel.U1.pin6,
        }}
      />
      <netlabel
        net="VCC"
        anchorSide="bottom"
        connection="JP8.pin3"
        schX={1.1}
        schY={-0.94}
      />
      <netlabel
        net="GND"
        anchorSide="top"
        connection="JP8.pin1"
        schX={2.8}
        schY={-1.6}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
