import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internalCircuit renders a dual MOSFET as two schematic units and one PCB package", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="28mm" height="18mm" routingDisabled>
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
      <schematicbox
        width={5.5}
        height={4.5}
        schX={0}
        schY={-1.25}
        strokeStyle="dashed"
        title="Q1 INTERNAL CIRCUIT: Q1A + Q1B"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <pcbnotetext
        text="Q1: ONE PHYSICAL PACKAGE FOR Q1A + Q1B"
        fontSize={0.6}
        pcbX={0}
        pcbY={-6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
})
