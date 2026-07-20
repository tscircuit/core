import { expect, test } from "bun:test"
import { InternalCircuitMosfet } from "lib/components/normal-components/InternalCircuitMosfet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internalCircuit renders a dual MOSFET as two schematic units and one PCB package", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="18mm" routingDisabled>
      <chip
        name="Q1"
        footprint="soic8"
        pinLabels={{
          pin1: "G1",
          pin2: "S1",
          pin3: "G2",
          pin4: "S2",
          pin5: "D2",
          pin6: "D2",
          pin7: "D1",
          pin8: "D1",
        }}
        connections={{
          G1: "net.GA",
          S1: "net.SA",
          D1: "net.DA",
          G2: "net.GB",
          S2: "net.SB",
          D2: "net.DB",
        }}
        schShowInternalCircuit
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              schX={-3}
              schY={0}
              connections={{
                gate: "Q1.pin1",
                source: "Q1.pin2",
                drain: "Q1.pin7",
              }}
            />
            <mosfet
              name="B"
              channelType="n"
              mosfetMode="enhancement"
              schX={3}
              schY={0}
              connections={{
                gate: "Q1.pin3",
                source: "Q1.pin4",
                drain: "Q1.pin5",
              }}
            />
          </internalcircuit>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const mosfets = circuit.selectAll("mosfet")
  expect(mosfets).toHaveLength(2)
  expect(mosfets.map((mosfet) => mosfet.name).sort()).toEqual(["A", "B"])
  expect(
    mosfets.every((mosfet) => mosfet instanceof InternalCircuitMosfet),
  ).toBe(true)
})
