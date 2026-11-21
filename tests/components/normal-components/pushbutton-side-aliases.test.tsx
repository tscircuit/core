import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "pushbutton side aliases resolve to their terminals",
  () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="18mm" height="12mm" routingDisabled>
        <schematictext
          text="SW1: side1 / side2; SW2: pins 1-2 / 3-4"
          schY={4}
        />
        <pushbutton
          name="SW1"
          footprint="pushbutton"
          schX={-3}
          connections={{ side1: "net.LEFT", side2: "net.RIGHT" }}
        />
        <pushbutton
          name="SW2"
          footprint="pushbutton_id1.3mm_od2mm"
          schX={3}
          internallyConnectedPins={[
            ["pin1", "pin2"],
            ["pin3", "pin4"],
          ]}
          connections={{ side1: "net.FIRST", side2: "net.SECOND" }}
        />
      </board>,
    )

    circuit.render()

    expect(circuit.selectOne(".SW1 .side1")).toBe(
      circuit.selectOne(".SW1 .pin1"),
    )
    expect(circuit.selectOne(".SW1 .side2")).toBe(
      circuit.selectOne(".SW1 .pin2"),
    )
    expect(circuit.selectOne(".SW2 .side1")).toBe(
      circuit.selectOne(".SW2 .pin1"),
    )
    expect(circuit.selectOne(".SW2 .side2")).toBe(
      circuit.selectOne(".SW2 .pin3"),
    )
    expect(circuit.db.source_trace.list()).toHaveLength(4)
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
  { timeout: 30000 },
)
