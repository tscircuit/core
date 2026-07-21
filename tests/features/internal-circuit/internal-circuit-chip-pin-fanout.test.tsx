import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internal circuit chip pin supports schematic fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        schX={-1}
      />
      <chip
        name="U1"
        footprint="sot23"
        pcbX={3}
        schX={1}
        pinLabels={{
          pin1: "COMMON_GATE",
          pin2: "NC2",
          pin3: "NC3",
        }}
        schShowInternalCircuit
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              schY={0.9}
              connections={{ gate: "U1.pin1" }}
            />
            <mosfet
              name="B"
              channelType="n"
              mosfetMode="enhancement"
              schY={-0.9}
              connections={{ gate: "U1.pin1" }}
            />
          </internalcircuit>
        }
      />
      <trace from=".R1 > .pin2" to=".U1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
