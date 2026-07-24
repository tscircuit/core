import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: long transistor name disconnects shared base junction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm" routingDisabled>
      <subcircuit name="USB_SHUTDOWN">
        <resistor
          name="R_USB_BOOST_OFF"
          resistance="100k"
          schX={-2.5}
          schY={0}
        />
        <transistor
          name="Q_USB_BOOST_OFF"
          type="npn"
          schX={1}
          schY={0}
          schRotation={270}
        />
        <resistor
          name="R_USB_BOOST_OFF_PULLDOWN"
          resistance="100k"
          schX={-0.5}
          schY={-1.5}
          schRotation={270}
        />

        <trace
          from=".R_USB_BOOST_OFF > .pin2"
          to=".Q_USB_BOOST_OFF > .pin2"
          schDisplayLabel="USB_DETECT"
        />
        <trace
          from=".Q_USB_BOOST_OFF > .pin2"
          to=".R_USB_BOOST_OFF_PULLDOWN > .pin1"
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
