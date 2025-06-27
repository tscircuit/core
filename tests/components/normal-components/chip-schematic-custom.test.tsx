import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

// Schematic snapshot test for jumper with custom schPortArrangement and netlabel

test("chip schematic with custom schPortArrangement and netlabel", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schWidth={1}
        schPinArrangement={{
          rightSide: {
            pins: [
              "pin1",
              "pin2",
              "pin3",
              "pin4",
              "pin5",
              "pin6",
              "pin7",
              "pin8",
              "pin9",
              "pin10",
              "pin11",
              "pin12",
              "pin13",
              "pin14",
              "pin15",
              "pin16",
            ],
            direction: "bottom-to-top",
          },
        }}
      />
      <netlabel
        schX={1.15}
        schY={1.7}
        anchorSide="bottom"
        net="V3_3"
        connectsTo={sel.U1.pin15}
      />
      <netlabel
        schX={1.15}
        schY={-1.9}
        anchorSide="top"
        net="GND"
        connectsTo={sel.U1.pin13}
      />
      <netlabel
        schX={1.4}
        schY={1.5}
        anchorSide="left"
        net="RESET"
        connectsTo={sel.U1.pin16}
      />
      <netlabel
        schX={1.4}
        schY={0.7}
        anchorSide="left"
        net="A0"
        connectsTo={sel.U1.pin12}
      />

      <netlabel
        schX={1.4}
        schY={0.5}
        anchorSide="left"
        net="A1"
        connectsTo={sel.U1.pin9}
      />
      <netlabel
        schX={1.4}
        schY={0.3}
        anchorSide="left"
        net="A2"
        connectsTo={sel.U1.pin10}
      />
      <netlabel
        schX={1.4}
        schY={0.1}
        anchorSide="left"
        net="A3"
        connectsTo={sel.U1.pin7}
      />
      <netlabel
        schX={1.4}
        schY={-0.1}
        anchorSide="left"
        net="A4"
        connectsTo={sel.U1.pin6}
      />
      <netlabel
        schX={1.4}
        schY={-0.3}
        anchorSide="left"
        net="A5"
        connectsTo={sel.U1.pin5}
      />
      <netlabel
        schX={1.4}
        schY={-0.5}
        anchorSide="left"
        net="SCK"
        connectsTo={sel.U1.pin4}
      />
      <netlabel
        schX={1.4}
        schY={-0.7}
        anchorSide="left"
        net="COPI"
        connectsTo={sel.U1.pin3}
      />
      <netlabel
        schX={1.4}
        schY={-0.9}
        anchorSide="left"
        net="CIPO"
        connectsTo={sel.U1.pin2}
      />
      <netlabel
        schX={1.4}
        schY={-1.1}
        anchorSide="left"
        net="D0/RX"
        connectsTo={[sel.U1.pin1]}
      />
      <netlabel
        schX={1.4}
        schY={-1.3}
        anchorSide="left"
        net="D1/TX"
        connectsTo={sel.U1.pin11}
      />

      <netlabel
        schX={1.4}
        schY={-1.5}
        anchorSide="left"
        net="BOOT0"
        connectsTo={sel.U1.pin11}
      />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
