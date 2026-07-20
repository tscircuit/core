import { expect, test } from "bun:test"
import { InternalCircuitMosfet } from "lib/components"
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
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              schX={-3}
              schY={0}
              connections={{
                gate: "pin.G1",
                source: "pin.S1",
                drain: "pin.D1",
              }}
            />
            <mosfet
              name="B"
              channelType="n"
              mosfetMode="enhancement"
              schX={3}
              schY={0}
              connections={{
                gate: "pin.G2",
                source: "pin.S2",
                drain: "pin.D2",
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

  const internalMosfets = circuit.selectAll("mosfet")
  expect(internalMosfets).toHaveLength(2)
  expect(
    internalMosfets.every((mosfet) => mosfet instanceof InternalCircuitMosfet),
  ).toBeTrue()

  expect({
    sourceComponentNames: circuit.db.source_component
      .list()
      .map((component) => component.name ?? "")
      .sort(),
    sourceComponentTypes: circuit.db.source_component
      .list()
      .map((component) => component.ftype)
      .sort(),
    schematicComponentCount: circuit.db.schematic_component.list().length,
    pcbComponentCount: circuit.db.pcb_component.list().length,
    sourceTraceCount: circuit.db.source_trace.list().length,
    missingFootprintErrorCount:
      circuit.db.pcb_missing_footprint_error.list().length,
  }).toEqual({
    sourceComponentNames: ["Q1", "Q1A", "Q1B"],
    sourceComponentTypes: ["simple_chip", "simple_mosfet", "simple_mosfet"],
    schematicComponentCount: 2,
    pcbComponentCount: 1,
    sourceTraceCount: 12,
    missingFootprintErrorCount: 0,
  })
})
