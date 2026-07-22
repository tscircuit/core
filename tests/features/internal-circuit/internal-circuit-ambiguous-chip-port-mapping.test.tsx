import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a chip port cannot overlap multiple internal circuit ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="sot23"
        pinLabels={{ pin1: "GATE" }}
        schShowInternalCircuit
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              connections={{ gate: "U1.pin1" }}
            />
            <mosfet
              name="B"
              channelType="n"
              mosfetMode="enhancement"
              connections={{ gate: "U1.pin1" }}
            />
          </internalcircuit>
        }
      />
    </board>,
  )

  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "is mapped to multiple internal circuit ports",
  )
})
