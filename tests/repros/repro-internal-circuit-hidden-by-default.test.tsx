import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internalCircuit is hidden behind the chip schematic box by default", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm" routingDisabled>
      <chip
        name="Q1"
        footprint="sot23"
        pinLabels={{
          pin1: "GATE",
          pin2: "SOURCE",
          pin3: "DRAIN",
        }}
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              connections={{
                gate: "pin.GATE",
                source: "pin.SOURCE",
                drain: "pin.DRAIN",
              }}
            />
          </internalcircuit>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
