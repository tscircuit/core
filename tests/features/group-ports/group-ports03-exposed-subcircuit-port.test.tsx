import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit ports expose internal pins to external components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="32mm" height="20mm" schMaxTraceDistance={30}>
      <pcbnotetext
        text="Exposed subcircuit ports: SUBFILTER.IN and SUBFILTER.OUT"
        pcbX={0}
        pcbY={-5}
      />
      <subcircuit
        name="SUBFILTER"
        showAsSchematicBox
        schTitle="Port-exposed subcircuit filter"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      >
        <resistor
          name="R_INTERNAL"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <port name="IN" direction="left" connectsTo="R_INTERNAL.pin1" />
        <port name="OUT" direction="right" connectsTo="R_INTERNAL.pin2" />
      </subcircuit>

      <resistor
        name="R_SOURCE"
        resistance="1k"
        footprint="0402"
        pcbX={-9}
        pcbY={0}
        schX={-6}
        schY={0}
        connections={{ pin1: "net.VCC", pin2: "SUBFILTER.IN" }}
      />
      <resistor
        name="R_LOAD"
        resistance="1k"
        footprint="0402"
        pcbX={9}
        pcbY={0}
        schX={6}
        schY={0}
        connections={{ pin1: "SUBFILTER.OUT", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
